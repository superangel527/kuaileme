import crypto from "crypto";

export const ACCESS_COOKIE = "kl_access";
const ACCESS_TTL_MS = 15 * 60 * 1000;

type AccessPayload = {
  v: 1;
  kind: "paid" | "promo";
  subject: string;
  issuedAt: number;
  expiresAt: number;
};

function getSecret(): string {
  const secret =
    process.env.ACCESS_SECRET ||
    process.env.PROMO_SECRET ||
    process.env.PAYUNI_HASH_KEY ||
    "";
  if (secret.length < 32) throw new Error("Access signing secret not configured");
  return secret;
}

function signature(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function signAccessPass(
  kind: AccessPayload["kind"],
  subject: string
): string {
  const issuedAt = Date.now();
  const payload: AccessPayload = {
    v: 1,
    kind,
    subject: subject.slice(0, 80),
    issuedAt,
    expiresAt: issuedAt + ACCESS_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyAccessPass(token: string): AccessPayload | null {
  try {
    const [encoded, supplied] = token.split(".");
    if (!encoded || !supplied) return null;
    const expected = signature(encoded);
    const a = Buffer.from(supplied, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AccessPayload;
    if (
      payload.v !== 1 ||
      (payload.kind !== "paid" && payload.kind !== "promo") ||
      !payload.subject ||
      !Number.isFinite(payload.issuedAt) ||
      !Number.isFinite(payload.expiresAt) ||
      payload.issuedAt > Date.now() + 60_000 ||
      payload.expiresAt <= Date.now() ||
      payload.expiresAt - payload.issuedAt > ACCESS_TTL_MS
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const accessCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  maxAge: ACCESS_TTL_MS / 1000,
  path: "/",
};
