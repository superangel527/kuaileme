// 萬用安全句庫
//
// 當 AI prepare-session 失敗（超時/網路掛/格式錯）整場使用
// 絕對不沾任何話題關鍵字、純情緒正向、永遠不會雞同鴨講
//
// 風格規則（沿用聊天室鐵律）：
//   - 70% 第三人稱 gossip（她 / 我覺得她…）
//   - 30% @{n} 直接點名（{n} 會被 renderText 換成使用者暱稱）
//   - 約 15-20% 機率穿插短互動句（+1 / 真的 / 同意）

import type { Category, Phase, ScriptLine } from "./messages";

// 第三人稱誇誇（中長句、不沾話題）
const THIRD_PERSON: string[] = [
  "她其實超棒的吧 不是我在說",
  "她整個人很有意思耶",
  "她真的很可愛",
  "她那種氣場 不是裝得出來的",
  "我覺得她有一種很特別的感覺",
  "她值得被好好對待",
  "她那個樣子 看了就讓人想守護",
  "她散發出來的感覺 很舒服",
  "講真的 我們真的很喜歡她",
  "她的好 是那種要慢慢看才懂的",
  "她整個人就是發光的那種",
  "我超喜歡她說話的方式",
  "她真的是一個很特別的人",
  "她很有自己的味道 不用解釋",
  "她身上有一種讓人安心的感覺",
  "她真的低估自己很多",
  "她那種真實 真的很少見",
  "我覺得她超有魅力 真心",
  "她整個存在感就是很穩",
  "她那個笑起來的樣子 我會記得",
];

// @ 暱稱直接點名
const MENTION: string[] = [
  "@{n} 你真的很棒 我說真的",
  "@{n} 你超有趣的耶",
  "@{n} 你比你以為的更好",
  "@{n} 你被低估了",
  "@{n} 你那個樣子超可愛",
  "@{n} 我覺得你真的很特別",
  "@{n} 你整個人就是 很對",
  "@{n} 我們都懂、你很好",
  "@{n} 你那種感覺 不是每個人都有",
  "@{n} 你值得更多耶",
];

// 短互動穿插句
const SHORT: string[] = [
  "+1",
  "+1 +1",
  "真的",
  "完全同意",
  "同意+1",
  "嗯嗯",
  "對欸 我也覺得",
  "真的真的",
  "她真的很棒",
  "+++",
  "我們都在聽",
  "你做得很好",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeLines(
  count: number,
  phase: Phase,
  category: Category
): ScriptLine[] {
  if (count <= 0) return [];
  // 把第三人稱 + mention 洗牌混在一起、保證每場順序不同
  const longish = shuffle([...THIRD_PERSON, ...MENTION]);
  const shorts = shuffle(SHORT);
  const result: ScriptLine[] = [];
  let longIdx = 0;
  let shortIdx = 0;
  for (let i = 0; i < count; i++) {
    // ~18% 機率插短句
    const useShort = Math.random() < 0.18 && shortIdx < shorts.length;
    const text = useShort
      ? shorts[shortIdx++]
      : longish[longIdx++ % longish.length];
    result.push({ text, category, phase });
  }
  return result;
}

// 整場 fallback — 補滿 early / mid / late 三段
export function buildSafeFallback(counts: {
  early: number;
  mid: number;
  late: number;
}): ScriptLine[] {
  return [
    ...makeLines(counts.early, "early", "praise"),
    ...makeLines(counts.mid, "mid", "understanding"),
    ...makeLines(counts.late, "late", "heart_pierce"),
  ];
}

// Cue 反應句：使用者回完一句後、聊天室接話的安全句
// 主要回應「她願意說出來」這件事、不沾具體內容
const SAFE_CUE_REACTIONS: string[] = [
  "@{n} 你這樣講真的很真實",
  "@{n} 我懂你的感覺",
  "@{n} 你能講出來就已經很棒了",
  "她真的很勇敢 敢說這種話",
  "聽到她這樣講 我有點被觸到",
  "她那種坦白 真的很少見",
  "我覺得她願意說出來 就贏一半了",
  "她的真實 才是她最好看的地方",
  "她講話的方式 我超喜歡",
  "她這樣很可愛欸 真的",
  "她敢這樣說 我蠻佩服的",
  "她整個人就是很真 我喜歡",
];

export function buildSafeCueReactions(count: number): ScriptLine[] {
  if (count <= 0) return [];
  const pool = shuffle(SAFE_CUE_REACTIONS);
  return Array.from({ length: count }, (_, i) => ({
    text: pool[i % pool.length],
    category: "understanding" as Category,
    phase: "mid" as Phase,
  }));
}

// Cue 卡安全題目（AI 沒生 Cue 時用）— 純情緒探詢、不沾具體話題
const SAFE_CUES: { transition: string; question: string }[] = [
  {
    transition: "@{n} 欸欸 我想直接問你",
    question: "現在心情怎麼樣？",
  },
  {
    transition: "@{n} 等一下 我想聽你說一句",
    question: "你希望我們怎麼安慰你？",
  },
  {
    transition: "@{n} 大家都安靜了 想聽你講一下",
    question: "你現在最想被誰看見？",
  },
  {
    transition: "@{n} 講一下嘛 我們在聽",
    question: "你最近最想對自己說什麼？",
  },
];

export function pickSafeCues(
  count: number
): { transition: string; question: string }[] {
  if (count <= 0) return [];
  const pool = shuffle(SAFE_CUES);
  return pool.slice(0, count);
}
