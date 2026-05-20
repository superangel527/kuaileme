"use client";

import { useState, type FormEvent } from "react";

export default function CueCard({
  question,
  answered,
  answer,
  onAnswer,
}: {
  question: string;
  answered: boolean;
  answer?: string;
  onAnswer: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (submitting || answered) return;
    const t = value.trim();
    if (!t) return;
    setSubmitting(true);
    onAnswer(t);
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-glow-pink/[0.15] via-glow-violet/[0.15] to-glow-cyan/[0.10] border border-white/15 p-4 my-1 shadow-[0_0_30px_-8px_rgba(255,95,162,0.45)] animate-fade-in-up overflow-hidden">
      {/* 微光裝飾 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1 opacity-50 blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(255,95,162,0.35), transparent 70%)",
        }}
      />

      <div className="relative">
        {/* badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan text-white text-[10.5px] font-semibold mb-2.5 shadow-[0_4px_12px_-2px_rgba(255,95,162,0.5)]">
          ✨ 有人正在等你回一句
        </div>

        {/* 問題 */}
        <p className="text-[15.5px] text-white font-medium leading-snug mb-3">
          {question}
        </p>

        {answered ? (
          <div className="text-[12px] text-glow-pink/85 inline-flex items-center gap-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-3.5 h-3.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            已丟進聊天室
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, 40))}
              maxLength={40}
              autoComplete="off"
              enterKeyHint="send"
              placeholder="只回一句就好…"
              className="w-full rounded-xl bg-bg-deep/70 border-2 border-glow-pink/45 px-3.5 py-2.5 text-[14.5px] text-white placeholder-white/40 focus:outline-none focus:border-glow-pink transition"
            />
            <button
              type="submit"
              disabled={!value.trim() || submitting}
              className="w-full py-2.5 rounded-xl text-white text-[14.5px] font-medium bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan shadow-[0_6px_18px_-4px_rgba(255,95,162,0.55)] disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition"
            >
              {submitting ? "正在丟進去…" : "丟進聊天室"}
            </button>
          </form>
        )}
      </div>

      {/* 已回覆顯示原本回答（隱藏） */}
      {answered && answer && (
        <div className="sr-only">已回覆內容：{answer}</div>
      )}
    </div>
  );
}
