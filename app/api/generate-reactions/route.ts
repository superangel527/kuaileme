/**
 * /api/generate-reactions
 *
 * 使用者回 Cue 後呼叫 — Claude 即時生成 6 句延伸討論
 * 訊息要圍繞使用者剛回的內容、又要扣回原主題
 *
 * 沒設 API key 或失敗 → 回空陣列、前端 fallback 池子
 */

import { NextRequest, NextResponse } from "next/server";

type GeneratedMsg = { text: string; gender: "M" | null };

const SYSTEM_PROMPT = `你是聊天室 gossip 即時反應生成器。

情境：使用者剛在聊天室回答了一個被點名的問題。
你的工作：模擬「一群人聽到她剛說的話、馬上接話討論她」。

## 鐵律

### 1. 圍繞她剛回的話 + 原主題
她剛回什麼、訊息就要回應那個。不能 generic、不能無關。

### 2. 70% 第三人稱 + 30% @-mention
- 第三人稱：「{n} 剛說的那句、我超有共鳴」「她那種反應太真實了」
- @-mention：「@{n} 妳這句太誠實了」「{n} 妳真的勇敢」

### 3. 自然口語 Threads 留言區感
6-30 字、可混插話（笑死、+1、靠、心疼、媽我哭了、+1 認真的）

### 4. 一定要有 1 句「聊天室呼應她剛說的關鍵字」
她剛說「我真的很累」→ 要有 1 句直接用「累」

## 輸出 JSON（只 JSON、無其他文字、無 markdown）：

{
  "messages": [
    {"text": "...", "gender": null 或 "M"},
    ... 共 6 句
  ]
}

## 正確範例

**主題：「生理期沒來怎麼辦」**
**使用者剛回 Cue「妳是不是壓力大到亂掉了」 → 回答「對 最近超焦慮」**

reactions：
- {text: "@{n} 妳這個誠實太心疼", gender: null}
- {text: "靠 焦慮真的會搞亂生理期", gender: null}
- {text: "{n} 妳真的需要休息一下", gender: null}
- {text: "+1 我之前也這樣 完全懂", gender: null}
- {text: "@{n} 妳這種人都把壓力扛自己身上", gender: "M"}
- {text: "心疼 真的去看一下醫生比較安心", gender: null}`;

export async function POST(req: NextRequest) {
  let topic = "unknown";
  let keywords: string[] = [];
  let nickname = "";
  let userReply = "";

  try {
    const body = await req.json();
    topic = typeof body?.topic === "string" ? body.topic : "unknown";
    keywords = Array.isArray(body?.keywords) ? body.keywords : [];
    nickname = typeof body?.nickname === "string" ? body.nickname : "";
    userReply = typeof body?.userReply === "string" ? body.userReply : "";
  } catch {
    return NextResponse.json({ messages: [], source: "parse_error" });
  }

  if (!userReply.trim()) {
    return NextResponse.json({ messages: [], source: "empty_reply" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ messages: [], source: "no_key" });
  }

  const userPrompt = `原主題: ${topic}
主題關鍵字: ${keywords.join(", ") || "無"}
她的暱稱: "${nickname.slice(0, 16) || "她"}"
她剛在 Cue 卡回的話: "${userReply.slice(0, 80)}"

請生成 6 句聊天室即時反應、要圍繞她剛說的話。
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
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!resp.ok) throw new Error(`Anthropic API HTTP ${resp.status}`);

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

    const parsed = JSON.parse(jsonMatch[0]) as {
      messages?: Array<{ text?: string; gender?: "M" | null }>;
    };

    const messages: GeneratedMsg[] = (parsed.messages ?? [])
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
      .slice(0, 8);

    return NextResponse.json({ messages, source: "ai" });
  } catch (e) {
    return NextResponse.json({
      messages: [],
      source: "ai_error",
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}
