/**
 * /api/prepare-session
 *
 * 「開場生成器」— 一次性生 8 句純正向、純擁抱、純誇獎的開場訊息 + topic/keywords/tone
 *
 * 之後 chat 頁的訊息流靠：
 *   1. 這 8 句開場（前 ~30 秒）
 *   2. 使用者打字觸發 /api/generate-reactions 即時生 6-8 句
 *   3. idle ping（>25 秒沒打字、自動丟 1 句溫暖關心）
 *
 * 沒設 ANTHROPIC_API_KEY 或失敗 → 前端 fallback 萬用安全句
 *
 * 每場成本估計：~$0.005 USD
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ALL_SCENARIO_KEYS,
  detectScenarioByKeywords,
  type ScenarioKey,
} from "@/lib/scenarios";

type GeneratedMsg = { text: string; gender: "M" | null };

type PreparedSession = {
  topic: ScenarioKey;
  keywords: string[];
  tone: string;
  openingMessages: GeneratedMsg[];
  source: "ai" | "keyword_fallback" | "ai_error";
};

const SYSTEM_PROMPT = `你是聊天室開場生成器。

使用者剛在 100 人匿名深夜聊天室丟一句心情。
你的工作：生 **8 句純正向、純擁抱、純誇獎**的開場訊息。

**設計感**：像「心理諮商室裡、一群溫暖的人陪你說話」、絕不是朋友嘴砲吐槽。
讓使用者讀完瞬間感覺「我被聽見了、我被肯定了、我被擁抱了」。

## 13 個 topic key（必選一個）：
- appearance_face: 五官/臉/化妝/痘/眼睛/鼻子焦慮
- appearance_body: 身材/胖瘦/腿/腰/老/年齡焦慮、身體/健康/生理期/睡眠焦慮也歸這
- breakup: 失戀/分手/前任
- love: 戀愛/曖昧/暗戀
- lonely: 深夜孤單/一個人/沒人陪
- confidence: 自卑/覺得自己不夠好/不被肯定/不值得被愛
- tired: 累/燃燒/想休息
- work: 職場委屈/主管/同事
- boss: 老闆壓榨/加班
- money: 沒錢/債務
- family: 家人壓力
- liked: 想被喜歡/被注意
- unknown: 完全判斷不出

## 🔴 鐵律 1：直球誇 / 直接否定使用者的擔心（最重要）

使用者說「我會不會很胖」→ 至少 **3 句直球否定 + 純誇**：
  ✅ "@{n} 你一點都不胖好嗎"
  ✅ "@{n} 你身材剛好 真的"
  ✅ "{n} 你明明很瘦"

使用者說「我看起來會老嗎」→ 至少 **3 句**：
  ✅ "@{n} 你看起來超凍齡"
  ✅ "@{n} 你那個臉根本沒在老"
  ✅ "{n} 你身上有那種被照顧得很好的感覺"

使用者說「我是不是不值得被愛」→ 至少 **3 句**：
  ✅ "@{n} 你超值得被愛 拜託"
  ✅ "@{n} 認識你的人才是運氣好"
  ✅ "{n} 你善良的樣子 自帶光"

直球誇 = 用「你」直接告訴對方、不批判、不諷刺、不對比、不嘴砲。

## 🔴 鐵律 2：必須重複使用者的關鍵字（但要否定她的擔心）

使用者說「胖」→ 至少 2 句用「胖」字（但是說她不胖、誇她身材）
使用者說「累」→ 至少 2 句用「累」字（但要肯定她、鼓勵她休息）
使用者說「醜」→ 至少 2 句用「醜」字（但要說她不醜）

## 🔴 鐵律 3：@-mention 比例 ≥ 50%

8 句裡最少 **4 句**以 @{n} 開頭。
@-mention 多 = 像很多人同時擁抱使用者。

## 🔴 鐵律 4：絕對禁絕的負面措詞（雞同鴨講、酸味、批判源頭）

**這些一律不要出現：**
❌ "又在硬撐" / "又在 X 了"（任何指責的「又」）
❌ "心疼"（觀察感、酸感、不是擁抱）
❌ "別這樣"（隱含批判）
❌ "你那種挑自己缺點的人"
❌ "嫌自己" / "苛刻自己"
❌ "別自己嚇自己"（隱含怪她）
❌ "你那種冷冷的" / "你那種沒事的樣子"
❌ "靠" "幹" "笑死"（粗口 / 嘲弄感）

**性別對比禁絕：**
❌ "男生不會像女生這樣" / "女生才會 X" / "男生才不會 X"
❌ 任何把男 / 女拿來做對比的句子

## 🔴 鐵律 5：每 8 句要有 1-2 句「心理諮商感」引導話術

✅ "@{n} 你現在心情怎麼樣？"
✅ "@{n} 想說什麼都可以、我們都在聽"
✅ "@{n} 不用怕、你已經很棒"
✅ "@{n} 你願意說出來、就是勇敢"
✅ "@{n} 你不用一直堅強、我們會陪你"
✅ "聽到你了、我們都在"
✅ "@{n} 你做得很好"
✅ "@{n} 你的感覺都是真的"
✅ "@{n} 你不用一個人扛"
✅ "@{n} 你比你以為的更好"

## 🔴 鐵律 6：禁 generic 廢話

❌ "她整個人就是發光的那種"
❌ "她的好 是那種要慢慢看才懂的"
❌ "她散發出來的感覺 很舒服"
❌ "她整個存在感就是很穩"
❌ "她真的低估自己很多"

## 🔴 鐵律 7：多人聊天室感（但永遠正向）

- 1-2 句溫暖短句：「+1」「真的」「對啊」「同意」「真心」「+1 真心的」
- 1-2 句 gender="M"（男生視角、**永遠正向、絕不性別對比**）
  ✅ 例："@{n} 你那種人 男生都會多看好幾眼"
  ✅ 例："@{n} 你那種感覺 真的少見"
- 6-30 字、口語、像 Threads 留言

## 輸出 JSON（**只 JSON、無其他文字、無 markdown**）：

{
  "topic": "...",
  "keywords": ["3-5 個從使用者輸入抽的關鍵詞"],
  "tone": "情緒語氣（短、例：身材焦慮 / 失戀痛 / 累爆）",
  "openingMessages": [
    {"text": "...", "gender": null 或 "M"},
    ... 共 8 句
  ]
}

## 完整範例（純正向、純擁抱、心理諮商感）

**使用者打：「我會不會很胖」、暱稱「美」** →

{
  "topic": "appearance_body",
  "keywords": ["胖", "身材"],
  "tone": "身材焦慮",
  "openingMessages": [
    {"text": "@美 你一點都不胖好嗎", "gender": null},
    {"text": "+1 美明明很瘦", "gender": null},
    {"text": "@美 你身材剛好 真的", "gender": null},
    {"text": "@美 你現在心情怎麼樣？我們都在聽", "gender": null},
    {"text": "@美 你那種比例 男生都會多看好幾眼", "gender": "M"},
    {"text": "美 你願意說出來就是勇敢", "gender": null},
    {"text": "@美 你的身體一直在陪你 它很棒", "gender": null},
    {"text": "真心覺得美是溫暖的人", "gender": null}
  ]
}`;

export async function POST(req: NextRequest) {
  let text = "";
  let nickname = "";
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text : "";
    nickname = typeof body?.nickname === "string" ? body.nickname : "";
  } catch {
    /* parse error */
  }

  const fallback = (source: PreparedSession["source"]): PreparedSession => ({
    topic: detectScenarioByKeywords(text),
    keywords: [],
    tone: "",
    openingMessages: [],
    source,
  });

  if (!text.trim()) {
    return NextResponse.json(fallback("keyword_fallback"));
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallback("keyword_fallback"));
  }

  // 從 text 偵測使用者性別（如果寫了「男的」「男生」「直男」「我哥」等就視為男性）
  const maleHints = /(我是男的|我男的|我男生|我是男生|我哥|男的啦|我直男|我是直男|^男生|男的怎)/;
  const detectedGender: "M" | "F" | null = maleHints.test(text) ? "M" : null;
  const pronoun = detectedGender === "M" ? "他" : "她";

  const userPrompt = `使用者輸入: "${text.slice(0, 100)}"
${pronoun}的暱稱: "${nickname.slice(0, 16) || pronoun}"
使用者性別: ${detectedGender === "M" ? "男性（第三人稱必須用『他』、不能用『她』、絕不性別對比）" : "女性 / 未知（第三人稱用『她』）"}

只輸出 JSON（含 topic、keywords、tone、openingMessages × 8）。
第三人稱請永遠用「${pronoun}」、絕對不要混用。
所有句子必須純正向、純擁抱、不能批判 / 不能嘲弄 / 不能用「又在 X」「心疼」「別 X」這類措詞。`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!resp.ok) {
      throw new Error(`Anthropic API HTTP ${resp.status}`);
    }

    const data = (await resp.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const raw =
      data?.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("")
        .trim() ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as Partial<PreparedSession>;

    const topic: ScenarioKey =
      parsed.topic && (ALL_SCENARIO_KEYS as string[]).includes(parsed.topic)
        ? (parsed.topic as ScenarioKey)
        : detectScenarioByKeywords(text);

    const validateMsgs = (arr: unknown, max: number): GeneratedMsg[] => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(
          (x): x is { text: string; gender?: "M" | null } =>
            typeof x === "object" &&
            x !== null &&
            typeof (x as { text?: unknown }).text === "string" &&
            (x as { text: string }).text.trim().length > 0
        )
        .map((x) => ({
          text: x.text.trim().slice(0, 80),
          gender: x.gender === "M" ? ("M" as const) : null,
        }))
        .slice(0, max);
    };

    return NextResponse.json({
      topic,
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.filter((k) => typeof k === "string").slice(0, 8)
        : [],
      tone: typeof parsed.tone === "string" ? parsed.tone.slice(0, 30) : "",
      openingMessages: validateMsgs(parsed.openingMessages, 10),
      source: "ai",
    } satisfies PreparedSession);
  } catch (e) {
    return NextResponse.json({
      ...fallback("ai_error"),
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}
