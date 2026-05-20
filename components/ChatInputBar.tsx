"use client";

type Mode = "passive" | "locked";

export default function ChatInputBar({
  mode,
  onUnlock,
}: {
  mode: Mode;
  onUnlock?: () => void;
}) {
  if (mode === "locked") {
    return (
      <div className="shrink-0 px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-white/5 bg-bg-deep/85 backdrop-blur-md">
        <button
          onClick={onUnlock}
          className="group w-full flex items-center gap-3 pl-4 pr-3 py-3 rounded-full bg-gradient-to-r from-glow-pink/20 via-glow-violet/20 to-glow-cyan/20 border border-white/10 hover:border-white/20 active:scale-[0.99] transition"
        >
          <span className="text-[15px]">🔒</span>
          <span className="flex-1 text-left text-[14.5px] text-white/85 font-medium">
            解鎖繼續聊天
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan text-white text-[12.5px] font-semibold shadow-[0_4px_18px_-4px_rgba(255,95,162,0.6)]">
            NT$19
          </span>
        </button>
      </div>
    );
  }

  // passive — 聊天室不開放發言、被動觀看
  return (
    <div className="shrink-0 px-4 pt-2 pb-[max(0.85rem,env(safe-area-inset-bottom))] border-t border-white/5 bg-bg-deep/85 backdrop-blur-md">
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-white/[0.03] border border-white/[0.06]">
        <span className="text-[13.5px] text-white/55 select-none text-center leading-snug">
          大部分時間，你只需要靜靜看著他們聊你。
        </span>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-white/35 leading-snug">
        偶爾，會有人突然想聽你說一句話。
      </p>
    </div>
  );
}
