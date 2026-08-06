/**
 * 優惠碼系統（中等版）
 *
 * 用途：試用碼 / KOL 碼 / 客訴補償碼 — 輸入正確碼可繞過 PayUni、免費玩一場。
 *
 * 環境變數（Netlify 後台設）：
 *   PROMO_CODES         — 格式 "CODE1:100,CODE2:1,CODE3:5"
 *                         例：ANGEL2026:100,VIP:10,SORRY01:1
 *                         值 = max_uses（用完就失效）
 *   PROMO_SECRET        — 隨機 32+ 碼字串、給 free pass token 簽名用
 *                         例：openssl rand -hex 32 產出
 *   PROMO_STATS_TOKEN   — 查用量的密鑰、GET /api/promo/stats?token=... 用
 *                         例：另一組隨機字串
 *
 * 儲存：Netlify Blobs（免費 KV）、store name = "promo-usage"
 *   key   = usage_<CODE>
 *   value = 目前用量（string）
 */

import { getStore, type Store } from "@netlify/blobs";
import crypto from "crypto";

const STORE_NAME = "promo-usage";
const FREE_PASS_TTL_MS = 30 * 60 * 1000; // 30 分鐘（夠使用者跑完 loading + prepare-session）

// ─────────────────────────────────────
// 碼配置解析
// ─────────────────────────────────────

// 讀 env、回傳 { CODE: max_uses } — 碼統一大寫
// 支援兩種格式（可混用）：
//   "CODE1,CODE2"           → 每個 max_uses=1（省字元、Netlify 5000 上限用）
//   "CODE1:100,CODE2:1"     → 顯式指定 max_uses
export function parseCodes(): Record<string, number> {
  const raw = process.env.PROMO_CODES || "";
  const out: Record<string, number> = {};
  for (const chunk of raw.split(",")) {
    const parts = chunk.split(":").map((s) => s.trim());
    const code = parts[0];
    const maxStr = parts[1];
    if (!code) continue;
    const max = maxStr ? parseInt(maxStr, 10) : 1;
    if (!Number.isFinite(max) || max <= 0) continue;
    out[code.toUpperCase()] = max;
  }
  return out;
}

// ─────────────────────────────────────
// Blobs store
// ─────────────────────────────────────

function store(): Store {
  return getStore(STORE_NAME);
}

// ─────────────────────────────────────
// 兌換 — 驗碼 + usage +1
// ─────────────────────────────────────

export type RedeemResult =
  | { ok: true; remainingUses: number; code: string }
  | { ok: false; error: string; reason: "invalid" | "used_up" | "system_error" };

export async function redeemCode(inputCode: string): Promise<RedeemResult> {
  const code = (inputCode || "").trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "請輸入優惠碼", reason: "invalid" };
  }

  const codes = parseCodes();
  // 如果 codes 是空、代表 Netlify PROMO_CODES 環境變數沒設好或沒 deploy
  // 給明確錯誤、Angel 一看就知道要去 Netlify 檢查
  if (Object.keys(codes).length === 0) {
    return {
      ok: false,
      error: "系統尚未設定優惠碼（PROMO_CODES 環境變數未設或未部署）",
      reason: "system_error",
    };
  }
  const max = codes[code];
  if (!max) {
    return { ok: false, error: "這個優惠碼不正確", reason: "invalid" };
  }

  try {
    const s = store();
    const key = `usage_${code}`;
    const currentStr = await s.get(key, { type: "text" });
    const current = currentStr ? parseInt(currentStr, 10) : 0;

    if (current >= max) {
      return { ok: false, error: "這個優惠碼已被領完了", reason: "used_up" };
    }

    // 不是完全 atomic — 高併發時可能超領一兩個、對誇了嗎規模可接受
    await s.set(key, String(current + 1));
    return { ok: true, remainingUses: max - current - 1, code };
  } catch (e) {
    console.error("[promo] redeem error:", e);
    return {
      ok: false,
      error: "系統暫時無法驗證、請稍後再試",
      reason: "system_error",
    };
  }
}

// ─────────────────────────────────────
// Free pass token（HMAC signed、防偽）
// ─────────────────────────────────────

function getSecret(): string {
  const s = process.env.PROMO_SECRET || "";
  if (!s) throw new Error("PROMO_SECRET not set");
  return s;
}

// 產一個 signed token 給前端當 free pass、格式：<ts>.<nonce>.<sig>
export function signFreePass(code: string): string {
  const nonce = crypto.randomBytes(6).toString("hex");
  const ts = Date.now();
  const payload = `${ts}.${nonce}.${code.toUpperCase()}`;
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 24);
  return `${payload}.${sig}`;
}

export type PassVerifyResult =
  | { ok: true; code: string; ageMs: number }
  | { ok: false; error: string };

export function verifyFreePass(token: string): PassVerifyResult {
  if (!token) return { ok: false, error: "沒有 free pass" };
  const parts = token.split(".");
  if (parts.length !== 4) return { ok: false, error: "格式錯誤" };
  const [ts, nonce, code, sig] = parts;
  const payload = `${ts}.${nonce}.${code}`;
  let expected: string;
  try {
    expected = crypto
      .createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex")
      .slice(0, 24);
  } catch {
    return { ok: false, error: "PROMO_SECRET not set" };
  }
  if (sig !== expected) return { ok: false, error: "簽章不對" };
  const ageMs = Date.now() - parseInt(ts, 10);
  if (ageMs < 0 || ageMs > FREE_PASS_TTL_MS) {
    return { ok: false, error: "已過期" };
  }
  return { ok: true, code, ageMs };
}

// ─────────────────────────────────────
// 管理：查用量
// ─────────────────────────────────────

export async function getAllUsage(): Promise<
  Array<{ code: string; used: number; max: number; remaining: number }>
> {
  const codes = parseCodes();
  const s = store();
  const out: Array<{
    code: string;
    used: number;
    max: number;
    remaining: number;
  }> = [];
  for (const [code, max] of Object.entries(codes)) {
    let used = 0;
    try {
      const v = await s.get(`usage_${code}`, { type: "text" });
      used = v ? parseInt(v, 10) : 0;
    } catch {
      used = 0;
    }
    out.push({ code, used, max, remaining: Math.max(0, max - used) });
  }
  return out;
}
