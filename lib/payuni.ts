/**
 * PayUni 統一金流 個人版 Universal API 整合
 *
 * 演算法（按 PayUni 官方 PHP_SDK 對應）：
 *   - 加密：AES-256-GCM、用商家固定 IV（16 bytes）、輸出 hex(base64(cipher)+":::"+base64(tag))
 *   - 簽章：SHA256(KEY + EncryptInfo + IV) 大寫
 *   - plaintext：PHP http_build_query 風格（空格 → +）
 *
 * 環境變數（Netlify 後台設）：
 *   PAYUNI_MERCHANT_ID — 商店代號
 *   PAYUNI_HASH_KEY    — 32 碼 AES key
 *   PAYUNI_HASH_IV     — 16 碼 AES IV
 *   PAYUNI_ENDPOINT_URL — 選用、預設 https://api.payuni.com.tw/api/upp
 */

import crypto from "crypto";

const PAYUNI_API_URL =
  process.env.PAYUNI_ENDPOINT_URL || "https://api.payuni.com.tw/api/upp";

const HASH_KEY = process.env.PAYUNI_HASH_KEY ?? "";
const HASH_IV = process.env.PAYUNI_HASH_IV ?? "";
const MER_ID = process.env.PAYUNI_MERCHANT_ID ?? "";

export const PAYUNI_CONFIGURED =
  HASH_KEY.length === 32 && HASH_IV.length === 16 && MER_ID.length > 0;

export const PAYUNI_API_ENDPOINT = PAYUNI_API_URL;

// AES-256-GCM 加密、用商家固定 IV（16 bytes、PHP openssl_encrypt 支援）
// 輸出格式（跟 PHP SDK 一致）：hex(base64(ciphertext) + ":::" + base64(tag))
export function encryptInfo(plaintext: string): string {
  if (!PAYUNI_CONFIGURED) throw new Error("PayUni not configured");
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(HASH_KEY, "utf8"),
    Buffer.from(HASH_IV, "utf8"),
    { authTagLength: 16 }
  );
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // PHP openssl_encrypt with options=0 → base64-encoded output
  const combined = `${encrypted.toString("base64")}:::${tag.toString("base64")}`;
  return Buffer.from(combined, "utf8").toString("hex");
}

// AES-256-GCM 解密、用商家固定 IV
// 解析 PayUni response 的 hex(base64(cipher) + ":::" + base64(tag))
export function decryptInfo(hexStr: string): string {
  if (!PAYUNI_CONFIGURED) throw new Error("PayUni not configured");
  const combined = Buffer.from(hexStr, "hex").toString("utf8");
  const parts = combined.split(":::");
  if (parts.length !== 2) throw new Error("Invalid PayUni response format");
  const [cipherB64, tagB64] = parts;
  const ciphertext = Buffer.from(cipherB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(HASH_KEY, "utf8"),
    Buffer.from(HASH_IV, "utf8"),
    { authTagLength: 16 }
  );
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// SHA256(KEY + EncryptInfo + IV) 大寫
export function makeHashInfo(encryptedStr: string): string {
  const raw = `${HASH_KEY}${encryptedStr}${HASH_IV}`;
  return crypto
    .createHash("sha256")
    .update(raw, "utf8")
    .digest("hex")
    .toUpperCase();
}

export function verifyHashInfo(
  encryptedStr: string,
  hashFromPayUni: string
): boolean {
  try {
    return makeHashInfo(encryptedStr) === hashFromPayUni.toUpperCase();
  } catch {
    return false;
  }
}

// PHP http_build_query 風格 — 空格用 `+` 不是 `%20`
function buildQuery(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([k, v]) => {
      const ek = encodeURIComponent(k).replace(/%20/g, "+");
      const ev = encodeURIComponent(String(v)).replace(/%20/g, "+");
      return `${ek}=${ev}`;
    })
    .join("&");
}

export type OrderOpts = {
  merTradeNo: string;
  amount: number;
  description: string;
  returnUrl: string;
  notifyUrl: string;
  backUrl?: string;
  userEmail?: string;
};

export type OrderFormPayload = {
  actionUrl: string;
  fields: {
    MerID: string;
    Version: string;
    EncryptInfo: string;
    HashInfo: string;
  };
};

// 產生要 POST 到 PayUni 的表單 payload
export function buildOrderPayload(opts: OrderOpts): OrderFormPayload {
  const order = {
    MerID: MER_ID,
    MerTradeNo: opts.merTradeNo,
    TradeAmt: opts.amount,
    Timestamp: Math.floor(Date.now() / 1000),
    ProdDesc: opts.description,
    ReturnURL: opts.returnUrl,
    NotifyURL: opts.notifyUrl,
    BackURL: opts.backUrl ?? opts.returnUrl,
    UsrMail: opts.userEmail ?? "",
    API1: "credit",
  };

  const plaintext = buildQuery(order);
  const encrypted = encryptInfo(plaintext);
  const hash = makeHashInfo(encrypted);

  return {
    actionUrl: PAYUNI_API_URL,
    fields: {
      MerID: MER_ID,
      Version: "1.0",
      EncryptInfo: encrypted,
      HashInfo: hash,
    },
  };
}

// 解析 PayUni 回傳（webhook / return URL）
export function parsePayUniResponse(
  encryptedStr: string,
  hashStr: string
): { ok: boolean; data?: Record<string, string>; error?: string } {
  if (!verifyHashInfo(encryptedStr, hashStr)) {
    return { ok: false, error: "Hash 驗證失敗（可能不是 PayUni 來的）" };
  }

  try {
    const plaintext = decryptInfo(encryptedStr);
    const data: Record<string, string> = {};
    for (const part of plaintext.split("&")) {
      const [k, v] = part.split("=");
      if (k) data[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
    }
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "decrypt failed",
    };
  }
}

// 產唯一訂單號（{prefix}{yyyyMMddHHmmss}{4 碼隨機}）
// prefix 預設 "kl"（首次付款）、續聊用 "ext"（PayUni return 偵測 → redirect /chat?extend=1）
export function generateOrderNo(prefix: string = "kl"): string {
  const now = new Date();
  const stamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}${stamp}${rand}`;
}
