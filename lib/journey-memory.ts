/**
 * Layer 2: Journey memory
 *
 * Persists each day's generated copy for a drip campaign and assembles
 * a coherence context so the LLM knows what came before and what
 * constraints apply to the next day.
 */

import { getDb, ensureMigrated } from "./db";
import crypto from "crypto";

// ─── Hook & strategy extraction ───────────────────────────────────────────────

export function extractHookType(headline: string): string {
  const h = headline.trim();
  if (/^\[Name\]/i.test(h))  return "personalized_opening";
  if (h.endsWith("?"))       return "question";
  if (h.endsWith("!"))       return "exclamation";
  return "statement";
}

export function extractStrategy(headline: string, body: string): string {
  const text = (headline + " " + body).toLowerCase();
  if (/\?/.test(headline))                                                 return "question_hook";
  if (/\b(expires?|expiring|lapse|lose|risk|miss|last\s+chance)\b/.test(text)) return "loss_framing";
  if (/\b(save|protect|keep|earn|bonus|discount|ncb)\b/.test(text))       return "benefit_framing";
  if (/\b(today|now|hours?\s+left|ends?\s+(today|soon))\b/.test(text))    return "urgency";
  if (/\b(\d{1,3},?\d{3}|\d+[kK]|\d+%|₹\d+)\b/.test(text))              return "specificity_proof";
  if (/\byou('ve|\s+have)\b/.test(text))                                  return "achievement";
  return "neutral";
}

// ─── Save a generation ───────────────────────────────────────────────────────

export interface JourneyGenerationInput {
  journeyId: string;
  day: number;
  channel: string;
  useCase: string;
  headline: string;
  body: string;
  formula?: string;
}

export async function recordJourneyGeneration(data: JourneyGenerationInput): Promise<void> {
  await ensureMigrated();
  const db = getDb();
  const hookType     = extractHookType(data.headline);
  const strategyUsed = data.formula ?? extractStrategy(data.headline, data.body);
  const now          = new Date().toISOString();

  const existingResult = await db.execute({
    sql: `SELECT id FROM journey_generations WHERE journey_id = ? AND day = ? AND channel = ?`,
    args: [data.journeyId, data.day, data.channel],
  });
  const existing = existingResult.rows[0] as unknown as { id: string } | undefined;

  if (existing) {
    await db.execute({
      sql: `UPDATE journey_generations
        SET headline = ?, body = ?, strategy_used = ?, hook_type = ?, created_at = ?
        WHERE id = ?`,
      args: [data.headline, data.body, strategyUsed, hookType, now, existing.id],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO journey_generations
        (id, journey_id, day, channel, use_case, headline, body,
         strategy_used, hook_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      args: [
        crypto.randomUUID(),
        data.journeyId, data.day, data.channel, data.useCase,
        data.headline, data.body, strategyUsed, hookType, now,
      ],
    });
  }
}

// ─── Assemble journey context ─────────────────────────────────────────────────

export interface JourneyDayRecord {
  day: number;
  headline: string;
  strategy: string;
  hook_type: string;
  status: string;
}

export interface JourneyContext {
  journey_id: string;
  days_completed: JourneyDayRecord[];
  strategies_used: string[];
  hooks_used: string[];
  constraints_for_next: {
    avoid_strategies: string[];
    avoid_hooks: string[];
    suggested_escalation: string;
  };
}

export async function getJourneyContext(
  journeyId: string,
  currentDay: number,
  totalDays: number
): Promise<JourneyContext | null> {
  await ensureMigrated();
  const result = await getDb().execute({
    sql: `SELECT day, headline, strategy_used, hook_type, status
      FROM journey_generations
      WHERE journey_id = ? AND day < ?
      ORDER BY day ASC`,
    args: [journeyId, currentDay],
  });

  const rows = result.rows as unknown as Array<{
    day: number; headline: string; strategy_used: string; hook_type: string; status: string;
  }>;

  if (rows.length === 0) return null;

  const strategiesUsed = [...new Set(rows.map((r) => r.strategy_used))];
  const hooksUsed      = [...new Set(rows.map((r) => r.hook_type))];
  const lastRow        = rows[rows.length - 1];

  const avoidHooks      = lastRow ? [lastRow.hook_type]      : [];
  const avoidStrategies = lastRow ? [lastRow.strategy_used]  : [];

  const progress    = currentDay / totalDays;
  const urgencyTier = progress <= 0.33 ? "low" : progress <= 0.67 ? "moderate" : "high";
  const usedLoss    = strategiesUsed.some((s) => s.includes("loss"));
  const usedBenefit = strategiesUsed.some((s) => s.includes("benefit"));

  const notes: string[] = [
    `Day ${currentDay} of ${totalDays}. Set urgency at ${urgencyTier}.`,
  ];

  if (lastRow) {
    notes.push(`Yesterday used a ${lastRow.hook_type} hook and ${lastRow.strategy_used} strategy — do not repeat either.`);
  }

  if (currentDay > 3 && usedLoss && !usedBenefit) {
    notes.push("Days 1–3 leaned on loss-framing. Shift to benefit-framing or achievement before returning to loss.");
  }

  if (urgencyTier === "high") {
    notes.push("Final stretch — escalate urgency meaningfully. State a specific consequence or deadline.");
  }

  return {
    journey_id: journeyId,
    days_completed: rows.map((r) => ({
      day:       r.day,
      headline:  r.headline,
      strategy:  r.strategy_used,
      hook_type: r.hook_type,
      status:    r.status,
    })),
    strategies_used: strategiesUsed,
    hooks_used:      hooksUsed,
    constraints_for_next: {
      avoid_strategies: avoidStrategies,
      avoid_hooks:      avoidHooks,
      suggested_escalation: notes.join(" "),
    },
  };
}
