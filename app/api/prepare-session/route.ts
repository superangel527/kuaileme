/**
 * /api/prepare-session
 *
 * 「準全場 AI」版本 — 一次性生成整場 3 分鐘聊天室劇本：
 *   - topic / keywords / tone（分類 + 關鍵字 + 語氣）
 *   - earlyMessages × 16（爆發期 0-30s）
 *   - midMessages × 14（沉浸期 30-120s）
 *   - lateMessages × 8（戳心期 120-170s，最後 2 句最深）
 *   - cues × 3（Cue 點名互動，每組含 transition 鋪陳 + question 問句）
 *
 * 共 47 句、Claude Haiku 4.5 一次生完。
 *
 * 沒設 ANTHROPIC_API_KEY 或 API 失敗 → 前端 fallback 純池子。
 *
 * 每場成本估計：~$0.015 USD ≈ NT$0.5
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ALL_SCENARIO_KEYS,
  detectScenarioByKeywords,
  type ScenarioKey,
} from "@/lib/scenarios";

type GeneratedMsg = { text: string; gender: "M" | null };
type GeneratedCue = { transition: string; question: string };

type PreparedSession = {
  topic: ScenarioKey;
  keywords: string[];
  tone: string;
  earlyMessages: GeneratedMsg[];
  midMessages: GeneratedMsg[];
  lateMessages: GeneratedMsg[];
  cues: GeneratedCue[];
  source: "ai" | "keyword_fallback" | "ai_error";
};

const SYSTEM_PROMPT = `你是「聊天室 gossip 全劇本生成器」。

使用者剛在匿名深夜聊天室丟一句心情。你的工作：生成一整場 3 分鐘聊天室劇本，模擬一群人圍著她討論。

## 13 個 topic key（必選一個）：
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
- unknown: 完全判斷不出（最後選項）

## 輸出 JSON（**只輸出 JSON、沒其他文字、沒 markdown**）：

{
  "topic": "...",
  "keywords": ["3-5 個從使用者輸入直接抽出的關鍵詞、訊息要重複它們"],
  "tone": "情緒語氣（短、例：身體焦慮 / 失戀痛 / 職場委屈）",
  "earlyMessages": [{"text": "...", "gender": null 或 "M"}, ...共 16 句],
  "midMessages": [..., 共 14 句],
  "lateMessages": [..., 共 8 句],
  "cues": [
    {"transition": "鋪陳訊息（聊天室裡有人說一句）", "question": "{n}，妳...？（直接對她的問句）"},
    {"transition": "...", "question": "..."},
    {"transition": "...", "question": "..."}
  ]
}

## 🔴 鐵律 1：訊息必須重複使用者關鍵字
使用者打「生理期沒來」→ earlyMessages 最少 5 句、midMessages 最少 4 句要直接出現「生理期」。
使用者打「我會不會很胖」→ 訊息要直接用「胖」。

## 🔴 鐵律 2：人稱混搭（70% 第三人稱 + 30% @-mention）
- 第三人稱（gossip 感、70%）："{n} 是不是又在硬撐"
- @-mention（聊天室裡有人對她大喊、30%）："@{n} 妳會不會其實很在意"、"{n} 妳也太誇張"
- 不是 AI 對話、是聊天室裡的人在點名她

## 🔴 鐵律 3：禁止 generic 安慰
不能寫「她很努力 / 她值得被愛 / 她只是太累了 / 她是不是壓力很大」這種沒指涉主題的句子。每句都要扣主題、關鍵字、或主題情境。

## 各階段重點

### earlyMessages（16 句、爆發期 0-30s）
- 訊息密集、快速、像聊天室炸開
- 混 2-3 句純插話：「哈哈」「+1 我懂」「靠」「笑死」「心疼」「+1 認真的」
- 2-3 句 gender: "M"（男生視角、例如「{n} 限動我都會多看兩遍」）
- 緊扣主題、第一印象決定沉浸感

### midMessages（14 句、沉浸期 30-120s）
- 較慢、開始有「被理解」「被注意」深度
- 可以加 1-2 句插話、1-2 句 male_flirt
- 主題持續延伸、可挖比較深的心理觀察

### lateMessages（8 句、戳心期 120-170s）
- 速度慢、句子深
- 最後 2 句要是「戳心收尾句」、要讓人想哭、要深
- 圍繞主題、有結論感

### cues（3 組、聊天室點名互動）
每組要：
- transition：鋪陳訊息（一句、像有人說「欸 {n} 還在嗎」「我想直接問 {n}」）
- question：直接對她的問句（用「妳」、要圍繞主題、不是心理測驗式問題）

**禁止心理測驗感**：
❌ "{n}，妳上次大哭是什麼時候？"（測驗感）
❌ "{n}，妳今天最希望聽到誰跟妳說一句話？"（測驗感）

**要真人聊天室感、用主題延伸**：
✅ 主題「生理期沒來」→ "@{n} 妳是不是壓力大到亂掉了？"
✅ 主題「會不會很胖」→ "@{n} 妳是不是又不太敢拍照了？"
✅ 主題「失戀」→ "{n}，妳真的不偷看他了嗎？"

## 正確範例

**使用者：「我會不會很胖」、暱稱「Angel」** →

earlyMessages 範例（16 句要這種感覺）：
- "@Angel 妳真的不胖好嗎"
- "Angel 是不是又不太敢拍照了"
- "很多女生明明不胖卻一直嫌自己胖"
- "Angel 那種一直挑自己缺點的人最讓人心疼"
- "靠 心疼"
- "@Angel 妳穿什麼都好看欸"
- "Angel 是不是穿衣服要試半天"
- "+1 我懂這種感覺"
- "我覺得 Angel 比她以為的瘦"
- "Angel 應該停止用照片判斷自己"
- "@Angel 妳的問題不是胖、是太苛刻"
- "Angel 是不是常常照鏡子挑缺點"
- "笑死 我也這樣"
- "Angel 那種對自己嚴的人最容易自卑"
- "@Angel 妳那種比例真的耐看"
- "幹 真的心疼"

cues 範例：
- {transition: "欸等等 Angel 還在嗎", question: "@Angel 妳是不是最近都不太敢拍照？"}
- {transition: "我想直接問 Angel 一件事", question: "Angel，妳是不是穿衣服都要試很多次才敢出門？"}
- {transition: "Angel 妳真的願意誠實說嗎", question: "@Angel 妳上次照鏡子有滿意自己嗎？"}`;

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
    earlyMessages: [],
    midMessages: [],
    lateMessages: [],
    cues: [],
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

只輸出 JSON（含 topic、keywords、tone、earlyMessages × 16、midMessages × 14、lateMessages × 8、cues × 3）。`;

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
        max_tokens: 4500,
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

    const parsed = JSON.parse(jsonMatch[0]) as Partial<PreparedSession> & {
      cues?: Array<{ transition?: string; question?: string }>;
    };

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

    const validateCues = (arr: unknown): GeneratedCue[] => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(
          (x): x is { transition?: string; question?: string } =>
            typeof x === "object" && x !== null
        )
        .map((x) => ({
          transition:
            typeof x.transition === "string"
              ? x.transition.trim().slice(0, 60)
              : "",
          question:
            typeof x.question === "string"
              ? x.question.trim().slice(0, 80)
              : "",
        }))
        .filter((c) => c.transition.length > 0 && c.question.length > 0)
        .slice(0, 3);
    };

    return NextResponse.json({
      topic,
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.filter((k) => typeof k === "string").slice(0, 8)
        : [],
      tone: typeof parsed.tone === "string" ? parsed.tone.slice(0, 30) : "",
      earlyMessages: validateMsgs(parsed.earlyMessages, 18),
      midMessages: validateMsgs(parsed.midMessages, 16),
      lateMessages: validateMsgs(parsed.lateMessages, 10),
      cues: validateCues(parsed.cues),
      source: "ai",
    } satisfies PreparedSession);
  } catch (e) {
    return NextResponse.json({
      ...fallback("ai_error"),
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}
