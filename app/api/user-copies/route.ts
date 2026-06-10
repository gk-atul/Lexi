import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserCopies } from "@/lib/user-copies";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const copies = await getUserCopies(email);
    return NextResponse.json({ copies });
  } catch (err) {
    console.error("user-copies GET error:", err);
    return NextResponse.json({ error: "Failed to load copies" }, { status: 500 });
  }
}
