"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import MicButton from "./MicButton";

// 半自由互動：使用者可隨時打字、AI 群演圍繞回應
export default function ChatInputBar({
  onSend,
  disabled = false,
  placeholder = "說點什麼、讓他們圍著你…",
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    onSend(trimmed);
    setText("");
    // 自動回到 1 行高
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
    setTimeout(() => setSending(false), 300);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 送出（行動端可能不適用、但 desktop OK）、Shift+Enter 換行
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // auto-grow（最多到 maxHeight）
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <form
      onSubmit={handleSubmit}
      // 加大底部 padding、避免在 iOS 上被 home indicator / 系統手勢區誤觸
      className="shrink-0 px-3 pt-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))] border-t border-white/5 bg-bg-deep/92 backdrop-blur-md"
    >
      <div className="flex items-end gap-2 max-w-md mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={placeholder}
            disabled={disabled}
            aria-label="輸入訊息"
            className="w-full resize-none rounded-2xl bg-white/[0.06] border-2 border-glow-pink/40 pl-12 pr-4 py-3 text-[15px] text-white placeholder:text-white/40 leading-snug focus:outline-none focus:border-glow-pink/80 focus:ring-1 focus:ring-glow-pink/40 transition disabled:opacity-50"
            style={{ maxHeight: "120px", minHeight: "48px" }}
          />
          {/* mic 在 textarea 左下角內 */}
          <div className="absolute left-1.5 bottom-1.5">
            <MicButton
              currentText={text}
              onUpdate={(t) => {
                setText(t);
                if (inputRef.current) {
                  inputRef.current.style.height = "auto";
                  inputRef.current.style.height =
                    Math.min(inputRef.current.scrollHeight, 120) + "px";
                }
              }}
              size={36}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!text.trim() || sending || disabled}
          aria-label="送出"
          className="shrink-0 w-[48px] h-[48px] rounded-full bg-gradient-to-br from-glow-pink via-glow-violet to-glow-cyan flex items-center justify-center text-white text-[20px] font-bold shadow-[0_4px_18px_-4px_rgba(255,95,162,0.55)] active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ↑
        </button>
      </div>
    </form>
  );
}
