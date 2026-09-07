import type { Metadata, Viewport } from "next";
import "./globals.css";
import Starfield from "@/components/Starfield";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kuaileme.superangel527.com"
  ),
  title: "誇了嗎",
  description: "你真好！現在有 100 個人正在聊天室討論你喔",
  manifest: "/manifest.json",
  // 檔名帶 v2 強迫 iOS Safari / Android Chrome 拿新的 icon（舊 apple-touch-icon.png
  // 之前被 Safari cache 死鎖、Angel 加主畫面顯示還是舊圓形淺色版）
  icons: {
    icon: [
      { url: "/favicon-v2.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192-v2.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-v2.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-v2.ico",
  },
  appleWebApp: {
    title: "誇了嗎",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "誇了嗎",
    description: "你真好！現在有 100 個人正在聊天室討論你喔",
    images: [
      {
        url: "/OG.png",
        width: 1200,
        height: 630,
        alt: "誇了嗎 - 來聊天 被誇誇 超開心",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "誇了嗎",
    description: "你真好！現在有 100 個人正在聊天室討論你喔",
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
      </body>
    </html>
  );
}
