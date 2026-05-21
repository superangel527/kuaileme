"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomGlow from "@/components/BottomGlow";

// 3 個法律頁面共用：隱私權政策 / 服務條款 / 免責聲明
export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <main className="relative min-h-screen-safe px-5 pt-4 pb-12 overflow-hidden">
      <BottomGlow />
      <div className="max-w-2xl mx-auto">
        {/* 頂部返回 */}
        <button
          onClick={() => router.back()}
          aria-label="返回"
          className="text-white/60 hover:text-white text-[14px] flex items-center gap-1 -ml-1 mb-6 active:scale-95 transition"
        >
          ‹ 返回
        </button>

        {/* Logo + 標題 */}
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" alt="" className="w-12 h-12 shrink-0" />
          <div>
            <h1 className="text-[22px] sm:text-[24px] font-bold text-white leading-tight">
              {title}
            </h1>
            <p className="text-[11.5px] text-white/45 mt-1">
              最後更新：{updated}
            </p>
          </div>
        </div>

        {/* 內容卡片 */}
        <article className="mt-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 sm:p-7 text-white/85 leading-[1.85] text-[14.5px] legal-content">
          {children}
        </article>

        {/* footer 連結 + 安心專線 */}
        <div className="mt-8 text-center text-[12px] text-white/45 space-y-3">
          <p className="space-x-2">
            <Link
              href="/privacy"
              className="hover:text-white/80 underline-offset-4 hover:underline"
            >
              隱私權政策
            </Link>
            <span className="text-white/25">·</span>
            <Link
              href="/terms"
              className="hover:text-white/80 underline-offset-4 hover:underline"
            >
              服務條款
            </Link>
            <span className="text-white/25">·</span>
            <Link
              href="/disclaimer"
              className="hover:text-white/80 underline-offset-4 hover:underline"
            >
              免責聲明
            </Link>
          </p>
          <p className="text-[11.5px] text-white/40 leading-relaxed">
            🫂 衛福部安心專線 <span className="text-white/70 font-medium">1925</span>{" "}
            ・ 自殺防治專線{" "}
            <span className="text-white/70 font-medium">1995</span>
            <br />
            <span className="text-white/30">（24 小時免費、有人陪你說話）</span>
          </p>
        </div>
      </div>

      {/* legal-content 樣式（給內部 markdown-like 元素用） */}
      <style jsx global>{`
        .legal-content h2 {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          margin-top: 22px;
          margin-bottom: 8px;
          padding-top: 4px;
        }
        .legal-content h3 {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14.5px;
          font-weight: 600;
          margin-top: 14px;
          margin-bottom: 6px;
        }
        .legal-content p {
          margin: 8px 0;
        }
        .legal-content ul {
          list-style: disc;
          padding-left: 22px;
          margin: 8px 0;
        }
        .legal-content ul li {
          margin: 4px 0;
          color: rgba(255, 255, 255, 0.78);
        }
        .legal-content a {
          color: #ff5fa2;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .legal-content a:hover {
          color: #ff84b8;
        }
        .legal-content hr {
          border: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin: 18px 0;
        }
        .legal-content strong {
          color: white;
          font-weight: 600;
        }
      `}</style>
    </main>
  );
}
