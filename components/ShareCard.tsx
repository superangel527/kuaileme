"use client";

import { forwardRef } from "react";
import type { Character } from "@/lib/characters";
import Avatar from "./Avatar";

export type ShareMsg = {
  char: Character;
  text: string;
  likeCount: number;
};

type Props = {
  nickname: string;
  mainQuote: string;
  mainQuoteAuthor: string;
  messages: ShareMsg[];
  totalLikes: number;
};

// 固定分享圖：540x900 portrait、深紫黑漸層、固定排版
const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { nickname, mainQuote, mainQuoteAuthor, messages, totalLikes },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        width: 540,
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
            "radial-gradient(circle at 20% 10%, rgba(139,92,246,0.18), transparent 35%), radial-gradient(circle at 90% 80%, rgba(255,95,162,0.16), transparent 40%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo + slogan */}
      <div style={{ textAlign: "center", marginBottom: 22, position: "relative" }}>
        <img
          src="/logo.png"
          alt="誇了嗎"
          style={{ width: 120, height: "auto", margin: "0 auto" }}
          crossOrigin="anonymous"
        />
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            marginTop: 6,
            letterSpacing: 4,
          }}
        >
          來聊天 · 被誇誇 · 超開心
        </p>
      </div>

      {/* 大引號 + 主標金句 */}
      <div style={{ marginBottom: 16, position: "relative", paddingLeft: 8 }}>
        <span
          style={{
            position: "absolute",
            top: -8,
            left: 0,
            fontSize: 48,
            color: "rgba(255,95,162,0.6)",
            lineHeight: 1,
          }}
        >
          「
        </span>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1.4,
            margin: "0 0 4px 22px",
            color: "white",
          }}
        >
          {mainQuote}
        </h2>
        <p
          style={{
            margin: "10px 0 0 22px",
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          ── {mainQuoteAuthor} 說
        </p>
      </div>

      {/* 聊天截圖區 */}
      <div
        style={{
          background: "rgba(20, 14, 38, 0.75)",
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
          聊天室剛剛這樣聊 {nickname}…
        </div>

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 14,
              marginBottom: i === messages.length - 1 ? 0 : 8,
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <Avatar char={m.char} size={36} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: 2,
                  fontWeight: 500,
                }}
              >
                {m.char.name}
              </div>
              <div
                style={{
                  fontSize: 14,
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
                background: "rgba(255,95,162,0.16)",
                border: "1px solid rgba(255,95,162,0.28)",
                borderRadius: 999,
                fontSize: 12,
                color: "#ff5fa2",
                flexShrink: 0,
                fontVariantNumeric: "tabular-nums",
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
          <span style={{ fontWeight: 600, color: "white" }}>
            {totalLikes.toLocaleString()}
          </span>{" "}
          人按讚這段對話
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          paddingTop: 12,
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
          💬 誇了嗎 · 有人在聊天室偷偷聊你 <span style={{ color: "#ff5fa2" }}>♥</span>
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
