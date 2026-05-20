export default function UserReply({
  nickname,
  text,
}: {
  nickname: string;
  text: string;
}) {
  return (
    <div className="flex justify-center py-2 animate-fade-in-up">
      <div className="inline-block max-w-[92%] px-4 py-2.5 rounded-2xl bg-gradient-to-br from-glow-pink/[0.15] via-glow-violet/[0.15] to-glow-cyan/[0.10] border border-white/[0.14] shadow-[0_0_18px_-4px_rgba(255,95,162,0.3)]">
        <div className="text-[11px] text-white/55 mb-0.5">
          <span className="text-white/85 font-medium">{nickname}</span>{" "}
          丟了一句話進聊天室
        </div>
        <div className="text-[14.5px] text-white font-medium leading-snug">
          『{text}』
        </div>
      </div>
    </div>
  );
}
