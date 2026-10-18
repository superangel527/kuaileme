/**
 * 公開健康檢查只回傳服務狀態，不揭露環境變數、商店代號或金鑰片段。
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Netlify-CDN-Cache-Control": "no-store",
      },
    }
  );
}
