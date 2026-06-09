import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveTov, saveTovMeta } from "@/lib/tov-store";
import { saveTovRules, TovRules, TOV_EXTRACTION_PROMPT } from "@/lib/tov-rules";
import { getWordRules, saveWordRules } from "@/lib/word-rules";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    // 1. Save raw ToV text (existing behaviour)
    saveTov(text);
    saveTovMeta(versionName);

    // 2. Extract structured rules via Gemini — runs in background, non-blocking
    extractAndSaveRules(text).catch((e) =>
      console.warn("ToV rule extraction failed (non-fatal):", e)
    );

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

// PUT — re-run rule extraction on the currently saved ToV (no re-upload needed)
export async function PUT() {
  try {
    const { getTov } = await import("@/lib/tov-store");
    const tov = getTov();
    await extractAndSaveRules(tov);
    const { getTovRules } = await import("@/lib/tov-rules");
    const rules = await getTovRules();
    return NextResponse.json({
      ok: true,
      forbidden_words: rules?.forbidden_words.length ?? 0,
      core_principles: rules?.core_principles.length ?? 0,
    });
  } catch (err) {
    console.error("ToV re-extraction error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}

async function extractAndSaveRules(tov: string): Promise<void> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  const prompt = TOV_EXTRACTION_PROMPT + tov + "\n---";

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim()
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const rules = JSON.parse(raw) as TovRules;
  await saveTovRules(rules);

  // Auto-merge extracted forbidden words into word-rules config
  // (only adds new entries — does not overwrite manual edits)
  const wordRules = await getWordRules();
  let changed = false;
  for (const { word, replace_with } of rules.forbidden_words) {
    const key = word.toLowerCase().trim();
    if (key && !wordRules.replacements[key]) {
      wordRules.replacements[key] = replace_with.toLowerCase().trim();
      changed = true;
    }
  }
  if (changed) await saveWordRules(wordRules);
}
