import { NextRequest, NextResponse } from "next/server";
import { recordEditEvent } from "@/lib/edit-memory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { generationId, useCase, channel, journeyDay, commType, generatedText, editedText, writerId } = body;

    if (!generatedText || !editedText || !channel) {
      return NextResponse.json({ error: "generatedText, editedText, and channel are required" }, { status: 400 });
    }

    if (generatedText === editedText) {
      return NextResponse.json({ skipped: true, reason: "no change" });
    }

    const result = await recordEditEvent({
      generationId,
      useCase:   useCase   ?? "",
      channel:   channel   ?? "",
      journeyDay: journeyDay ?? null,
      commType:  commType  ?? "",
      generatedText,
      editedText,
      writerId,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("edit-event error:", err);
    return NextResponse.json({ error: "Failed to record edit event" }, { status: 500 });
  }
}
