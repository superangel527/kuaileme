/**
 * /api/prepare-session
 *
 * 「開場生成器」— 一次性生 8 句開場訊息 + topic/keywords/tone
 *
 * 之後 chat 頁的訊息流靠：
 *   1. 這 8 句開場（前 ~30 秒）
 *   2. 使用者打字觸發 /api/generate-reactions 即時生 6-8 句
 *   3. idle ping（>25 秒沒打字、自動丟 1 句「@{n} 還在嗎」維持活躍）
 *
 * 沒設 ANTHROPIC_API_KEY 或失敗 → 前端 fallback 萬用安全句
 *
 * 每場成本估計：~$0.005 USD（從原本 $0.015 砍 67%）
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
你的工作：生 **8 句開場訊息**、模擬聊天室裡的人剛看到她那句話、馬上接話討論她。

之後她會自由打字、由另一個 API 負責即時生反應。
你只負責**第一波 8 句開場**、設定氣氛、讓她瞬間感覺「被注意到 + 被擁抱」。

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

## 🔴 鐵律 1：直球誇 / 直球否定（最重要）

她說「我會不會很胖」→ 至少 **3 句直接否定**：
  ✅ "@{n} 你一點都不胖好嗎"
  ✅ "@{n} 你身材剛好 真的"
  ✅ "{n} 你明明很瘦 別自己嚇自己"

她說「我看起來會老嗎」→ 至少 **3 句**：
  ✅ "@{n} 你哪有老 你超凍齡"
  ✅ "@{n} 你那個臉根本沒在老的"

她說「我是不是不值得被愛」→ 至少 **3 句**：
  ✅ "@{n} 你超值得被愛 拜託"
  ✅ "@{n} 你那種人 誰不愛"

直球誇 = 用「你」直接告訴她、不是旁觀觀察。

## 🔴 鐵律 2：必須重複她的關鍵字

她說「胖」→ 至少 2 句要用「胖」字
她說「累」→ 至少 2 句要用「累」字
她說「醜」→ 至少 2 句要用「醜」字
不能避開她的字、不能換成抽象說法。

## 🔴 鐵律 3：@-mention 比例 ≥ 50%

8 句裡最少 **4 句**以 @{n} 開頭。
@-mention 多 = 像很多人同時擁抱她。

## 🔴 鐵律 4：禁 generic 廢話

❌ "她整個人就是發光的那種"
❌ "她的好 是那種要慢慢看才懂的"
❌ "她散發出來的感覺 很舒服"
❌ "她整個存在感就是很穩"
❌ "她真的低估自己很多"

這些抽象套話會雞同鴨講。永遠用她剛說的字、永遠直球。

## 🔴 鐵律 5：多人聊天室感

- 1-2 句短插話：「+1」「靠 真的」「心疼」「+1 認真的」「笑死她真的」
- 1-2 句 gender="M"（男生視角、例：「@{n} 你那種比例 男生超吃」）
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

## 完整範例

**她打：「我會不會很胖」、暱稱「美」** →

{
  "topic": "appearance_body",
  "keywords": ["胖", "身材焦慮"],
  "tone": "身材焦慮",
  "openingMessages": [
    {"text": "@美 你一點都不胖好嗎", "gender": null},
    {"text": "靠 她明明很瘦", "gender": null},
    {"text": "@美 你身材剛好 真的", "gender": null},
    {"text": "美 又在嫌自己胖了齁 別這樣", "gender": null},
    {"text": "@美 你那種比例 男生超吃", "gender": "M"},
    {"text": "+1 她真的不胖 別亂講", "gender": null},
    {"text": "@美 你的問題不是胖 是太苛刻自己", "gender": null},
    {"text": "心疼 她常常照鏡子挑缺點齁", "gender": null}
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

  const userPrompt = `使用者輸入: "${text.slice(0, 100)}"
她的暱稱: "${nickname.slice(0, 16) || "她"}"

只輸出 JSON（含 topic、keywords、tone、openingMessages × 8）。`;

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
