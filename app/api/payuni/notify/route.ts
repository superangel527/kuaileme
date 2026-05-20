/**
 * /api/payuni/notify
 *
 * PayUni 付款完成後 server-to-server webhook
 * 收到後驗證簽章、log 訂單結果
 *
 * 注意：webhook 跟使用者瀏覽器無關、沒辦法 setCookie 給 user
 * 真正寫入「已付款」是在 /api/payuni/return（使用者跳回來的時候）
 *
 * 這個 endpoint 主要功能：
 *   - 收 PayUni 通知（避免使用者沒等到跳轉就關瀏覽器）
 *   - log 訂單狀態（之後若加 Netlify Blobs 可存資料庫）
 *   - 回 200 給 PayUni（不回就會一直重送）
 */

import { NextRequest, NextResponse } from "next/server";
import { parsePayUniResponse, PAYUNI_CONFIGURED } from "@/lib/payuni";

export async function POST(req: NextRequest) {
  if (!PAYUNI_CONFIGURED) {
    return new NextResponse("PayUni not configured", { status: 500 });
  }

  let encryptInfo = "";
  let hashInfo = "";

  // PayUni notify 可能是 form-urlencoded 或 JSON
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      encryptInfo = body?.EncryptInfo ?? "";
      hashInfo = body?.HashInfo ?? "";
    } else {
      const form = await req.formData();
      encryptInfo = (form.get("EncryptInfo") as string) ?? "";
      hashInfo = (form.get("HashInfo") as string) ?? "";
    }
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const result = parsePayUniResponse(encryptInfo, hashInfo);

  // log（之後上 Netlify 可在 Functions log 看）
  if (!result.ok) {
    console.error("[payuni/notify] verify failed:", result.error);
  } else {
    console.log(
      "[payuni/notify] order verified:",
      JSON.stringify({
        order: result.data?.MerTradeNo,
        status: result.data?.Status,
        amount: result.data?.TradeAmt,
      })
    );
  }

  // 一律回 200 給 PayUni、不然會一直重送
  return new NextResponse("OK", { status: 200 });
}
