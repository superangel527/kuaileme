/**
 * /api/prepare-session
 *
 * 使用者付款後、進聊天室前呼叫的「定調」endpoint。
 * 一次回傳：
 *   - topic: 13 個情境之一
 *   - keywords: 3-5 個從輸入抽到的關鍵字
 *   - tone: 情緒語氣描述
 *   - earlyMessages: 10 句「圍繞那句話」的爆發期訊息（最重要、第一分鐘決定沉浸感）
 *   - hearts: 2 句最後戳心收尾句
 *
 * 用 Claude Haiku 4.5 一次生成、節省 roundtrip 跟 token。
 *
 * 沒設 ANTHROPIC_API_KEY 或 API 失敗時 → 回傳空陣列、前端 fallback 到純池子。
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
  earlyMessages: GeneratedMsg[];
  hearts: GeneratedMsg[];
  source: "ai" | "keyword_fallback" | "ai_error";
};

const SYSTEM_PROMPT = `你是「聊天室 gossip 模擬器」。

使用者剛在一個匿名深夜聊天室丟了一句心情進來。
你的工作：模擬「一群人在聊天室裡圍著她討論」的瞬間。

## 13 個 topic key：
- appearance_face: 五官/臉/化妝/痘/眼睛/鼻子焦慮
- appearance_body: 身材/胖瘦/腿/腰/拍照焦慮、**身體/健康/生理期/睡眠焦慮也歸這**
- breakup: 失戀/分手/前任
- love: 戀愛/曖昧/暗戀/喜歡某人
- lonely: 深夜孤單/一個人/沒人陪
- confidence: 自卑/覺得自己不夠好/不被肯定
- tired: 累/燃燒/想休息
- work: 職場委屈/主管/同事
- boss: 老闆壓榨/加班/過勞
- money: 沒錢/房租/債務
- family: 家人壓力/爸媽期待/家人吵架
- liked: 想被喜歡/被注意/沒人理我
- unknown: 完全判斷不出（**最後選項、盡量歸到上面 12 個**）

## 輸出 JSON（**只輸出 JSON、沒有其他文字、沒有 markdown**）：

{
  "topic": "...",
  "keywords": ["3-5 個從使用者輸入直接抽出的關鍵詞（必須出現在訊息中）"],
  "tone": "情緒語氣描述（短、例：低自信/失戀痛/職場委屈）",
  "earlyMessages": [
    {"text": "...", "gender": null 或 "M"},
    ... 10 句
  ],
  "hearts": [
    {"text": "...", "gender": null},
    {"text": "...", "gender": null}
  ]
}

## 訊息嚴格規則：

### 🔴 鐵律 1：必須重複使用者的關鍵字（最少 5 句直接出現）
使用者打「**我生理期沒來怎麼辦**」→ 訊息要直接用「生理期」這個詞。
使用者打「**我會不會很胖**」→ 訊息要直接用「胖」。
使用者打「**我失戀了**」→ 訊息要用「失戀」「他」「分手」。
**不能只用 generic 同義詞迴避**。

### 🔴 鐵律 2：人稱混搭（70% 第三人稱 + 30% @-mention 直接對她說）
**第三人稱（70%）** — gossip 感：
- "{n} 是不是又在硬撐"
- "她那種一直挑自己的人最累"

**@-mention 直接對她說（30%）** — 像有人在群組裡直接點名她：
- "@{n} 妳會不會其實很在意"
- "{n} 妳也太誇張了吧"
- "@{n} 妳是不是真的有點不舒服"
**這不是 AI 客服**、是聊天室裡有人對她大喊一聲。

### 🔴 鐵律 3：每句必須圍繞使用者那句話的主題/關鍵字/場景
**絕對禁止 generic**：「她很努力」「她值得被愛」「她只是太累了」「她是不是壓力很大」「她那種人最讓人想保護」 — 這種沒指涉主題的句子全部禁止。

### 其他規則：
- 用 {n} 代表她的暱稱（前端會換）
- 自然 Threads 留言區口語、6-30 字
- earlyMessages 可混 2-3 句純插話：「哈哈」「+1 我懂」「靠」「笑死」「心疼」「蛤」「+1 認真的」
- earlyMessages 可有 2-3 句 gender: "M"（男生視角）
- hearts 是最後 2 句戳心、要深、要圍繞主題

## 正確範例

**使用者：「我會不會很胖」** →
- "{n} 是不是最近又不太敢拍照了"
- "@{n} 妳真的不胖好嗎"
- "很多女生明明不胖卻一直嫌自己**胖**"
- "{n} 那種一直挑自己缺點的人最讓人心疼"
- "靠 心疼"
- "{n} 是不是穿什麼都要試半天"
- "@{n} 妳也太誇張了 妳超瘦的"
- "+1 我懂這種"
- "{n} 應該停止用照片裡的角度判斷自己"
- "她是不是怕鏡頭斜的時候顯臉大"

**使用者：「我生理期沒來怎麼辦」** →
- "@{n} **生理期沒來**是不是壓力太大了"
- "{n} 最近是不是熬夜熬太兇"
- "**生理期**不準真的會讓人焦慮死"
- "@{n} 妳要不要先驗一下沒事就好"
- "{n} 平常有沒有好好吃飯"
- "心疼 我之前也這樣"
- "**生理期**亂掉通常跟壓力有關"
- "@{n} 妳最近是不是心事很多"
- "{n} 那種事都自己消化的人最危險"
- "+1 真的要照顧自己"

**使用者：「我失戀了」** →
- "@{n} 別撐了哭出來吧"
- "**失戀**真的超痛"
- "{n} 是不是還在偷看他限動"
- "他配不上{n} 真的"
- "@{n} 妳付出真的太多了"
- "心疼{n}"
- "他根本不知道他失去什麼"
- "@{n} 妳這次要好好對自己"
- "+1 那種人沒人選了"
- "{n} 值得一個會珍惜的人"`;

export async function POST(req: NextRequest) {
  let text = "";
  let nickname = "";
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text : "";
    nickname = typeof body?.nickname === "string" ? body.nickname : "";
  } catch {
    // parse error → return minimal fallback
  }

  const fallback = (source: PreparedSession["source"]): PreparedSession => ({
    topic: detectScenarioByKeywords(text),
    keywords: [],
    tone: "",
    earlyMessages: [],
    hearts: [],
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

只輸出 JSON。`;

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

    // 嘗試從回應中抓 JSON（防 LLM 加 markdown code fence）
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<PreparedSession>;

    // 驗證 topic 是合法 key
    const topic: ScenarioKey =
      parsed.topic && (ALL_SCENARIO_KEYS as string[]).includes(parsed.topic)
        ? (parsed.topic as ScenarioKey)
        : detectScenarioByKeywords(text);

    // 驗證 earlyMessages 跟 hearts 是陣列且元素正常
    const validateMsgs = (arr: unknown): GeneratedMsg[] => {
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
          text: x.text.trim().slice(0, 60),
          gender: x.gender === "M" ? ("M" as const) : null,
        }))
        .slice(0, 20); // safety cap
    };

    return NextResponse.json({
      topic,
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.filter((k) => typeof k === "string").slice(0, 8)
        : [],
      tone: typeof parsed.tone === "string" ? parsed.tone.slice(0, 30) : "",
      earlyMessages: validateMsgs(parsed.earlyMessages),
      hearts: validateMsgs(parsed.hearts),
      source: "ai",
    } satisfies PreparedSession);
  } catch (e) {
    return NextResponse.json({
      ...fallback("ai_error"),
      // 顯示錯誤訊息給前端 debug 用（不會影響使用者體驗）
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}
