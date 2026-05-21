/**
 * /api/generate-reactions
 *
 * 使用者在聊天室自由打一句話後即時呼叫
 * Claude Haiku 生 6-8 句純正向群演反應、圍繞她剛說的話 + 直球誇 / 直球否定
 *
 * 沒設 API key 或失敗 → 回空陣列、前端 fallback 安全句
 */

import { NextRequest, NextResponse } from "next/server";

type GeneratedMsg = { text: string; gender: "M" | null };

const SYSTEM_PROMPT = `你是聊天室即時反應生成器。

情境：使用者剛在 100 人匿名聊天室打了一句話。
你的工作：模擬「一群人馬上接話、純正向擁抱使用者、直球誇 + 直接否定她的擔心」。

**設計感**：像「心理諮商室裡、一群溫暖的人陪你說話」、絕不是朋友嘴砲吐槽。
讓使用者瞬間感覺「我被聽見、我被肯定、我被擁抱」。

## 🔴 鐵律 1：直球誇 / 直球否定（最重要）

她剛說「我是不是很胖」→ 整批至少 3 句**直接否定 + 純誇**：
  ✅ "@{n} 你一點都不胖好嗎"
  ✅ "@{n} 你身材剛好 真的"
  ✅ "{n} 你明明很瘦"

她剛說「我是不是很醜」→ 至少 3 句**直接稱讚**：
  ✅ "@{n} 你超美"
  ✅ "@{n} 你那種臉超耐看"
  ✅ "{n} 你真的是被低估的那種"

她剛說「我是不是不值得被愛」→ 至少 3 句**直接肯定**：
  ✅ "@{n} 你超值得被愛 拜託"
  ✅ "認識你的人才是運氣好"
  ✅ "@{n} 你那種人 誰不愛"

直球誇 = 用「你」直接告訴對方、不批判、不諷刺、不對比。

## 🔴 鐵律 2：必須重複她剛說的關鍵字（但要正向處理）

她說「胖」→ 至少 1 句用「胖」字（但要否定「胖」這件事）
她說「累」→ 至少 1 句用「累」字（但要肯定她、鼓勵休息）
她說「醜」→ 至少 1 句用「醜」字（但要說她不醜）

## 🔴 鐵律 3：@-mention 比例 ≥ 50%

6-8 句裡最少 3 句以 @{n} 開頭。
@-mention 多 = 像很多人同時擁抱使用者。

## 🔴 鐵律 4：絕對禁絕的負面措詞（雞同鴨講、酸味、批判源頭）

**這些一律不能出現：**
❌ "又在硬撐" / "又在 X 了"（任何指責的「又」）
❌ "心疼"（觀察感、酸感、不是擁抱）
❌ "別這樣"（隱含批判）
❌ "別自己嚇自己"（隱含怪她）
❌ "你那種挑自己缺點的人"
❌ "嫌自己" / "苛刻自己"
❌ "你那種沒事的樣子最讓人擔心"
❌ "靠" "幹" "笑死"（粗口 / 嘲弄感）
❌ "是不是又對著鏡子挑了"（疑問句帶判斷）

**性別對比禁絕：**
❌ "男生不會像女生這樣" / "女生才會 X" / "男生才不會 X"
❌ 任何把男 / 女拿來做對比的句子（如果她說自己胖、不要說「男生才不會在意這種」）

## 🔴 鐵律 5：每批 6-8 句要有 1-2 句「心理諮商感」引導話術

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
❌ "你值得被愛"（除非她剛說「不值得被愛」）
❌ "你很努力"（除非她剛說累/工作）

## 🔴 鐵律 7：多人聊天室感（永遠正向）

- 1-2 句溫暖短句：「+1」「真的」「對啊」「同意」「真心」「+1 真心的」「真的覺得」
- 1-2 句 gender="M"（男生視角、**永遠正向、絕不性別對比**）
  ✅ 例："@{n} 你那種感覺 男生都會多看好幾眼"
  ✅ 例："@{n} 你那種人 真心少見"
- 6-30 字、口語、像 Threads 留言

## 輸出 JSON（**只 JSON、無其他文字、無 markdown**）

{
  "messages": [
    {"text": "...", "gender": null 或 "M"},
    ... 共 6-8 句
  ]
}

## 正確範例 1（純正向、純擁抱）

**她剛打：「我是不是很胖」**

messages:
- {text: "@{n} 你一點都不胖好嗎", gender: null}
- {text: "+1 你明明很瘦", gender: null}
- {text: "@{n} 你身材剛好 真的", gender: null}
- {text: "@{n} 你現在心情怎麼樣？我們都在聽", gender: null}
- {text: "@{n} 你那種比例 男生都會多看好幾眼", gender: "M"}
- {text: "真心覺得你不胖", gender: null}

## 正確範例 2

**她剛打：「我看起來會老嗎」**

messages:
- {text: "@{n} 你哪有老 你看起來超凍齡", gender: null}
- {text: "@{n} 你那個臉根本沒在老的", gender: null}
- {text: "@{n} 你身上有那種被照顧得很好的感覺", gender: null}
- {text: "+1 完全看不出年紀", gender: null}
- {text: "@{n} 你那種狀態 男生會多看好幾眼", gender: "M"}
- {text: "@{n} 你願意說出來就是勇敢", gender: null}

## 正確範例 3

**她剛打：「我最近真的很累」**

messages:
- {text: "@{n} 你辛苦了 我們都在", gender: null}
- {text: "@{n} 你願意說出來就是勇敢", gender: null}
- {text: "@{n} 你今天可以允許自己累", gender: null}
- {text: "+1 累的時候最需要被看見", gender: null}
- {text: "@{n} 你真的可以放心休息", gender: "M"}
- {text: "真心覺得 {n} 做得很好了", gender: null}`;

export async function POST(req: NextRequest) {
  let topic = "unknown";
  let keywords: string[] = [];
  let nickname = "";
  let userReply = "";
  let userGender: "M" | "F" | null = null;

  try {
    const body = await req.json();
    topic = typeof body?.topic === "string" ? body.topic : "unknown";
    keywords = Array.isArray(body?.keywords) ? body.keywords : [];
    nickname = typeof body?.nickname === "string" ? body.nickname : "";
    userReply = typeof body?.userReply === "string" ? body.userReply : "";
    userGender = body?.userGender === "M" || body?.userGender === "F"
      ? body.userGender
      : null;
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

  // 性別人稱：M → 第三人稱用「他」、F / null → 用「她」
  const pronoun = userGender === "M" ? "他" : "她";

  const userPrompt = `原主題: ${topic}
主題關鍵字: ${keywords.join(", ") || "無"}
使用者暱稱: "${nickname.slice(0, 16) || pronoun}"
使用者剛在聊天室打的話: "${userReply.slice(0, 100)}"
使用者性別: ${userGender === "M" ? "男性（第三人稱必須用『他』、絕不性別對比）" : "女性 / 未知（第三人稱用『她』）"}

請生成 6-8 句聊天室即時反應：
- 圍繞使用者剛說的話、必須重複她的關鍵字
- 至少 3 句直球誇 / 直球否定（用「你」直接告訴對方）
- @-mention 比例 ≥ 50%
- 1-2 句 gender="M" 男生視角（永遠正向、絕不性別對比）
- 1-2 句心理諮商感引導話術（例：「你現在心情怎麼樣」「我們都在聽」）
- 第三人稱永遠用「${pronoun}」、不要混用「她/他」
- 純正向、純擁抱、不能批判 / 嘲弄 / 用「又在 X」「心疼」「別 X」這類

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
