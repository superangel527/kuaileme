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

// 付款過場文案池（定版 5 句、隨機抽 4 句）
const LOADING_TEXT_POOL = [
  "聊天室開始注意到你了…",
  "有人已經開始聊你剛剛那句話",
  "聊天室裡，好像有人在等你",
  "有人正在替你說話",
  "你剛剛那句話，被聊天室看見了",
];

// 卡片固定 icon 順序（typing dots 永遠在第 1 張）
const LOADING_ICONS = ["💬", "♥", "✨", "💭"];

// 背景殘影飄過的聊天室訊息片段
const GHOST_SNIPPETS = [
  "她又這樣了",
  "我超心疼她",
  "她是不是還好",
  "+1 真的",
  "靠 完全懂",
  "她該不會在哭吧",
  "我有點放不下她",
  "她那種感覺 真的少見",
  "她最近真的撐很久",
  "我覺得她很有事",
];

export default function PayPage() {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [stepIdx, setStepIdx] = useState(0); // 哪些卡片已亮起（>= idx 的會顯示）
  const [progress, setProgress] = useState(0); // 進度條 0-100
  const [nickname, setNickname] = useState("");
  // 所有隨機都搬到 useEffect — 避免 SSR/client mismatch
  const [previewChars, setPreviewChars] = useState<Character[]>([]);
  const [onlineCount, setOnlineCount] = useState(2000);
  // 付款過場的 4 句文案（從 5 句池隨機抽）
  const [loadingTexts, setLoadingTexts] = useState<string[]>(
    LOADING_TEXT_POOL.slice(0, 4)
  );
  // 背景殘影：6 個訊息片段、隨機位置 + 動畫 delay
  const [ghosts, setGhosts] = useState<
    Array<{ text: string; left: number; top: number; delay: number; dur: number }>
  >([]);
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
    // 從 5 句池隨機抽 4 句
    setLoadingTexts(
      [...LOADING_TEXT_POOL].sort(() => Math.random() - 0.5).slice(0, 4)
    );
    // 生 8 個殘影 — 隨機散落、不同延遲與週期
    const shuffled = [...GHOST_SNIPPETS].sort(() => Math.random() - 0.5);
    setGhosts(
      Array.from({ length: 8 }, (_, i) => ({
        text: shuffled[i % shuffled.length],
        left: 5 + Math.random() * 90, // 5-95% 寬
        top: 8 + Math.random() * 78, // 8-86% 高
        delay: Math.random() * 6, // 0-6s 延遲
        dur: 9 + Math.random() * 6, // 9-15s 動畫週期
      }))
    );
  }, [router]);

  // 付款模式開關：
  //   NEXT_PUBLIC_PAYMENT_MODE=payuni → 真實 PayUni（PayUni 審核通過後才設）
  //   NEXT_PUBLIC_PAYMENT_MODE=fake 或沒設 → 假流程（loading 後直接進 chat）
  const paymentMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || "fake";

  const handlePay = async () => {
    if (paying) return;
    setPaying(true);

    const topic =
      typeof window !== "undefined" ? localStorage.getItem("kl_topic") || "" : "";
    const nick =
      typeof window !== "undefined"
        ? localStorage.getItem("kl_nickname") || ""
        : "";

    // 清掉上一場資料
    if (typeof window !== "undefined") {
      localStorage.removeItem("kl_prepared");
      localStorage.removeItem("kl_scenario");
      localStorage.removeItem("kl_paid_at");
    }

    // 先呼叫 AI prepare-session — 保留 promise、等下要 await
    // (AI 生 47 句要 5-8 秒、必須等回來才能跳 chat、不然會 fallback 池子)
    const aiPromise: Promise<void> = topic
      ? fetch("/api/prepare-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: topic, nickname: nick }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.topic && typeof window !== "undefined") {
              localStorage.setItem("kl_prepared", JSON.stringify(d));
              localStorage.setItem("kl_scenario", d.topic);
            }
          })
          .catch(() => {})
      : Promise.resolve();

    // 走真實 PayUni 流程
    if (paymentMode === "payuni") {
      try {
        const resp = await fetch("/api/payuni/create-order", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ nickname: nick, topic }),
        });
        const data = await resp.json();

        if (!data?.ok || !data?.actionUrl || !data?.fields) {
          throw new Error(data?.error || "建單失敗");
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.actionUrl;
        form.style.display = "none";
        for (const [key, value] of Object.entries(data.fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      } catch (e) {
        alert(
          "付款建單失敗：" +
            (e instanceof Error ? e.message : String(e)) +
            "\n請通知客服或稍後再試。"
        );
        setPaying(false);
        return;
      }
    }

    // 假流程：進度條 + 卡片動畫 + 等 AI 回來才跳 /chat
    if (typeof window !== "undefined") {
      localStorage.setItem("kl_paid_at", String(Date.now()));
    }

    // 進度條：先衝 15%（給使用者立刻看到啟動感），然後依卡片節奏推進
    setProgress(15);
    // 卡片依序亮起 + 進度條前進（第一張在 stepIdx=0 已亮、從第 2 張起）
    payTimeoutsRef.current.push(
      setTimeout(() => {
        setStepIdx(1);
        setProgress(38);
      }, 1100)
    );
    payTimeoutsRef.current.push(
      setTimeout(() => {
        setStepIdx(2);
        setProgress(58);
      }, 2300)
    );
    payTimeoutsRef.current.push(
      setTimeout(() => {
        setStepIdx(3);
        setProgress(76);
      }, 3500)
    );
    // 第 4 張卡之後、進度條繼續慢慢爬到 92%（在等 AI）
    payTimeoutsRef.current.push(setTimeout(() => setProgress(86), 5000));
    payTimeoutsRef.current.push(setTimeout(() => setProgress(92), 7000));

    // 至少 4.5 秒（給卡片動畫跑完）
    const minLoading = new Promise<void>((resolve) => {
      payTimeoutsRef.current.push(setTimeout(resolve, 4500));
    });
    // AI 最多等 9 秒、超時就用安全句 fallback
    const aiCapped = Promise.race([
      aiPromise,
      new Promise<void>((resolve) => {
        payTimeoutsRef.current.push(setTimeout(resolve, 9000));
      }),
    ]);
    // 兩個都完成 → 進度條衝 100% → 等 transition 結束才跳
    await Promise.all([aiCapped, minLoading]);
    setProgress(100);
    await new Promise<void>((resolve) => {
      payTimeoutsRef.current.push(setTimeout(resolve, 450));
    });
    router.replace("/chat");
  };

  if (paying) {
    return (
      <main className="relative min-h-screen-safe flex flex-col px-5 pt-7 pb-5 overflow-hidden">
        <BottomGlow />
        {/* 背景殘影：聊天室訊息片段慢慢飄上 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {ghosts.map((g, i) => (
            <div
              key={i}
              className="absolute ghost-float text-[12.5px] text-white italic select-none whitespace-nowrap"
              style={{
                left: `${g.left}%`,
                top: `${g.top}%`,
                filter: "blur(3px)",
                animationDuration: `${g.dur}s`,
                animationDelay: `${g.delay}s`,
              }}
            >
              「{g.text}」
            </div>
          ))}
        </div>
        <div className="relative flex-1 flex flex-col max-w-md mx-auto w-full z-10">
          {/* 大標 */}
          <h1 className="text-[24px] sm:text-[26px] font-bold leading-tight">
            聊天室正在
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan">
              注意到你了
            </span>
            …
          </h1>
          <p className="mt-1.5 text-[13px] text-white/55 flex items-center gap-1.5">
            你的心情已經被丟進聊天室 <span className="text-glow-pink">💗</span>
          </p>

          {/* 4 張預告卡 — 左右交錯堆疊（內容從 5 句池隨機抽 4 句） */}
          <div className="mt-7 flex flex-col gap-3">
            {loadingTexts.map((text, i) => {
              const visible = i <= stepIdx;
              const alignClass = i % 2 === 0 ? "self-start" : "self-end";
              const icon = LOADING_ICONS[i % LOADING_ICONS.length];
              const isFirst = i === 0; // 第一張用 typing dots
              return (
                <div
                  key={i}
                  className={`${alignClass} flex items-center gap-2.5 pl-2 pr-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.09] backdrop-blur-sm max-w-[82%] shadow-[0_8px_24px_-12px_rgba(139,92,246,0.4)]`}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible
                      ? "translateY(0) scale(1)"
                      : "translateY(10px) scale(0.96)",
                    transition: "opacity 500ms ease-out, transform 500ms ease-out",
                  }}
                >
                  <span className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-glow-pink/45 via-glow-violet/45 to-glow-cyan/35 flex items-center justify-center text-[15px]">
                    {icon}
                  </span>
                  <span className="text-[13.5px] text-white/90 flex-1 leading-snug">
                    {text}
                  </span>
                  {isFirst && (
                    <span className="flex gap-[3px] pr-0.5">
                      <span className="w-[3px] h-[3px] rounded-full bg-white/70 animate-blink-dot" />
                      <span
                        className="w-[3px] h-[3px] rounded-full bg-white/70 animate-blink-dot"
                        style={{ animationDelay: "200ms" }}
                      />
                      <span
                        className="w-[3px] h-[3px] rounded-full bg-white/70 animate-blink-dot"
                        style={{ animationDelay: "400ms" }}
                      />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 中央 Logo — 飄浮發光 */}
          <div className="flex-1 flex items-center justify-center my-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-glow-pink/45 via-glow-violet/45 to-glow-cyan/35 blur-2xl scale-125 animate-pulse-glow" />
              <img
                src="/logo.png"
                alt="誇了嗎"
                className="relative w-28 h-auto animate-drift"
              />
            </div>
          </div>

          {/* 進度條 */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-[12px] text-white/60 mb-2 px-0.5">
              <span>正在進入聊天室…</span>
              <span className="flex gap-[3px] items-end">
                <span className="w-[3px] h-[3px] rounded-full bg-white/50 animate-blink-dot" />
                <span
                  className="w-[3px] h-[3px] rounded-full bg-white/50 animate-blink-dot"
                  style={{ animationDelay: "200ms" }}
                />
                <span
                  className="w-[3px] h-[3px] rounded-full bg-white/50 animate-blink-dot"
                  style={{ animationDelay: "400ms" }}
                />
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan shadow-[0_0_12px_rgba(255,95,162,0.6)]"
                style={{
                  width: `${progress}%`,
                  transition: "width 600ms ease-out",
                }}
              />
            </div>
          </div>

          {/* 小提醒 */}
          <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[13px] mt-px">💡</span>
            <span className="text-[11.5px] text-white/55 leading-relaxed">
              小提醒：聊天室只會討論你、不會直接跟你說話喔！
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
