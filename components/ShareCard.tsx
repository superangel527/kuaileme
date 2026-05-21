"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
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

// 用 Angel 給的 /share.png 當底圖、Canvas overlay 暱稱
// 暱稱位置：副金句「你真是一位有趣的人 ♥」下方（Angel 圈起來的地方）
// 相對座標：x = 50%（置中）、y = 25.5%（副金句底下）
const NICKNAME_X_RATIO = 0.5;
const NICKNAME_Y_RATIO = 0.255;
const NICKNAME_FONT_RATIO = 0.058; // 字大小相對圖寬

const BASE_SRC = "/share.png";

const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { nickname },
  ref
) {
  const [imgSrc, setImgSrc] = useState<string>(BASE_SRC);
  const generatedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const nick = (nickname || "").trim().slice(0, 12);
    if (!nick) {
      setImgSrc(BASE_SRC);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
          img.src = BASE_SRC;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 底圖
        ctx.drawImage(img, 0, 0);

        // 暱稱位置
        const x = canvas.width * NICKNAME_X_RATIO;
        const y = canvas.height * NICKNAME_Y_RATIO;
        const fontSize = Math.round(canvas.width * NICKNAME_FONT_RATIO);

        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = `@${nick}`;

        // 先畫深色描邊（讓暱稱在任何背景都看得清楚）
        ctx.lineWidth = Math.max(3, fontSize * 0.12);
        ctx.strokeStyle = "rgba(11, 11, 26, 0.85)";
        ctx.lineJoin = "round";
        ctx.strokeText(text, x, y);

        // 粉色文字（跟設計圖配色）
        ctx.fillStyle = "#ff5fa2";
        ctx.shadowColor = "rgba(255, 95, 162, 0.6)";
        ctx.shadowBlur = Math.max(6, fontSize * 0.2);
        ctx.fillText(text, x, y);

        if (cancelled) return;

        // 轉 blob URL（比 data URL 短、iOS window.open 也 work）
        canvas.toBlob((blob) => {
          if (cancelled || !blob) return;
          // 回收上一個 blob URL
          if (generatedUrlRef.current) {
            URL.revokeObjectURL(generatedUrlRef.current);
          }
          const url = URL.createObjectURL(blob);
          generatedUrlRef.current = url;
          setImgSrc(url);
        }, "image/png");
      } catch (e) {
        console.warn("[ShareCard] canvas overlay 失敗、用原圖", e);
        if (!cancelled) setImgSrc(BASE_SRC);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nickname]);

  // unmount 時回收 blob URL
  useEffect(() => {
    return () => {
      if (generatedUrlRef.current) {
        URL.revokeObjectURL(generatedUrlRef.current);
        generatedUrlRef.current = null;
      }
    };
  }, []);

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
        src={imgSrc}
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
