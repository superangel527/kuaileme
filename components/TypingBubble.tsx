import type { Character } from "@/lib/characters";
import Avatar from "./Avatar";

export default function TypingBubble({ char }: { char: Character }) {
  return (
    <div className="flex items-start gap-2.5 animate-fade-in-up">
      <Avatar char={char} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[13px] font-medium text-white/70 truncate">
            {char.name}
          </span>
          <span className="text-[11px] text-white/30">正在輸入</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-bg-card/70 px-3.5 py-3 border border-white/5">
          <span
            className="block w-1.5 h-1.5 rounded-full bg-white/70 animate-blink-dot"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="block w-1.5 h-1.5 rounded-full bg-white/70 animate-blink-dot"
            style={{ animationDelay: "180ms" }}
          />
          <span
            className="block w-1.5 h-1.5 rounded-full bg-white/70 animate-blink-dot"
            style={{ animationDelay: "360ms" }}
          />
        </div>
      </div>
    </div>
  );
}
