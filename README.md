# 誇了嗎 ✦ Kua Le Ma

> 花 NT$19，進入 100 人聊天室被瘋狂誇 3 分鐘。

[線上網站](https://kuaileme.superangel527.com) · [MIT License](./LICENSE)

「誇了嗎」是一個以繁體中文為主、手機優先的互動式情緒支持體驗。本儲存庫公開完整的 Next.js 應用架構，包含 AI 回應流程、付款後存取控制、PWA、內容安全邊界與 Netlify 部署設定，供華語開發者研究、改進及貢獻。

## 開源維護

- 維護者：[@superangel527](https://github.com/superangel527)
- 授權：MIT
- 歡迎透過 Issue 回報錯誤或提出功能建議，也歡迎提交 Pull Request。
- 安全問題請勿公開揭露金鑰、付款資料或個人資料。

不是 AI 工具・不是心理測驗・不是療癒 APP。
就是一個情緒爽感的小遊戲網站。

---

## 🚀 第一次啟動

打開 PowerShell 或 終端機（在這個資料夾裡），照順序貼指令：

```bash
# 1. 安裝套件（只要做一次，大約 1~2 分鐘）
npm install

# 2. 啟動開發伺服器
npm run dev
```

跑起來後打開瀏覽器：

```
http://localhost:3000
```

手機看的話：
- 確認電腦跟手機同一個 Wi-Fi
- 終端機會顯示一個 `192.168.x.x:3000` 的網址，用手機開那個

---

## 🗂 檔案結構

```
kuaileme/
├── app/
│   ├── layout.tsx          根 layout
│   ├── globals.css         全站樣式（黑底、深夜感）
│   ├── page.tsx            首頁
│   ├── pay/page.tsx        付款 loading 頁
│   └── chat/page.tsx       聊天室頁（最重要）
├── components/
│   ├── Avatar.tsx          圓形頭像（漸層 + 中文字）
│   ├── MessageBubble.tsx   訊息泡泡
│   ├── TypingBubble.tsx    正在輸入...
│   ├── LiveCounter.tsx     287 人在線（會浮動）
│   └── BottomGlow.tsx      底部粉紫光暈
├── lib/
│   ├── characters.ts       53 個人格池
│   ├── messages.ts         留言池（依情境分類、依階段分層）
│   ├── scenarios.ts        情境分類（關鍵字偵測）
│   └── stripe.ts           Stripe 預留位（含串接說明）
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── postcss.config.js
└── netlify.toml            Netlify 部署設定
```

---

## ✏️ 想改文案的話看這裡

### 改誇人的句子
👉 `lib/messages.ts`
- `GENERAL_POOL.early` / `.mid` / `.late` — 通用句子
- `SCENARIO_POOL.tired` / `.anxious` / `.breakup` ... — 各情境專屬句子
- 直接加在陣列裡就會被混入抽籤

### 改首頁標題、副標、按鈕文字
👉 `app/page.tsx`

### 改快速按鈕（我今天很累 / 我失戀了…）
👉 `lib/scenarios.ts` 的 `SCENARIOS` 陣列。
也可以順便加新關鍵字，讓自由輸入更準。

### 改人格（名字、年齡、身份）
👉 `lib/characters.ts`

### 改總時長 / 訊息數量
👉 `app/chat/page.tsx` 上方：
```ts
const TOTAL_MS = 180_000;   // 3 分鐘
const MSG_COUNT = 24;       // 預計顯示訊息數
```

### 改價格
👉 `lib/stripe.ts` 的 `KUA_PRICE_TWD`
👉 還要順手改 `app/page.tsx` 跟 `app/chat/page.tsx` 按鈕文字裡的「NT$19」

---

## 💳 之後接真的 Stripe

目前是「假付款」：按按鈕 → 跑 2.7 秒 loading → 進聊天室。

要接真實金流，完整步驟寫在 `lib/stripe.ts` 開頭的註解裡。
重點：**API Key 一定要放 `.env.local`，絕對不要寫死在程式裡。**

---

## ☁️ 部署到 Netlify

1. 把整個 `kuaileme` 資料夾 push 到 GitHub
2. Netlify → Add new site → Import from Git → 選這個 repo
3. Netlify 會自動讀 `netlify.toml`，按預設值即可
4. 第一次部署需要安裝 `@netlify/plugin-nextjs`：
   Netlify 後台 → Site settings → Plugins → 搜尋 `@netlify/plugin-nextjs` → Install

部署完會給妳一個 `xxx.netlify.app` 網址，可以直接用，也可以綁自己的網域。

---

## 📦 技術選型備忘

- Next.js 14 App Router + TypeScript
- React 18
- Tailwind CSS 3.4
- 手機優先（max-w-md，黑底深夜感）
- **沒有資料庫、沒有登入** — 只用 localStorage 暫存使用者輸入的那句話
- **沒有後端 AI** — 留言池都是預先寫好的，照情境抽

---

## ⚠️ 重要提醒

- 不會收集使用者個資
- 不會用到任何 API Key（第一版）
- 接了 Stripe 之後，Key 一定放在 `.env.local`，**永遠不要 commit 到 git**

---

打開 `app/chat/page.tsx` 在瀏覽器看效果最爽，調文案的話從 `lib/messages.ts` 開始最快。
