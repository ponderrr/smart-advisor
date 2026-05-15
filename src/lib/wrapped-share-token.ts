import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed share token for the public Year in Review page.
 *
 * Format: base64url(payload).base64url(hmac)
 *   payload = { u: userId, y: year }
 *   hmac    = SHA-256 HMAC of the payload string using WRAPPED_SHARE_SECRET
 *
 * The token is the access grant: anyone with the link can view the
 * referenced user's wrapped data for the given year. No DB columns or
 * revocation list — rotating WRAPPED_SHARE_SECRET invalidates every
 * outstanding link at once if the user ever needs an emergency kill switch.
 *
 * Only callable from a Node runtime (uses `node:crypto`). Next.js Server
 * Components and Route Handlers are fine; client components are not.
 */

interface SharePayload {
  /** Target user_id (auth.users.id). */
  u: string;
  /** Calendar year being shared. */
  y: number;
}

const ENC = "base64url";

function getSecret(): string {
  const secret = process.env.WRAPPED_SHARE_SECRET;
  if (!secret) {
    throw new Error(
      "WRAPPED_SHARE_SECRET is not set — refusing to sign/verify share tokens.",
    );
  }
  return secret;
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest(ENC);
}

export function signShareToken(input: {
  userId: string;
  year: number;
}): string {
  const payload: SharePayload = { u: input.userId, y: input.year };
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString(ENC);
  const sig = sign(data, getSecret());
  return `${data}.${sig}`;
}

export function verifyShareToken(token: string): SharePayload | null {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  let expected: string;
  try {
    expected = sign(data, getSecret());
  } catch {
    return null;
  }

  // timingSafeEqual requires equal-length buffers; bail before comparing
  // when the lengths don't match to avoid a throw on truncated tokens.
  const sigBuf = Buffer.from(sig, ENC);
  const expectedBuf = Buffer.from(expected, ENC);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const decoded = Buffer.from(data, ENC).toString("utf8");
    const parsed = JSON.parse(decoded) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as SharePayload).u !== "string" ||
      typeof (parsed as SharePayload).y !== "number"
    ) {
      return null;
    }
    return parsed as SharePayload;
  } catch {
    return null;
  }
}
