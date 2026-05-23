"use client";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// 麥克風按鈕：點下啟動語音輸入、結果 append 到現有 text
// 若瀏覽器不支援（LINE WebView 等）、按鈕自動隱藏
export default function MicButton({
  currentText,
  onUpdate,
  className = "",
  size = 36,
}: {
  currentText: string;
  onUpdate: (newText: string) => void;
  className?: string;
  size?: number;
}) {
  const { supported, listening, start, stop } = useSpeechRecognition(
    (heard) => {
      // append 聽到的文字到現有 text（中間加空格）
      const next = currentText.trim()
        ? `${currentText.trim()} ${heard.trim()}`
        : heard.trim();
      onUpdate(next);
    }
  );

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      aria-label={listening ? "停止錄音" : "語音輸入"}
      className={`shrink-0 rounded-full flex items-center justify-center transition active:scale-90 ${
        listening
          ? "bg-glow-pink text-white animate-pulse-glow shadow-[0_0_16px_rgba(255,95,162,0.6)]"
          : "bg-white/[0.08] text-white/70 hover:bg-white/[0.14] hover:text-white border border-white/[0.12]"
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: size * 0.5, height: size * 0.5 }}
        aria-hidden
      >
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5.3-3a.7.7 0 0 0-.7.7 4.6 4.6 0 0 1-9.2 0 .7.7 0 1 0-1.4 0 6 6 0 0 0 5.3 5.96V20H9a.7.7 0 1 0 0 1.4h6a.7.7 0 1 0 0-1.4h-2.3v-2.34A6 6 0 0 0 18 11.7a.7.7 0 0 0-.7-.7z" />
      </svg>
    </button>
  );
}
