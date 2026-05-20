import type { Character } from "@/lib/characters";
import Avatar from "./Avatar";

function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function MessageBubble({
  char,
  text,
  ts,
  likeCount,
}: {
  char: Character;
  text: string;
  ts: Date;
  likeCount?: number;
}) {
  return (
    <div className="flex items-start gap-2.5 animate-fade-in-up">
      <Avatar char={char} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-[13.5px] font-medium text-white/95">
            {char.name}
          </span>
          <span className="text-[10.5px] text-white/30 truncate">
            {char.identity}
          </span>
          <span className="ml-auto text-[10.5px] text-white/25 tabular-nums pl-2 shrink-0">
            {formatTime(ts)}
          </span>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="inline-block max-w-[88%] rounded-2xl rounded-tl-md bg-white/[0.06] px-3.5 py-2.5 text-[15px] leading-[1.55] text-white/95 border border-white/[0.06]">
            {text}
          </div>
          {likeCount !== undefined && likeCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-glow-pink/12 border border-glow-pink/20 text-[11px] text-glow-pink tabular-nums shrink-0 transition-all">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                <path d="M12 21s-7-4.35-7-10a4 4 0 018-1 4 4 0 018 1c0 5.65-7 10-7 10z" />
              </svg>
              {likeCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
