/**
 * Simple username/password admin auth — used until Google OAuth is configured.
 * Credentials stored in ADMIN_USER + ADMIN_PASSWORD env vars.
 * Token is a deterministic SHA-256 hash; no session storage needed.
 */

import crypto from "crypto";

export const ADMIN_COOKIE = "acko_admin";

const ADMIN_USER = process.env.ADMIN_USER ?? "";
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? "";

function makeToken(): string {
  // Incorporate the password itself so the token changes if creds change
  const seed = `${ADMIN_USER}:${ADMIN_PASS}:${process.env.NEXTAUTH_SECRET ?? "acko-admin-secret"}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}

export function verifyAdminCredentials(user: string, pass: string): boolean {
  if (!ADMIN_USER || !ADMIN_PASS) return false;
  return user === ADMIN_USER && pass === ADMIN_PASS;
}

export function getAdminToken(): string {
  return makeToken();
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !ADMIN_USER || !ADMIN_PASS) return false;
  return token === makeToken();
}
