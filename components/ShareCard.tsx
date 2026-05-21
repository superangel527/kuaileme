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

// 直接用 Angel 給的 /share.png 設計圖
// 好處：
//   1. 每張完美一致、設計感最強
//   2. iOS Safari 也能保存（不再用 html-to-image、避免相容問題）
//   3. 簡單穩定、不會跑版
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
        lineHeight: 0, // 避免 img 下方 inline gap
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
