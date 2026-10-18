"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomGlow from "@/components/BottomGlow";
import MicButton from "@/components/MicButton";

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

// 付款失敗時、被 /api/payuni/return 踢回首頁、URL 帶 ?error=...
// 不同 error 給不同說明 + 同樣指向客服
type PayErrorInfo = { title: string; detail: string };
function parsePayError(search: string): PayErrorInfo | null {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const err = params.get("error");
  if (!err) return null;
  const status = params.get("status") || "";
  const msg = params.get("msg") || "";

  if (err === "payment_invalid") {
    return {
      title: "付款驗證失敗",
      detail: "PayUni 回傳的簽章對不上、付款未完成。如果你的卡或 Apple Pay 顯示已扣款、通常 7 天內銀行會自動取消，不會真的扣款。",
    };
  }
  if (err === "payment_failed") {
    return {
      title: "付款未完成",
      detail: `付款流程沒走完（${status || "unknown"}${msg ? "・" + msg : ""}）。如果你的卡或 Apple Pay 顯示已扣款、通常 7 天內銀行會自動取消。`,
    };
  }
  if (err === "payuni_not_configured" || err === "bad_response") {
    return {
      title: "系統設定問題",
      detail: "付款服務暫時無法使用、請稍後再試或聯絡客服。",
    };
  }
  return null;
}

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [nickname, setNickname] = useState("");
  const [going, setGoing] = useState(false);
  // 兩個聊天室殘影（mount 後才產，避免 hydration mismatch）
  const [ghosts, setGhosts] = useState<{ text: string }[]>([]);
  // 付款被踢回的錯誤橫幅（從 URL 讀 ?error=...）
  const [payError, setPayError] = useState<PayErrorInfo | null>(null);

  useEffect(() => {
    const shuffled = [...GHOST_SNIPPETS].sort(() => Math.random() - 0.5);
    setGhosts([{ text: shuffled[0] }, { text: shuffled[1] }]);
    // 讀 URL ?error=...、有的話顯示客服橫幅；讀完後 replaceState 清掉 query
    // 避免使用者重整一直看到（也避免分享連結帶錯誤）
    if (typeof window !== "undefined") {
      const info = parsePayError(window.location.search);
      if (info) {
        setPayError(info);
        const url = window.location.pathname;
        window.history.replaceState({}, "", url);
      }
    }
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

      {/* 付款異常橫幅 — 從 PayUni return 踢回時顯示、避免使用者誤以為扣款成功又重刷 */}
      {payError && (
        <div className="max-w-md mx-auto w-full mb-4 rounded-2xl border border-rose-400/40 bg-rose-500/[0.08] px-4 py-3.5 text-rose-100/95 leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="text-[18px] mt-0.5">⚠️</span>
            <div className="flex-1">
              <div className="text-[14.5px] font-semibold text-rose-50">
                {payError.title}
              </div>
              <div className="mt-1 text-[12.5px] text-rose-100/85">
                {payError.detail}
              </div>
              <div className="mt-2 text-[12px] text-rose-100/85">
                需要協助請聯絡：
                <a
                  href="mailto:support@superangel527.com"
                  className="ml-1 underline underline-offset-2 text-rose-50 font-medium"
                >
                  support@superangel527.com
                </a>
              </div>
              <button
                type="button"
                onClick={() => setPayError(null)}
                className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-rose-400/15 border border-rose-300/30 text-[11.5px] text-rose-50 active:scale-95 transition"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto">
        {/* Logo — 再放大、上方空位收緊 */}
        <div className="flex justify-center pt-0 pb-1">
          <img
            src="/logo.png"
            alt="誇了嗎"
            className="w-[170px] h-auto drop-shadow-[0_8px_28px_rgba(255,95,162,0.4)]"
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
          <p className="mt-4 text-center text-[16px] text-white/75 italic leading-relaxed">
            <span className="text-white/90">有人好像很在意你剛剛那句話。</span>
          </p>
        </div>

        {/* 三行 whisper（從橫排 pill 改成直排 whisper，更像偷聽到的） */}
        <div className="mt-6 flex flex-col gap-1.5 items-center">
          {TRUST_LINES.map((t) => (
            <div
              key={t.text}
              className="inline-flex items-center gap-2 text-[14.5px] text-white/70"
            >
              <span className={`${t.color} text-[16px]`}>{t.icon}</span>
              {t.text}
            </div>
          ))}
        </div>

        {/* 主卡片：話題 + 暱稱 — 加實心感讓使用者明顯知道這是「動作區」 */}
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] p-4 space-y-5 shadow-[0_8px_30px_rgba(139,92,246,0.12)]">
          {/* 話題 — 步驟 1 */}
          <div>
            <label className="flex items-center gap-2 text-[15.5px] text-white font-medium mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-glow-pink to-glow-violet text-[12.5px] font-semibold">
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
                className="w-full resize-none rounded-2xl bg-bg-deep/90 border-2 border-glow-pink/40 px-4 pt-3.5 pb-12 text-[16.5px] leading-relaxed text-white placeholder-white/40 focus:outline-none focus:border-glow-pink focus:bg-bg-deep transition shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]"
              />
              {/* 框內底部：左下 mic、右下字數 */}
              <div className="absolute left-2.5 right-3 bottom-2 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto">
                  <MicButton
                    currentText={topic}
                    onUpdate={(t) => setTopic(t.slice(0, 30))}
                    size={32}
                  />
                </div>
                <span className="text-[12px] text-white/40 pointer-events-auto">
                  {topic.length}/30
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_TOPICS.map((q) => (
                <button
                  key={q.text}
                  type="button"
                  onClick={() => setTopic(q.text)}
                  className="text-[14px] px-3 py-2 rounded-full bg-white/[0.07] hover:bg-white/[0.12] active:scale-[0.97] border border-white/[0.1] text-white/85 transition inline-flex items-center gap-1.5"
                >
                  <span className="text-[15px]">{q.emoji}</span>
                  {q.text}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/[0.08]" />

          {/* 暱稱 — 步驟 2 */}
          <div>
            <label className="flex items-center gap-2 text-[15.5px] text-white font-medium mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-glow-violet to-glow-cyan text-[12.5px] font-semibold">
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
                className="w-full rounded-2xl bg-bg-deep/90 border-2 border-glow-pink/40 px-4 py-3.5 text-[16.5px] text-white placeholder-white/40 focus:outline-none focus:border-glow-pink focus:bg-bg-deep transition shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-white/40">
                {nickname.length}/8
              </span>
            </div>
          </div>
        </div>

        {/* 主 CTA */}
        <button
          onClick={handleEnter}
          disabled={!canEnter}
          className="mt-5 w-full py-5 rounded-2xl text-white text-[19.5px] font-semibold tracking-wide bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan shadow-[0_10px_40px_-8px_rgba(255,95,162,0.55)] active:scale-[0.98] disabled:opacity-35 disabled:shadow-none transition flex items-center justify-center gap-3"
        >
          <span className="flex-1 text-center pl-7">
            {going ? "正在進入聊天室…" : "NT$19 看他們怎麼聊你"}
          </span>
          {!going && <ArrowRightIcon className="w-5 h-5 mr-2" />}
        </button>

        {/* 安全 pill */}
        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-white/60">
            💬 即時聊天室
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-white/60">
            🔒 匿名模式
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-white/60">
            🛡 聊天內容不會公開
          </span>
        </div>

        {/* 匿名 footer 卡片 — 兩行低語 */}
        <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-4 text-center">
          <div className="inline-flex items-center gap-1.5 text-[14px] text-white/80 font-medium">
            🔒 匿名使用，內容僅用於產生當次回應
          </div>
          <p className="mt-2 text-[13px] text-white/50">
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
            ・ 生命線{" "}
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
