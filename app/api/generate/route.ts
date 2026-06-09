import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getTov } from "@/lib/tov-store";
import { buildPrompt, Channel, Product, UseCase, PnFramework, BriefFields, ProceduralRuleInput, JourneyContextInput } from "@/lib/prompts";
import { getRelevantExamples, getInsights } from "@/lib/feedback-store";
import { getProceduralRules } from "@/lib/edit-memory";
import { getJourneyContext, recordJourneyGeneration } from "@/lib/journey-memory";
import { getWordRules, sanitizeCopy, buildWordRulesBlock } from "@/lib/word-rules";
import { getTovRules, buildTovRulesBlock } from "@/lib/tov-rules";
import { recordUsageEvent } from "@/lib/analytics";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const {
      channel,
      product,
      useCase,
      userState,
      context,
      variantCount,
      pnFramework,
      dripDay,
      dripTotal,
      userDescription,
      commType,
      desiredAction,
      nonNegotiables,
      referenceText,
      tone,
      journeyId,
    } = await req.json();

    if (!channel || !product || !context) {
      return NextResponse.json(
        { error: "channel, product, and context are required" },
        { status: 400 }
      );
    }

    const resolvedUserState = userState ?? "";
    const tov = getTov();
    const feedbackExamples = getRelevantExamples(channel, product, resolvedUserState);
    const insightsData = getInsights(channel, product, resolvedUserState);
    const dripContext =
      dripDay && dripTotal ? { day: dripDay, totalDays: dripTotal } : undefined;

    // ── Layer 1: procedural rules from edit memory ────────────────────────
    const rawRules = getProceduralRules(useCase ?? "", channel, commType ?? "");
    const proceduralRules: ProceduralRuleInput[] = rawRules.map((r) => ({
      rule: r.rule, strength: r.strength,
    }));

    // ── Layer 2: journey context (drip only, day > 1) ─────────────────────
    let journeyContext: JourneyContextInput | undefined;
    if (journeyId && dripDay && dripTotal && dripDay > 1) {
      const ctx = getJourneyContext(journeyId, dripDay, dripTotal);
      if (ctx) journeyContext = ctx;
    }

    const wordRules = getWordRules();
    const tovRules = getTovRules();
    const tovRulesBlock = tovRules ? buildTovRulesBlock(tovRules) : undefined;

    const brief: BriefFields = {
      userDescription: userDescription || undefined,
      commType: commType || undefined,
      desiredAction: desiredAction || undefined,
      nonNegotiables: nonNegotiables || undefined,
      referenceText: referenceText || undefined,
      tone: tone || undefined,
    };

    const prompt = buildPrompt(
      tov,
      channel as Channel,
      product as Product,
      useCase as UseCase | undefined,
      context,
      variantCount || 3,
      pnFramework as PnFramework | undefined,
      feedbackExamples,
      dripContext,
      insightsData.insights.length > 0 ? insightsData.insights : undefined,
      brief,
      proceduralRules.length > 0 ? proceduralRules : undefined,
      journeyContext,
      buildWordRulesBlock(wordRules),
      tovRulesBlock
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Helper: parse + normalise a raw LLM response string
    const parseVariants = (raw: string) => {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      return JSON.parse(cleaned);
    };

    // First attempt
    let result = await model.generateContent(prompt);
    let variants = parseVariants(result.response.text().trim());

    // If any variant has any crm_score below 4, retry once with an explicit nudge
    const hasBelowFour = (vs: Record<string, unknown>[]) =>
      vs.some((v) => {
        const scores = v.crm_scores as Record<string, number> | undefined;
        return scores && Object.values(scores).some((s) => s < 4);
      });

    if (hasBelowFour(variants)) {
      const retryPrompt =
        prompt +
        "\n\nIMPORTANT RETRY: Your previous attempt had one or more variants with a CRM dimension below 4. " +
        "Review each variant carefully against the QUALITY BAR checklist and rewrite any that fall short. " +
        "Do not return the same copy. Every dimension in crm_scores must be 4 or 5.";
      result = await model.generateContent(retryPrompt);
      variants = parseVariants(result.response.text().trim());
    }

    const stripMarkdown = (s: string) =>
      s.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");

    const normalised = variants.map((v: Record<string, unknown>) => {
      const rawCopy =
        v.copy && typeof v.copy === "object"
          ? Object.values(v.copy as Record<string, string>)
              .filter(Boolean)
              .join("\n")
          : (v.copy as string);

      let copy = stripMarkdown(rawCopy ?? "");

      if (channel === "whatsapp") {
        const sections = copy.split(/\n\n+/);
        const last = sections[sections.length - 1]?.trim() ?? "";
        const sentenceSplit = last.match(/^([\s\S]+[.!?])\s{1,2}([^.!?\n]{5,40})$/);
        if (sentenceSplit && sections.length >= 2) {
          sections[sections.length - 1] = sentenceSplit[1];
          sections.push(sentenceSplit[2]);
          copy = sections.join("\n\n");
        }
      }

      // Post-process: deterministic jargon replacement (safety net for anything the model missed)
      copy = sanitizeCopy(copy, wordRules);

      return { ...v, copy };
    });

    // ── Layer 2: persist first variant to journey memory ──────────────────
    if (journeyId && dripDay && normalised.length > 0) {
      const first = normalised[0];
      const rawCopy: string = first.copy ?? "";
      const copyLines = rawCopy.split("\n").filter(Boolean);
      const headline = channel === "push" ? (copyLines[0] ?? "") : rawCopy.split(/\n\n/)[0] ?? rawCopy.slice(0, 80);
      const body     = channel === "push" ? copyLines.slice(1).join(" ") : rawCopy;
      try {
        recordJourneyGeneration({
          journeyId,
          day:      dripDay,
          channel,
          useCase:  useCase ?? "",
          headline,
          body,
          formula:  first.formula,
        });
      } catch (e) {
        console.warn("journey-memory save failed (non-fatal):", e);
      }
    }

    // Record usage analytics (non-fatal)
    try {
      recordUsageEvent({
        event_type:        dripDay ? "drip_cell" : "generate",
        channel,
        product,
        use_case:          useCase          ?? "",
        comm_type:         commType         ?? "",
        tone:              tone             ?? "",
        pn_framework:      pnFramework      ?? "",
        variant_count:     variantCount     || 3,
        has_user_desc:     !!userDescription,
        has_desired_action: !!desiredAction,
        has_non_neg:       !!nonNegotiables,
        has_reference:     !!referenceText,
        is_drip:           !!dripDay,
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({ variants: normalised });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: "Generation failed. Check server logs." },
      { status: 500 }
    );
  }
}
