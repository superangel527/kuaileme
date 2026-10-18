/**
 * /api/payuni/return
 *
 * 使用者在 PayUni 付完款後、PayUni 把使用者導回這裡（GET 或 POST）
 * 我們驗證簽章 → 確認真的付款成功 → 設 cookie 標記「已付款」 → 跳轉到 /chat
 *
 * 驗證訂單後簽發 HttpOnly 通行證，聊天室與 AI API 均由伺服器驗證
 */

import { NextRequest, NextResponse } from "next/server";
import { parsePayUniResponse, PAYUNI_CONFIGURED } from "@/lib/payuni";
import { ACCESS_COOKIE, accessCookieOptions, signAccessPass } from "@/lib/access";
import { consumePendingOrder } from "@/lib/payuni-orders";

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
    // 把錯誤訊息塞進 URL、debug 用
    const debugQs = new URLSearchParams();
    debugQs.set("error", "payment_failed");
    debugQs.set("status", status);
    if (result.data?.Message)
      debugQs.set("msg", String(result.data.Message).slice(0, 200));
    if (result.data?.StatusInfo)
      debugQs.set("info", String(result.data.StatusInfo).slice(0, 200));
    return NextResponse.redirect(`${SITE_URL}/?${debugQs.toString()}`);
  }

  // ✅ 付款成功 — 看訂單前綴決定 redirect
  //   "ext..." → 續聊（chat?extend=1、不重新開場、直接 +3 分鐘）
  //   "kl..."  → 首次付款（chat?paid=1、開新場）
  const orderNo = result.data?.MerTradeNo || "";
  const amount = Number(result.data?.TradeAmt || 0);
  const pending = await consumePendingOrder(orderNo, amount);
  if (!pending || amount !== 19) {
    console.error("[payuni/return] unknown, mismatched, expired or replayed order", { orderNo, amount });
    return NextResponse.redirect(`${SITE_URL}/?error=payment_invalid`);
  }
  const isExtend = pending.mode === "extend";
  const redirectPath = isExtend
    ? `${SITE_URL}/chat?extend=1&order=${orderNo}`
    : `${SITE_URL}/chat?paid=1&order=${orderNo}`;
  const resp = NextResponse.redirect(redirectPath);

  resp.cookies.set(
    ACCESS_COOKIE,
    signAccessPass("paid", orderNo),
    accessCookieOptions
  );

  return resp;
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
