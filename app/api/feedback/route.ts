import { NextRequest, NextResponse } from "next/server";
import { addFeedback, removeFeedback, getAllFeedback, getFeedbackStats, getFeedbackCountForCombo } from "@/lib/feedback-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { verdict, copy, channel, product, userState, context, formula, tov_note } = body;

    if (!verdict || !copy || !channel) {
      return NextResponse.json({ error: "verdict, copy, and channel are required" }, { status: 400 });
    }

    const entry = await addFeedback({
      verdict,
      copy,
      channel,
      product: product ?? "",
      userState: userState ?? "",
      context: context ?? "",
      formula: formula ?? "",
      tov_note: tov_note ?? "",
    });

    // Fire-and-forget: re-analyse every 5th feedback for this combo
    const count = await getFeedbackCountForCombo(channel, product ?? "", userState ?? "");
    if (count > 0 && count % 5 === 0) {
      const origin = req.nextUrl.origin;
      fetch(`${origin}/api/learn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, product: product ?? "", userState: userState ?? "" }),
      }).catch((err) => console.error("[feedback] background learn trigger failed:", err));
    }

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error("Feedback POST error:", err);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await removeFeedback(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Feedback DELETE error:", err);
    return NextResponse.json({ error: "Failed to remove feedback" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [stats, entries] = await Promise.all([getFeedbackStats(), getAllFeedback()]);
    return NextResponse.json({ stats, entries });
  } catch (err) {
    console.error("Feedback GET error:", err);
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}
