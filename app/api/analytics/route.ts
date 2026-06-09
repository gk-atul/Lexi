import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isWriter } from "@/lib/auth";
import { recordUsageEvent, getAnalytics, UsageEventInput } from "@/lib/analytics";

// GET — writer-only: returns aggregated stats
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!isWriter(email)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    return NextResponse.json(getAnalytics());
  } catch (err) {
    console.error("analytics GET error:", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}

// POST — open: records client-side events (copy, regenerate, etc.)
// Exposing what you track is fine; the stats view is protected above.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as UsageEventInput;
    if (!body.event_type) {
      return NextResponse.json({ error: "event_type required" }, { status: 400 });
    }
    recordUsageEvent(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("analytics POST error:", err);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
