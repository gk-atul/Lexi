import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getTov } from "@/lib/tov-store";
import { buildPrompt, Channel, Product, UseCase, PnFramework, BriefFields } from "@/lib/prompts";
import { getRelevantExamples, getInsights } from "@/lib/feedback-store";

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

    const brief: BriefFields = {
      userDescription: userDescription || undefined,
      commType: commType || undefined,
      desiredAction: desiredAction || undefined,
      nonNegotiables: nonNegotiables || undefined,
      referenceText: referenceText || undefined,
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
      brief
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

      return { ...v, copy };
    });

    return NextResponse.json({ variants: normalised });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: "Generation failed. Check server logs." },
      { status: 500 }
    );
  }
}
