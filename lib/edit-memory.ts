/**
 * Layer 1: Edit memory
 *
 * Tracks every writer edit, classifies what changed, and extracts
 * procedural rules that improve future generations.
 */

import { getDb } from "@/lib/feedback-store";
import crypto from "crypto";

// ─── Edit classification ──────────────────────────────────────────────────────

export function classifyEdit(generated: string, edited: string): string[] {
  if (!generated || !edited || generated === edited) return [];
  const types: string[] = [];

  // shortened: length reduced by >15%
  if ((generated.length - edited.length) / generated.length > 0.15) {
    types.push("shortened");
  }

  // added_urgency: time-bound words that weren't in the original
  const urgencyRx = /\b(today|now|expires?|expiring|last\s+chance|hours?\s+left|days?\s+left|ends?\s+(today|soon|\w+day)|deadline)\b/i;
  if (!urgencyRx.test(generated) && urgencyRx.test(edited)) {
    types.push("added_urgency");
  }

  // added_personalization: more tokens in edited than generated
  const tokenRx = /\[(Name|Car\s*Model|Amount|Date|Expiry|NCB|Policy|Premium)\]/gi;
  const genTokens = (generated.match(tokenRx) ?? []).length;
  const editTokens = (edited.match(tokenRx) ?? []).length;
  if (editTokens > genTokens) {
    types.push("added_personalization");
  }

  // removed_emoji: had emoji, no longer does
  // Use a broad range rather than \p{Emoji_Presentation} for TS compat
  const emojiRx = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  if (emojiRx.test(generated) && !emojiRx.test(edited)) {
    types.push("removed_emoji");
  }

  // added_specificity: rupee amounts, percentages, or shorthand numbers introduced
  const specificRx = /₹\s*\d+|\d+\s*%|\d+[Kk]\b|\d+[Ll]\b/;
  if (!specificRx.test(generated) && specificRx.test(edited)) {
    types.push("added_specificity");
  }

  // reframed_tone: switched between loss-framing and benefit-framing
  const lossRx  = /\b(lose|risk|expire|lapse|miss|penalty|lose out)\b/i;
  const benefitRx = /\b(save|protect|keep|earn|get|enjoy|gain)\b/i;
  const genLoss = lossRx.test(generated); const editBenefit = benefitRx.test(edited) && !benefitRx.test(generated);
  const genBenefit = benefitRx.test(generated); const editLoss = lossRx.test(edited) && !lossRx.test(generated);
  if ((genLoss && editBenefit) || (genBenefit && editLoss)) {
    types.push("reframed_tone");
  }

  if (types.length === 0) types.push("other");
  return types;
}

// ─── Record an edit event ─────────────────────────────────────────────────────

export interface EditEventInput {
  generationId?: string;
  useCase: string;
  channel: string;
  journeyDay?: number | null;
  commType: string;
  generatedText: string;
  editedText: string;
  writerId?: string;
}

