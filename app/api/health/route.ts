/**
 * /api/health — 診斷 endpoint
 * 確認 production 上的環境變數是否設好
 * 不曝露完整 secret、只回前 4 + 後 4 碼讓 Angel 肉眼比對
 */

import { NextResponse } from "next/server";
import { PAYUNI_CONFIGURED } from "@/lib/payuni";

export const runtime = "nodejs";

// 只洩漏前 N 碼 + 後 N 碼、給 Angel 跟 PayUni 後台肉眼比對
function preview(s: string, ends = 4): string {
  if (!s) return "(empty)";
  if (s.length <= ends * 2) return `(too short, len=${s.length})`;
  return `${s.slice(0, ends)}...${s.slice(-ends)} (len=${s.length})`;
}

export async function GET() {
  const key = process.env.PAYUNI_HASH_KEY || "";
  const iv = process.env.PAYUNI_HASH_IV || "";
  const mer = process.env.PAYUNI_MERCHANT_ID || "";

  return NextResponse.json({
    paymentMode: process.env.NEXT_PUBLIC_PAYMENT_MODE || "(not set)",
    payuniConfigured: PAYUNI_CONFIGURED,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "(not set)",
    // PayUni 設定預覽（前 4 / 後 4 碼、肉眼比對是否跟 PayUni 後台一致）
    payuniMerId: mer,
    payuniHashKeyPreview: preview(key, 4),
    payuniHashIvPreview: preview(iv, 2),
    // 額外 check：頭尾有沒有空白（最常見的貼錯）
    keyHasWhitespace: key !== key.trim(),
    ivHasWhitespace: iv !== iv.trim(),
    timestamp: new Date().toISOString(),
  });
}
