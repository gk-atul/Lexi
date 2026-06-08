import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const STATIC_DB_PATH = path.join(DATA_DIR, "feedback.db");

// On Vercel the project root is read-only; use /tmp so SQLite can write.
// Seed /tmp from the committed DB on first cold-start so existing TOV/feedback data carries over.
function resolveDbPath(): string {
  if (!process.env.VERCEL) return STATIC_DB_PATH;
  const tmp = "/tmp/angelou.db";
  if (!fs.existsSync(tmp) && fs.existsSync(STATIC_DB_PATH)) {
    fs.copyFileSync(STATIC_DB_PATH, tmp);
    // WAL/SHM files aren't needed for the copy — SQLite will recreate them in /tmp
    try { fs.unlinkSync(tmp + "-wal"); } catch { /* ignore */ }
    try { fs.unlinkSync(tmp + "-shm"); } catch { /* ignore */ }
  }
  return tmp;
}

const DB_PATH = resolveDbPath();

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

// ─── Singleton DB connection ──────────────────────────────────────────────────
// Next.js hot-reloads modules in dev; store the instance on globalThis to avoid
// opening multiple connections.

const globalForDb = globalThis as unknown as { _feedbackDb?: Database.Database };

export function getDb(): Database.Database {
  if (globalForDb._feedbackDb) return globalForDb._feedbackDb;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);

  // WAL mode: concurrent reads + writes without blocking each other
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id        TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      verdict   TEXT NOT NULL CHECK(verdict IN ('good','bad')),
      copy      TEXT NOT NULL,
      channel   TEXT NOT NULL,
      product   TEXT NOT NULL DEFAULT '',
      user_state TEXT NOT NULL DEFAULT '',
      context   TEXT NOT NULL DEFAULT '',
      formula   TEXT NOT NULL DEFAULT '',
      tov_note  TEXT NOT NULL DEFAULT ''
    );

    -- Index used by getRelevantExamples: filter by channel+verdict, sort by match quality
    CREATE INDEX IF NOT EXISTS idx_feedback_lookup
      ON feedback (channel, verdict, product, user_state);

    -- Learned insights: one row per (channel, product, user_state) combo
    CREATE TABLE IF NOT EXISTS learned_insights (
      channel        TEXT NOT NULL,
      product        TEXT NOT NULL DEFAULT '',
      user_state     TEXT NOT NULL DEFAULT '',
      insight_text   TEXT NOT NULL DEFAULT '[]',
      summary        TEXT NOT NULL DEFAULT '',
      feedback_count INTEGER NOT NULL DEFAULT 0,
      updated_at     TEXT NOT NULL,
      PRIMARY KEY (channel, product, user_state)
    );

    -- ── Layer 1: Edit memory ──────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS edit_events (
      id              TEXT PRIMARY KEY,
      generation_id   TEXT NOT NULL DEFAULT '',
      use_case        TEXT NOT NULL DEFAULT '',
      channel         TEXT NOT NULL DEFAULT '',
      journey_day     INTEGER,
      comm_type       TEXT NOT NULL DEFAULT '',
      generated_text  TEXT NOT NULL DEFAULT '',
      edited_text     TEXT NOT NULL DEFAULT '',
      edit_types      TEXT NOT NULL DEFAULT '[]',
      writer_id       TEXT NOT NULL DEFAULT '',
      created_at      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_edit_events_scope
      ON edit_events (channel, use_case, comm_type);

    CREATE TABLE IF NOT EXISTS procedural_rules (
      id                   TEXT PRIMARY KEY,
      scope_use_case       TEXT,
      scope_channel        TEXT,
      scope_comm_type      TEXT,
      rule                 TEXT NOT NULL,
      strength             REAL NOT NULL DEFAULT 0.3,
      supporting_edit_count INTEGER NOT NULL DEFAULT 1,
      last_updated         TEXT NOT NULL,
      status               TEXT NOT NULL DEFAULT 'pending_review',
      source               TEXT NOT NULL DEFAULT 'auto_extracted'
    );
    CREATE INDEX IF NOT EXISTS idx_proc_rules_scope
      ON procedural_rules (scope_channel, scope_use_case, scope_comm_type, status);

    -- ── Layer 2: Journey memory ───────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS journey_generations (
      id             TEXT PRIMARY KEY,
      journey_id     TEXT NOT NULL,
      day            INTEGER NOT NULL,
      channel        TEXT NOT NULL,
      use_case       TEXT NOT NULL DEFAULT '',
      headline       TEXT NOT NULL DEFAULT '',
      body           TEXT NOT NULL DEFAULT '',
      strategy_used  TEXT NOT NULL DEFAULT '',
      hook_type      TEXT NOT NULL DEFAULT '',
      status         TEXT NOT NULL DEFAULT 'draft',
      created_at     TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_journey_id
      ON journey_generations (journey_id, day);
  `);

  globalForDb._feedbackDb = db;
  return db;
}

// ─── Migrate existing JSON → SQLite (runs once) ───────────────────────────────

function migrateFromJson(): void {
  const jsonPath = path.join(DATA_DIR, "feedback.json");
  if (!fs.existsSync(jsonPath)) return;

  const db = getDb();
  const existing = db.prepare("SELECT COUNT(*) as n FROM feedback").get() as { n: number };
  if (existing.n > 0) return; // already migrated

  try {
    const entries: FeedbackEntry[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    if (!Array.isArray(entries) || entries.length === 0) return;

    const insert = db.prepare(`
      INSERT OR IGNORE INTO feedback
        (id, timestamp, verdict, copy, channel, product, user_state, context, formula, tov_note)
      VALUES
        (@id, @timestamp, @verdict, @copy, @channel, @product, @userState, @context, @formula, @tov_note)
    `);

    const migrate = db.transaction(() => {
      for (const e of entries) insert.run(e);
    });
    migrate();

    // Rename the old file so we don't re-migrate
    fs.renameSync(jsonPath, jsonPath + ".migrated");
    console.log(`[feedback-store] Migrated ${entries.length} entries from JSON → SQLite`);
  } catch (err) {
    console.error("[feedback-store] Migration failed:", err);
  }
}

// Run migration on first import
migrateFromJson();

// ─── Public API ───────────────────────────────────────────────────────────────

export function addFeedback(
  entry: Omit<FeedbackEntry, "id" | "timestamp">
): FeedbackEntry {
  const db = getDb();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO feedback
      (id, timestamp, verdict, copy, channel, product, user_state, context, formula, tov_note)
    VALUES
      (@id, @timestamp, @verdict, @copy, @channel, @product, @userState, @context, @formula, @tov_note)
  `).run({ id, timestamp, ...entry });

  return { id, timestamp, ...entry };
}

