import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ text: result.value.trim() });
    }

    if (name.endsWith(".txt") || name.endsWith(".md")) {
      return NextResponse.json({ text: buffer.toString("utf-8").trim() });
    }

    return NextResponse.json(
      { error: "Unsupported file type. Please upload a .docx or .txt file, or paste text directly." },
      { status: 400 }
    );
  } catch (err) {
    console.error("extract-reference error:", err);
    return NextResponse.json({ error: "Failed to extract text from file." }, { status: 500 });
  }
}
