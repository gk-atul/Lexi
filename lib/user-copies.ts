import { getDb, ensureMigrated } from "./db";

export interface UserCopy {
  id: string;
  user_email: string;
  channel: string;
  product: string;
  use_case: string;
  copy_text: string;
  created_at: string;
}

export async function saveUserCopy(data: Omit<UserCopy, "id" | "created_at">): Promise<void> {
  await ensureMigrated();
  await getDb().execute({
    sql: `INSERT INTO user_copies (id, user_email, channel, product, use_case, copy_text, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      data.user_email,
      data.channel,
      data.product,
      data.use_case,
      data.copy_text,
      new Date().toISOString(),
    ],
  });
}

export async function getUserCopies(email: string, limit = 20): Promise<UserCopy[]> {
  await ensureMigrated();
  const result = await getDb().execute({
    sql: `SELECT * FROM user_copies WHERE user_email = ?
          ORDER BY created_at DESC LIMIT ?`,
    args: [email, limit],
  });
  return result.rows.map((r) => r as unknown as UserCopy);
}
