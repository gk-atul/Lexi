import { getDb, ensureMigrated } from "./db";

export type Verdict = "good" | "bad";

export interface FeedbackEntry {
  id: string;
  timestamp: string;
  verdict: Verdict;
  copy: string;
  channel: string;
  product: string;
  userState: string;
  context: string;
  formula: string;
  tov_note: string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function addFeedback(
  entry: Omit<FeedbackEntry, "id" | "timestamp">
): Promise<FeedbackEntry> {
  await ensureMigrated();
  const db = getDb();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO feedback
      (id, timestamp, verdict, copy, channel, product, user_state, context, formula, tov_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, timestamp, entry.verdict, entry.copy, entry.channel, entry.product, entry.userState, entry.context, entry.formula, entry.tov_note],
  });

  return { id, timestamp, ...entry };
}

export async function removeFeedback(id: string): Promise<void> {
  await ensureMigrated();
  await getDb().execute({ sql: "DELETE FROM feedback WHERE id = ?", args: [id] });
}

export async function getAllFeedback(): Promise<FeedbackEntry[]> {
  await ensureMigrated();
  const result = await getDb().execute("SELECT * FROM feedback ORDER BY timestamp DESC");
  return result.rows.map(rowToEntry);
}

/**
 * Returns the most relevant examples for a given generation context.
 *
 * Scoring (higher = more relevant):
 *   channel + product + userState match  →  3
 *   channel + product match              →  2
 *   channel match only                   →  1
 */
export async function getRelevantExamples(
  channel: string,
  product: string,
  userState: string,
  limit = 3
): Promise<{ good: FeedbackEntry[]; bad: FeedbackEntry[] }> {
  await ensureMigrated();
  const db = getDb();

  const sql = `
    SELECT *,
      CASE
        WHEN product = ? AND user_state = ? THEN 3
        WHEN product = ?                    THEN 2
        ELSE                                     1
      END AS relevance
    FROM feedback
    WHERE channel = ? AND verdict = ?
    GROUP BY copy
    ORDER BY relevance DESC, timestamp DESC
    LIMIT ?
  `;

  const goodResult = await db.execute({ sql, args: [product, userState, product, channel, "good", limit] });
  const badResult  = await db.execute({ sql, args: [product, userState, product, channel, "bad",  limit] });

  return {
    good: goodResult.rows.map(rowToEntry),
    bad:  badResult.rows.map(rowToEntry),
  };
}

export async function getFeedbackStats(): Promise<{
  total: number;
  good: number;
  bad: number;
  byChannel: Record<string, { good: number; bad: number }>;
}> {
  await ensureMigrated();
  const db = getDb();

  const totalsResult = await db.execute(
    "SELECT verdict, COUNT(*) as n FROM feedback GROUP BY verdict"
  );
  const totals = totalsResult.rows as unknown as { verdict: string; n: number }[];

  const byChannelResult = await db.execute(
    "SELECT channel, verdict, COUNT(*) as n FROM feedback GROUP BY channel, verdict"
  );
  const byChannelRows = byChannelResult.rows as unknown as { channel: string; verdict: string; n: number }[];

  const byChannel: Record<string, { good: number; bad: number }> = {};
  for (const r of byChannelRows) {
    if (!byChannel[r.channel]) byChannel[r.channel] = { good: 0, bad: 0 };
    byChannel[r.channel][r.verdict as Verdict] = Number(r.n);
  }

  const good = totals.find((r) => r.verdict === "good")?.n ?? 0;
  const bad  = totals.find((r) => r.verdict === "bad")?.n ?? 0;

  return { total: Number(good) + Number(bad), good: Number(good), bad: Number(bad), byChannel };
}

// ─── Learned insights ────────────────────────────────────────────────────────

export interface InsightRow {
  channel: string;
  product: string;
  userState: string;
  insights: string[];
  summary: string;
  feedbackCount: number;
  updatedAt: string;
}

export async function upsertInsights(
  channel: string,
  product: string,
  userState: string,
  insights: string[],
  summary: string,
  feedbackCount: number
): Promise<void> {
  await ensureMigrated();
  await getDb().execute({
    sql: `INSERT INTO learned_insights
        (channel, product, user_state, insight_text, summary, feedback_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(channel, product, user_state) DO UPDATE SET
        insight_text   = excluded.insight_text,
        summary        = excluded.summary,
        feedback_count = excluded.feedback_count,
        updated_at     = excluded.updated_at`,
    args: [channel, product, userState, JSON.stringify(insights), summary, feedbackCount, new Date().toISOString()],
  });
}

export async function getInsights(
  channel: string,
  product: string,
  userState: string
): Promise<{ insights: string[]; summary: string; feedbackCount: number; updatedAt: string | null }> {
  await ensureMigrated();
  const result = await getDb().execute({
    sql: "SELECT * FROM learned_insights WHERE channel = ? AND product = ? AND user_state = ?",
    args: [channel, product, userState],
  });

  const row = result.rows[0];
  if (!row) return { insights: [], summary: "", feedbackCount: 0, updatedAt: null };
  return {
    insights: JSON.parse(row.insight_text as string ?? "[]"),
    summary: row.summary as string ?? "",
    feedbackCount: Number(row.feedback_count ?? 0),
    updatedAt: row.updated_at as string ?? null,
  };
}

export async function getFeedbackCountForCombo(
  channel: string,
  product: string,
  userState: string
): Promise<number> {
  await ensureMigrated();
  const result = await getDb().execute({
    sql: "SELECT COUNT(*) as n FROM feedback WHERE channel = ? AND product = ? AND user_state = ?",
    args: [channel, product, userState],
  });
  return Number(result.rows[0]?.n ?? 0);
}

export async function getAllInsights(): Promise<InsightRow[]> {
  await ensureMigrated();
  const result = await getDb().execute("SELECT * FROM learned_insights ORDER BY updated_at DESC");
  return result.rows.map((r) => ({
    channel:      r.channel as string,
    product:      r.product as string,
    userState:    r.user_state as string,
    insights:     JSON.parse(r.insight_text as string ?? "[]"),
    summary:      r.summary as string ?? "",
    feedbackCount: Number(r.feedback_count ?? 0),
    updatedAt:    r.updated_at as string,
  }));
}

// ─── Internal helper ─────────────────────────────────────────────────────────

function rowToEntry(row: Record<string, unknown>): FeedbackEntry {
  return {
    id:        row.id as string,
    timestamp: row.timestamp as string,
    verdict:   row.verdict as Verdict,
    copy:      row.copy as string,
    channel:   row.channel as string,
    product:   row.product as string,
    userState: row.user_state as string,
    context:   row.context as string,
    formula:   row.formula as string,
    tov_note:  row.tov_note as string,
  };
}
