"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);

  // iOS 鍵盤修：用 visualViewport API 監聽鍵盤高度、寫進 CSS var
  // keyboard 彈出 → 表單 padding-bottom 動態撐高、textarea 不會被蓋住
  // iOS 15+ + Safari WebView 都支援
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      // 鍵盤高度 = window 高度 - visualViewport 高度 - viewport 頂部 offset
      const overlap = window.innerHeight - vv.height - vv.offsetTop;
      const px = Math.max(0, Math.round(overlap));
      document.documentElement.style.setProperty("--kb-offset", `${px}px`);
    };
    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);
    handler();
    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
      document.documentElement.style.removeProperty("--kb-offset");
    };
  }, []);

  // textarea 拿到 focus → 100ms 後 scrollIntoView，讓 input 保證進 viewport
  const handleFocus = () => {
    if (typeof window === "undefined") return;
    setTimeout(() => {
      formRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    }, 250);
  };

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
      ref={formRef}
      onSubmit={handleSubmit}
      // 底部 padding：max(基本 1.25rem, safe-area+0.5rem, keyboard 高度)
      // --kb-offset 由 visualViewport useEffect 動態更新、鍵盤彈出時把 input 頂上去
      className="shrink-0 px-3 pt-3 border-t border-white/5 bg-bg-deep/92 backdrop-blur-md"
      style={{
        paddingBottom:
          "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.5rem), var(--kb-offset, 0px))",
      }}
    >
      <div className="flex items-end gap-2 max-w-md mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
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
