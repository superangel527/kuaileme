import BottomGlow from "@/components/BottomGlow";

export default function Loading() {
  return (
    <main className="relative min-h-screen-safe flex flex-col items-center justify-center px-6">
      <BottomGlow />
      <div className="relative w-36 h-36 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-glow-pink via-glow-violet to-glow-cyan opacity-60 blur-2xl animate-pulse-glow" />
        <img
          src="/logo.png"
          alt="誇了嗎"
          className="relative w-32 h-auto animate-drift"
        />
      </div>
      <div className="mt-8 flex items-center gap-1.5">
        <span
          className="block w-2 h-2 rounded-full bg-white/70 animate-blink-dot"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="block w-2 h-2 rounded-full bg-white/70 animate-blink-dot"
          style={{ animationDelay: "180ms" }}
        />
        <span
          className="block w-2 h-2 rounded-full bg-white/70 animate-blink-dot"
          style={{ animationDelay: "360ms" }}
        />
      </div>
    </main>
  );
}
