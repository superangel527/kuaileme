// 13 個情境 keys — 對應 /api/classify 回傳值
export type ScenarioKey =
  | "appearance_face"   // 五官外表焦慮
  | "appearance_body"   // 身材焦慮
  | "love"              // 甜甜曖昧 / 戀愛 / 暗戀
  | "breakup"           // 失戀
  | "money"             // 沒錢壓力
  | "work"              // 職場委屈
  | "boss"              // 被老闆壓榨
  | "family"            // 家人壓力
  | "lonely"            // 深夜孤單
  | "confidence"        // 低自信
  | "tired"             // 疲憊想被安慰
  | "liked"             // 想被喜歡
  | "unknown";          // 模糊共感（fallback）

export const ALL_SCENARIO_KEYS: ScenarioKey[] = [
  "appearance_face",
  "appearance_body",
  "love",
  "breakup",
  "money",
  "work",
  "boss",
  "family",
  "lonely",
  "confidence",
  "tired",
  "liked",
  "unknown",
];

// 關鍵字 fallback — 當 /api/classify 沒回應或沒有 API key 時用
// 規則：分數最高的 key 勝出；全部 0 → unknown
const KEYWORD_TABLE: Record<ScenarioKey, string[]> = {
  appearance_face: [
    "醜", "鼻子", "眼睛", "嘴", "下巴", "臉大", "臉小", "顏值", "妝", "皮膚", "痘", "黑眼圈", "雙眼皮", "好看嗎", "難看", "五官",
  ],
  appearance_body: [
    "胖", "瘦", "腿", "屁股", "胸", "身材", "減肥", "肥", "肉", "腰", "粗", "矮", "體重", "BMI", "贅肉",
  ],
  love: [
    "男友", "女友", "男朋友", "女朋友", "戀愛", "在一起", "曖昧", "對象", "約會",
    "心動", "暗戀", "喜歡他", "喜歡她", "追", "表白", "心儀", "他喜歡", "她喜歡",
    "告白", "牽手", "曖昧期", "心情", // careful: 心情 too generic, but keep low
  ],
  breakup: [
    "失戀", "分手", "前任", "前男友", "前女友", "被甩", "心碎", "心痛", "斷聯", "復合", "走不出來", "忘不了",
  ],
  money: [
    "窮", "沒錢", "破產", "負債", "房租", "貸款", "薪水", "錢", "繳不出", "存款", "信用卡", "卡費", "經濟",
  ],
  work: [
    "主管", "同事", "上班", "公司", "離職", "辭職", "客戶", "被欺負", "被罵", "委屈", "工作",
  ],
  boss: [
    "老闆", "加班", "勒索", "壓榨", "過勞", "燃燒", "責任制", "免費加班",
  ],
  family: [
    "爸媽", "媽媽", "爸爸", "家人", "親戚", "婆婆", "家庭", "結婚", "生小孩", "懂事", "期待", "單親",
  ],
  lonely: [
    "孤單", "一個人", "沒人陪", "深夜", "睡不著", "失眠", "好孤", "好寂寞", "想找人聊",
  ],
  confidence: [
    "不夠好", "自卑", "笨", "沒用", "廢", "失敗", "魯蛇", "差勁", "比不上", "內耗", "否定自己", "我很糟",
  ],
  tired: [
    "累", "疲", "撐", "倦", "想睡", "沒力", "崩潰", "撐不住", "想休息", "好累", "燃燒殆盡", "burnout",
  ],
  liked: [
    "被喜歡", "被愛", "被在乎", "被注意", "想被", "沒人喜歡", "孤獨", "陪",
  ],
  unknown: [],
};

export function detectScenarioByKeywords(input: string): ScenarioKey {
  if (!input || !input.trim()) return "unknown";
  const text = input.trim();
  const scored: { key: ScenarioKey; hits: number }[] = (Object.keys(
    KEYWORD_TABLE
  ) as ScenarioKey[])
    .filter((k) => k !== "unknown")
    .map((key) => ({
      key,
      hits: KEYWORD_TABLE[key].reduce(
        (acc, kw) => (text.includes(kw) ? acc + 1 : acc),
        0
      ),
    }));
  scored.sort((a, b) => b.hits - a.hits);
  if (scored[0] && scored[0].hits > 0) return scored[0].key;
  return "unknown";
}

// 對外的主要入口 — 給 API route fallback 或舊程式碼相容用
export function detectScenario(input: string): ScenarioKey {
  return detectScenarioByKeywords(input);
}
