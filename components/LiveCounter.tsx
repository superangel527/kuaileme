"use client";

import { useEffect, useState } from "react";

// SSR 跟 client 第一輪 render 都用這個固定值，避免 hydration mismatch
const SSR_FALLBACK = 2000;

export default function LiveCounter({
  base = 287,
  compact = false,
}: {
  base?: number;
  compact?: boolean;
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // 客端 mount 後才把 count 設成 base，並啟動 drift
    setCount(base);
    const tick = () => {
      setCount((c) => {
        const cur = c ?? base;
        const drift = Math.floor(Math.random() * 9) - 4;
        const next = cur + drift;
        if (next < base - 30) return base - 30;
        if (next > base + 60) return base + 60;
        return next;
      });
    };
    const id = setInterval(tick, 1400 + Math.random() * 1200);
    return () => clearInterval(id);
  }, [base]);

  const display = count ?? SSR_FALLBACK;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-white/55 tabular-nums">
        <span className="relative flex items-center justify-center">
          <span className="absolute w-2 h-2 rounded-full bg-green-400 opacity-40 animate-ping" />
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        </span>
        {display} 在線
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-white/70">
      <span className="relative flex items-center justify-center">
        <span className="absolute w-2.5 h-2.5 rounded-full bg-green-400 opacity-50 animate-ping" />
        <span className="w-2 h-2 rounded-full bg-green-400" />
      </span>
      <span className="text-sm tracking-wide">
        目前聊天室{" "}
        <span className="text-white font-semibold tabular-nums">{display}</span>{" "}
        人在線
      </span>
    </div>
  );
}
