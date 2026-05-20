/**
 * /api/payuni/create-order
 *
 * 使用者按「確認付款 NT$19」→ 前端 POST 過來
 * 回傳要 POST 到 PayUni 的表單欄位 + action URL
 * 前端拿到後組 form 自動 submit 跳轉 PayUni 結帳頁
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildOrderPayload,
  generateOrderNo,
  PAYUNI_CONFIGURED,
} from "@/lib/payuni";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kuaileme.superangel527.com";
const PRICE = 19;

export async function POST(req: NextRequest) {
  if (!PAYUNI_CONFIGURED) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "PayUni 未設定 — 請在 Netlify 設 PAYUNI_MERCHANT_ID / PAYUNI_HASH_KEY / PAYUNI_HASH_IV",
      },
      { status: 500 }
    );
  }

  let nickname = "";
  let topic = "";
  try {
    const body = await req.json();
    nickname = typeof body?.nickname === "string" ? body.nickname.slice(0, 16) : "";
    topic = typeof body?.topic === "string" ? body.topic.slice(0, 30) : "";
  } catch {
    /* empty body OK */
  }

  const orderNo = generateOrderNo();

  try {
    const payload = buildOrderPayload({
      merTradeNo: orderNo,
      amount: PRICE,
      description: "誇了嗎 - 3 分鐘聊天室",
      returnUrl: `${SITE_URL}/api/payuni/return`,
      notifyUrl: `${SITE_URL}/api/payuni/notify`,
      backUrl: `${SITE_URL}/`,
    });

    // 把 orderNo + 使用者資料暫存到 cookie、後續驗證用
    const resp = NextResponse.json({
      ok: true,
      orderNo,
      actionUrl: payload.actionUrl,
      fields: payload.fields,
    });

    // 訂單號存 cookie、return URL 來的時候對得起來
    resp.cookies.set("kl_order_no", orderNo, {
      httpOnly: false, // 客戶端 JS 也要能讀（chat 頁要清 cart）
      sameSite: "lax",
      maxAge: 60 * 30, // 30 分鐘
      path: "/",
    });
    if (nickname) {
      resp.cookies.set("kl_order_nickname", nickname, {
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 30,
        path: "/",
      });
    }
    if (topic) {
      resp.cookies.set("kl_order_topic", topic, {
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 30,
        path: "/",
      });
    }

    return resp;
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "encrypt failed",
      },
      { status: 500 }
    );
  }
}
