import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import {
  getAllFeedback,
  upsertInsights,
  getFeedbackCountForCombo,
  getAllInsights,
} from "@/lib/feedback-store";
import { CHANNEL_LABELS, PRODUCT_LABELS } from "@/lib/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── GET — return all learned insights + feedback stats ─────────────────────
export async function GET() {
  try {
    const insights = await getAllInsights();
    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[learn] GET error:", err);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}

// ── POST — run analysis for a specific channel/product/userState combo ──────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const channel: string = body.channel ?? "";
    const product: string = body.product ?? "";
    const userState: string = body.userState ?? "";

    if (!channel) {
      return NextResponse.json({ error: "channel is required" }, { status: 400 });
    }

    // Filter all feedback to this combo
    const allEntries = await getAllFeedback();
    const all = allEntries.filter(
      (e) => e.channel === channel && e.product === product && e.userState === userState
    );
    const good = all.filter((e) => e.verdict === "good");
    const bad  = all.filter((e) => e.verdict === "bad");

    // Need at least 3 total to derive meaningful patterns
    if (all.length < 3) {
      return NextResponse.json({
        insights: [],
        summary: "Not enough feedback to analyse yet — need at least 3 rated samples.",
      });
    }

    const channelLabel   = CHANNEL_LABELS[channel as keyof typeof CHANNEL_LABELS] || channel;
    const rawProductLabel = PRODUCT_LABELS[product as keyof typeof PRODUCT_LABELS] || product;
    const productLabel   = rawProductLabel || "All products";
    const userStateLabel = userState || "All user states";

    const formatSamples = (samples: typeof all) =>
      samples
        .slice(0, 12)
        .map((e, i) => {
          const lines = [`${i + 1}. "${e.copy}"`];
          if (e.context) lines.push(`   Context: ${e.context}`);
          return lines.join("\n");
        })
        .join("\n\n");

    const prompt = `
You are a senior copywriting coach analysing feedback data for ACKO, an Indian digital insurance brand.

You have been given marketing copy samples that were rated GOOD (approved) and BAD (rejected) by the content team for a specific channel and context. Your job is to extract concrete, reusable writing rules.

CONTEXT:
- Channel: ${channelLabel}
- Product: ${productLabel}
- User State: ${userStateLabel}

GOOD COPY SAMPLES (${good.length} approved):
${good.length > 0 ? formatSamples(good) : "(none yet)"}

BAD COPY SAMPLES (${bad.length} rejected):
${bad.length > 0 ? formatSamples(bad) : "(none yet)"}

TASK:
Analyse the contrast between good and bad samples. Extract 4–7 specific, actionable writing rules. Each rule must:
- Be grounded in the actual samples shown (not generic advice)
- State clearly what TO DO or what TO AVOID
- Be specific enough for a copywriter to apply it immediately
- Be phrased as a direct instruction (e.g. "Always lead with the user's specific policy event, not a generic greeting")

Also write a one-sentence summary of the single most important pattern you observed.

Respond ONLY with valid JSON — no markdown, no explanation:
{
  "insights": [
    "Rule 1 as a direct instruction",
    "Rule 2 as a direct instruction"
  ],
  "summary": "One-sentence summary of the dominant pattern."
}
`.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    let insights: string[] = [];
    let summary = "";
    try {
      const parsed = JSON.parse(cleaned);
      insights = Array.isArray(parsed.insights) ? parsed.insights : [];
      summary  = typeof parsed.summary === "string" ? parsed.summary : "";
    } catch {
      console.error("[learn] Failed to parse Gemini response:", cleaned);
      return NextResponse.json({
        insights: [],
        summary: "Analysis failed — will retry on next feedback.",
      });
    }

    const feedbackCount = await getFeedbackCountForCombo(channel, product, userState);
    await upsertInsights(channel, product, userState, insights, summary, feedbackCount);

    return NextResponse.json({ insights, summary });
  } catch (err) {
    console.error("[learn] POST error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
