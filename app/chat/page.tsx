"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomGlow from "@/components/BottomGlow";
import MessageBubble from "@/components/MessageBubble";
import JoinEvent from "@/components/JoinEvent";
import SystemNotice from "@/components/SystemNotice";
import LiveCounter from "@/components/LiveCounter";
import ChatInputBar from "@/components/ChatInputBar";
import {
  CHARACTERS,
  pickRandomCharacters,
  pickByGender,
  pickAny,
  type Character,
} from "@/lib/characters";
// pickByGender/pickAny 仍用於 assign()，請勿刪除上方
import CueCard from "@/components/CueCard";
import UserReply from "@/components/UserReply";
import ShareCard, { type ShareMsg } from "@/components/ShareCard";
import {
  buildScript,
  buildCueReactions,
  pickCueScripts,
  renderText,
  type Category,
  type Phase,
  type ScriptLine,
} from "@/lib/messages";
import {
  detectScenarioByKeywords,
  type ScenarioKey,
  ALL_SCENARIO_KEYS,
} from "@/lib/scenarios";

type MsgItem = {
  kind: "msg";
  id: string;
  char: Character;
  text: string;
  ts: Date;
  likeCount: number;
};
type JoinItem = {
  kind: "join";
  id: string;
  char: Character;
  ts: Date;
  verbIndex: number;
};
type SystemItem = {
  kind: "system";
  id: string;
  text: string;
  ts: Date;
};
type CueItem = {
  kind: "cue";
  id: string;
  question: string;
  ts: Date;
  answered: boolean;
  answer?: string;
};
type UserReplyItem = {
  kind: "user_reply";
  id: string;
  nickname: string;
  text: string;
  ts: Date;
};
type ChatItem = MsgItem | JoinItem | SystemItem | CueItem | UserReplyItem;
type Typing = { id: string; char: Character };
type Scheduled = ScriptLine & { char: Character; at: number };

const TOTAL_MS = 180_000;

// 各 phase 訊息數量
const COUNTS = { early: 16, mid: 14, late: 8 };
//  4 階段沉浸式節奏（不顯示倒數秒數）：
//  → 0-30s   爆發期：16 則訊息 + 訊息密集連跳 + 1 次「+18 人加入」
//  → 30-120s 沉浸討論期：14 則訊息 + 插話 + 「N 個人正在輸入…」
//  → 120-170s 戳心收尾期：8 則訊息 + 速度變慢、句子變戳心
//  → 170-180s 結尾停留期：訊息停、輸入框變解鎖 CTA

// ────────────────────────────────────────────
// 排程函式
// ────────────────────────────────────────────

// 0-30s 爆發期：頻繁連跳，前 6 則特別密
function buildEarlyTimes(count: number): number[] {
  const times: number[] = [];
  let t = 400 + Math.random() * 300;
  for (let i = 0; i < count; i++) {
    times.push(t);
    const burstProb = i < 6 ? 0.5 : 0.25;
    if (Math.random() < burstProb) {
      t += 250 + Math.random() * 350; // 連跳 250-600ms
    } else {
      t += 900 + Math.random() * 1100; // 一般 0.9-2s（撐到 ~30s）
    }
  }
  return times;
}

// 30-120s 沉浸期：1-2 秒一則，偶爾插話連跳
function buildMidTimes(start: number, count: number): number[] {
  const times: number[] = [];
  let t = start;
  for (let i = 0; i < count; i++) {
    times.push(t);
    const burstProb = 0.2;
    if (Math.random() < burstProb) {
      t += 400 + Math.random() * 500;
    } else {
      t += 5000 + Math.random() * 3500; // 5-8.5s（撐到 ~120s）
    }
  }
  return times;
}

// 120-170s 戳心期：每則拉長到 5-7s
function buildLateTimes(start: number, count: number): number[] {
  const times: number[] = [];
  let t = start;
  for (let i = 0; i < count; i++) {
    times.push(t);
    t += 5000 + Math.random() * 2500; // ~5-7.5s（撐到 ~170s）
  }
  return times;
}

// 短訊息 typing 時間短一點；長訊息長一點
function typingDurationFor(text: string): number {
  if (text.length <= 4) return 350 + Math.random() * 250; // 350-600ms 插話超快
  if (text.length <= 12) return 600 + Math.random() * 400;
  return 900 + Math.random() * 600;
}

