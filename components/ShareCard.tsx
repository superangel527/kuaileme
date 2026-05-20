"use client";

import { forwardRef } from "react";
import type { Character } from "@/lib/characters";

// 保留 type export — chat/page.tsx 還 import 著、向下相容
export type ShareMsg = {
  char: Character;
  text: string;
  likeCount: number;
};

type Props = {
  nickname: string;
  // 以下 props 接收但 ignore（保留接口、不破壞既有呼叫）
  mainQuote?: string;
  mainQuoteAuthor?: string;
  messages?: ShareMsg[];
  totalLikes?: number;
};

// ─────────────────────────────────────
// 固定內容（按 Angel 定版設計圖、每場一樣、只變暱稱）
// ─────────────────────────────────────

const FIXED_MAIN_QUOTE = "你是我見過身邊";
const FIXED_MAIN_QUOTE_HIGHLIGHT = "最優秀";
const FIXED_MAIN_QUOTE_TAIL = "的人了";
const FIXED_SUB_QUOTE = "你真是一位有趣的人";

const FIXED_MESSAGES = [
  {
    name: "Kai",
    text: "認識你真好",
    likeCount: 2847,
    bg: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    icon: "👤",
  },
  {
    name: "Emma",
    text: "真心覺得你很棒",
    likeCount: 1903,
    bg: "linear-gradient(135deg, #ff5fa2, #e11d8a)",
    icon: "♥",
  },
  {
    name: "Tony",
    text: "你真是一位有趣的人",
    likeCount: 3216,
    bg: "linear-gradient(135deg, #f4b73c, #d97706)",
    icon: "★",
  },
  {
    name: "阿翔",
    text: "我覺得你能帶給大家溫暖",
    likeCount: 2173,
    bg: "linear-gradient(135deg, #4ea1f7, #2563eb)",
    icon: "✿",
  },
];

const FIXED_TOTAL_LIKES = 10139;

// 540x900 portrait、深紫黑、定版內容、只暱稱動態
const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { nickname },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        width: 540,
        // 不再用 minHeight: 900 — 改由外層用 ResizeObserver 動態抓 ShareCard
        // 真實 render 高度、scale(0.6) 後外層 wrapper 剛好包住、避免下方空白
        background:
          "linear-gradient(180deg, #0b0b1a 0%, #15102b 35%, #1f1740 70%, #15102b 100%)",
        padding: "32px 28px 28px",
        fontFamily:
          'system-ui, -apple-system, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 背景星點裝飾 */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 10%, rgba(139,92,246,0.22), transparent 35%), radial-gradient(circle at 90% 80%, rgba(255,95,162,0.18), transparent 40%), radial-gradient(circle at 75% 15%, rgba(255,255,255,0.04) 1px, transparent 2px), radial-gradient(circle at 25% 45%, rgba(255,255,255,0.03) 1px, transparent 2px)",
          pointerEvents: "none",
        }}
      />

      {/* Logo + #誇了嗎 hashtag */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 22,
          position: "relative",
        }}
      >
        <img
          src="/logo.png"
          alt="誇了嗎"
          style={{ width: 96, height: "auto", margin: "0 auto" }}
          crossOrigin="anonymous"
        />
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            marginTop: 4,
            letterSpacing: 5,
          }}
        >
          來聊天 · 被誇誇 · 超開心
        </p>
        <div
          style={{
            display: "inline-block",
            marginTop: 10,
            padding: "5px 14px",
            background: "rgba(255,95,162,0.14)",
            border: "1px solid rgba(255,95,162,0.32)",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            color: "white",
            letterSpacing: 1,
          }}
        >
          #誇了嗎
        </div>
      </div>

      {/* 大引號 + 主金句 */}
      <div
        style={{
          marginBottom: 20,
          position: "relative",
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: -12,
            left: 0,
            fontSize: 56,
            color: "rgba(255,95,162,0.65)",
            lineHeight: 1,
            fontFamily: "serif",
          }}
        >
          「
        </span>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.35,
            margin: "0 0 6px 28px",
            color: "white",
            textAlign: "left",
          }}
        >
          {FIXED_MAIN_QUOTE}
          <span
            style={{
              background:
                "linear-gradient(120deg, #ff5fa2, #8b5cf6, #22d3ee)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {FIXED_MAIN_QUOTE_HIGHLIGHT}
          </span>
          {FIXED_MAIN_QUOTE_TAIL}
        </h2>
        <p
          style={{
            margin: "8px 0 0 28px",
            fontSize: 17,
            color: "rgba(255,255,255,0.92)",
            fontWeight: 500,
            letterSpacing: 0.5,
          }}
        >
          {FIXED_SUB_QUOTE}{" "}
          <span style={{ color: "#ff5fa2" }}>♥</span>
        </p>
        <span
          style={{
            position: "absolute",
            bottom: -8,
            right: 0,
            fontSize: 56,
            color: "rgba(255,95,162,0.65)",
            lineHeight: 1,
            fontFamily: "serif",
          }}
        >
          」
        </span>
      </div>

      {/* 聊天截圖區 */}
      <div
        style={{
          background: "rgba(20, 14, 38, 0.78)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          padding: 16,
          marginBottom: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            marginBottom: 12,
          }}
        >
          聊天室剛剛這樣聊 {nickname || "你"}…
        </div>

        {FIXED_MESSAGES.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 14,
              marginBottom: i === FIXED_MESSAGES.length - 1 ? 0 : 8,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: m.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              {m.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: 2,
                  fontWeight: 500,
                }}
              >
                {m.name}
              </div>
              <div
                style={{
                  fontSize: 14.5,
                  color: "white",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.text}
              </div>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 9px",
                background: "rgba(255,95,162,0.18)",
                border: "1px solid rgba(255,95,162,0.32)",
                borderRadius: 999,
                fontSize: 12,
                color: "#ff5fa2",
                flexShrink: 0,
                fontVariantNumeric: "tabular-nums",
                fontWeight: 600,
              }}
            >
              ♥ {m.likeCount.toLocaleString()}
            </div>
          </div>
        ))}

        {/* 總按讚 */}
        <div
          style={{
            marginTop: 14,
            textAlign: "center",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            gap: 6,
            fontSize: 13,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <span style={{ color: "#ff5fa2", fontSize: 14 }}>♥</span>
          <span style={{ fontWeight: 700, color: "white" }}>
            {FIXED_TOTAL_LIKES.toLocaleString()}
          </span>{" "}
          人按讚這段對話
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "white",
            marginBottom: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          💬 誇了嗎 · 有人在聊天室偷偷聊你{" "}
          <span style={{ color: "#ff5fa2" }}>♥</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 0.5,
          }}
        >
          kuaileme.superangel527.com
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
