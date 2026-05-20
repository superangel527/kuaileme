/**
 * /api/payuni/return
 *
 * 使用者在 PayUni 付完款後、PayUni 把使用者導回這裡（GET 或 POST）
 * 我們驗證簽章 → 確認真的付款成功 → 設 cookie 標記「已付款」 → 跳轉到 /chat
 *
 * cookie 設好後、chat 頁的 mount useEffect 會讀 cookie、設 localStorage.kl_paid_at、走原本聊天室流程
 */

import { NextRequest, NextResponse } from "next/server";
import { parsePayUniResponse, PAYUNI_CONFIGURED } from "@/lib/payuni";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kuaileme.superangel527.com";

async function handle(req: NextRequest) {
  if (!PAYUNI_CONFIGURED) {
    return NextResponse.redirect(`${SITE_URL}/?error=payuni_not_configured`);
  }

  let encryptInfo = "";
  let hashInfo = "";

  // 同時支援 GET（query string）跟 POST（form-urlencoded）
  if (req.method === "POST") {
    try {
      const form = await req.formData();
      encryptInfo = (form.get("EncryptInfo") as string) ?? "";
      hashInfo = (form.get("HashInfo") as string) ?? "";
    } catch {
      return NextResponse.redirect(`${SITE_URL}/?error=bad_response`);
    }
  } else {
    const params = req.nextUrl.searchParams;
    encryptInfo = params.get("EncryptInfo") ?? "";
    hashInfo = params.get("HashInfo") ?? "";
  }

  const result = parsePayUniResponse(encryptInfo, hashInfo);

  if (!result.ok) {
    console.error("[payuni/return] verify failed:", result.error);
    return NextResponse.redirect(`${SITE_URL}/?error=payment_invalid`);
  }

  // 確認 Status：PayUni 個人版通常 SUCCESS = 付款成功
  const status = (result.data?.Status || "").toUpperCase();
  if (status !== "SUCCESS" && status !== "OK") {
    console.warn("[payuni/return] payment not success:", status, result.data);
    return NextResponse.redirect(`${SITE_URL}/?error=payment_failed`);
  }

  // ✅ 付款成功 — 設 cookie 標記、redirect 到 /chat
  const orderNo = result.data?.MerTradeNo || "";
  const resp = NextResponse.redirect(`${SITE_URL}/chat?paid=1&order=${orderNo}`);

  // kl_paid_at cookie — chat 頁讀取後 setLocalStorage
  resp.cookies.set("kl_paid_at", String(Date.now()), {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 10, // 10 分鐘有效
    path: "/",
  });
  resp.cookies.set("kl_paid_order", orderNo, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return resp;
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