export function recordEditEvent(data: EditEventInput): { id: string; editTypes: string[] } {
  const editTypes = classifyEdit(data.generatedText, data.editedText);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const db = getDb();

  db.prepare(`
    INSERT INTO edit_events
      (id, generation_id, use_case, channel, journey_day, comm_type,
       generated_text, edited_text, edit_types, writer_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.generationId ?? "",
    data.useCase,
    data.channel,
    data.journeyDay ?? null,
    data.commType,
    data.generatedText,
    data.editedText,
    JSON.stringify(editTypes),
    data.writerId ?? "anonymous",
    now
  );

  // Trigger rule extraction every 5 edits
  const total = (db.prepare("SELECT COUNT(*) as n FROM edit_events").get() as { n: number }).n;
  if (total % 5 === 0) extractRules();

  return { id, editTypes };
}

// ─── Rule extraction ──────────────────────────────────────────────────────────

const EDIT_TYPE_RULE_TEMPLATES: Record<string, (ctx: string) => string> = {
  shortened:             (ctx) => `Keep copy concise for ${ctx} — writers consistently shorten output by >15%.`,
  added_urgency:         (ctx) => `Include a real deadline or expiry signal in ${ctx} copy — writers consistently add time-bound urgency.`,
  added_personalization: (ctx) => `Add [Name] and at least one specific detail ([Amount], [Date], [NCB]) to ${ctx} copy — writers consistently personalise further.`,
  removed_emoji:         (ctx) => `Do not use emojis in ${ctx} copy — writers consistently remove them.`,
  added_specificity:     (ctx) => `Include at least one concrete figure (₹ amount or percentage) in ${ctx} copy — writers consistently add specificity.`,
  reframed_tone:         (ctx) => `Check framing direction for ${ctx} copy — writers frequently reframe between benefit and loss framing.`,
  other:                 (ctx) => `Writers frequently modify ${ctx} copy — apply extra editorial care.`,
};

export function extractRules(): void {
  const db = getDb();
  const KNOWN_TYPES = Object.keys(EDIT_TYPE_RULE_TEMPLATES);

  for (const editType of KNOWN_TYPES) {
    // Find (use_case, channel, comm_type) groups with 5+ edits of this type
    const groups = db.prepare(`
      SELECT use_case, channel, comm_type, COUNT(*) as cnt
      FROM edit_events
      WHERE edit_types LIKE ?
      GROUP BY use_case, channel, comm_type
      HAVING cnt >= 5
    `).all(`%${editType}%`) as { use_case: string; channel: string; comm_type: string; cnt: number }[];

    for (const g of groups) {
      const ctx = [g.channel, g.use_case, g.comm_type].filter(Boolean).join("/") || "all contexts";
      const ruleText = EDIT_TYPE_RULE_TEMPLATES[editType](ctx);
      const now = new Date().toISOString();

      const existing = db.prepare(`
        SELECT id, supporting_edit_count FROM procedural_rules
        WHERE (scope_use_case IS NULL OR scope_use_case = ?)
          AND (scope_channel   IS NULL OR scope_channel   = ?)
          AND (scope_comm_type IS NULL OR scope_comm_type = ?)
          AND rule LIKE ?
          AND status != 'retired'
        LIMIT 1
      `).get(g.use_case || null, g.channel || null, g.comm_type || null, `%${editType}%`) as
        { id: string; supporting_edit_count: number } | undefined;

      if (existing) {
        const newCount    = existing.supporting_edit_count + 1;
        const newStrength = Math.min(0.95, 0.3 + newCount * 0.05);
        db.prepare(`
          UPDATE procedural_rules
          SET supporting_edit_count = ?, strength = ?, last_updated = ?, status = 'active'
          WHERE id = ?
        `).run(newCount, newStrength, now, existing.id);
      } else {
        db.prepare(`
          INSERT INTO procedural_rules
            (id, scope_use_case, scope_channel, scope_comm_type,
             rule, strength, supporting_edit_count, last_updated, status, source)
          VALUES (?, ?, ?, ?, ?, 0.3, 1, ?, 'pending_review', 'auto_extracted')
        `).run(
          crypto.randomUUID(),
          g.use_case || null,
          g.channel  || null,
          g.comm_type || null,
          ruleText,
          now
        );
      }
    }
  }

  // Age out rules not updated in 90 days (reduce strength 0.1 per month)
  const cutoff90  = new Date(Date.now() - 90  * 86400_000).toISOString();
  const cutoff180 = new Date(Date.now() - 180 * 86400_000).toISOString();
  db.prepare(`UPDATE procedural_rules SET strength = MAX(0, strength - 0.1) WHERE last_updated < ? AND status = 'active'`).run(cutoff90);
  db.prepare(`UPDATE procedural_rules SET status = 'retired' WHERE strength <= 0 OR last_updated < ?`).run(cutoff180);
}

// ─── Query rules for prompt injection ────────────────────────────────────────

export interface ProceduralRule {
  id: string;
  rule: string;
  strength: number;
  scope_channel: string | null;
  scope_use_case: string | null;
  scope_comm_type: string | null;
}

export function getProceduralRules(
  useCase: string,
  channel: string,
  commType: string
): ProceduralRule[] {
  return getDb().prepare(`
    SELECT id, rule, strength, scope_channel, scope_use_case, scope_comm_type
    FROM procedural_rules
    WHERE status = 'active'
      AND (scope_channel   IS NULL OR scope_channel   = ?)
      AND (scope_use_case  IS NULL OR scope_use_case  = ?)
      AND (scope_comm_type IS NULL OR scope_comm_type = ?)
    ORDER BY strength DESC
    LIMIT 8
  `).all(channel, useCase, commType) as ProceduralRule[];
}
