"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { Character } from "@/lib/characters";

export type ShareMsg = {
  char: Character;
  text: string;
  likeCount: number;
};

type Props = {
  nickname: string;
  messages?: ShareMsg[];
  // 以下 props 接收但 ignore
  mainQuote?: string;
  mainQuoteAuthor?: string;
  totalLikes?: number;
};

// ?v=2 — 強制 Netlify CDN / 瀏覽器重抓新版（不再 cache 舊版有 Kai/Emma 的圖）
const BASE_SRC = "/share.png?v=2";

// share.png 1024×1536 內「聊天截圖區」座標（按新版空白框位置量、可再微調）
// Angel 反饋：字再大、排版更鬆、下面空白用滿 — 卡片高 86→100、gap 5→8、4 個訊息
// 從 y=780 開始到 y=1206、佔聊天截圖整個區域
const LAYOUT = {
  // 標籤位置（不再用、底圖已有）
  labelX: 130,
  labelY: 775,
  labelFontPx: 22,
  // 4 個訊息卡片（4*100 + 3*8 = 424、fit 聊天截圖區）
  msgStartY: 780,
  msgHeight: 100,
  msgGap: 8,
  msgLeft: 105,
  msgRight: 920,
  // avatar 圓 — 大一點
  avatarRadius: 36,
  avatarCx: 158,
  // text / name — 右移留 avatar 空間
  textLeft: 215,
  // ♥ pill
  pillRight: 905,
};

const FONT = `-apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function ellipsizeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

function drawMessage(
  ctx: CanvasRenderingContext2D,
  m: ShareMsg,
  yTop: number
) {
  const cx = LAYOUT.avatarCx;
  const cy = yTop + LAYOUT.msgHeight / 2;
  const w = LAYOUT.msgRight - LAYOUT.msgLeft;

  // 卡片背景
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(ctx, LAYOUT.msgLeft, yTop, w, LAYOUT.msgHeight, 14);
  ctx.fill();

  // avatar 圓（漸層）
  const gradient = ctx.createLinearGradient(
    cx - LAYOUT.avatarRadius,
    cy - LAYOUT.avatarRadius,
    cx + LAYOUT.avatarRadius,
    cy + LAYOUT.avatarRadius
  );
  gradient.addColorStop(0, m.char.gradient[0]);
  gradient.addColorStop(1, m.char.gradient[1]);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, LAYOUT.avatarRadius, 0, Math.PI * 2);
  ctx.fill();

  // initial 字
  const initial = m.char.initial || m.char.name.slice(0, 1);
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, cx, cy);

  // 名字（左對齊、淡白）
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(m.char.name, LAYOUT.textLeft, yTop + 32);

  // ♥ pill — 右側、先量寬度
  const likeText = `${m.likeCount.toLocaleString()}`;
  ctx.font = `bold 26px ${FONT}`;
  const heartW = ctx.measureText("♥ ").width;
  const numW = ctx.measureText(likeText).width;
  const pillContentW = heartW + numW;
  const pillPaddingX = 18;
  const pillW = pillContentW + pillPaddingX * 2;
  const pillH = 42;
  const pillX = LAYOUT.pillRight - pillW;
  const pillY = yTop + LAYOUT.msgHeight / 2 - pillH / 2;

  ctx.fillStyle = "rgba(255,95,162,0.18)";
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,95,162,0.32)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#ff5fa2";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`♥ ${likeText}`, pillX + pillPaddingX, pillY + pillH / 2);

  // 訊息文字（左對齊、白、用 ellipsize 避免撞到 pill）
  const textRight = pillX - 14;
  const textMaxW = textRight - LAYOUT.textLeft;
  ctx.font = `30px ${FONT}`;
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const displayText = ellipsizeText(ctx, m.text, textMaxW);
  ctx.fillText(displayText, LAYOUT.textLeft, yTop + 70);
}

const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { nickname, messages },
  ref
) {
  const [imgSrc, setImgSrc] = useState<string>(BASE_SRC);
  const generatedUrlRef = useRef<string | null>(null);

  useEffect(() => {
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

        // 不再 overlay 標籤 — 底圖已經有「聊天室剛剛這樣聊…」、避免字疊字

        // 4 個動態訊息
        const msgs = (messages || []).slice(0, 4);
        msgs.forEach((m, idx) => {
          const yTop = LAYOUT.msgStartY + idx * (LAYOUT.msgHeight + LAYOUT.msgGap);
          drawMessage(ctx, m, yTop);
        });

        if (cancelled) return;

        canvas.toBlob((blob) => {
          if (cancelled || !blob) return;
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
    // 依賴：nickname 跟 messages 序列化過後的字串
  }, [nickname, JSON.stringify(messages)]); // eslint-disable-line react-hooks/exhaustive-deps

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
