import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getTov } from "@/lib/tov-store";
import { Channel, Product, UserState, CHANNEL_LABELS, PRODUCT_LABELS, USER_STATE_LABELS } from "@/lib/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const CHANNEL_RULES_BRIEF: Record<Channel, string> = {
  push: `Push notification rules:
- Headline: max 33 characters (ideal ≤26). Body: max 75 characters.
- Lead with the benefit. Be specific. One CTA only.
- Real urgency only. No generic language ("Big news!", "Don't miss out!").
- Forbidden words: "instantly", "instant policy", "click here", "act now", "guaranteed".
- Return as: headline on line 1, body on line 2 (plain text, no JSON).`,

  whatsapp: `WhatsApp message rules:
- Structure: intro line → blank line → context (1–2 sentences) → blank line → bullets (if 2+ points) → blank line → nudge → blank line → CTA button text (3–5 words, action-first).
- Every block separated by \\n\\n (blank line). CTA must stand alone on last line.
- No "Hey" opener. No "Thanks, Team ACKO". No markdown bold (**).
- Return as plain text following the structure above.`,

  email: `Email rules:
- Subject under 8 words, max 1 emoji. Most important info + CTA in first 2 lines.
- No sign-off with "Team ACKO". Sentence case.
- Return as plain text.`,

  "in-app": `In-app copy rules:
- Shortest format. Action clarity over personality. No marketing language.
- Return as plain text.`,
};

export async function POST(req: NextRequest) {
  try {
    const { copy, instruction, channel, product, userState, context } =
      await req.json();

    if (!copy || !instruction || !channel) {
      return NextResponse.json(
        { error: "copy, instruction, and channel are required" },
        { status: 400 }
      );
    }

    const tov = getTov();

    const prompt = `You are a copy editor for ACKO, an Indian digital insurance company.

Below is ACKO's Tone of Voice guide. Follow it exactly.

---
TONE OF VOICE GUIDE:
${tov}
---

${CHANNEL_RULES_BRIEF[channel as Channel]}

PRODUCT: ${product ? PRODUCT_LABELS[product as Product] : "Not specified"}
USER STATE: ${userState ? USER_STATE_LABELS[userState as UserState] : "Not specified"}
CONTEXT: ${context || "Not specified"}

CURRENT COPY:
${copy}

USER INSTRUCTION:
${instruction}

Rewrite the copy above following the user's instruction. Apply all channel rules and ToV guidelines. Keep what works; change only what the instruction requires.

Return ONLY the rewritten copy as plain text — no JSON, no explanation, no markdown, no quotes around the output.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(prompt);
    let refined = result.response.text().trim();

    // Strip any accidental markdown bold/italic
    refined = refined.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");

    // Strip wrapping quotes if the model added them
    if (
      (refined.startsWith('"') && refined.endsWith('"')) ||
      (refined.startsWith("'") && refined.endsWith("'"))
    ) {
      refined = refined.slice(1, -1).trim();
    }

    return NextResponse.json({ copy: refined });
  } catch (err) {
    console.error("Refine error:", err);
    return NextResponse.json(
      { error: "Refinement failed. Check server logs." },
      { status: 500 }
    );
  }
}
