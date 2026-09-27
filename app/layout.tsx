import type { Metadata, Viewport } from "next";
import "./globals.css";
import Starfield from "@/components/Starfield";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kuaileme.superangel527.com"
  ),
  title: {
    default: "誇了嗎｜匿名情緒陪伴聊天室・100 人圍著你誇 3 分鐘",
    template: "%s｜誇了嗎",
  },
  description:
    "誇了嗎是為疲憊女生設計的匿名情緒陪伴聊天室、丟一句話進來、100 個人立刻圍著你誇 3 分鐘、給你 3 分鐘的心情充電。免下載、免註冊、NT$19 一場、24 小時開放。",
  keywords: [
    "誇了嗎", "誇獎", "情緒陪伴", "匿名聊天室", "心情充電", "被誇獎",
    "女生療癒", "情緒支持", "聊天陪伴", "心靈解憂", "疲憊", "被看見",
    "台灣聊天室", "匿名APP", "深夜陪伴", "情緒出口",
  ],
  authors: [{ name: "誇了嗎 團隊", url: "https://kuaileme.superangel527.com" }],
  creator: "誇了嗎",
  publisher: "誇了嗎",
  alternates: {
    canonical: "https://kuaileme.superangel527.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Google Search Console 驗證 — Angel 拿到 code 後填進 verification.google
  // verification: { google: "your-verification-code-here" },
  manifest: "/manifest.json",
  // 檔名帶 v4，強迫 iOS Safari / Android Chrome 改用新版深色 logo。
  icons: {
    icon: [
      { url: "/favicon-32-v4.png", sizes: "any" },
      { url: "/favicon-16-v4.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32-v4.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192-v4.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512-v4.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-v4.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-32-v4.png",
  },
  appleWebApp: {
    title: "誇了嗎",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "誇了嗎｜100 個人圍著你誇 3 分鐘的匿名聊天室",
    description:
      "疲憊的時候、需要有人聽你、有人誇你。誇了嗎是為妳準備的 3 分鐘匿名聊天室、丟一句話進來、100 個人立刻圍著妳。免下載、免註冊、NT$19。",
    images: [
      {
        url: "/OG.png",
        width: 1200,
        height: 630,
        alt: "誇了嗎 - 來聊天 被誇誇 超開心",
      },
    ],
    type: "website",
    locale: "zh_TW",
    siteName: "誇了嗎",
    url: "https://kuaileme.superangel527.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "誇了嗎｜100 個人圍著你誇 3 分鐘",
    description:
      "為疲憊女生準備的匿名情緒陪伴聊天室、丟一句話、100 個人立刻圍著妳。3 分鐘 NT$19。",
    images: ["/OG.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a12",
  // iOS 鍵盤彈出時、viewport 跟著縮 → 內容自動 reflow → input 不會被鍵盤蓋住
  interactiveWidget: "resizes-content",
};

// JSON-LD 結構化資料：讓 Google 理解「這是啥網站」、SERP 顯示更完整
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "誇了嗎",
  alternateName: "Kuaileme",
  url: "https://kuaileme.superangel527.com",
  description:
    "為疲憊女生設計的匿名情緒陪伴聊天室、丟一句話進來、100 個人立刻圍著你誇 3 分鐘。",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any",
  inLanguage: "zh-TW",
  offers: {
    "@type": "Offer",
    price: "19",
    priceCurrency: "TWD",
    description: "3 分鐘匿名情緒陪伴聊天室",
  },
  publisher: {
    "@type": "Organization",
    name: "誇了嗎",
    url: "https://kuaileme.superangel527.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="font-sans antialiased text-white">
        <Starfield />
        {children}
        {/* JSON-LD 給 Google 爬蟲理解站台性質 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}


