import { createClient, Client } from "@libsql/client";

const g = globalThis as unknown as { _db?: Client; _migrated?: boolean };

export function getDb(): Client {
  if (g._db) return g._db;
  g._db = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:./data/feedback.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return g._db;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, verdict TEXT NOT NULL,
    copy TEXT NOT NULL, channel TEXT NOT NULL, product TEXT NOT NULL DEFAULT '',
    user_state TEXT NOT NULL DEFAULT '', context TEXT NOT NULL DEFAULT '',
    formula TEXT NOT NULL DEFAULT '', tov_note TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_lookup ON feedback (channel, verdict, product, user_state)`,
  `CREATE TABLE IF NOT EXISTS learned_insights (
    channel TEXT NOT NULL, product TEXT NOT NULL DEFAULT '',
    user_state TEXT NOT NULL DEFAULT '', insight_text TEXT NOT NULL DEFAULT '[]',
    summary TEXT NOT NULL DEFAULT '', feedback_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL, PRIMARY KEY (channel, product, user_state)
  )`,
  `CREATE TABLE IF NOT EXISTS edit_events (
    id TEXT PRIMARY KEY, generation_id TEXT NOT NULL DEFAULT '',
    use_case TEXT NOT NULL DEFAULT '', channel TEXT NOT NULL DEFAULT '',
    journey_day INTEGER, comm_type TEXT NOT NULL DEFAULT '',
    generated_text TEXT NOT NULL DEFAULT '', edited_text TEXT NOT NULL DEFAULT '',
    edit_types TEXT NOT NULL DEFAULT '[]', writer_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_edit_events_scope ON edit_events (channel, use_case, comm_type)`,
  `CREATE TABLE IF NOT EXISTS procedural_rules (
    id TEXT PRIMARY KEY, scope_use_case TEXT, scope_channel TEXT, scope_comm_type TEXT,
    rule TEXT NOT NULL, strength REAL NOT NULL DEFAULT 0.3,
    supporting_edit_count INTEGER NOT NULL DEFAULT 1, last_updated TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_review', source TEXT NOT NULL DEFAULT 'auto_extracted'
  )`,
  `CREATE INDEX IF NOT EXISTS idx_proc_rules_scope ON procedural_rules (scope_channel, scope_use_case, scope_comm_type, status)`,
  `CREATE TABLE IF NOT EXISTS journey_generations (
    id TEXT PRIMARY KEY, journey_id TEXT NOT NULL, day INTEGER NOT NULL,
    channel TEXT NOT NULL, use_case TEXT NOT NULL DEFAULT '',
    headline TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '',
    strategy_used TEXT NOT NULL DEFAULT '', hook_type TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_journey_id ON journey_generations (journey_id, day)`,
  `CREATE TABLE IF NOT EXISTS usage_events (
    id TEXT PRIMARY KEY, event_type TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT '', product TEXT NOT NULL DEFAULT '',
    use_case TEXT NOT NULL DEFAULT '', comm_type TEXT NOT NULL DEFAULT '',
    tone TEXT NOT NULL DEFAULT '', pn_framework TEXT NOT NULL DEFAULT '',
    variant_count INTEGER NOT NULL DEFAULT 0, has_user_desc INTEGER NOT NULL DEFAULT 0,
    has_desired_action INTEGER NOT NULL DEFAULT 0, has_non_neg INTEGER NOT NULL DEFAULT 0,
    has_reference INTEGER NOT NULL DEFAULT 0, is_drip INTEGER NOT NULL DEFAULT 0,
    writer_id TEXT NOT NULL DEFAULT 'anonymous', created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events (event_type, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_usage_events_channel ON usage_events (channel, product, created_at)`,
  `CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
];

export async function ensureMigrated(): Promise<void> {
  if (g._migrated) return;
  const db = getDb();
  for (const sql of SCHEMA) {
    await db.execute(sql);
  }
  g._migrated = true;
}