// ────────────────────────────────────────────
// React 元件
// ────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [typings, setTypings] = useState<Typing[]>([]);
  const [ended, setEnded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [savingImage, setSavingImage] = useState(false);

  // 所有 setTimeout 都登記到這個 ref — 結尾 / unmount 一次清光
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = (cb: () => void, delay: number) => {
    const id = setTimeout(cb, delay);
    timeoutsRef.current.push(id);
  };
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  // 標記 client mount — 所有 Math.random / 排程都等到這之後才執行
  useEffect(() => {
    setMounted(true);
  }, []);

  const plan = useMemo(() => {
    if (!mounted) return null;
    const nickname =
      (typeof window !== "undefined"
        ? localStorage.getItem("kl_nickname")
        : "") || "";
    const topic =
      (typeof window !== "undefined"
        ? localStorage.getItem("kl_topic")
        : "") || "";

    // 讀取 pay 頁存的 AI prepared session（完整 47 句劇本 + 3 個 Cue）
    type AIMsg = { text: string; gender: "M" | null };
    type AICue = { transition: string; question: string };
    let prepared: {
      topic?: string;
      keywords?: string[];
      tone?: string;
      earlyMessages?: AIMsg[];
      midMessages?: AIMsg[];
      lateMessages?: AIMsg[];
      cues?: AICue[];
    } | null = null;
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("kl_prepared")
          : null;
      if (raw) prepared = JSON.parse(raw);
    } catch {
      prepared = null;
    }

    // scenario 優先 AI 判定、其次關鍵字
    const scenario: ScenarioKey =
      prepared?.topic && (ALL_SCENARIO_KEYS as string[]).includes(prepared.topic)
        ? (prepared.topic as ScenarioKey)
        : detectScenarioByKeywords(topic);

    // AI 各階段數量
    const aiEarly = prepared?.earlyMessages ?? [];
    const aiMid = prepared?.midMessages ?? [];
    const aiLate = prepared?.lateMessages ?? [];
    const aiCues = prepared?.cues ?? [];

    // 池子補位：AI 不夠時才用
    const fillCounts = {
      early: Math.max(0, COUNTS.early - aiEarly.length),
      mid: Math.max(0, COUNTS.mid - aiMid.length),
      late: Math.max(0, COUNTS.late - aiLate.length),
    };
    const poolLines = buildScript(scenario, fillCounts);

    // AI lines 轉成 ScriptLine 格式
    const aiToLine = (m: AIMsg, phase: Phase, category: Category): ScriptLine => {
      const line: ScriptLine = { text: m.text, category, phase };
      if (m.gender === "M") line.requiresGender = "M";
      return line;
    };

    // 各段：AI 優先、池子補
    const earlyLines: ScriptLine[] = [
      ...aiEarly.slice(0, COUNTS.early).map((m) => aiToLine(m, "early", "praise")),
      ...poolLines.filter((l) => l.phase === "early"),
    ];
    const midLines: ScriptLine[] = [
      ...aiMid.slice(0, COUNTS.mid).map((m) => aiToLine(m, "mid", "understanding")),
      ...poolLines.filter((l) => l.phase === "mid"),
    ];
    const lateLines: ScriptLine[] = [
      ...aiLate.slice(0, COUNTS.late).map((m) => aiToLine(m, "late", "heart_pierce")),
      ...poolLines.filter((l) => l.phase === "late"),
    ];

    // 抽 16 個角色用（夠多樣）
    const chars = pickRandomCharacters(Math.min(16, CHARACTERS.length));

    // 配角色：男生視角必須給男角；其他輪替＋避免同一人連續
    let lastCharId: string | null = null;

    function assign(ls: ScriptLine[]) {
      return ls.map((line) => {
        let char: Character;
        if (line.requiresGender) {
          char = pickByGender(chars, line.requiresGender, lastCharId ?? undefined);
        } else {
          char = pickAny(chars, lastCharId ?? undefined);
        }
        lastCharId = char.id;
        return { ...line, char };
      });
    }

    const earlyAssigned = assign(earlyLines);
    const midAssigned = assign(midLines);
    const lateAssigned = assign(lateLines);

    // 4 階段排程時間
    const earlyTimes = buildEarlyTimes(earlyAssigned.length);
    const earlyEnd = earlyTimes[earlyTimes.length - 1] ?? 0;
    const midStart = Math.max(30000, earlyEnd + 1500); // 30s 起跑沉浸期
    const midTimes = buildMidTimes(midStart, midAssigned.length);
    const midEnd = midTimes[midTimes.length - 1] ?? midStart;
    const lateStart = Math.max(122000, midEnd + 3000); // 120s 起跑戳心期
    const lateTimes = buildLateTimes(lateStart, lateAssigned.length);

    const scheduled: Scheduled[] = [
      ...earlyAssigned.map((l, i) => ({ ...l, at: earlyTimes[i] })),
      ...midAssigned.map((l, i) => ({ ...l, at: midTimes[i] })),
      ...lateAssigned.map((l, i) => ({ ...l, at: lateTimes[i] })),
    ].sort((a, b) => a.at - b.at);

    // 開頭 join 事件 — 縮短，讓真訊息馬上開始
    const joinChars = pickRandomCharacters(5);
    const joinSchedule = [
      { char: joinChars[0], at: 100 },
      { char: joinChars[1], at: 250 },
      { char: joinChars[2], at: 600 + Math.random() * 200 },
      { char: joinChars[3], at: 35000 + Math.random() * 8000 },
      { char: joinChars[4], at: 105000 + Math.random() * 10000 },
    ];

    // 批量加入系統訊息：爆發期 1 次 + 沉浸期 1 次 + 戳心期 1 次
    const bulkJoins = [
      { at: 9000 + Math.random() * 5000, text: `又有 ${14 + Math.floor(Math.random() * 8)} 個人加入聊天室` },
      { at: 55000 + Math.random() * 12000, text: `又有 ${6 + Math.floor(Math.random() * 6)} 個人加入聊天室` },
      { at: 135000 + Math.random() * 10000, text: `又有 ${4 + Math.floor(Math.random() * 5)} 個人加入聊天室` },
    ];

    // Cue 點名：3 次 — 38s / 88s / 142s
    // 優先用 AI 生的 Cue（圍繞主題）、不夠用池子補
    const aiCueCount = Math.min(aiCues.length, 3);
    const poolCueScripts = pickCueScripts(3 - aiCueCount, scenario);
    const cueScripts = [
      ...aiCues.slice(0, aiCueCount).map((c) => ({
        transition: c.transition,
        question: c.question,
      })),
      ...poolCueScripts,
    ];
    const cueSchedule = [
      { id: "c1", at: 38000, transitionAt: 36500, ...cueScripts[0] },
      { id: "c2", at: 88000, transitionAt: 86500, ...cueScripts[1] },
      { id: "c3", at: 142000, transitionAt: 140500, ...cueScripts[2] },
    ];

    // 在線數 base：1800-2400 隨機
    const onlineBase = 1800 + Math.floor(Math.random() * 600);

    return {
      nickname,
      topic,
      scenario,
      keywords: prepared?.keywords ?? [],
      scheduled,
      chars,
      joinSchedule,
      bulkJoins,
      cueSchedule,
      onlineBase,
    };
  }, [mounted]);

  // 付款檢查 — 先看 cookie（PayUni return 設的）再看 localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    // 從 cookie 把 PayUni 付款 marker 搬到 localStorage
    const cookieMatch = document.cookie.match(/(?:^|;\s*)kl_paid_at=([^;]+)/);
    if (cookieMatch) {
      localStorage.setItem("kl_paid_at", decodeURIComponent(cookieMatch[1]));
      // 清掉 cookie（避免下次還生效）
      document.cookie = "kl_paid_at=; Max-Age=0; path=/";
    }
    const paid = localStorage.getItem("kl_paid_at");
    if (!paid) {
      router.replace("/pay");
    }
  }, [router]);

  useEffect(() => {
    if (!plan) return;

    // 個別加入事件
    plan.joinSchedule.forEach((j, idx) => {
      schedule(() => {
        setItems((arr) => [
          ...arr,
          {
            kind: "join",
            id: `j-${idx}`,
            char: j.char,
            ts: new Date(),
            verbIndex: idx,
          },
        ]);
      }, j.at);
    });

    // 批量加入系統訊息
    plan.bulkJoins.forEach((b, idx) => {
      schedule(() => {
        setItems((arr) => [
          ...arr,
          {
            kind: "system",
            id: `s-${idx}`,
            text: b.text,
            ts: new Date(),
          },
        ]);
      }, b.at);
    });

    // Cue 互動：先排過渡訊息、再排 Cue 卡
    plan.cueSchedule.forEach((cue, idx) => {
      const transitionChar = plan.chars[(idx * 5) % plan.chars.length];
      schedule(() => {
        setItems((arr) => [
          ...arr,
          {
            kind: "msg",
            id: `cuet-${cue.id}`,
            char: transitionChar,
            text: renderText(cue.transition, plan.nickname),
            ts: new Date(),
            likeCount: 3 + Math.floor(Math.random() * 12),
          },
        ]);
      }, cue.transitionAt);
      schedule(() => {
        setItems((arr) => [
          ...arr,
          {
            kind: "cue",
            id: cue.id,
            question: renderText(cue.question, plan.nickname),
            ts: new Date(),
            answered: false,
          },
        ]);
      }, cue.at);
    });

    // 真實訊息：先 typing 一下，再吐 message
    plan.scheduled.forEach((evt, idx) => {
      const typingDelay = typingDurationFor(evt.text);
      const showTypingAt = Math.max(0, evt.at - typingDelay);
      const tid = `t-${idx}`;
      schedule(() => {
        setTypings((t) => [...t, { id: tid, char: evt.char }]);
      }, showTypingAt);
      schedule(() => {
        setTypings((t) => t.filter((x) => x.id !== tid));
        setItems((arr) => [
          ...arr,
          {
            kind: "msg",
            id: `m-${idx}`,
            char: evt.char,
            text: renderText(evt.text, plan.nickname),
            ts: new Date(),
            likeCount: 5 + Math.floor(Math.random() * 25),
          },
        ]);
      }, evt.at);
    });

    // 假性「正在輸入」— 讓底部偶爾跳出「3 個人正在輸入…」
    const decoyCount = 14;
    for (let i = 0; i < decoyCount; i++) {
      const at = 10000 + Math.random() * 110000;
      const dur = 1200 + Math.random() * 1600;
      const char = plan.chars[Math.floor(Math.random() * plan.chars.length)];
      const did = `d-${i}`;
      schedule(() => {
        setTypings((t) => [...t, { id: did, char }]);
      }, at);
      schedule(() => {
        setTypings((t) => t.filter((x) => x.id !== did));
      }, at + dur);
    }

    // 結尾 — 把剩餘 timeout 全部清掉、清付款 marker
    schedule(() => {
      setTypings([]);
      setEnded(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem("kl_paid_at");
      }
      clearAllTimeouts();
    }, TOTAL_MS + 1500);

    return () => {
      clearAllTimeouts();
    };
  }, [plan]);

  useEffect(() => {
    // 暴動期用 auto 避免 smooth 跟不上
    const behavior: ScrollBehavior = items.length < 18 ? "auto" : "smooth";
    scrollEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, [items.length, typings.length, ended]);

  // 愛心 reaction 慢慢增加 — 製造熱度感
  useEffect(() => {
    if (ended) return;
    const id = setInterval(() => {
      setItems((arr) => {
        const msgIdxs = arr
          .map((it, i) => (it.kind === "msg" ? i : -1))
          .filter((i) => i >= 0);
        if (msgIdxs.length === 0) return arr;
        // 隨機挑 1-3 則 +1-4
        const next = [...arr];
        const pickCount = 1 + Math.floor(Math.random() * 3);
        for (let k = 0; k < pickCount; k++) {
          const idx = msgIdxs[Math.floor(Math.random() * msgIdxs.length)];
          const it = next[idx];
          if (it.kind === "msg") {
            next[idx] = {
              ...it,
              likeCount: it.likeCount + 1 + Math.floor(Math.random() * 3),
            };
          }
        }
        return next;
      });
    }, 1800 + Math.random() * 1400);
    return () => clearInterval(id);
  }, [ended]);

  const handleReplay = () => {
    // 回首頁：清掉舊話題、讓使用者打新心情
    if (typeof window !== "undefined") {
      localStorage.removeItem("kl_topic");
      localStorage.removeItem("kl_prepared");
      localStorage.removeItem("kl_scenario");
      localStorage.removeItem("kl_paid_at");
      // kl_nickname 保留 — 同一個暱稱繼續用
    }
    router.push("/");
  };

  // 從本場訊息挑出 3-4 則最高愛心、適合分享的（排除短插話、廢話）
  const shareItems: ShareMsg[] = useMemo(() => {
    if (!ended || !plan) return [];
    const trashStart = /^(\+|笑死|靠|哈哈|對對|對啊|蛤|懂|認同|心疼|幹|真的)/;
    const candidates = items
      .filter((it): it is MsgItem => it.kind === "msg")
      .filter((m) => m.text.length >= 10) // 排除太短
      .filter((m) => !trashStart.test(m.text.replace(/^@\S+\s*/, ""))) // 排除短插話
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 4)
      .map((m) => ({ char: m.char, text: m.text, likeCount: m.likeCount }));
    return candidates;
  }, [ended, items, plan]);

  const totalLikes = useMemo(() => {
    if (!ended) return 0;
    return items
      .filter((it): it is MsgItem => it.kind === "msg")
      .reduce((sum, m) => sum + m.likeCount, 0);
  }, [ended, items]);

  const mainQuote = shareItems[0]?.text ?? "你真是一位有趣的人";
  const mainQuoteAuthor = shareItems[0]?.char.name ?? "小桃";

  const handleSaveImage = async () => {
    if (savingImage || !shareCardRef.current) return;
    setSavingImage(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(shareCardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0b0b1a",
      });
      const link = document.createElement("a");
      const nick = plan?.nickname || "我";
      link.download = `誇了嗎_${nick}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      // 萬一失敗、提示使用者長按存圖
      alert("產生圖片失敗、請長按下方圖卡存到相簿");
      console.error(e);
    } finally {
      setSavingImage(false);
    }
  };

  const handleHome = () => router.push("/");

  const handleCueAnswer = async (cueId: string, text: string) => {
    if (!plan || ended) return;

    // 1. 把 cue 標記為 answered
    setItems((arr) =>
      arr.map((it) =>
        it.kind === "cue" && it.id === cueId
          ? { ...it, answered: true, answer: text }
          : it
      )
    );

    // 2. 加 UserReply line
    const stamp = Date.now();
    setItems((arr) => [
      ...arr,
      {
        kind: "user_reply",
        id: `ur-${stamp}`,
        nickname: plan.nickname || "你",
        text,
        ts: new Date(),
      },
    ]);

    // 3. 先用池子 fallback、同時叫 AI（如果 AI 回得快就用 AI 蓋掉）
    let reactions: ScriptLine[] = buildCueReactions(plan.scenario, 6);
    try {
      const resp = await fetch("/api/generate-reactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: plan.scenario,
          keywords: plan.keywords,
          nickname: plan.nickname,
          userReply: text,
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as {
          messages?: Array<{ text: string; gender: "M" | null }>;
        };
        if (data?.messages && data.messages.length > 0) {
          reactions = data.messages.map((m) => {
            const line: ScriptLine = {
              text: m.text,
              category: "understanding",
              phase: "mid",
            };
            if (m.gender === "M") line.requiresGender = "M";
            return line;
          });
        }
      }
    } catch {
      /* 用池子的 reactions */
    }

    let lastId: string | null = null;
    let cursor = 700;
    reactions.forEach((line, idx) => {
      const char = line.requiresGender
        ? pickByGender(plan.chars, line.requiresGender, lastId ?? undefined)
        : pickAny(plan.chars, lastId ?? undefined);
      lastId = char.id;
      const dur = typingDurationFor(line.text);
      const typingAt = Math.max(0, cursor - dur);
      const tid = `crt-${cueId}-${idx}`;

      schedule(() => {
        setTypings((arr) => [...arr, { id: tid, char }]);
      }, typingAt);
      schedule(() => {
        setTypings((arr) => arr.filter((x) => x.id !== tid));
        setItems((arr) => [
          ...arr,
          {
            kind: "msg",
            id: `crm-${cueId}-${idx}-${stamp}`,
            char,
            text: renderText(line.text, plan.nickname),
            ts: new Date(),
            likeCount: 8 + Math.floor(Math.random() * 30),
          },
        ]);
      }, cursor);
      const gap =
        Math.random() < 0.4 ? 350 + Math.random() * 400 : 800 + Math.random() * 800;
      cursor += gap;
    });
  };

  return (
    <main className="relative flex flex-col h-screen-safe overflow-hidden">
      <BottomGlow />

      {/* 頂部 — 像 Discord 頻道 header */}
      <header className="shrink-0 px-4 pt-3 pb-3 border-b border-white/5 backdrop-blur-md bg-bg-deep/70 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleHome}
            aria-label="離開"
            className="text-white/55 hover:text-white text-[20px] leading-none w-8 h-8 flex items-center justify-center -ml-1 active:scale-90 transition"
          >
            ‹
          </button>
          <div className="flex-1 text-center">
            <div className="text-[14.5px] font-semibold text-white tracking-wide">
              #誇了嗎
            </div>
            <div className="mt-0.5">
              <LiveCounter base={plan?.onlineBase ?? 2000} compact />
            </div>
          </div>
          <div className="w-8" />
        </div>
      </header>

      {/* 訊息流 */}
      <div className="flex-1 overflow-y-auto chat-scroll">
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          {/* 話題卡 — 整場圍繞這句話討論 */}
          {plan?.topic && (
            <div className="mb-2 rounded-2xl bg-gradient-to-br from-glow-pink/[0.08] via-glow-violet/[0.08] to-glow-cyan/[0.06] border border-white/[0.1] p-3.5">
              <div className="flex items-start gap-3">
                <img
                  src="/logo.png"
                  alt=""
                  className="w-9 h-9 rounded-full shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white/55 mb-0.5">
                    你丟進聊天室的心情是：
                  </div>
                  <div className="text-[16px] text-white font-medium leading-snug">
                    {plan.topic}
                  </div>
                  <div className="mt-2 text-[12px] text-white/60 leading-relaxed">
                    大家正在討論你，偷偷說、偷偷誇、也偷偷心疼。
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-white/45">
                    🔒 這裡不會洩漏你的身分・安心享受這 3 分鐘
                  </div>
                </div>
              </div>
            </div>
          )}

          {items.map((it) => {
            if (it.kind === "msg") {
              return (
                <MessageBubble
                  key={it.id}
                  char={it.char}
                  text={it.text}
                  ts={it.ts}
                  likeCount={it.likeCount}
                />
              );
            }
            if (it.kind === "join") {
              return (
                <JoinEvent
                  key={it.id}
                  char={it.char}
                  ts={it.ts}
                  verbIndex={it.verbIndex}
                />
              );
            }
            if (it.kind === "cue") {
              return (
                <CueCard
                  key={it.id}
                  question={it.question}
                  answered={it.answered}
                  answer={it.answer}
                  onAnswer={(text) => handleCueAnswer(it.id, text)}
                />
              );
            }
            if (it.kind === "user_reply") {
              return (
                <UserReply
                  key={it.id}
                  nickname={it.nickname}
                  text={it.text}
                />
              );
            }
            return <SystemNotice key={it.id} text={it.text} />;
          })}

          {ended && (
            <div className="pt-5 pb-2 animate-fade-in-up">
              {/* 大標 */}
              <div className="text-center mb-1">
                <div className="text-[12.5px] text-white/45 mb-1">
                  聊天室慢慢安靜下來了……
                </div>
                <h2 className="text-[20px] sm:text-[22px] text-white font-bold leading-snug">
                  聊天室裡，
                  <br />
                  好像
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan">
                    還有人想繼續聊你
                  </span>
                  。
                </h2>
                <p className="mt-1.5 text-[11.5px] text-white/40">
                  ✨ 聊天室裡，有幾句話被很多人按了愛心
                </p>
              </div>

              {/* ShareCard 預覽 — 縮放 */}
              {shareItems.length > 0 && (
                <div className="mt-4 mb-3 flex justify-center">
                  <div
                    style={{
                      transform: "scale(0.6)",
                      transformOrigin: "top center",
                      width: 540,
                      marginBottom: -360,
                    }}
                  >
                    <ShareCard
                      ref={shareCardRef}
                      nickname={plan?.nickname || "你"}
                      mainQuote={mainQuote}
                      mainQuoteAuthor={mainQuoteAuthor}
                      messages={shareItems}
                      totalLikes={totalLikes}
                    />
                  </div>
                </div>
              )}

              {/* 兩個按鈕 */}
              <div className="mt-4 space-y-2.5">
                <button
                  onClick={handleSaveImage}
                  disabled={savingImage || shareItems.length === 0}
                  className="w-full py-3.5 rounded-2xl text-white text-[15.5px] font-semibold bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan shadow-[0_10px_30px_-8px_rgba(255,95,162,0.55)] active:scale-[0.98] disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {savingImage ? "正在產生圖片…" : "📥 保存分享圖"}
                </button>
                <button
                  onClick={handleReplay}
                  className="w-full py-3.5 rounded-2xl text-white/95 text-[15.5px] font-medium bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.1] active:scale-[0.98] transition"
                >
                  💬 換一句心情再被討論
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] text-white/35">
                長按圖片也可以直接存到相簿
              </p>
            </div>
          )}

          <div ref={scrollEndRef} className="h-2" />
        </div>
      </div>

      {/* 底部 — 結尾時隱藏（ShareCard 上方已有按鈕） */}
      {!ended && (
        <ChatInputBar mode="passive" onUnlock={handleReplay} />
      )}
    </main>
  );
}
