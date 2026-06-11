import { getDb, ensureMigrated } from "./db";
import crypto from "crypto";

// Gemini 2.5 Pro pricing (USD per token)
const COST_PER_INPUT_TOKEN  = 1.25  / 1_000_000; // $1.25 / 1M
const COST_PER_OUTPUT_TOKEN = 10.00 / 1_000_000; // $10   / 1M

export function calcCost(tokensIn: number, tokensOut: number): number {
  return tokensIn * COST_PER_INPUT_TOKEN + tokensOut * COST_PER_OUTPUT_TOKEN;
}

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
  tokens_in?: number;
  tokens_out?: number;
  // Full brief text for data analysis
  brief_context?: string;
  brief_user_desc?: string;
  brief_action?: string;
  brief_non_neg?: string;
  brief_reference?: string;
}

export async function recordUsageEvent(data: UsageEventInput): Promise<void> {
  try {
    await ensureMigrated();
    await getDb().execute({
      sql: `INSERT INTO usage_events
        (id, event_type, channel, product, use_case, comm_type, tone,
         pn_framework, variant_count, has_user_desc, has_desired_action,
         has_non_neg, has_reference, is_drip, writer_id, tokens_in, tokens_out,
         brief_context, brief_user_desc, brief_action, brief_non_neg, brief_reference,
         created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
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
        data.tokens_in      ?? 0,
        data.tokens_out     ?? 0,
        data.brief_context   ?? "",
        data.brief_user_desc ?? "",
        data.brief_action    ?? "",
        data.brief_non_neg   ?? "",
        data.brief_reference ?? "",
        new Date().toISOString(),
      ],
    });
  } catch (e) {
    console.warn("analytics record failed (non-fatal):", e);
  }
}

// ─── Aggregated stats ─────────────────────────────────────────────────────────

function since(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export async function getAnalytics() {
  await ensureMigrated();
  const db = getDb();

  const total = async (days: number, type?: string): Promise<number> => {
    const cutoff = since(days);
    if (type) {
      const r = await db.execute({
        sql: "SELECT COUNT(*) as n FROM usage_events WHERE event_type = ? AND created_at >= ?",
        args: [type, cutoff],
      });
      return Number(r.rows[0]?.n ?? 0);
    }
    const r = await db.execute({
      sql: "SELECT COUNT(*) as n FROM usage_events WHERE created_at >= ?",
      args: [cutoff],
    });
    return Number(r.rows[0]?.n ?? 0);
  };

  // Generations
  const [gen7a, gen7b, gen30a, gen30b] = await Promise.all([
    total(7, "generate"),
    total(7, "drip_cell"),
    total(30, "generate"),
    total(30, "drip_cell"),
  ]);
  const generations7   = gen7a + gen7b;
  const generations30  = gen30a + gen30b;

  const genAllResult = await db.execute(
    "SELECT COUNT(*) as n FROM usage_events WHERE event_type IN ('generate','drip_cell')"
  );
  const generationsAll = Number(genAllResult.rows[0]?.n ?? 0);

  // Interactions (last 30 days)
  const [copies30, regenerates30, addMore30, refines30, exports30] = await Promise.all([
    total(30, "copy"),
    total(30, "regenerate"),
    total(30, "add_more"),
    total(30, "refine"),
    total(30, "export"),
  ]);

  // Channel breakdown (last 30 days)
  const channelResult = await db.execute({
    sql: `SELECT channel, COUNT(*) as n
      FROM usage_events
      WHERE event_type IN ('generate','drip_cell') AND created_at >= ? AND channel != ''
      GROUP BY channel ORDER BY n DESC`,
    args: [since(30)],
  });
  const channelRows = channelResult.rows as unknown as { channel: string; n: number }[];

  // Product breakdown (last 30 days)
  const productResult = await db.execute({
    sql: `SELECT product, COUNT(*) as n
      FROM usage_events
      WHERE event_type IN ('generate','drip_cell') AND created_at >= ? AND product != ''
      GROUP BY product ORDER BY n DESC`,
    args: [since(30)],
  });
  const productRows = productResult.rows as unknown as { product: string; n: number }[];

  // Brief field fill rates (last 30 days)
  const briefBaseResult = await db.execute({
    sql: "SELECT COUNT(*) as n FROM usage_events WHERE event_type = 'generate' AND created_at >= ?",
    args: [since(30)],
  });
  const briefTotal = Number(briefBaseResult.rows[0]?.n ?? 0) || 1;

  const briefFieldsResult = await db.execute({
    sql: `SELECT
      SUM(has_user_desc)       as user_desc,
      SUM(has_desired_action)  as desired_action,
      SUM(has_non_neg)         as non_neg,
      SUM(has_reference)       as reference
      FROM usage_events
      WHERE event_type = 'generate' AND created_at >= ?`,
    args: [since(30)],
  });
  const bf = briefFieldsResult.rows[0] as unknown as {
    user_desc: number; desired_action: number; non_neg: number; reference: number;
  };

  // Tone distribution (last 30 days, generations only)
  const toneResult = await db.execute({
    sql: `SELECT tone, COUNT(*) as n FROM usage_events
      WHERE event_type = 'generate' AND created_at >= ? AND tone != ''
      GROUP BY tone ORDER BY n DESC`,
    args: [since(30)],
  });
  const toneRows = toneResult.rows as unknown as { tone: string; n: number }[];

  // Comm type distribution
  const commResult = await db.execute({
    sql: `SELECT comm_type, COUNT(*) as n FROM usage_events
      WHERE event_type = 'generate' AND created_at >= ? AND comm_type != ''
      GROUP BY comm_type ORDER BY n DESC`,
    args: [since(30)],
  });
  const commRows = commResult.rows as unknown as { comm_type: string; n: number }[];

  // Daily generation trend (last 14 days)
  const trendResult = await db.execute({
    sql: `SELECT substr(created_at, 1, 10) as day, COUNT(*) as n
      FROM usage_events
      WHERE event_type IN ('generate','drip_cell') AND created_at >= ?
      GROUP BY day ORDER BY day ASC`,
    args: [since(14)],
  });
  const trendRows = trendResult.rows as unknown as { day: string; n: number }[];

  // Cost aggregation — tokens_in/tokens_out stored on generate/drip_cell events
  const costQuery = async (cutoff: string | null): Promise<{ tokensIn: number; tokensOut: number }> => {
    const r = await db.execute({
      sql: cutoff
        ? `SELECT COALESCE(SUM(tokens_in),0) as ti, COALESCE(SUM(tokens_out),0) as to_
           FROM usage_events WHERE event_type IN ('generate','drip_cell') AND created_at >= ?`
        : `SELECT COALESCE(SUM(tokens_in),0) as ti, COALESCE(SUM(tokens_out),0) as to_
           FROM usage_events WHERE event_type IN ('generate','drip_cell')`,
      args: cutoff ? [cutoff] : [],
    });
    const row = r.rows[0] as unknown as { ti: number; to_: number };
    return { tokensIn: Number(row?.ti ?? 0), tokensOut: Number(row?.to_ ?? 0) };
  };

  const [cost7, cost30, costAll] = await Promise.all([
    costQuery(since(7)),
    costQuery(since(30)),
    costQuery(null),
  ]);

  const fmt = (t: { tokensIn: number; tokensOut: number }) => ({
    tokensIn:  t.tokensIn,
    tokensOut: t.tokensOut,
    usd:       Math.round(calcCost(t.tokensIn, t.tokensOut) * 10000) / 10000, // 4 decimal places
  });

  return {
    generations: { last7: generations7, last30: generations30, all: generationsAll },
    cost: { last7: fmt(cost7), last30: fmt(cost30), all: fmt(costAll) },
    interactions30: { copies: copies30, regenerates: regenerates30, addMore: addMore30, refines: refines30, exports: exports30 },
    channels: channelRows,
    products: productRows,
    brief: {
      total: briefTotal,
      userDesc:      Math.round((Number(bf?.user_desc      ?? 0) / briefTotal) * 100),
      desiredAction: Math.round((Number(bf?.desired_action ?? 0) / briefTotal) * 100),
      nonNeg:        Math.round((Number(bf?.non_neg        ?? 0) / briefTotal) * 100),
      reference:     Math.round((Number(bf?.reference      ?? 0) / briefTotal) * 100),
    },
    tone: toneRows,
    commType: commRows,
    trend: trendRows,
  };
}
