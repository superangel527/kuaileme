/**
 * In-app browser 偵測（LINE / IG / Facebook / TikTok / WeChat）
 *
 * 為什麼存在：這些 webview 對 Apple Pay / Google Pay / 各種 OAuth callback
 * 都有支援問題。LINE WebView 特別會擋住 Apple Pay token 的 callback、
 * 導致使用者看到 Apple Pay 認證成功、但 PayUni 沒收到 → 沒建單 → 使用者
 * 被踢回首頁、誤以為扣款失敗（實際上是 pending authorization、銀行 7
 * 天會釋放）。
 *
 * 解法：偵測到 in-app browser 時、在付款頁顯示警告 + 強制只開信用卡
 * （CREDIT、不開 APPLEPAY）。
 */

export type InAppBrowserKind =
  | "line"
  | "instagram"
  | "facebook"
  | "messenger"
  | "tiktok"
  | "wechat"
  | "other"
  | null;

// 從 User Agent 判斷是不是 in-app browser；不是就回 null
export function detectInAppBrowser(userAgent?: string): InAppBrowserKind {
  if (typeof userAgent !== "string") {
    if (typeof navigator === "undefined") return null;
    userAgent = navigator.userAgent || "";
  }
  const ua = userAgent.toLowerCase();

  if (ua.includes("line/") || ua.includes("line ")) return "line";
  if (ua.includes("instagram")) return "instagram";
  if (ua.includes("fbav") || ua.includes("fban")) return "facebook";
  if (ua.includes("fb_iab") || ua.includes("messenger")) return "messenger";
  if (ua.includes("tiktok") || ua.includes("musical_ly")) return "tiktok";
  if (ua.includes("micromessenger")) return "wechat";

  return null;
}

export function isInAppBrowser(userAgent?: string): boolean {
  return detectInAppBrowser(userAgent) !== null;
}

// 給使用者看的友善名字
export function inAppBrowserDisplayName(kind: InAppBrowserKind): string {
  switch (kind) {
    case "line":
      return "LINE";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "messenger":
      return "Messenger";
    case "tiktok":
      return "TikTok";
    case "wechat":
      return "微信";
    case "other":
      return "App";
    default:
      return "";
  }
}

// 給使用者開外部瀏覽器的引導文字（不同 App 操作不同）
export function openInExternalBrowserHint(kind: InAppBrowserKind): string {
  switch (kind) {
    case "line":
      return "請按右下角「⋯」→「在瀏覽器中開啟」";
    case "instagram":
    case "facebook":
    case "messenger":
      return "請按右上角「⋯」→「在外部瀏覽器中開啟」";
    case "tiktok":
      return "請按右上角「⋯」→「在瀏覽器中開啟」";
    case "wechat":
      return "請按右上角「⋯」→「在瀏覽器中打開」";
    default:
      return "請複製此頁連結、在 Safari 或 Chrome 打開";
  }
}
