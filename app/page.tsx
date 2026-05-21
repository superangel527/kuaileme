"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomGlow from "@/components/BottomGlow";

type IconProps = React.SVGProps<SVGSVGElement>;

const ArrowRightIcon = (p: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <polyline points="9 6 15 12 9 18" />
  </svg>
);

// 偷聽到的聊天室碎片 — 飄在 H1 周圍，營造「你不在但他們在聊你」的感覺
const GHOST_SNIPPETS = [
  "她最近還好嗎",
  "我感覺她真的撐很久了",
  "她又這樣了",
  "靠 心疼",
  "她是不是其實很累",
  "她應該不知道有人在偷偷想她",
  "我覺得她超耐看",
  "她那種笑藏了很多",
  "她不是不夠好",
  "+1 我也覺得",
  "她那種懂事 是被逼的吧",
  "突然有點心疼她",
];

const TRUST_LINES = [
  { icon: "♡", text: "有些人覺得你很可愛", color: "text-glow-pink" },
  { icon: "❤︎", text: "有些人其實很心疼你", color: "text-glow-violet" },
  { icon: "✦", text: "也有人偷偷注意你很久了", color: "text-glow-cyan" },
];

const QUICK_TOPICS = [
  { emoji: "💤", text: "我最近真的很累" },
  { emoji: "💔", text: "我是不是不值得被愛" },
  { emoji: "🍰", text: "我會不會很胖" },
  { emoji: "🪞", text: "我看起來會老嗎？" },
];

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [nickname, setNickname] = useState("");
  const [going, setGoing] = useState(false);
  // 兩個聊天室殘影（mount 後才產，避免 hydration mismatch）
  const [ghosts, setGhosts] = useState<{ text: string }[]>([]);

  useEffect(() => {
    const shuffled = [...GHOST_SNIPPETS].sort(() => Math.random() - 0.5);
    setGhosts([{ text: shuffled[0] }, { text: shuffled[1] }]);
  }, []);

  const canEnter =
    topic.trim().length > 0 && nickname.trim().length > 0 && !going;

  const handleEnter = () => {
    if (!canEnter) return;
    setGoing(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("kl_topic", topic.trim());
      localStorage.setItem("kl_nickname", nickname.trim());
      localStorage.setItem("kl_started_at", String(Date.now()));
      localStorage.removeItem("kl_paid_at");
      localStorage.removeItem("kl_scenario");
    }
    router.push("/pay");
  };

  return (
    <main className="relative min-h-screen-safe px-5 pt-4 pb-8 overflow-hidden">
      <BottomGlow />

      <div className="max-w-md mx-auto">
        {/* Logo — 放大 1.5x */}
        <div className="flex justify-center pt-2 pb-2">
          <img
            src="/logo.png"
            alt="誇了嗎"
            className="w-[120px] h-auto drop-shadow-[0_8px_24px_rgba(255,95,162,0.35)]"
          />
        </div>

        {/* H1 + 殘影 — 模糊到像背景 */}
        <div className="relative pt-6 pb-1">
          {/* 兩個 ghost 訊息變成「聊天室背景殘影」— 重模糊、極淡 */}
          {ghosts[0] && (
            <div
              aria-hidden
              className="absolute -top-1 left-2 max-w-[170px] select-none pointer-events-none"
              style={{
                opacity: 0.18,
                filter: "blur(3px)",
              }}
            >
              <div className="text-[13px] text-white italic leading-snug">
                「{ghosts[0].text}」
              </div>
            </div>
          )}
          {ghosts[1] && (
            <div
              aria-hidden
              className="absolute top-2 right-2 max-w-[170px] text-right select-none pointer-events-none"
              style={{
                opacity: 0.16,
                filter: "blur(3px)",
              }}
            >
              <div className="text-[13px] text-white italic leading-snug">
                「{ghosts[1].text}」
              </div>
            </div>
          )}

          <h1 className="text-center text-[26px] sm:text-[30px] leading-[1.3] font-bold tracking-tight">
            你剛剛那句話，
            <br />
            已經被
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan">
              聊天室看見了
            </span>
            。
          </h1>

          {/* 副標 — 偷看感 */}
          <p className="mt-4 text-center text-[14px] text-white/70 italic leading-relaxed">
            <span className="text-white/90">有人好像很在意你剛剛那句話。</span>
          </p>
        </div>

        {/* 三行 whisper（從橫排 pill 改成直排 whisper，更像偷聽到的） */}
        <div className="mt-6 flex flex-col gap-1.5 items-center">
          {TRUST_LINES.map((t) => (
            <div
              key={t.text}
              className="inline-flex items-center gap-2 text-[12.5px] text-white/65"
            >
              <span className={`${t.color} text-[14px]`}>{t.icon}</span>
              {t.text}
            </div>
          ))}
        </div>

        {/* 主卡片：話題 + 暱稱 — 加實心感讓使用者明顯知道這是「動作區」 */}
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] p-4 space-y-5 shadow-[0_8px_30px_rgba(139,92,246,0.12)]">
          {/* 話題 — 步驟 1 */}
          <div>
            <label className="flex items-center gap-2 text-[14px] text-white font-medium mb-2.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-glow-pink to-glow-violet text-[11px] font-semibold">
                1
              </span>
              丟一句話，看看他們會怎麼聊你
            </label>
            <div className="relative">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 30))}
                placeholder="點下面快速心情、或自己打一句…"
                rows={3}
                maxLength={30}
                className="w-full resize-none rounded-2xl bg-bg-deep/90 border-2 border-glow-pink/40 px-4 py-3 text-[15px] leading-relaxed text-white placeholder-white/40 focus:outline-none focus:border-glow-pink focus:bg-bg-deep transition shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]"
              />
              <span className="absolute right-3 bottom-2 text-[10.5px] text-white/35">
                {topic.length}/30
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {QUICK_TOPICS.map((q) => (
                <button
                  key={q.text}
                  type="button"
                  onClick={() => setTopic(q.text)}
                  className="text-[12.5px] px-2.5 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] active:scale-[0.97] border border-white/[0.1] text-white/85 transition inline-flex items-center gap-1"
                >
                  <span>{q.emoji}</span>
                  {q.text}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/[0.08]" />

          {/* 暱稱 — 步驟 2 */}
          <div>
            <label className="flex items-center gap-2 text-[14px] text-white font-medium mb-2.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-glow-violet to-glow-cyan text-[11px] font-semibold">
                2
              </span>
              聊天室裡，大家要怎麼叫你？
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 8))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEnter();
                }}
                placeholder="例如:小星、Emma、Angel、A…"
                maxLength={8}
                autoComplete="off"
                enterKeyHint="go"
                className="w-full rounded-2xl bg-bg-deep/90 border-2 border-glow-pink/40 px-4 py-3 text-[15px] text-white placeholder-white/40 focus:outline-none focus:border-glow-pink focus:bg-bg-deep transition shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-white/35">
                {nickname.length}/8
              </span>
            </div>
          </div>
        </div>

        {/* 主 CTA */}
        <button
          onClick={handleEnter}
          disabled={!canEnter}
          className="mt-5 w-full py-5 rounded-2xl text-white text-[18px] font-semibold tracking-wide bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan shadow-[0_10px_40px_-8px_rgba(255,95,162,0.55)] active:scale-[0.98] disabled:opacity-35 disabled:shadow-none transition flex items-center justify-center gap-3"
        >
          <span className="flex-1 text-center pl-7">
            {going ? "正在進入聊天室…" : "NT$19 看他們怎麼聊你"}
          </span>
          {!going && <ArrowRightIcon className="w-5 h-5 mr-2" />}
        </button>

        {/* 安全 pill */}
        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1 text-[11.5px] text-white/55">
            💬 即時聊天室
          </span>
          <span className="inline-flex items-center gap-1 text-[11.5px] text-white/55">
            🔒 匿名模式
          </span>
          <span className="inline-flex items-center gap-1 text-[11.5px] text-white/55">
            🛡 不會留下紀錄
          </span>
        </div>

        {/* 匿名 footer 卡片 — 兩行低語 */}
        <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3.5 text-center">
          <div className="inline-flex items-center gap-1.5 text-[12.5px] text-white/75 font-medium">
            🔒 放心，這裡不會留下紀錄
          </div>
          <p className="mt-1.5 text-[12px] text-white/45">
            現在，你是聊天室裡的主角
          </p>
        </div>

        {/* 法律連結 + 安心專線（情緒類產品必要） */}
        <div className="mt-6 text-center text-[11.5px] text-white/40 space-y-2">
          <p className="space-x-2">
            <a
              href="/privacy"
              className="hover:text-white/75 underline-offset-4 hover:underline"
            >
              隱私權政策
            </a>
            <span className="text-white/25">·</span>
            <a
              href="/terms"
              className="hover:text-white/75 underline-offset-4 hover:underline"
            >
              服務條款
            </a>
            <span className="text-white/25">·</span>
            <a
              href="/disclaimer"
              className="hover:text-white/75 underline-offset-4 hover:underline"
            >
              免責聲明
            </a>
          </p>
          <p className="text-[11px] text-white/35 leading-relaxed">
            🫂 衛福部安心專線{" "}
            <a
              href="tel:1925"
              className="text-white/60 font-medium hover:text-white/90"
            >
              1925
            </a>{" "}
            ・ 自殺防治專線{" "}
            <a
              href="tel:1995"
              className="text-white/60 font-medium hover:text-white/90"
            >
              1995
            </a>
            <br />
            <span className="text-white/25">（24 小時免費、有人陪你說話）</span>
          </p>
        </div>
      </div>
    </main>
  );
}
