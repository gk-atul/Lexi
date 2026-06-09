import { NextRequest, NextResponse } from "next/server";
import { recordUsageEvent, getAnalytics, UsageEventInput } from "@/lib/analytics";

export async function GET() {
  try {
    return NextResponse.json(getAnalytics());
  } catch (err) {
    console.error("analytics GET error:", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}

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
