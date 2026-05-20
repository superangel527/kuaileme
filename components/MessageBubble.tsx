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
}: {
  char: Character;
  text: string;
  ts: Date;
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
        <div className="inline-block max-w-[92%] rounded-2xl rounded-tl-md bg-white/[0.06] px-3.5 py-2.5 text-[15px] leading-[1.55] text-white/95 border border-white/[0.06]">
          {text}
        </div>
      </div>
    </div>
  );
}
