"use client";

import { useEffect, useState } from "react";

type Star = {
  id: number;
  top: string;
  left: string;
  size: number;
  opacity: number;
  delay: string;
  hue: "white" | "pink" | "cyan";
};

// 散落的星點 — 全站背景的「深夜感」
export default function Starfield({ count = 36 }: { count?: number }) {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const out: Star[] = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      const hue: Star["hue"] = r < 0.7 ? "white" : r < 0.88 ? "pink" : "cyan";
      out.push({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 2,
        opacity: 0.18 + Math.random() * 0.45,
        delay: `${(Math.random() * 4).toFixed(2)}s`,
        hue,
      });
    }
    setStars(out);
  }, [count]);

  const colorOf = (hue: Star["hue"]) => {
    switch (hue) {
      case "pink":
        return "bg-glow-pink";
      case "cyan":
        return "bg-glow-cyan";
      default:
        return "bg-white";
    }
  };

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        {stars.map((s) => (
          <span
            key={s.id}
            className={`absolute rounded-full ${colorOf(s.hue)} animate-pulse-glow`}
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>
      {/* 流星 — 只在 client mount 後出現，避免 hydration mismatch */}
      {stars.length > 0 && (
        <>
          <span aria-hidden className="shooting-star" />
          <span aria-hidden className="shooting-star delay-2" />
        </>
      )}
    </>
  );
}
