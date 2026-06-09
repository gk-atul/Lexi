import { NextRequest, NextResponse } from "next/server";
import { getWordRules, saveWordRules, WordRules } from "@/lib/word-rules";

export async function GET() {
  return NextResponse.json(await getWordRules());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as WordRules;
    if (!body.replacements || !body.forbidden) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    await saveWordRules(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("word-rules save error:", err);
    return NextResponse.json({ error: "Failed to save word rules" }, { status: 500 });
  }
}
