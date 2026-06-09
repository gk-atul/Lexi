/**
 * Structured ToV rules — extracted from the raw ToV document by Gemini at upload time.
 * Lives at data/tov-parsed.json and is injected into every generation prompt.
 */

import fs from "fs";
import path from "path";

export interface ForbiddenWord {
  word: string;
  replace_with: string;
  reason: string;
}

export interface TovRules {
  forbidden_words: ForbiddenWord[];
  core_principles: string[];
  tone_is: string[];
  tone_is_not: string[];
  never_do: string[];
  always_do: string[];
}

const RULES_PATH = path.join(process.cwd(), "data", "tov-parsed.json");

export function getTovRules(): TovRules | null {
  try {
    if (!fs.existsSync(RULES_PATH)) return null;
    return JSON.parse(fs.readFileSync(RULES_PATH, "utf8")) as TovRules;
  } catch {
    return null;
  }
}

export function saveTovRules(rules: TovRules): void {
  fs.writeFileSync(RULES_PATH, JSON.stringify(rules, null, 2), "utf8");
}

/**
 * Builds a compact, structured block injected into every generation prompt
 * immediately after the raw ToV text. This dual-injection ensures the model
 * has both the nuance of the full doc and a scannable mechanical ruleset.
 */
export function buildTovRulesBlock(rules: TovRules): string {
  const lines: string[] = [
    "--- TOV RULES (distilled from the guide above — apply with equal weight) ---",
  ];

  if (rules.tone_is.length > 0 || rules.tone_is_not.length > 0) {
    lines.push(`VOICE IS: ${rules.tone_is.join(", ")}`);
    lines.push(`VOICE IS NOT: ${rules.tone_is_not.join(", ")}`);
  }

  if (rules.core_principles.length > 0) {
    lines.push("\nCORE PRINCIPLES:");
    rules.core_principles.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
  }

  if (rules.always_do.length > 0) {
    lines.push("\nALWAYS:");
    rules.always_do.forEach((r) => lines.push(`✓ ${r}`));
  }

  if (rules.never_do.length > 0) {
    lines.push("\nNEVER:");
    rules.never_do.forEach((r) => lines.push(`✗ ${r}`));
  }

  if (rules.forbidden_words.length > 0) {
    lines.push("\nFORBIDDEN WORDS — replace without exception:");
    rules.forbidden_words.forEach(({ word, replace_with }) =>
      lines.push(`  "${word}" → "${replace_with}"`)
    );
  }

  lines.push("--- END TOV RULES ---");
  return lines.join("\n");
}

export const TOV_EXTRACTION_PROMPT = `You are analysing a brand Tone of Voice document. Extract structured, actionable writing rules from it.

Return ONLY a valid JSON object with exactly these fields — no markdown, no explanation:

{
  "forbidden_words": [
    { "word": "lapse", "replace_with": "cover ends", "reason": "insurance jargon" }
  ],
  "core_principles": [
    "Write in second person — use 'you'/'your', never 'policyholder' or 'insured'"
  ],
  "tone_is": ["plain", "direct", "warm"],
  "tone_is_not": ["jargon-heavy", "fear-based", "salesy", "corporate"],
  "never_do": [
    "Use fear as the primary hook — use preparedness instead"
  ],
  "always_do": [
    "Lead with what the user gains or avoids, not what ACKO does"
  ]
}

Rules for extraction:
- forbidden_words: extract every word or phrase the document warns against using. Include ALL jargon, legal-ese, agent-speak, and emotional manipulation phrases. For each, derive a plain-language replacement from context in the document.
- core_principles: 6–10 short, imperative writing rules that can be checked against any piece of copy.
- tone_is / tone_is_not: single adjectives or short phrases only.
- never_do / always_do: complete sentences starting with a verb, concrete enough to apply as a checklist.
- Be exhaustive for forbidden_words — if the document says "avoid X" or "instead of X" or "don't use X", it belongs in the list.

ToV document:
---
`;
