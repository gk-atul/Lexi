/**
 * Word rules: forbidden jargon replacements + banned phrases.
 *
 * Source of truth: data/word-rules.json
 * Applied in two places:
 *   1. Prompt injection — tells the model what to avoid (reduces violations)
 *   2. Post-processing in generate/route.ts — deterministic fallback (catches everything)
 */

import fs from "fs";
import path from "path";

export interface WordRules {
  /** Jargon → plain-English replacements. Applied programmatically after generation. */
  replacements: Record<string, string>;
  /** Phrases with no direct replacement — must be rephrased entirely. Prompt-only warning. */
  forbidden: string[];
}

const RULES_PATH = path.join(process.cwd(), "data", "word-rules.json");

export function getWordRules(): WordRules {
  try {
    const raw = fs.readFileSync(RULES_PATH, "utf8");
    return JSON.parse(raw) as WordRules;
  } catch {
    return { replacements: {}, forbidden: [] };
  }
}

export function saveWordRules(rules: WordRules): void {
  fs.writeFileSync(RULES_PATH, JSON.stringify(rules, null, 2), "utf8");
}

/**
 * Programmatically replace jargon in generated copy.
 * - Multi-word phrases are matched first (longest → shortest) to avoid partial collisions.
 * - Capitalisation of the first letter is preserved.
 * - Only whole-word matches (won't touch "collapse" when replacing "lapse").
 */
export function sanitizeCopy(text: string, rules: WordRules): string {
  // Sort longest phrase first so "sum insured" matches before "insured"
  const pairs = Object.entries(rules.replacements).sort(
    (a, b) => b[0].length - a[0].length
  );

  let result = text;
  for (const [jargon, plain] of pairs) {
    // \b works for single words; for multi-word phrases we need lookaround
    const escaped = jargon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const boundary = jargon.includes(" ")
      ? `(?<![\\w])${escaped}(?![\\w])`
      : `\\b${escaped}\\b`;
    const regex = new RegExp(boundary, "gi");

    result = result.replace(regex, (match) => {
      // Preserve sentence-start capitalisation
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return plain.charAt(0).toUpperCase() + plain.slice(1);
      }
      return plain;
    });
  }
  return result;
}

/**
 * Builds the prompt injection block — tells the model what to avoid.
 * This is the first line of defence; sanitizeCopy() is the safety net.
 */
export function buildWordRulesBlock(rules: WordRules): string {
  const pairs = Object.entries(rules.replacements);
  if (pairs.length === 0 && rules.forbidden.length === 0) return "";

  const lines: string[] = [
    "PLAIN LANGUAGE — mandatory word replacements (scan every word before outputting):",
  ];

  if (pairs.length > 0) {
    lines.push("Replace these words/phrases without exception:");
    // Show longest first so the model sees multi-word phrases prominently
    const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length);
    for (const [from, to] of sorted) {
      lines.push(`  "${from}" → "${to}"`);
    }
  }

  if (rules.forbidden.length > 0) {
    lines.push(
      "",
      "Never use these phrases — rephrase the entire sentence instead:"
    );
    for (const phrase of rules.forbidden) {
      lines.push(`  "${phrase}"`);
    }
  }

  return lines.join("\n");
}
