import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const RP_NAME = "Smart Advisor";

export function getRpId(req: NextRequest): string {
  const host = req.headers.get("host") ?? "";
  // WebAuthn RP ID must be a bare hostname — strip the port.
  return host.split(":")[0] || "localhost";
}

export function getOrigin(req: NextRequest): string {
  const host = req.headers.get("host") ?? "";
  const fwdProto = req.headers.get("x-forwarded-proto");
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol = isLocal ? "http" : (fwdProto ?? "https");
  return `${protocol}://${host}`;
}

export function getAdminClient(): SupabaseClient {
  if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getAnonClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getUserFromAuthHeader(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await getAnonClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export const CHALLENGE_COOKIE = "passkey_challenge";

export interface ChallengeCookieData {
  challenge: string;
  userId: string;
  purpose: "register" | "authenticate";
}

export function setChallengeCookie(
  res: NextResponse,
  data: ChallengeCookieData,
) {
  res.cookies.set({
    name: CHALLENGE_COOKIE,
    value: JSON.stringify(data),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });
}

export function readChallengeCookie(
  req: NextRequest,
): ChallengeCookieData | null {
  const raw = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ChallengeCookieData>;
    if (!parsed.challenge || !parsed.userId || !parsed.purpose) return null;
    return parsed as ChallengeCookieData;
  } catch {
    return null;
  }
}

export function clearChallengeCookie(res: NextResponse) {
  res.cookies.set({
    name: CHALLENGE_COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function base64UrlToBytes(b64u: string): Uint8Array {
  const pad = b64u.length % 4 === 0 ? "" : "=".repeat(4 - (b64u.length % 4));
  const b64 = (b64u + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

/** Resolve an email or username to its email address, mirroring the
 *  username-or-email login path used elsewhere. */
export async function resolveIdentifier(
  identifier: string,
): Promise<{ userId: string; email: string } | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const admin = getAdminClient();
  const isEmail = trimmed.includes("@");

  if (isEmail) {
    const email = trimmed.toLowerCase();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();
    if (profile?.id && profile?.email) {
      return { userId: profile.id, email: profile.email };
    }
    return null;
  }

  // Username path — same RPC the sign-in flow uses.
  const { data: email } = await admin.rpc("get_email_for_username", {
    p_username: trimmed,
  });
  if (typeof email !== "string" || !email) return null;
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (!profile?.id) return null;
  return { userId: profile.id, email };
}
