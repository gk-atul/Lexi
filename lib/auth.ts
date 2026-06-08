import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Writers: either match domain OR specific emails
// Set WRITER_EMAILS="a@acko.com,b@acko.com" in env to allowlist individuals
// Set WRITER_DOMAIN="acko.com" to allow the whole domain
// Both can be set simultaneously — either match grants access

const WRITER_DOMAIN  = process.env.WRITER_DOMAIN  ?? "";
const WRITER_EMAILS  = (process.env.WRITER_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isWriter(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  if (WRITER_DOMAIN && e.endsWith(`@${WRITER_DOMAIN}`)) return true;
  if (WRITER_EMAILS.includes(e)) return true;
  return false;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Attach writer flag to the JWT so it's available everywhere
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.isWriter = isWriter(profile.email as string);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { isWriter?: boolean }).isWriter = token.isWriter as boolean ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
