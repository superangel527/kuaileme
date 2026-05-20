export type Gender = "M" | "F";

export type Character = {
  id: string;
  name: string;
  age: number;
  identity: string;
  gender: Gender;
  initial: string;
  gradient: [string, string];
  emoji?: string;
};

const G = {
  pink: ["#ff5fa2", "#8b5cf6"] as [string, string],
  violet: ["#8b5cf6", "#22d3ee"] as [string, string],
  cyan: ["#22d3ee", "#3b82f6"] as [string, string],
  amber: ["#fbbf24", "#f97316"] as [string, string],
  rose: ["#fb7185", "#ef4444"] as [string, string],
  mint: ["#34d399", "#10b981"] as [string, string],
  indigo: ["#6366f1", "#312e81"] as [string, string],
  fuchsia: ["#e879f9", "#a21caf"] as [string, string],
  sky: ["#38bdf8", "#0ea5e9"] as [string, string],
  lime: ["#a3e635", "#65a30d"] as [string, string],
  night: ["#1e1b4b", "#312e81"] as [string, string],
  peach: ["#fda4af", "#fb923c"] as [string, string],
  cream: ["#fde68a", "#fca5a5"] as [string, string],
};

export const CHARACTERS: Character[] = [
  { id: "c01", name: "小宇", age: 21, identity: "大學生", gender: "M", initial: "宇", gradient: G.pink, emoji: "🎧" },
  { id: "c02", name: "Yuna", age: 24, identity: "服飾店店員", gender: "F", initial: "Y", gradient: G.violet },
  { id: "c03", name: "阿哲", age: 27, identity: "工程師", gender: "M", initial: "哲", gradient: G.cyan },
  { id: "c04", name: "曉曉", age: 23, identity: "插畫家", gender: "F", initial: "曉", gradient: G.fuchsia, emoji: "🎨" },
  { id: "c05", name: "Mia", age: 29, identity: "行銷企劃", gender: "F", initial: "M", gradient: G.rose },
  { id: "c06", name: "阿凱", age: 32, identity: "健身教練", gender: "M", initial: "凱", gradient: G.amber },
  { id: "c07", name: "靜怡", age: 35, identity: "護理師", gender: "F", initial: "怡", gradient: G.mint },
  { id: "c08", name: "Leo", age: 31, identity: "攝影師", gender: "M", initial: "L", gradient: G.indigo, emoji: "📷" },
  { id: "c09", name: "婷婷", age: 38, identity: "單親媽媽", gender: "F", initial: "婷", gradient: G.pink },
  { id: "c10", name: "阿翔", age: 41, identity: "自己創業", gender: "M", initial: "翔", gradient: G.cyan },
  { id: "c11", name: "Ruby", age: 28, identity: "酒吧調酒師", gender: "F", initial: "R", gradient: G.fuchsia, emoji: "🍸" },
  { id: "c12", name: "小卷", age: 22, identity: "咖啡店打工", gender: "F", initial: "卷", gradient: G.amber, emoji: "☕" },
  { id: "c13", name: "Vivian", age: 33, identity: "外商業務", gender: "F", initial: "V", gradient: G.violet },
  { id: "c14", name: "阿德", age: 36, identity: "離婚男", gender: "M", initial: "德", gradient: G.indigo },
  { id: "c15", name: "Coco", age: 26, identity: "彩妝師", gender: "F", initial: "C", gradient: G.rose, emoji: "💄" },
  { id: "c16", name: "宥廷", age: 25, identity: "研究所學生", gender: "M", initial: "廷", gradient: G.sky },
  { id: "c17", name: "Linda", age: 42, identity: "離婚女", gender: "F", initial: "L", gradient: G.pink },
  { id: "c18", name: "阿洋", age: 30, identity: "餐廳老闆", gender: "M", initial: "洋", gradient: G.amber },
  { id: "c19", name: "小慈", age: 27, identity: "幼教老師", gender: "F", initial: "慈", gradient: G.mint, emoji: "🌷" },
  { id: "c20", name: "Kai", age: 34, identity: "建築師", gender: "M", initial: "K", gradient: G.cyan },
  { id: "c21", name: "夏夏", age: 23, identity: "Threads 寫手", gender: "F", initial: "夏", gradient: G.fuchsia, emoji: "✨" },
  { id: "c22", name: "信宏", age: 39, identity: "中年男", gender: "M", initial: "宏", gradient: G.indigo },
  { id: "c23", name: "Emma", age: 30, identity: "翻譯", gender: "F", initial: "E", gradient: G.violet },
  { id: "c24", name: "阿青", age: 28, identity: "髮型師", gender: "M", initial: "青", gradient: G.rose, emoji: "✂️" },
  { id: "c25", name: "Hana", age: 26, identity: "瑜珈老師", gender: "F", initial: "H", gradient: G.mint, emoji: "🧘" },
  { id: "c26", name: "子睿", age: 31, identity: "金融業", gender: "M", initial: "睿", gradient: G.sky },
  { id: "c27", name: "小桃", age: 24, identity: "甜點師", gender: "F", initial: "桃", gradient: G.peach, emoji: "🍑" },
  { id: "c28", name: "阿森", age: 37, identity: "二寶爸", gender: "M", initial: "森", gradient: G.amber },
  { id: "c29", name: "Nico", age: 29, identity: "DJ", gender: "M", initial: "N", gradient: G.violet, emoji: "🎶" },
  { id: "c30", name: "曼曼", age: 33, identity: "心理諮商師", gender: "F", initial: "曼", gradient: G.night, emoji: "🌙" },
  { id: "c31", name: "阿翰", age: 26, identity: "外送員", gender: "M", initial: "翰", gradient: G.cyan, emoji: "🛵" },
  { id: "c32", name: "Selina", age: 35, identity: "公關", gender: "F", initial: "S", gradient: G.rose },
  { id: "c33", name: "建宏", age: 44, identity: "餐廳主廚", gender: "M", initial: "建", gradient: G.indigo, emoji: "🍳" },
  { id: "c34", name: "莉莉", age: 28, identity: "藥師", gender: "F", initial: "莉", gradient: G.mint, emoji: "💊" },
  { id: "c35", name: "Tony", age: 30, identity: "業務副理", gender: "M", initial: "T", gradient: G.sky },
  { id: "c36", name: "阿純", age: 36, identity: "自由工作者", gender: "F", initial: "純", gradient: G.amber },
  { id: "c37", name: "可可", age: 22, identity: "聲樂系學生", gender: "F", initial: "可", gradient: G.pink, emoji: "🎤" },
  { id: "c38", name: "Jay", age: 32, identity: "獨立樂手", gender: "M", initial: "J", gradient: G.violet, emoji: "🎸" },
  { id: "c39", name: "婕婕", age: 27, identity: "編劇", gender: "F", initial: "婕", gradient: G.fuchsia },
  { id: "c40", name: "阿龍", age: 40, identity: "司機大哥", gender: "M", initial: "龍", gradient: G.indigo, emoji: "🚖" },
  { id: "c41", name: "Ariel", age: 31, identity: "空服員", gender: "F", initial: "A", gradient: G.cyan, emoji: "✈️" },
  { id: "c42", name: "小銘", age: 29, identity: "業務", gender: "M", initial: "銘", gradient: G.lime },
  { id: "c43", name: "玟玟", age: 34, identity: "二寶媽", gender: "F", initial: "玟", gradient: G.cream, emoji: "🍼" },
  { id: "c44", name: "阿仁", age: 45, identity: "中年大叔", gender: "M", initial: "仁", gradient: G.amber, emoji: "🍺" },
  { id: "c45", name: "Cindy", age: 26, identity: "前台行政", gender: "F", initial: "C", gradient: G.violet },
  { id: "c46", name: "宥安", age: 24, identity: "正在找工作", gender: "M", initial: "安", gradient: G.sky },
  { id: "c47", name: "Patty", age: 38, identity: "工作室老闆", gender: "F", initial: "P", gradient: G.fuchsia },
  { id: "c48", name: "阿凡", age: 33, identity: "工程經理", gender: "M", initial: "凡", gradient: G.cyan },
  { id: "c49", name: "Megan", age: 27, identity: "獸醫助理", gender: "F", initial: "M", gradient: G.mint, emoji: "🐶" },
  { id: "c50", name: "子涵", age: 25, identity: "正在實習", gender: "F", initial: "涵", gradient: G.pink },
  { id: "c51", name: "Eric", age: 36, identity: "創業者", gender: "M", initial: "E", gradient: G.indigo, emoji: "💼" },
  { id: "c52", name: "小芸", age: 30, identity: "電商選品", gender: "F", initial: "芸", gradient: G.rose },
  { id: "c53", name: "阿諺", age: 23, identity: "重考生", gender: "M", initial: "諺", gradient: G.lime },
];

export function pickRandomCharacters(count: number): Character[] {
  const pool = [...CHARACTERS];
  const out: Character[] = [];
  while (out.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function pickRandomCharacter(exclude?: string): Character {
  const pool = exclude ? CHARACTERS.filter((c) => c.id !== exclude) : CHARACTERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickByGender(
  pool: Character[],
  gender: Gender,
  excludeId?: string
): Character {
  const filtered = pool.filter(
    (c) => c.gender === gender && c.id !== excludeId
  );
  if (filtered.length === 0) {
    const fallback = excludeId
      ? pool.filter((c) => c.id !== excludeId)
      : pool;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function pickAny(pool: Character[], excludeId?: string): Character {
  const filtered = excludeId ? pool.filter((c) => c.id !== excludeId) : pool;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
