/**
 * /api/classify
 *
 * 拿到使用者打的一句話 → 回傳一個 scenario key（13 種之一）
 *
 * 三種來源（優先序）：
 *  1. 有 ANTHROPIC_API_KEY → 呼叫 Claude Haiku 4.5 做語意分類
 *  2. API 失敗 / 不在允許清單 → 回退關鍵字 fallback
 *  3. 沒設 API key → 直接用關鍵字 fallback
 *
 * ──────────────────────────────────────────────
 * 怎麼開啟 AI 分類（你要做的）
 * ──────────────────────────────────────────────
 *  1. 到 https://console.anthropic.com/ 註冊 / 登入
 *  2. 左側 API Keys → Create Key → 複製
 *  3. 在專案根目錄建一個檔案叫 .env.local（已被 .gitignore 排除，不會上 git）
 *  4. 內容只要一行：
 *        ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx
 *  5. 重啟 dev server（Ctrl+C 後 npm run dev）
 *
 * 成本：claude-haiku-4-5 大約每 1000 次分類 < NT$10
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ALL_SCENARIO_KEYS,
  detectScenarioByKeywords,
  type ScenarioKey,
} from "@/lib/scenarios";
import { protectApi } from "@/lib/api-security";

const SYSTEM_PROMPT = `分類中文情緒短句到 ONE 個 key。

keys 跟對應情境：
appearance_face = 臉/五官焦慮（鼻子/醜/臉大/雙眼皮/痘）
appearance_body = 身材焦慮（胖/瘦/腿/屁股/減肥）
love = 戀愛/曖昧/暗戀（男友/女友/喜歡他）
breakup = 失戀（分手/前任/心碎）
money = 沒錢壓力（窮/房租/貸款/卡費）
work = 職場委屈（主管/同事/被欺負/受委屈）
boss = 老闆壓榨（加班/責任制/老闆/過勞）
family = 家人壓力（爸媽/婆婆/期待/結婚生子）
lonely = 深夜孤單（一個人/沒人陪/睡不著）
confidence = 低自信（不夠好/自卑/沒用）
tired = 疲憊想休息（累/撐不住/想睡）
liked = 想被喜歡（被注意/沒人喜歡）
unknown = 模糊或情緒方向不明

只回答 key 本身，不要解釋、不要加標點符號。判讀不出就回 unknown。`;

export async function POST(req: NextRequest) {
  const blocked = await protectApi(req, "classify", 20, 10 * 60 * 1000);
  if (blocked) return blocked;
  let text = "";
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text : "";
  } catch {
    return NextResponse.json({ scenario: "unknown" as ScenarioKey });
  }

  if (!text.trim()) {
    return NextResponse.json({ scenario: "unknown" as ScenarioKey });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 沒 API key → 用關鍵字 fallback
  if (!apiKey) {
    return NextResponse.json({
      scenario: detectScenarioByKeywords(text),
      source: "keyword",
    });
  }

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
        max_tokens: 20,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text.slice(0, 100) }],
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
        .trim()
        .toLowerCase() ?? "";

    const isValid = (ALL_SCENARIO_KEYS as readonly string[]).includes(raw);
    const scenario: ScenarioKey = isValid
      ? (raw as ScenarioKey)
      : detectScenarioByKeywords(text);

    return NextResponse.json({
      scenario,
      source: isValid ? "ai" : "ai_fallback_to_keyword",
    });
  } catch (e) {
    // API 出錯 → 退回關鍵字判斷
    return NextResponse.json({
      scenario: detectScenarioByKeywords(text),
      source: "keyword_fallback",
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}
