import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isWriter } from "@/lib/auth";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { recordUsageEvent, getAnalytics, UsageEventInput } from "@/lib/analytics";

// GET — writer or admin cookie: returns aggregated stats
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!isWriter(email) && !verifyAdminToken(adminToken)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const data = await getAnalytics();
    return NextResponse.json({ ...data, isWriter: isWriter(email) });
  } catch (err) {
    console.error("analytics GET error:", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}

// POST — open: records client-side events (copy, regenerate, etc.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as UsageEventInput;
    if (!body.event_type) {
      return NextResponse.json({ error: "event_type required" }, { status: 400 });
    }
    await recordUsageEvent(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("analytics POST error:", err);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
