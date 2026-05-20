import type { Character } from "@/lib/characters";

export default function Avatar({
  char,
  size = 36,
  ring = false,
}: {
  char: Character;
  size?: number;
  ring?: boolean;
}) {
  const [c1, c2] = char.gradient;
  const isEmoji = !!char.emoji;
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
      className={`shrink-0 rounded-full flex items-center justify-center text-white font-semibold ${
        ring ? "ring-2 ring-bg-deep" : "shadow-[0_0_12px_rgba(255,95,162,0.25)]"
      }`}
    >
      <span
        style={{
          fontSize: isEmoji ? size * 0.55 : size * 0.42,
          lineHeight: 1,
          filter: isEmoji ? "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" : undefined,
        }}
      >
        {char.emoji ?? char.initial}
      </span>
    </div>
  );
}