export function removeFeedback(id: string): void {
  getDb().prepare("DELETE FROM feedback WHERE id = ?").run(id);
}

export function getAllFeedback(): FeedbackEntry[] {
  const rows = getDb()
    .prepare("SELECT * FROM feedback ORDER BY timestamp DESC")
    .all() as Record<string, string>[];
  return rows.map(rowToEntry);
}

/**
 * Returns the most relevant examples for a given generation context.
 *
 * Scoring (higher = more relevant):
 *   channel + product + userState match  →  3
 *   channel + product match              →  2
 *   channel match only                   →  1
 *
 * Uses a single indexed SQL query — fast at any scale.
 */
export function getRelevantExamples(
  channel: string,
  product: string,
  userState: string,
  limit = 3
): { good: FeedbackEntry[]; bad: FeedbackEntry[] } {
  const db = getDb();

  // Deduplicated: one example per distinct copy text (latest wins)
  const query = db.prepare(`
    SELECT *,
      CASE
        WHEN product = @product AND user_state = @userState THEN 3
        WHEN product = @product                             THEN 2
        ELSE                                                     1
      END AS relevance
    FROM feedback
    WHERE channel = @channel AND verdict = @verdict
    GROUP BY copy          -- deduplicate identical copies
    ORDER BY relevance DESC, timestamp DESC
    LIMIT @limit
  `);

  const good = (query.all({ channel, product, userState, verdict: "good", limit }) as Record<string, string>[]).map(rowToEntry);
  const bad  = (query.all({ channel, product, userState, verdict: "bad",  limit }) as Record<string, string>[]).map(rowToEntry);

  return { good, bad };
}

