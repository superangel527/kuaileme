/**
 * /api/promo/stats?token=<PROMO_STATS_TOKEN>
 *
 * 管理用 — 查每個優惠碼目前用量。token 錯直接 404 假裝沒這個 endpoint。
 * Angel 想查：直接開 https://kuaileme.superangel527.com/api/promo/stats?token=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllUsage } from "@/lib/promo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const expected = process.env.PROMO_STATS_TOKEN || "";
  const given = req.nextUrl.searchParams.get("token") || "";
  if (!expected || given !== expected) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const usage = await getAllUsage();
  return NextResponse.json(
    {
      ok: true,
      codes: usage,
      totalCodes: usage.length,
      totalUsed: usage.reduce((s, c) => s + c.used, 0),
      totalRemaining: usage.reduce((s, c) => s + c.remaining, 0),
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Netlify-CDN-Cache-Control": "no-store",
      },
    }
  );
}
