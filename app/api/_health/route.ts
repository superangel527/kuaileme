/**
 * /api/_health — 診斷 endpoint
 * 確認 production 上的環境變數是否設好
 * 不曝露任何 secret、只回 boolean / 字串值
 */

import { NextResponse } from "next/server";
import { PAYUNI_CONFIGURED } from "@/lib/payuni";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    paymentMode: process.env.NEXT_PUBLIC_PAYMENT_MODE || "(not set)",
    payuniConfigured: PAYUNI_CONFIGURED,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "(not set)",
    timestamp: new Date().toISOString(),
  });
}
