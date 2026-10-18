import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, verifyAccessPass } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value || "";
  const access = verifyAccessPass(token);
  return NextResponse.json(
    { authorized: !!access, kind: access?.kind || null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
