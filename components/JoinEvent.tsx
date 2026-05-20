import type { Character } from "@/lib/characters";

function fmt(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

const VERBS = ["加入了聊天", "上線了", "進入聊天室"];

export default function JoinEvent({
  char,
  ts,
  verbIndex = 0,
}: {
  char: Character;
  ts: Date;
  verbIndex?: number;
}) {
  const verb = VERBS[verbIndex % VERBS.length];
  return (
    <div className="text-center py-0.5 animate-fade-in-up">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-white/30">
        <span
          className="w-1 h-1 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${char.gradient[0]}, ${char.gradient[1]})`,
          }}
        />
        <span>
          <span className="text-white/55">{char.name}</span> {verb} · {fmt(ts)}
        </span>
      </span>
    </div>
  );
}
