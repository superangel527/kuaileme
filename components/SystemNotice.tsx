export default function SystemNotice({ text }: { text: string }) {
  return (
    <div className="text-center py-1 animate-fade-in-up">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-white/35">
        <span className="w-1 h-1 rounded-full bg-glow-violet" />
        {text}
      </span>
    </div>
  );
}