export function getFeedbackStats(): {
  total: number;
  good: number;
  bad: number;
  byChannel: Record<string, { good: number; bad: number }>;
} {
  const db = getDb();

  const totals = db.prepare(`
    SELECT verdict, COUNT(*) as n FROM feedback GROUP BY verdict
  `).all() as { verdict: string; n: number }[];

  const byChannelRows = db.prepare(`
    SELECT channel, verdict, COUNT(*) as n FROM feedback GROUP BY channel, verdict
  `).all() as { channel: string; verdict: string; n: number }[];

  const byChannel: Record<string, { good: number; bad: number }> = {};
  for (const r of byChannelRows) {
    if (!byChannel[r.channel]) byChannel[r.channel] = { good: 0, bad: 0 };
    byChannel[r.channel][r.verdict as Verdict] = r.n;
  }

  const good = totals.find((r) => r.verdict === "good")?.n ?? 0;
  const bad  = totals.find((r) => r.verdict === "bad")?.n ?? 0;

  return { total: good + bad, good, bad, byChannel };
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

export function upsertInsights(
  channel: string,
  product: string,
  userState: string,
  insights: string[],
  summary: string,
  feedbackCount: number
): void {
  getDb()
    .prepare(`
      INSERT INTO learned_insights
        (channel, product, user_state, insight_text, summary, feedback_count, updated_at)
      VALUES
        (@channel, @product, @userState, @insightText, @summary, @feedbackCount, @updatedAt)
      ON CONFLICT(channel, product, user_state) DO UPDATE SET
        insight_text   = excluded.insight_text,
        summary        = excluded.summary,
        feedback_count = excluded.feedback_count,
        updated_at     = excluded.updated_at
    `)
    .run({
      channel,
      product,
      userState,
      insightText: JSON.stringify(insights),
      summary,
      feedbackCount,
      updatedAt: new Date().toISOString(),
    });
}

export function getInsights(
  channel: string,
  product: string,
  userState: string
): { insights: string[]; summary: string; feedbackCount: number; updatedAt: string | null } {
  const row = getDb()
    .prepare(
      "SELECT * FROM learned_insights WHERE channel = ? AND product = ? AND user_state = ?"
    )
    .get(channel, product, userState) as Record<string, string> | undefined;

  if (!row) return { insights: [], summary: "", feedbackCount: 0, updatedAt: null };
  return {
    insights: JSON.parse(row.insight_text ?? "[]"),
    summary: row.summary ?? "",
    feedbackCount: Number(row.feedback_count ?? 0),
    updatedAt: row.updated_at ?? null,
  };
}

export function getFeedbackCountForCombo(
  channel: string,
  product: string,
  userState: string
): number {
  const row = getDb()
    .prepare(
      "SELECT COUNT(*) as n FROM feedback WHERE channel = ? AND product = ? AND user_state = ?"
    )
    .get(channel, product, userState) as { n: number };
  return row.n;
}

export function getAllInsights(): InsightRow[] {
  const rows = getDb()
    .prepare("SELECT * FROM learned_insights ORDER BY updated_at DESC")
    .all() as Record<string, string>[];
  return rows.map((r) => ({
    channel: r.channel,
    product: r.product,
    userState: r.user_state,
    insights: JSON.parse(r.insight_text ?? "[]"),
    summary: r.summary ?? "",
    feedbackCount: Number(r.feedback_count ?? 0),
    updatedAt: r.updated_at,
  }));
}

// ─── Internal helper ─────────────────────────────────────────────────────────

function rowToEntry(row: Record<string, string>): FeedbackEntry {
  return {
    id:        row.id,
    timestamp: row.timestamp,
    verdict:   row.verdict as Verdict,
    copy:      row.copy,
    channel:   row.channel,
    product:   row.product,
    userState: row.user_state,
    context:   row.context,
    formula:   row.formula,
    tov_note:  row.tov_note,
  };
}
