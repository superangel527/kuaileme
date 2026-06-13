/**
 * PayUni 統一金流 個人版 Universal API 1.x 整合
 *
 * 加密：AES-256-CBC + PKCS7 padding、hex 編碼小寫
 * 簽章：SHA256(HashKey=...&...&HashIV=...) 大寫
 *
 * 環境變數（Netlify 後台設）：
 *   PAYUNI_MERCHANT_ID — 商店代號
 *   PAYUNI_HASH_KEY    — 32 碼 AES key
 *   PAYUNI_HASH_IV     — 16 碼 AES IV
 */

import crypto from "crypto";

// PayUni form post endpoint — 可用環境變數 PAYUNI_ENDPOINT_URL 覆蓋
const PAYUNI_API_URL =
  process.env.PAYUNI_ENDPOINT_URL || "https://api.payuni.com.tw/api/upp";

const HASH_KEY = process.env.PAYUNI_HASH_KEY ?? "";
const HASH_IV = process.env.PAYUNI_HASH_IV ?? "";
const MER_ID = process.env.PAYUNI_MERCHANT_ID ?? "";

export const PAYUNI_CONFIGURED =
  HASH_KEY.length === 32 && HASH_IV.length === 16 && MER_ID.length > 0;

export const PAYUNI_API_ENDPOINT = PAYUNI_API_URL;

// AES-256-CBC + PKCS7、hex 小寫
export function encryptInfo(plaintext: string): string {
  if (!PAYUNI_CONFIGURED) throw new Error("PayUni not configured");
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(HASH_KEY, "utf8"),
    Buffer.from(HASH_IV, "utf8")
  );
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return encrypted.toString("hex").toLowerCase();
}

export function decryptInfo(ciphertext: string): string {
  if (!PAYUNI_CONFIGURED) throw new Error("PayUni not configured");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(HASH_KEY, "utf8"),
    Buffer.from(HASH_IV, "utf8")
  );
  const decrypted = Buffer.concat([
    decipher.update(ciphertext, "hex"),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// SHA256("HashKey=" + key + "&" + ciphertext + "&HashIV=" + iv) 大寫
export function makeHashInfo(encryptedStr: string): string {
  const raw = `HashKey=${HASH_KEY}&${encryptedStr}&HashIV=${HASH_IV}`;
  return crypto
    .createHash("sha256")
    .update(raw, "utf8")
    .digest("hex")
    .toUpperCase();
}

export function verifyHashInfo(encryptedStr: string, hashFromPayUni: string): boolean {
  try {
    return makeHashInfo(encryptedStr) === hashFromPayUni.toUpperCase();
  } catch {
    return false;
  }
}

// 用 PHP-style http_build_query 編碼（PayUni 比較吃這個格式）
function buildQuery(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
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
    API1: "credit", // 信用卡
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

// 解析 PayUni 回傳的 EncryptInfo（無論 webhook 或 return URL）
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
