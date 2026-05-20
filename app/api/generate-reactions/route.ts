/**
 * /api/generate-reactions
 *
 * 使用者在聊天室自由打一句話後即時呼叫
 * Claude Haiku 生 6-8 句群演反應、圍繞她剛說的話 + 直球誇 / 直球否定
 *
 * 沒設 API key 或失敗 → 回空陣列、前端 fallback 安全句
 */

import { NextRequest, NextResponse } from "next/server";

type GeneratedMsg = { text: string; gender: "M" | null };

const SYSTEM_PROMPT = `你是聊天室即時 gossip 反應生成器。

情境：使用者剛在 100 人匿名聊天室打了一句話。
你的工作：模擬「一群人馬上接話、圍繞她剛說的話、直球誇她、直球否定她的焦慮」。

## 🔴 鐵律 1：直球誇獎 / 直球否定（最重要）

她剛說「我是不是很胖」→ 整批至少 3 句**直接否定**：
  ✅ "@{n} 你一點都不胖好嗎"
  ✅ "@{n} 你身材剛好 真的"
  ✅ "{n} 你明明很瘦 別自己嚇自己"

她剛說「我是不是很醜」→ 至少 3 句**直接稱讚**：
  ✅ "@{n} 你超美 別亂講"
  ✅ "@{n} 你那種臉超耐看"
  ✅ "{n} 你真的是被低估的那種"

她剛說「我是不是不值得被愛」→ 至少 3 句**直接肯定**：
  ✅ "@{n} 你超值得被愛 拜託"
  ✅ "認識你的人才是運氣好"
  ✅ "@{n} 你那種人 誰不愛"

直球誇 = 用「你」直接告訴她、不是旁觀觀察。

## 🔴 鐵律 2：必須重複她剛說的關鍵字、不能 generic

她說「胖」→ 至少 1 句要用「胖」字
她說「累」→ 至少 1 句要用「累」字
她說「醜」→ 至少 1 句要用「醜」字
不能避開她的字、不能換成抽象說法。

## 🔴 鐵律 3：@-mention 比例至少 50%

6-8 句裡最少 3 句要以 @{n} 開頭。
@-mention 多 = 像很多人同時擁抱她。
不能全部第三人稱（會變成她被旁觀、不是被擁抱）。

## 🔴 鐵律 4：禁 generic 廢話（除非貼題）

❌ "她整個人就是發光的那種"
❌ "她的好 是那種要慢慢看才懂的"
❌ "她散發出來的感覺 很舒服"
❌ "她整個存在感就是很穩"
❌ "她真的低估自己很多"
❌ "你值得被愛"（除非她剛說「不值得被愛」）
❌ "你很努力"（除非她剛說累/工作）

這些是抽象套話、會雞同鴨講。永遠用她剛說的字、永遠直球。

## 🔴 鐵律 5：多人聊天室感、不是 AI 助理

- 短插話穿插：「真的」「+1」「靠 同意」「心疼」「+1 認真的」「笑死她真的」
- 6-30 字、口語、像 Threads 留言區
- 1-2 句 gender="M"（男生視角、例如「@{n} 你那種感覺 男生超吃」「{n} 你是那種男生會默默偷看的」）

## 輸出 JSON（**只 JSON、無其他文字、無 markdown**）

{
  "messages": [
    {"text": "...", "gender": null 或 "M"},
    ... 共 6-8 句
  ]
}

## 正確範例 1

**她剛打：「我是不是很胖」**

messages:
- {text: "@{n} 你一點都不胖好嗎", gender: null}
- {text: "靠 她明明很瘦 別自己嚇自己", gender: null}
- {text: "@{n} 你身材剛好 真的", gender: null}
- {text: "{n} 是不是又對著鏡子挑了", gender: null}
- {text: "@{n} 你那種比例 男生超吃", gender: "M"}
- {text: "+1 她真的不胖 別亂講", gender: null}

## 正確範例 2

**她剛打：「我看起來會老嗎」**

messages:
- {text: "@{n} 你哪有老 你看起來超凍齡", gender: null}
- {text: "她那個臉根本沒在老的", gender: null}
- {text: "@{n} 你真的別焦慮 你很年輕", gender: null}
- {text: "+1 完全看不出年紀好嗎", gender: null}
- {text: "@{n} 你那種狀態 男生會多看好幾眼", gender: "M"}
- {text: "靠 她說自己會老 我笑死", gender: null}

## 正確範例 3

**她剛打：「我最近真的很累」**

messages:
- {text: "@{n} 你又在硬撐了齁", gender: null}
- {text: "她那種累 是裝沒事的累", gender: null}
- {text: "@{n} 你這次真的允許自己休息一下", gender: null}
- {text: "+1 累的時候最需要被看見", gender: null}
- {text: "@{n} 你真的辛苦了 我們在", gender: "M"}
- {text: "心疼 她明明很累還在撐", gender: null}`;

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
她剛在聊天室打的話: "${userReply.slice(0, 100)}"

請生成 6-8 句聊天室即時反應：
- 圍繞她剛說的話、必須重複她的關鍵字
- 至少 3 句直球誇 / 直球否定（用「你」直接告訴她）
- @-mention 比例 ≥ 50%
- 1-2 句 gender="M" 男生視角
- 1-2 句短插話穿插

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
        max_tokens: 1200,
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
