"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BottomGlow from "@/components/BottomGlow";
import { pickRandomCharacters, type Character } from "@/lib/characters";
import Avatar from "@/components/Avatar";

const TEASER_LINES = [
  "她是不是根本不知道自己很有魅力？",
  "我覺得她講話超有感覺欸",
  "她那種冷冷的反而最致命",
  "我會想一直偷看她限動",
];

const LOADING_STEPS = [
  "聊天室開始注意到你了…",
  "他們正在討論你剛剛那句話…",
  "有人已經想誇你了…",
];

export default function PayPage() {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [nickname, setNickname] = useState("");
  // 所有隨機都搬到 useEffect — 避免 SSR/client mismatch
  const [previewChars, setPreviewChars] = useState<Character[]>([]);
  const [onlineCount, setOnlineCount] = useState(2000);
  // 付款 loading 過場的 timeouts — unmount 時要清掉
  const payTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 元件卸載時清掉所有 pending timeouts
  useEffect(() => {
    return () => {
      payTimeoutsRef.current.forEach(clearTimeout);
      payTimeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const n = localStorage.getItem("kl_nickname") || "";
      if (!n) {
        // 沒暱稱不能付款 — 踢回首頁
        router.replace("/");
        return;
      }
      setNickname(n);
    }
    setPreviewChars(pickRandomCharacters(4));
    setOnlineCount(1800 + Math.floor(Math.random() * 600));
  }, [router]);

  const handlePay = () => {
    if (paying) return;
    setPaying(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("kl_paid_at", String(Date.now()));
      // 趁 loading 期間呼叫 AI 定調 + 生成爆發期/收尾訊息
      const topic = localStorage.getItem("kl_topic") || "";
      const nickname = localStorage.getItem("kl_nickname") || "";
      // 清掉上一場的 prepared（避免吃舊資料）
      localStorage.removeItem("kl_prepared");
      localStorage.removeItem("kl_scenario");
      if (topic) {
        fetch("/api/prepare-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: topic, nickname }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.topic) {
              localStorage.setItem("kl_prepared", JSON.stringify(d));
              // 保留 kl_scenario 給 chat 頁快速讀取
              localStorage.setItem("kl_scenario", d.topic);
            }
          })
          .catch(() => {
            /* chat 頁有 keyword fallback */
          });
      }
    }
    // loading 拉長到 3.5s — 給 AI 多一點時間回應、但太久也直接進
    payTimeoutsRef.current.push(setTimeout(() => setStepIdx(1), 900));
    payTimeoutsRef.current.push(setTimeout(() => setStepIdx(2), 2000));
    payTimeoutsRef.current.push(
      setTimeout(() => router.replace("/chat"), 3500)
    );
  };

  if (paying) {
    return (
      <main className="relative min-h-screen-safe flex flex-col items-center justify-center px-6">
        <BottomGlow />
        <div className="w-full max-w-sm text-center">
          <div className="relative mx-auto w-36 h-36 mb-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-glow-pink via-glow-violet to-glow-cyan opacity-70 blur-2xl animate-pulse-glow" />
            <img
              src="/logo.png"
              alt="誇了嗎"
              className="relative w-32 h-auto animate-drift"
            />
          </div>
          <div className="space-y-3">
            {LOADING_STEPS.map((s, i) => (
              <p
                key={i}
                className={`text-[16px] transition-all duration-500 ${
                  i <= stepIdx
                    ? "text-white opacity-100 translate-y-0"
                    : "text-white/25 opacity-40 translate-y-1"
                }`}
              >
                {s}
              </p>
            ))}
          </div>
          <div className="mt-10 inline-flex items-start gap-1.5 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-left max-w-[280px]">
            <span className="text-[12px] mt-px">💡</span>
            <span className="text-[11.5px] text-white/55 leading-relaxed">
              小提醒：聊天室只會討論你、不會直接跟你說話喔
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen-safe flex flex-col px-5 pt-6 pb-8 overflow-hidden">
      <BottomGlow />

      <button
        onClick={() => router.back()}
        aria-label="返回"
        className="self-start text-white/55 hover:text-white text-[14px] flex items-center gap-1 -ml-1 mb-3"
      >
        ‹ 返回
      </button>

      <div className="max-w-md mx-auto w-full flex flex-col">
        {/* Logo */}
        <div className="flex justify-center pt-1 pb-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-glow-pink/35 via-glow-violet/35 to-glow-cyan/30 blur-2xl scale-110" />
            <img
              src="/logo.png"
              alt="誇了嗎"
              className="relative w-[110px] h-auto drop-shadow-[0_8px_30px_rgba(255,95,162,0.3)]"
            />
          </div>
        </div>

        {/* 訴求 */}
        <h2 className="text-center text-[22px] font-bold leading-snug">
          100 個人
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan">
            {" "}已經在聊天室
          </span>
          <br />
          等著討論
          <span className="ml-1 text-white">{nickname || "你"}</span>
        </h2>

        {/* 偷看版預覽 — 模糊 */}
        <div className="mt-5 relative rounded-2xl bg-bg-card/60 border border-white/[0.08] overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-white/5 flex items-center justify-between">
            <div className="text-[12.5px] font-medium text-white/85">
              #誇了嗎
            </div>
            <div className="text-[10.5px] text-white/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
              {onlineCount} 人在線
            </div>
          </div>
          <div className="px-4 py-3 space-y-2.5 max-h-[200px] overflow-hidden">
            {previewChars.map((c, i) => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar char={c} size={28} />
                <div className="flex-1">
                  <div className="text-[11px] text-white/70 mb-0.5">
                    {c.name}
                  </div>
                  <div className="inline-block rounded-xl bg-white/[0.06] px-3 py-1.5 text-[13px] text-white/85 filter blur-[5px] select-none">
                    {TEASER_LINES[i % TEASER_LINES.length]}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* 漸層覆蓋 + 鎖 */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-bg-deep/95 via-bg-deep/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11.5px] text-white/85">
              🔒 付款後，才能偷偷看他們怎麼聊你
            </div>
          </div>
        </div>

        {/* 你會解鎖 */}
        <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="text-[11.5px] text-white/50 uppercase tracking-wider mb-2.5">
            你會解鎖
          </div>
          <ul className="space-y-2 text-[13.5px] text-white/85">
            <li className="flex items-center gap-2.5">
              <span className="text-glow-pink">♥</span> 100+ 個人圍著
              <span className="text-white">{nickname || "你"}</span> 暴風誇 3 分鐘
            </li>
            <li className="flex items-center gap-2.5">
              <span className="text-glow-violet">💬</span> 隨時打字告訴大家心情・他們會接話
            </li>
            <li className="flex items-center gap-2.5">
              <span className="text-glow-cyan">🔒</span> 100% 匿名・不會留下紀錄
            </li>
          </ul>
        </div>

        {/* 付款按鈕 */}
        <button
          onClick={handlePay}
          disabled={paying}
          className="mt-6 w-full py-5 rounded-2xl text-white text-[19px] font-semibold tracking-wide bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan shadow-[0_12px_40px_-8px_rgba(255,95,162,0.6)] active:scale-[0.98] disabled:opacity-60 transition flex items-center justify-center gap-3"
        >
          NT$19 偷偷進聊天室
        </button>

        <p className="mt-3 text-center text-[11px] text-white/40">
          一次性付款・即時進入・無自動續訂
        </p>
      </div>
    </main>
  );
}
