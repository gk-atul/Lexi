import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { getServerSession } from "next-auth";
import { authOptions, isWriter } from "@/lib/auth";
import { getDb, ensureMigrated } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!isWriter(email) && !verifyAdminToken(adminToken)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = 25;
  const offset  = (page - 1) * limit;
  const channel = searchParams.get("channel") ?? "";
  const product = searchParams.get("product") ?? "";

  await ensureMigrated();
  const db = getDb();

  const where = [
    "event_type IN ('generate','drip_cell')",
    channel ? "channel = ?" : "",
    product ? "product = ?" : "",
  ].filter(Boolean).join(" AND ");

  const filterArgs = [channel, product].filter(Boolean);

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as n FROM usage_events WHERE ${where}`,
    args: filterArgs,
  });
  const total = Number(countResult.rows[0]?.n ?? 0);

  const rowsResult = await db.execute({
    sql: `SELECT
      created_at, channel, product, use_case, comm_type, tone,
      is_drip, pn_framework, tokens_in, tokens_out,
      brief_context, brief_user_desc, brief_action, brief_non_neg, brief_reference
    FROM usage_events
    WHERE ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`,
    args: [...filterArgs, limit, offset],
  });

  return NextResponse.json({
    rows: rowsResult.rows,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
