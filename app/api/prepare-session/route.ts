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

13 個情境 key：
- appearance_face: 五官/臉/化妝/痘/眼睛/鼻子焦慮
- appearance_body: 身材/胖瘦/腿/腰/拍照焦慮
- breakup: 失戀/分手/前任
- love: 戀愛/曖昧/暗戀/喜歡某人
- lonely: 深夜孤單/一個人/沒人陪
- confidence: 自卑/覺得自己不夠好
- tired: 累/燃燒/想休息
- work: 職場委屈/主管/同事
- boss: 老闆壓榨/加班/過勞
- money: 沒錢/房租/債務
- family: 家人壓力/爸媽期待
- liked: 想被喜歡/被注意
- unknown: 完全判斷不出

請輸出 JSON（**只輸出 JSON、沒有其他文字、沒有 markdown ⁠**）：

{
  "topic": "...",
  "keywords": ["3-5 個從輸入抽取或衍生的關鍵字"],
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

訊息嚴格規則：
1. **每一句都必須圍繞使用者那句話的主題/關鍵字/場景**
2. 用「{n}」當她的暱稱佔位符（前端會代換）
3. 用第三人稱、不要對她說話、不要用「你/妳」開頭
4. **絕對禁止 generic 安慰**（例如「她很努力」「她值得被愛」「她只是太累了」「她是不是壓力很大」這種沒指涉主題的句子）
5. 自然口語 Threads 留言區感、6-30 字
6. earlyMessages 中可以混入 2-3 句插話：「哈哈」「+1」「靠」「笑死」「心疼」「蛤」「+1 認真的」
7. earlyMessages 中可以有 2-3 句 gender: "M"（男生視角、例如「{n}限動我都會多看兩遍」）
8. hearts 是最後安靜下來的 2 句戳心、要深、要走心

正確範例（使用者輸入「我會不會很胖」）：
- "{n} 是不是最近又不太敢拍照了"
- "她那種一直挑自己缺點的人最讓人心疼"
- "很多女生明明不胖卻一直嫌自己"
- "{n} 是不是穿什麼都要試半天"
- "靠 心疼"
- "{n} 應該停止用照片裡的角度判斷自己"
- "她是不是怕鏡頭斜的時候顯臉大"
- "+1 我懂這種"

錯誤範例（不能輸出）：
- "她很努力"（沒指涉主題）
- "她值得被愛"（generic 雞湯）
- "她只是太累了"（跟胖瘦無關）`;

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
