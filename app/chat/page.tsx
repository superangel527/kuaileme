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
import UserReply from "@/components/UserReply";
import ShareCard, { type ShareMsg } from "@/components/ShareCard";
import { renderText, type ScriptLine } from "@/lib/messages";
import {
  detectScenarioByKeywords,
  type ScenarioKey,
  ALL_SCENARIO_KEYS,
} from "@/lib/scenarios";
import {
  buildSafeFallback,
  buildSafeCueReactions,
} from "@/lib/safe-fallback";

// ─────────────────────────────────────
// Types
// ─────────────────────────────────────

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
type UserReplyItem = {
  kind: "user_reply";
  id: string;
  nickname: string;
  text: string;
  ts: Date;
};
type ChatItem = MsgItem | JoinItem | SystemItem | UserReplyItem;
type Typing = { id: string; char: Character };

// ─────────────────────────────────────
// Constants
// ─────────────────────────────────────

const INITIAL_DURATION_MS = 180_000; // 第一場 3 分鐘
const EXTEND_DURATION_MS = 180_000; // 續聊 3 分鐘（跟首場一致、心理門檻低、連續小額更易上癮）
const FADE_DURATION_MS = 18_000; // 「慢慢安靜」末段
const IDLE_PING_AFTER_MS = 5_000; // 使用者沒打字 5 秒就繼續誇（Angel 反饋：停頓太久）
const IDLE_PING_COOLDOWN_MS = 5_000; // 兩次 ping 至少間隔 5 秒

// 結尾「慢慢安靜」3 句固定戳心收尾（規格定版）
const FAREWELL_LINES = [
  "我感覺她其實還有很多沒說",
  "聊天室裡 好像還有人不想離開",
  "她剛剛那句話 我有點放不下",
];

// 招牌核心 phrase — 整場每個 phrase 最多出現 2 次、超過跳過
// 用 substring 比對（不管前後綴）、抓「你心情怎麼樣？」「@美 你心情怎麼樣 我們都在聽」都當同一句
const SIGNATURE_PHRASES = [
  "心情怎麼樣",
  "心情如何",
  "說出來就是勇敢",
  "願意說出來",
  "做得很好",
  "我們都在聽",
  "都在聽",
  "我們都懂",
  "我們陪你",
  "你不孤單",
  "聽到你了",
  "已經很棒",
  "你比你以為",
  "我們真的懂",
  "存在就是答案",
  "我們在這",
  "我們看見你",
  "你不用一個人",
  "感覺都是真的",
  "你已經很努力",
  "願意來",
  "你的心情我們收到",
  "你說的我們都收到",
  "你比你想的",
];
const PHRASE_MAX = 1; // 整場 3 分鐘、每句完全不重複（Angel 反饋：時間短、重複很煩）

// idle ping 訊息池（持續誇獎為主、偶爾傾聽）
// 5 秒沒打字就丟一句、繼續餵情緒價值
const IDLE_PING_LINES = [
  "@{n} 你超棒",
  "@{n} 你超有魅力",
  "@{n} 你超酷",
  "@{n} 你真的很特別",
  "@{n} 你很可愛",
  "@{n} 你是溫暖的人",
  "@{n} 你做得超好",
  "@{n} 你比你以為的更厲害",
  "真心覺得 {n} 很棒",
  "@{n} 你那種感覺 真的少見",
  "@{n} 你超有想法",
  "@{n} 我們真的喜歡你",
  "@{n} 你超讓人安心",
  "@{n} 你笑起來很好看",
  "{n} 你身上有那種讓人想靠近的感覺",
  "@{n} 你的存在 真的很美",
  "{n} 你那種真實 我們都看見",
  "@{n} 你超值得被珍惜",
  // 偶爾穿插傾聽（少量）
  "@{n} 我們都在",
  "@{n} 我們陪你",
];

// ─────────────────────────────────────
// 排程函式
// ─────────────────────────────────────

// 開場 8 句的密集排程（前 ~30 秒吐完）
function buildOpeningTimes(count: number): number[] {
  const times: number[] = [];
  let t = 500 + Math.random() * 400;
  for (let i = 0; i < count; i++) {
    times.push(t);
    const burstProb = i < 4 ? 0.45 : 0.25;
    if (Math.random() < burstProb) {
      t += 300 + Math.random() * 400;
    } else {
      t += 1500 + Math.random() * 1800;
    }
  }
  return times;
}

function typingDurationFor(text: string): number {
  if (text.length <= 4) return 350 + Math.random() * 250;
  if (text.length <= 12) return 600 + Math.random() * 400;
  return 900 + Math.random() * 600;
}

