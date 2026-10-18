import crypto from "crypto";
import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, verifyAccessPass } from "@/lib/access";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function protectApi(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
  requireAccess = true
): Promise<NextResponse | null> {
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  }

  const devBypass =
    process.env.NODE_ENV !== "production" &&
    (process.env.NEXT_PUBLIC_PAYMENT_MODE || "fake") !== "payuni";
  const token = req.cookies.get(ACCESS_COOKIE)?.value || "";
  if (requireAccess && !devBypass && !verifyAccessPass(token)) {
    return NextResponse.json({ error: "payment_required" }, { status: 402 });
  }

  try {
    const ipHash = crypto.createHash("sha256").update(clientIp(req)).digest("hex").slice(0, 24);
    const bucket = Math.floor(Date.now() / windowMs);
    const store = getStore("api-rate-limit");
    const key = `${scope}_${ipHash}_${bucket}`;
    const current = Number((await store.get(key, { type: "text" })) || 0);
    if (current >= limit) {
      return NextResponse.json(
        { error: "rate_limited", retryAfter: Math.ceil(((bucket + 1) * windowMs - Date.now()) / 1000) },
        { status: 429, headers: { "Retry-After": String(Math.ceil(((bucket + 1) * windowMs - Date.now()) / 1000)) } }
      );
    }
    await store.set(key, String(current + 1));
    return null;
  } catch (error) {
    console.error(`[security/${scope}] rate limiter unavailable`, error);
    return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
  }
}


