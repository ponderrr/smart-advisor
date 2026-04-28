import { createClient, type User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export type AALevel = "aal1" | "aal2";

function getEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

/**
 * Reads the AAL claim for the provided JWT.
 *
 * Returns "aal2" only when Supabase reports the session is at AAL2. Anything
 * else (aal1, null, error) maps to "aal1" or null. Never trust client-passed
 * AAL state — this re-validates against the auth server every call.
 */
export async function getAal(jwt: string): Promise<AALevel | null> {
  if (!jwt) return null;
  const { url, anonKey } = getEnv();
  if (!url || !anonKey) return null;

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data, error } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel(jwt);
    if (error || !data) return null;
    return data.currentLevel === "aal2" ? "aal2" : "aal1";
  } catch {
    return null;
  }
}

export type RequireAal2Result =
  | { ok: true; user: User; token: string }
  | { ok: false; response: NextResponse };

/**
 * Server-side guard for sensitive operations that require a verified second
 * factor. Caller must immediately return `result.response` if `ok` is false.
 *
 *   - 401 Unauthorized when the bearer header is missing/malformed or the
 *     token does not resolve to an authenticated user.
 *   - 403 with `code: "AAL2_REQUIRED"` when the token is valid but the
 *     session is at AAL1. Clients route to /auth?mfa_required=true.
 *
 * Uses getUser(token) and mfa.getAuthenticatorAssuranceLevel(token) — both
 * validate. Never uses getSession() for authorization decisions.
 */
export async function requireAal2(
  req: NextRequest,
): Promise<RequireAal2Result> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const token = authHeader.slice(7);

  const { url, anonKey } = getEnv();
  if (!url || !anonKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      ),
    };
  }

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const aal = await getAal(token);
  if (aal !== "aal2") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Step-up required. Verify your second factor to continue.",
          code: "AAL2_REQUIRED",
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user: userData.user, token };
}
