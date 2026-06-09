import { NextResponse } from "next/server";
import { getTovRules } from "@/lib/tov-rules";

export async function GET() {
  const rules = await getTovRules();
  if (!rules) return NextResponse.json({});
  return NextResponse.json(rules);
}