// 訊息按讚數：分 3 級隨機
//   爆紅（25%）：600-3000  →  share.png 4K 那種感覺
//   中熱（30%）：80-300    →  有人氣
//   普通（45%）：5-55      →  日常
// 確保每場都有「幾個爆紅」+ 大多正常的真實感
function genLikeCount(): number {
  const r = Math.random();
  if (r < 0.25) return 600 + Math.floor(Math.random() * 2400);
  if (r < 0.55) return 80 + Math.floor(Math.random() * 220);
  return 5 + Math.floor(Math.random() * 50);
}

// ─────────────────────────────────────
// Component
// ─────────────────────────────────────

export default function ChatPage() {
  const router = useRouter();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [typings, setTypings] = useState<Typing[]>([]);
  const [ended, setEnded] = useState(false); // 真的結束、顯示 ShareCard + 續聊按鈕
  const [fading, setFading] = useState(false); // 進入「慢慢安靜」階段
  const [mounted, setMounted] = useState(false);
  const [sending, setSending] = useState(false); // 使用者打字後、AI 群演回覆中
  const [extending, setExtending] = useState(false); // 續聊付款中
  const [userGender, setUserGender] = useState<"M" | "F" | null>(null); // 性別偵測
  const userHistoryRef = useRef<string[]>([]); // 使用者打字累積、給 AI 推測角色用

  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  // 保存圖片結果訊息
  // null / "success" / "ios"（已開新分頁、提示長按）/ "longpress"（LINE WebView、提示長按預覽圖）/ "error"
  const [saveResult, setSaveResult] = useState<
    null | "success" | "ios" | "longpress" | "error"
  >(null);

  const sessionStartRef = useRef<number>(Date.now());
  const sessionDurationRef = useRef<number>(INITIAL_DURATION_MS);
  const lastUserInputAtRef = useRef<number>(Date.now());
  // 招牌句出現次數：整場最多 PHRASE_MAX 次、超過跳過
  const phraseCountRef = useRef<Record<string, number>>({});

  // 檢查訊息是否還能放（雙重判斷）：
  //   1. 整句 normalize（去 @暱稱 / 標點 / 空白）後比對、整場最多 PHRASE_MAX 次
  //   2. 招牌核心 phrase substring 比對、每個 phrase 整場最多 PHRASE_MAX 次
  // 兩者都通過才放
  // side effect: 若返回 true、會 increment 所有 matched count
  const shouldKeepMessage = (text: string): boolean => {
    // dry check：先確認都不超過、不 mutate
    const matchedPhrases: string[] = [];
    for (const phrase of SIGNATURE_PHRASES) {
      if (text.includes(phrase)) {
        const count = phraseCountRef.current[phrase] || 0;
        if (count >= PHRASE_MAX) return false;
        matchedPhrases.push(phrase);
      }
    }

    // 整句 normalize 比對
    const normalized = text
      .replace(/^@\S+\s*/, "")
      .replace(/[，。！？、…\s]/g, "");
    const exactKey = "__exact:" + normalized;
    if (normalized) {
      const exactCount = phraseCountRef.current[exactKey] || 0;
      if (exactCount >= PHRASE_MAX) return false;
    }

    // 通過、increment 所有 count
    for (const phrase of matchedPhrases) {
      phraseCountRef.current[phrase] =
        (phraseCountRef.current[phrase] || 0) + 1;
    }
    if (normalized) {
      phraseCountRef.current[exactKey] =
        (phraseCountRef.current[exactKey] || 0) + 1;
    }
    return true;
  };

  // 所有 setTimeout 都登記到這個 ref — unmount / 結束時一次清光
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = (cb: () => void, delay: number) => {
    const id = setTimeout(cb, delay);
    timeoutsRef.current.push(id);
    return id;
  };
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─────────────────────────────────────
  // Plan：讀 prepared session、規劃開場 8 句訊息
  // ─────────────────────────────────────
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

    type AIMsg = { text: string; gender: "M" | null };
    let prepared: {
      topic?: string;
      keywords?: string[];
      tone?: string;
      openingMessages?: AIMsg[];
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

    const scenario: ScenarioKey =
      prepared?.topic && (ALL_SCENARIO_KEYS as string[]).includes(prepared.topic)
        ? (prepared.topic as ScenarioKey)
        : detectScenarioByKeywords(topic);

    // 開場 8 句：AI 為主、不夠用安全句補
    const aiOpening = prepared?.openingMessages ?? [];
    const openingCount = 8;
    const fillCount = Math.max(0, openingCount - aiOpening.length);
    const safeFill = buildSafeFallback({
      early: fillCount,
      mid: 0,
      late: 0,
    });

    const aiToLine = (m: AIMsg): ScriptLine => {
      const line: ScriptLine = {
        text: m.text,
        category: "praise",
        phase: "early",
      };
      if (m.gender === "M") line.requiresGender = "M";
      return line;
    };

    const openingLines: ScriptLine[] = [
      ...aiOpening.slice(0, openingCount).map(aiToLine),
      ...safeFill,
    ];

    const chars = pickRandomCharacters(Math.min(16, CHARACTERS.length));
    let lastCharId: string | null = null;
    const openingAssigned = openingLines.map((line) => {
      const char = line.requiresGender
        ? pickByGender(chars, line.requiresGender, lastCharId ?? undefined)
        : pickAny(chars, lastCharId ?? undefined);
      lastCharId = char.id;
      return { ...line, char };
    });

    const openingTimes = buildOpeningTimes(openingAssigned.length);
    const openingScheduled = openingAssigned.map((l, i) => ({
      ...l,
      at: openingTimes[i],
    }));

    // 開場 join 事件 — 縮短、真訊息馬上開始
    const joinChars = pickRandomCharacters(3);
    const joinSchedule = [
      { char: joinChars[0], at: 100 },
      { char: joinChars[1], at: 250 },
      { char: joinChars[2], at: 600 + Math.random() * 200 },
    ];

    // 開場系統訊息（1 次）
    const bulkJoin = {
      at: 8000 + Math.random() * 4000,
      text: `又有 ${14 + Math.floor(Math.random() * 8)} 個人加入聊天室`,
    };

    const onlineBase = 1800 + Math.floor(Math.random() * 600);

    return {
      nickname,
      topic,
      scenario,
      keywords: prepared?.keywords ?? [],
      openingScheduled,
      chars,
      joinSchedule,
      bulkJoin,
      onlineBase,
    };
  }, [mounted]);

  // ─────────────────────────────────────
  // 付款檢查 — cookie / localStorage
  // ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)kl_paid_at=([^;]+)/);
    if (cookieMatch) {
      localStorage.setItem("kl_paid_at", decodeURIComponent(cookieMatch[1]));
      document.cookie = "kl_paid_at=; Max-Age=0; path=/";
    }
    const paid = localStorage.getItem("kl_paid_at");
    if (!paid) {
      router.replace("/pay");
    }
  }, [router]);

  // ─────────────────────────────────────
  // PayUni return：?extend=1 → 延長 3 分鐘
  // ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("extend") === "1") {
      window.history.replaceState({}, "", "/chat");
      // 延後一個 tick、等 plan 載入
      setTimeout(() => extendSession(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  // ─────────────────────────────────────
  // 主排程：開場 join + 開場 8 句 + fade + ended
  // ─────────────────────────────────────
  useEffect(() => {
    if (!plan) return;
    sessionStartRef.current = Date.now();
    sessionDurationRef.current = INITIAL_DURATION_MS;
    lastUserInputAtRef.current = Date.now();
    phraseCountRef.current = {}; // 新場 reset 招牌句計數

    plan.joinSchedule.forEach((j, idx) => {
      schedule(() => {
        setItems((arr) => [
          ...arr,
          {
            kind: "join",
            id: `j-${idx}-${sessionStartRef.current}`,
            char: j.char,
            ts: new Date(),
            verbIndex: idx,
          },
        ]);
      }, j.at);
    });

    schedule(() => {
      setItems((arr) => [
        ...arr,
        {
          kind: "system",
          id: `s-bulk-${sessionStartRef.current}`,
          text: plan.bulkJoin.text,
          ts: new Date(),
        },
      ]);
    }, plan.bulkJoin.at);

    // 開場 8 句先 filter 招牌句重複的、再排程
    const filteredOpening = plan.openingScheduled.filter((evt) =>
      shouldKeepMessage(renderText(evt.text, plan.nickname))
    );
    filteredOpening.forEach((evt, idx) => {
      const typingDelay = typingDurationFor(evt.text);
      const showTypingAt = Math.max(0, evt.at - typingDelay);
      const tid = `to-${idx}-${sessionStartRef.current}`;
      schedule(() => {
        setTypings((t) => [...t, { id: tid, char: evt.char }]);
      }, showTypingAt);
      schedule(() => {
        setTypings((t) => t.filter((x) => x.id !== tid));
        setItems((arr) => [
          ...arr,
          {
            kind: "msg",
            id: `o-${idx}-${sessionStartRef.current}`,
            char: evt.char,
            text: renderText(evt.text, plan.nickname),
            ts: new Date(),
            likeCount: genLikeCount(),
          },
        ]);
      }, evt.at);
    });

    // 「慢慢安靜」階段：sessionDuration - 18 秒
    const fadeStart = INITIAL_DURATION_MS - FADE_DURATION_MS;
    schedule(() => {
      setFading(true);
      FAREWELL_LINES.forEach((line, idx) => {
        const char = pickAny(plan.chars);
        const at = idx * 6500 + 2000; // 2/8.5/15s
        const dur = typingDurationFor(line);
        const tid = `tf-${idx}-${Date.now()}`;
        schedule(() => {
          setTypings((t) => [...t, { id: tid, char }]);
        }, Math.max(0, at - dur));
        schedule(() => {
          setTypings((t) => t.filter((x) => x.id !== tid));
          setItems((arr) => [
            ...arr,
            {
              kind: "msg",
              id: `fa-${idx}-${Date.now()}`,
              char,
              text: line,
              ts: new Date(),
              likeCount: 30 + Math.floor(Math.random() * 50),
            },
          ]);
        }, at);
      });
    }, fadeStart);

    // 真正結束 → ShareCard + 續聊按鈕
    schedule(() => {
      setTypings([]);
      setEnded(true);
      // 不清 paid_at — 因為使用者可能要按續聊（要保留聊天室不被踢回 /pay）
      // 清掉所有殘留 schedule（避免 reactions / decoy typing 在 ended 後 fire、
      // 造成 ShareCard 上方又冒新訊息的「時間線倒退」感）
      clearAllTimeouts();
    }, INITIAL_DURATION_MS);

    return () => {
      clearAllTimeouts();
    };
  }, [plan]);

  // ─────────────────────────────────────
  // idle ping：使用者超過 25 秒沒打字、自動丟 1 句關心
  // ─────────────────────────────────────
  useEffect(() => {
    if (!plan || ended || fading) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastUserInputAtRef.current < IDLE_PING_AFTER_MS) return;
      // AI 反應排程中、不要插話、避免時序錯亂
      if (sending) return;

      // 抽 idle ping、若招牌句已滿、再隨機抽一次（最多 3 次嘗試）、都滿就跳過
      let line = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        const candidate =
          IDLE_PING_LINES[Math.floor(Math.random() * IDLE_PING_LINES.length)];
        const rendered = renderText(candidate, plan.nickname);
        if (shouldKeepMessage(rendered)) {
          line = candidate;
          break;
        }
      }
      if (!line) return; // 都試過、本輪 skip
      const char = pickAny(plan.chars);
      const dur = typingDurationFor(line);
      const stamp = Date.now();
      const tid = `tip-${stamp}`;
      schedule(() => {
        setTypings((t) => [...t, { id: tid, char }]);
      }, 0);
      schedule(() => {
        setTypings((t) => t.filter((x) => x.id !== tid));
        setItems((arr) => [
          ...arr,
          {
            kind: "msg",
            id: `ip-${stamp}`,
            char,
            text: renderText(line, plan.nickname),
            ts: new Date(),
            likeCount: genLikeCount(),
          },
        ]);
      }, dur);
      // 重置「最後互動時間」、給 cooldown
      lastUserInputAtRef.current =
        now - (IDLE_PING_AFTER_MS - IDLE_PING_COOLDOWN_MS);
    }, 2000); // 每 2 秒 check 一次（之前 5 秒、現在反應更即時）
    return () => clearInterval(interval);
  }, [plan, ended, fading, sending]);

  // 假性 typing decoy — 偶爾跳出「N 個人正在輸入…」
  useEffect(() => {
    if (!plan || ended) return;
    const interval = setInterval(() => {
      if (typings.length > 0) return;
      const char = plan.chars[Math.floor(Math.random() * plan.chars.length)];
      const did = `d-${Date.now()}`;
      const dur = 1200 + Math.random() * 1500;
      setTypings((t) => [...t, { id: did, char }]);
      setTimeout(() => {
        setTypings((t) => t.filter((x) => x.id !== did));
      }, dur);
    }, 8000 + Math.random() * 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, ended]);

  // 自動 scroll
  useEffect(() => {
    const behavior: ScrollBehavior = items.length < 18 ? "auto" : "smooth";
    scrollEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, [items.length, typings.length, ended]);

  // 愛心慢慢增加
  useEffect(() => {
    if (ended) return;
    const id = setInterval(() => {
      setItems((arr) => {
        const msgIdxs = arr
          .map((it, i) => (it.kind === "msg" ? i : -1))
          .filter((i) => i >= 0);
        if (msgIdxs.length === 0) return arr;
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

  // ─────────────────────────────────────
  // handleSend: 使用者打字 → 顯示 UserReply → fetch AI 即時 6-8 句反應
  // ─────────────────────────────────────
  const handleSend = async (text: string) => {
    // fading 階段（最後 18 秒）也不再接受打字、避免 reactions 拖到 ended 後才 fire、
    // 造成 ShareCard 上方又冒新訊息的「時間線倒退」感
    if (!plan || ended || fading || sending) return;
    setSending(true);
    lastUserInputAtRef.current = Date.now();

    // 性別偵測（擴大關鍵字、含角色 keyword）：
    //   男性指標：男的 / 男生 / 直男 / 我哥 / 弟弟 / 爸爸 / 當爸 / 我老婆 / 我太太
    //   女性指標：女的 / 女生 / 我妹 / 我姐 / 媽媽 / 當媽 / 我老公 / 我先生 / 懷孕
    const maleHints =
      /(我是男的|我男的|我男生|我是男生|我哥|我弟|男的啦|我直男|我是直男|男生啦|我爸|爸爸|當爸|要當爸|我是爸|我老婆|我太太|有老婆)/;
    const femaleHints =
      /(我是女的|我女的|我女生|我是女生|我妹|我姐|我媽|媽媽|當媽|要當媽|我是媽|我老公|我先生|有老公|我懷孕|懷孕了)/;
    let detectedGender: "M" | "F" | null = userGender;
    if (maleHints.test(text)) detectedGender = "M";
    else if (femaleHints.test(text)) detectedGender = "F";
    if (detectedGender && detectedGender !== userGender) {
      setUserGender(detectedGender);
    }

    // 累積使用者打字歷史、給 AI 推測角色用（爸爸/媽媽/工程師/學生 等）
    userHistoryRef.current = [...userHistoryRef.current, text].slice(-10);

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

    // 同時 fetch AI + 準備 fallback 安全句
    let reactions: ScriptLine[] = buildSafeCueReactions(6);
    try {
      const resp = await fetch("/api/generate-reactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: plan.scenario,
          keywords: plan.keywords,
          nickname: plan.nickname,
          userReply: text,
          userGender: detectedGender, // 傳 M / F / null
          // 首頁原 topic + 使用者所有打過的話 — AI 推測角色 / 性別用
          userTopic: plan.topic,
          userHistory: userHistoryRef.current,
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
      /* 用 fallback */
    }

    // 先 filter 招牌句已超過 PHRASE_MAX 次的、再排程
    const filteredReactions = reactions.filter((line) =>
      shouldKeepMessage(renderText(line.text, plan.nickname))
    );

    // 順序顯示 reactions（每句之間 350-1600ms gap）
    let lastId: string | null = null;
    let cursor = 600;
    filteredReactions.forEach((line, idx) => {
      const char = line.requiresGender
        ? pickByGender(plan.chars, line.requiresGender, lastId ?? undefined)
        : pickAny(plan.chars, lastId ?? undefined);
      lastId = char.id;
      const dur = typingDurationFor(line.text);
      const typingAt = Math.max(0, cursor - dur);
      const tid = `trt-${stamp}-${idx}`;

      schedule(() => {
        setTypings((arr) => [...arr, { id: tid, char }]);
      }, typingAt);
      schedule(() => {
        setTypings((arr) => arr.filter((x) => x.id !== tid));
        setItems((arr) => [
          ...arr,
          {
            kind: "msg",
            id: `rm-${stamp}-${idx}`,
            char,
            text: renderText(line.text, plan.nickname),
            ts: new Date(),
            likeCount: genLikeCount(),
          },
        ]);
      }, cursor);
      const gap =
        Math.random() < 0.4
          ? 350 + Math.random() * 400
          : 800 + Math.random() * 800;
      cursor += gap;
    });

    schedule(() => {
      setSending(false);
    }, cursor + 200);
  };

  // ─────────────────────────────────────
  // handleExtend: 「再聊 3 分鐘 NT$19」→ 看 PAYMENT_MODE 走真實 PayUni 或 fake
  // ─────────────────────────────────────
  const paymentMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || "fake";
  const handleExtend = async () => {
    if (extending) return;
    setExtending(true);

    // 真實 PayUni 流程
    if (paymentMode === "payuni") {
      try {
        const resp = await fetch("/api/payuni/create-order", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            nickname: plan?.nickname || "",
            topic: plan?.topic || "",
            mode: "extend", // 關鍵：訂單號 ext_ 前綴、return 後 redirect /chat?extend=1
          }),
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
          "續聊付款建單失敗：" +
            (e instanceof Error ? e.message : String(e)) +
            "\n請稍後再試或聯繫客服。"
        );
        setExtending(false);
        return;
      }
    }

    // 假流程（PAYMENT_MODE=fake、開發測試用）
    await new Promise((r) => setTimeout(r, 900));
    extendSession();
  };

  // 真的延長聊天室 — 不 reset、原 items 保留、+3 分鐘新流程
  const extendSession = () => {
    if (!plan) return;
    clearAllTimeouts();
    sessionStartRef.current = Date.now();
    sessionDurationRef.current = EXTEND_DURATION_MS;
    lastUserInputAtRef.current = Date.now();
    setFading(false);
    setEnded(false);
    setExtending(false);

    // 重置 paid_at（避免之後重整被踢回 /pay）
    if (typeof window !== "undefined") {
      localStorage.setItem("kl_paid_at", String(Date.now()));
    }

    // 系統訊息：又有人加入
    setItems((arr) => [
      ...arr,
      {
        kind: "system",
        id: `s-resume-${Date.now()}`,
        text: `又有 ${8 + Math.floor(Math.random() * 8)} 個人重新關注這場聊天室`,
        ts: new Date(),
      },
    ]);

    // 熱身：丟 1 句直接 @ 你「回來啦」
    const warmupLine = `@${plan.nickname || "你"} 你回來啦 我們還在等你`;
    const warmupChar = pickAny(plan.chars);
    schedule(() => {
      setItems((arr) => [
        ...arr,
        {
          kind: "msg",
          id: `rw-${Date.now()}`,
          char: warmupChar,
          text: warmupLine,
          ts: new Date(),
          likeCount: 10 + Math.floor(Math.random() * 20),
        },
      ]);
    }, 1200);

    // 排「慢慢安靜」+「結束」 — 同初始流程、用 EXTEND_DURATION_MS
    const fadeStart = EXTEND_DURATION_MS - FADE_DURATION_MS;
    schedule(() => {
      setFading(true);
      FAREWELL_LINES.forEach((line, idx) => {
        const char = pickAny(plan.chars);
        const at = idx * 6500 + 2000;
        const dur = typingDurationFor(line);
        const tid = `tfe-${idx}-${Date.now()}`;
        schedule(() => {
          setTypings((t) => [...t, { id: tid, char }]);
        }, Math.max(0, at - dur));
        schedule(() => {
          setTypings((t) => t.filter((x) => x.id !== tid));
          setItems((arr) => [
            ...arr,
            {
              kind: "msg",
              id: `fae-${idx}-${Date.now()}`,
              char,
              text: line,
              ts: new Date(),
              likeCount: 30 + Math.floor(Math.random() * 50),
            },
          ]);
        }, at);
      });
    }, fadeStart);

    schedule(() => {
      setTypings([]);
      setEnded(true);
      // 同初始流程 — 清掉殘留 schedule、避免時間線倒退
      clearAllTimeouts();
    }, EXTEND_DURATION_MS);
  };

  // ─────────────────────────────────────
  // handleReplay: 真的結束、回首頁換新心情
  // ─────────────────────────────────────
  const handleReplay = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kl_topic");
      localStorage.removeItem("kl_prepared");
      localStorage.removeItem("kl_scenario");
      localStorage.removeItem("kl_paid_at");
      // kl_nickname 保留
    }
    router.push("/");
  };

  // ─────────────────────────────────────
  // ShareCard 資料
  // ─────────────────────────────────────
  // 排除：戳心收尾（fa-/fae-）、idle ping（ip-）、續聊熱身（rw-）、純插話開頭
  // 這些放分享圖會感覺「沒誇我」、Angel 反饋過
  const isShareWorthy = (m: MsgItem): boolean => {
    if (/^(fa-|fae-|ip-|rw-)/.test(m.id)) return false; // 系統 / 收尾 / 閒置
    if (m.text.length < 10) return false; // 太短
    const trashStart = /^(\+|笑死|靠|哈哈|對對|對啊|蛤|懂|認同|心疼|幹|真的)/;
    if (trashStart.test(m.text.replace(/^@\S+\s*/, ""))) return false; // 純插話
    return true;
  };

  const shareItems: ShareMsg[] = useMemo(() => {
    if (!ended || !plan) return [];
    const picked = items
      .filter((it): it is MsgItem => it.kind === "msg")
      .filter(isShareWorthy)
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 4)
      .map((m) => ({ char: m.char, text: m.text, likeCount: m.likeCount }));

    // 不夠 4 句、用固定誇句補位（share.png 不能少於 4 句）
    if (picked.length >= 4) return picked;
    const fallbackChars = [
      { id: "fb-kai", name: "Kai", age: 26, identity: "公關", gender: "M" as const, initial: "K", gradient: ["#8b5cf6", "#6d28d9"] as [string, string] },
      { id: "fb-emma", name: "Emma", age: 24, identity: "翻譯", gender: "F" as const, initial: "E", gradient: ["#ff5fa2", "#e11d8a"] as [string, string] },
      { id: "fb-tony", name: "Tony", age: 28, identity: "工程師", gender: "M" as const, initial: "T", gradient: ["#fbbf24", "#d97706"] as [string, string] },
      { id: "fb-axiang", name: "阿翔", age: 25, identity: "自己創業", gender: "M" as const, initial: "翔", gradient: ["#4ea1f7", "#2563eb"] as [string, string] },
    ];
    const fallbackMessages: ShareMsg[] = [
      { char: fallbackChars[0], text: "認識你真好", likeCount: 2847 },
      { char: fallbackChars[1], text: "真心覺得你很棒", likeCount: 1903 },
      { char: fallbackChars[2], text: "你真是一位有趣的人", likeCount: 3216 },
      { char: fallbackChars[3], text: "我覺得你能帶給大家溫暖", likeCount: 2173 },
    ];
    // 補到 4 個
    const result = [...picked];
    for (const fb of fallbackMessages) {
      if (result.length >= 4) break;
      result.push(fb);
    }
    return result;
  }, [ended, items, plan]);

  const totalLikes = useMemo(() => {
    if (!ended) return 0;
    return items
      .filter((it): it is MsgItem => it.kind === "msg")
      .reduce((sum, m) => sum + m.likeCount, 0);
  }, [ended, items]);

  // 主金句 — 拿「直球誇」的最高愛心句（過濾戳心收尾、純插話、太短）
  const mainQuoteData = useMemo(() => {
    if (!ended) return { text: "你真是一位有趣的人", author: "小桃" };
    const cands = items
      .filter((it): it is MsgItem => it.kind === "msg")
      .filter(isShareWorthy)
      // 主金句優先選**非 @ 開頭**的（更通用、像箴言）
      .filter((m) => !m.text.startsWith("@"))
      .sort((a, b) => b.likeCount - a.likeCount);
    return {
      text: cands[0]?.text ?? "你真是一位有趣的人",
      author: cands[0]?.char.name ?? "小桃",
    };
  }, [ended, items]);

  const handleSaveImage = () => {
    if (savingImage) return;
    setSavingImage(true);
    setSaveResult(null);
    try {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
      const isIOS =
        /iPad|iPhone|iPod/.test(ua) &&
        !(window as { MSStream?: unknown }).MSStream;
      // LINE / IG / FB 內嵌 WebView — window.open 通常被 block
      const isLine = /Line\//i.test(ua);
      const isInApp = isLine || /FBAN|FBAV|Instagram/i.test(ua);

      // 從 ShareCard 內的 <img> 拿真實 src（已是含本場 4 句 overlay 的 blob URL）
      const innerImg = shareCardRef.current?.querySelector("img");
      const src = innerImg?.src || "/share.png";

      if (isInApp) {
        // LINE / IG 內嵌瀏覽器：開新分頁會被 block、直接提示長按上方預覽圖
        setSaveResult("longpress");
      } else if (isIOS) {
        // iOS Safari：<a download> 不支援、改開新分頁讓使用者長按存
        window.open(src, "_blank");
        setSaveResult("ios");
      } else {
        // Desktop / Android：用 <a download> 直接下載
        const link = document.createElement("a");
        const nick = plan?.nickname || "我";
        link.download = `誇了嗎_${nick}_${Date.now()}.png`;
        link.href = src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSaveResult("success");
      }
    } catch (e) {
      console.error("[saveImage]", e);
      setSaveResult("error");
    } finally {
      setSavingImage(false);
      setTimeout(() => setSaveResult(null), 8000);
    }
  };

  const handleHome = () => router.push("/");

  return (
    <main className="relative flex flex-col h-screen-safe overflow-hidden">
      <BottomGlow />

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
                    大家正在討論你、偷偷說、偷偷誇、也偷偷心疼。
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-white/45">
                    🔒 這裡不會洩漏你的身分・安心享受
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
            if (it.kind === "user_reply") {
              return (
                <UserReply key={it.id} nickname={it.nickname} text={it.text} />
              );
            }
            return <SystemNotice key={it.id} text={it.text} />;
          })}

          {/* 結束狀態 — 續聊 + ShareCard */}
          {ended && (
            <div className="pt-5 pb-2 animate-fade-in-up">
              <div className="text-center mb-4">
                <div className="text-[12.5px] text-white/45 mb-1.5">
                  聊天室慢慢安靜下來了……
                </div>
                <h2 className="text-[24px] sm:text-[26px] text-white font-bold leading-snug">
                  聊天室裡，
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan">
                    還有人不想離開你
                  </span>
                  。
                </h2>
                <p className="mt-2 text-[12px] text-white/50">
                  聊天室還有人在線…
                </p>
              </div>

              <button
                onClick={handleExtend}
                disabled={extending}
                className="w-full py-4 rounded-2xl text-white text-[16px] font-bold tracking-wide bg-gradient-to-r from-glow-pink via-glow-violet to-glow-cyan shadow-[0_12px_36px_-8px_rgba(255,95,162,0.65)] active:scale-[0.98] disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {extending ? "建立訂單中…" : "再聊 3 分鐘 NT$19"}
              </button>

              {shareItems.length > 0 && (
                <>
                  <div className="mt-7 text-center">
                    <div className="text-[14px] text-white/60 mb-1.5">
                      聊天室裡、有幾句話被很多人按了愛心
                    </div>
                    <div className="text-[13.5px] text-glow-pink/90 font-medium">
                      ↓ 保存這張圖、有些話值得被留下來
                    </div>
                  </div>
                  {/* ShareCard 預覽：外層加明顯漸層相框 + 厚邊 + 大陰影 */}
                  <div
                    className="mt-4 mb-3 mx-auto p-3 rounded-3xl bg-gradient-to-br from-glow-pink/35 via-glow-violet/30 to-glow-cyan/25 border-2 border-glow-pink/40 shadow-[0_20px_60px_-10px_rgba(255,95,162,0.55)]"
                    style={{ maxWidth: 380 }}
                  >
                    <ShareCard
                      ref={shareCardRef}
                      nickname={plan?.nickname || "你"}
                      mainQuote={mainQuoteData.text}
                      mainQuoteAuthor={mainQuoteData.author}
                      messages={shareItems}
                      totalLikes={totalLikes}
                    />
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={handleSaveImage}
                      disabled={savingImage}
                      className="w-full py-3.5 rounded-2xl text-white text-[15px] font-semibold bg-gradient-to-r from-glow-pink/30 to-glow-violet/30 border border-glow-pink/40 hover:from-glow-pink/40 hover:to-glow-violet/40 active:scale-[0.98] disabled:opacity-60 transition"
                    >
                      {savingImage ? "正在產生圖片…" : "📥 保存分享圖"}
                    </button>
                    {/* 保存結果提示 */}
                    {saveResult === "success" && (
                      <p className="mt-2 text-center text-[12px] text-glow-cyan animate-fade-in-up">
                        ✓ 已下載、這些話值得保存下來
                      </p>
                    )}
                    {saveResult === "ios" && (
                      <p className="mt-2 text-center text-[12px] text-glow-pink leading-relaxed animate-fade-in-up">
                        請<strong>長按圖片</strong>選「儲存到相簿」
                      </p>
                    )}
                    {saveResult === "longpress" && (
                      <p className="mt-2 text-center text-[12px] text-glow-pink leading-relaxed animate-fade-in-up">
                        請<strong>長按圖片</strong>選「儲存到相簿」
                      </p>
                    )}
                    {saveResult === "error" && (
                      <p className="mt-2 text-center text-[12px] text-glow-pink leading-relaxed animate-fade-in-up">
                        產生圖片失敗、請<strong>長按上方圖卡</strong>存到相簿
                      </p>
                    )}
                  </div>

                  {/* 底部明確離開按鈕 — Angel 反饋過「不知道怎麼回首頁」、雙重保險 */}
                  <button
                    onClick={handleReplay}
                    className="mt-6 w-full py-3 rounded-2xl text-white/75 text-[14px] font-medium hover:text-white bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.08] active:scale-[0.98] transition flex items-center justify-center gap-2"
                  >
                    ← 結束聊天、回首頁
                  </button>
                </>
              )}
            </div>
          )}

          <div ref={scrollEndRef} className="h-2" />
        </div>
      </div>

      {/* 底部 — 結束時隱藏。fading 階段也 disable、避免時間線倒退 */}
      {!ended && (
        <ChatInputBar
          onSend={handleSend}
          disabled={sending || fading}
          placeholder={
            fading ? "聊天室慢慢安靜了…" : "說點什麼、讓他們圍著你…"
          }
        />
      )}
    </main>
  );
}
