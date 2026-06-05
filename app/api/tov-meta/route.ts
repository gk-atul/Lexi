import { NextResponse } from "next/server";
import { getTovMeta } from "@/lib/tov-store";

export async function GET() {
  const meta = getTovMeta();
  return NextResponse.json(meta);
}
