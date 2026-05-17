// Shared AAL2 gate for account Edge Functions. Mirrors the web
// src/lib/auth/aal.ts requireAal2: Bearer token → getUser → MFA AAL must be
// "aal2". Returns the user + a service-role admin client, or a Response.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
type Ok = { ok: true; userId: string; admin: any };
type Err = { ok: false; response: Response };

export async function requireAal2(req: Request): Promise<Ok | Err> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, response: json({ error: "Unauthorized" }, 401) };
  }
  const token = authHeader.slice(7);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !anonKey || !serviceKey) {
    return {
      ok: false,
      response: json({ error: "Server configuration error." }, 500),
    };
  }

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(
    token,
  );
  if (userError || !userData.user) {
    return { ok: false, response: json({ error: "Unauthorized" }, 401) };
  }

  // getUser validated the token signature; trust its `aal` claim.
  let aalClaim: string | null = null;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    aalClaim = payload?.aal ?? null;
  } catch {
    aalClaim = null;
  }
  if (aalClaim !== "aal2") {
    return {
      ok: false,
      response: json(
        {
          error: "Step-up required. Verify your second factor to continue.",
          code: "AAL2_REQUIRED",
        },
        403,
      ),
    };
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { ok: true, userId: userData.user.id, admin };
}
