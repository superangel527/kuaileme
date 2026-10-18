/**
 * /api/promo/redeem
 *
 * POST { code: string } → 驗優惠碼、成功 set cookie kl_free_pass、pay 頁讀 cookie 繞過 PayUni
 *
 * 回傳：
 *   { ok: true, remainingUses: number }
 *   { ok: false, error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { redeemCode } from "@/lib/promo";
import { ACCESS_COOKIE, accessCookieOptions, signAccessPass } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit — 同 IP 5 分鐘最多 8 次嘗試（防止 script 暴力猜碼）
// 8 位英數 alnum ~1 兆組合、每 5 分鐘 8 次 → 猜完要 108 萬年
const RATE_LIMIT_STORE = "promo-rate-limit";
const MAX_TRIES = 8;
const WINDOW_MS = 5 * 60 * 1000;

async function checkRateLimit(ip: string): Promise<{ ok: boolean; remainingSec?: number }> {
  if (!ip) return { ok: true }; // 拿不到 IP、保守放行
  try {
    const store = getStore(RATE_LIMIT_STORE);
    const bucket = Math.floor(Date.now() / WINDOW_MS);
    const key = `ip_${ip}_${bucket}`;
    const cur = await store.get(key, { type: "text" });
    const count = cur ? parseInt(cur, 10) : 0;
    if (count >= MAX_TRIES) {
      const nextBucketMs = (bucket + 1) * WINDOW_MS;
      return { ok: false, remainingSec: Math.ceil((nextBucketMs - Date.now()) / 1000) };
    }
    await store.set(key, String(count + 1));
    return { ok: true };
  } catch (e) {
    // Blobs 掛掉不要擋正常使用者
    console.error("[promo/rate-limit] blob error:", e);
    return { ok: true };
  }
}

export async function POST(req: NextRequest) {
  // Rate limit — 用 Netlify client IP、Netlify Blobs 跨 lambda instance shared
  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `試太多次了、請 ${rl.remainingSec ?? 300} 秒後再試`,
        reason: "rate_limited",
      },
      { status: 429 }
    );
  }

  let code = "";
  try {
    const body = await req.json();
    code = typeof body?.code === "string" ? body.code.slice(0, 40) : "";
  } catch {
    return NextResponse.json(
      { ok: false, error: "格式錯誤" },
      { status: 400 }
    );
  }

  const result = await redeemCode(code);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, reason: result.reason },
      { status: result.reason === "system_error" ? 500 : 400 }
    );
  }

  // 檢查 PROMO_SECRET 有沒有設、沒設就給明確錯（避免產出無法驗證的 token）
  let token: string;
  try {
    token = signAccessPass("promo", result.code);
  } catch (e) {
    console.error("[promo/redeem] sign failed:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "系統未設定簽章金鑰、請通知客服（PROMO_SECRET 未設）",
      },
      { status: 500 }
    );
  }

  console.log("[promo/redeem]", {
    code: result.code,
    remainingUses: result.remainingUses,
  });

  const resp = NextResponse.json({
    ok: true,
    remainingUses: result.remainingUses,
    code: result.code,
  });

  // HttpOnly 簽章通行證，瀏覽器 JavaScript 無法偽造或讀取。
  resp.cookies.set(ACCESS_COOKIE, token, accessCookieOptions);

  return resp;
}
