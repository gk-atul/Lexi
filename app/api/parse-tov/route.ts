import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { saveTov, saveTovMeta } from "@/lib/tov-store";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const versionName = (formData.get("version") as string) || file.name;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: "Could not extract text from document" },
        { status: 400 }
      );
    }

    saveTov(text);
    saveTovMeta(versionName);

    return NextResponse.json({
      success: true,
      charCount: text.length,
      version: versionName,
    });
  } catch (err) {
    console.error("Parse ToV error:", err);
    return NextResponse.json(
      { error: "Failed to parse document" },
      { status: 500 }
    );
  }
}
