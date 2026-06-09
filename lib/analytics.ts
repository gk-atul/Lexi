import { getDb } from "@/lib/feedback-store";
import crypto from "crypto";

export interface UsageEventInput {
  event_type: "generate" | "copy" | "regenerate" | "add_more" | "refine" | "export" | "drip_cell";
  channel?: string;
  product?: string;
  use_case?: string;
  comm_type?: string;
  tone?: string;
  pn_framework?: string;
  variant_count?: number;
  has_user_desc?: boolean;
  has_desired_action?: boolean;
  has_non_neg?: boolean;
  has_reference?: boolean;
  is_drip?: boolean;
  writer_id?: string;
}

export function recordUsageEvent(data: UsageEventInput): void {
  try {
    getDb().prepare(`
      INSERT INTO usage_events
        (id, event_type, channel, product, use_case, comm_type, tone,
         pn_framework, variant_count, has_user_desc, has_desired_action,
         has_non_neg, has_reference, is_drip, writer_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      data.event_type,
      data.channel        ?? "",
      data.product        ?? "",
      data.use_case       ?? "",
      data.comm_type      ?? "",
      data.tone           ?? "",
      data.pn_framework   ?? "",
      data.variant_count  ?? 0,
      data.has_user_desc       ? 1 : 0,
      data.has_desired_action  ? 1 : 0,
      data.has_non_neg         ? 1 : 0,
      data.has_reference       ? 1 : 0,
      data.is_drip             ? 1 : 0,
      data.writer_id      ?? "anonymous",
      new Date().toISOString(),
    );
  } catch (e) {
    console.warn("analytics record failed (non-fatal):", e);
  }
}

// ─── Aggregated stats ─────────────────────────────────────────────────────────

function since(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export function getAnalytics() {
  const db = getDb();

  const total = (days: number, type?: string) => {
    const cutoff = since(days);
    if (type) {
      return (db.prepare(
        "SELECT COUNT(*) as n FROM usage_events WHERE event_type = ? AND created_at >= ?"
      ).get(type, cutoff) as { n: number }).n;
    }
    return (db.prepare(
      "SELECT COUNT(*) as n FROM usage_events WHERE created_at >= ?"
    ).get(cutoff) as { n: number }).n;
  };

  // Generations
  const generations7  = total(7,  "generate") + total(7,  "drip_cell");
  const generations30 = total(30, "generate") + total(30, "drip_cell");
  const generationsAll = (db.prepare(
    "SELECT COUNT(*) as n FROM usage_events WHERE event_type IN ('generate','drip_cell')"
  ).get() as { n: number }).n;

  // Interactions (last 30 days)
  const copies30      = total(30, "copy");
  const regenerates30 = total(30, "regenerate");
  const addMore30     = total(30, "add_more");
  const refines30     = total(30, "refine");
  const exports30     = total(30, "export");

  // Channel breakdown (last 30 days)
  const channelRows = db.prepare(`
    SELECT channel, COUNT(*) as n
    FROM usage_events
    WHERE event_type IN ('generate','drip_cell') AND created_at >= ? AND channel != ''
    GROUP BY channel ORDER BY n DESC
  `).all(since(30)) as { channel: string; n: number }[];

  // Product breakdown (last 30 days)
  const productRows = db.prepare(`
    SELECT product, COUNT(*) as n
    FROM usage_events
    WHERE event_type IN ('generate','drip_cell') AND created_at >= ? AND product != ''
    GROUP BY product ORDER BY n DESC
  `).all(since(30)) as { product: string; n: number }[];

  // Brief field fill rates (last 30 days)
  const briefBase = db.prepare(`
    SELECT COUNT(*) as n FROM usage_events
    WHERE event_type = 'generate' AND created_at >= ?
  `).get(since(30)) as { n: number };
  const briefTotal = briefBase.n || 1;

  const briefFields = db.prepare(`
    SELECT
      SUM(has_user_desc)       as user_desc,
      SUM(has_desired_action)  as desired_action,
      SUM(has_non_neg)         as non_neg,
      SUM(has_reference)       as reference
    FROM usage_events
    WHERE event_type = 'generate' AND created_at >= ?
  `).get(since(30)) as {
    user_desc: number; desired_action: number; non_neg: number; reference: number;
  };

  // Tone distribution (last 30 days, generations only)
  const toneRows = db.prepare(`
    SELECT tone, COUNT(*) as n FROM usage_events
    WHERE event_type = 'generate' AND created_at >= ? AND tone != ''
    GROUP BY tone ORDER BY n DESC
  `).all(since(30)) as { tone: string; n: number }[];

  // Comm type distribution
  const commRows = db.prepare(`
    SELECT comm_type, COUNT(*) as n FROM usage_events
    WHERE event_type = 'generate' AND created_at >= ? AND comm_type != ''
    GROUP BY comm_type ORDER BY n DESC
  `).all(since(30)) as { comm_type: string; n: number }[];

  // Daily generation trend (last 14 days)
  const trendRows = db.prepare(`
    SELECT substr(created_at, 1, 10) as day, COUNT(*) as n
    FROM usage_events
    WHERE event_type IN ('generate','drip_cell') AND created_at >= ?
    GROUP BY day ORDER BY day ASC
  `).all(since(14)) as { day: string; n: number }[];

  return {
    generations: { last7: generations7, last30: generations30, all: generationsAll },
    interactions30: { copies: copies30, regenerates: regenerates30, addMore: addMore30, refines: refines30, exports: exports30 },
    channels: channelRows,
    products: productRows,
    brief: {
      total: briefTotal,
      userDesc:      Math.round((briefFields.user_desc      / briefTotal) * 100),
      desiredAction: Math.round((briefFields.desired_action / briefTotal) * 100),
      nonNeg:        Math.round((briefFields.non_neg        / briefTotal) * 100),
      reference:     Math.round((briefFields.reference      / briefTotal) * 100),
    },
    tone: toneRows,
    commType: commRows,
    trend: trendRows,
  };
}
