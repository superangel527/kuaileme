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

// 純顯示 Angel 給的 /share.png 設計圖、不再做 Canvas overlay
// 暱稱已寫死在圖內、聊天室也會強制出現對應的 4 個角色 + 4 句話（保持一致）
const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  _props,
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#0b0b1a",
        lineHeight: 0,
      }}
    >
      <img
        src="/share.png"
        alt="誇了嗎 - 你是我見過身邊最優秀的人了"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />
    </div>
  );
});

export default ShareCard;
