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
import { redeemCode, signFreePass } from "@/lib/promo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
    token = signFreePass(result.code);
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

  // 30 分鐘有效、給使用者跑完後續 loading + AI prepare-session
  resp.cookies.set("kl_free_pass", token, {
    httpOnly: false, // 前端 pay page 要能讀 → 才能決定走 fake mode
    sameSite: "lax",
    maxAge: 60 * 30,
    path: "/",
  });

  return resp;
}
