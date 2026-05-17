import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, requireAal2 } from "../_shared/aal2.ts";

// Port of Next.js /api/account/password — AAL2-gated password change.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = await requireAal2(req);
  if (!auth.ok) return auth.response;

  const { password } = await req.json().catch(() => ({}));
  const p = String(password ?? "");
  if (
    p.length < 8 ||
    !/[A-Z]/.test(p) ||
    !/[a-z]/.test(p) ||
    !/[0-9]/.test(p) ||
    !/[^A-Za-z0-9]/.test(p)
  ) {
    return json(
      {
        error:
          "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
      },
      400,
    );
  }

  const { error } = await auth.admin.auth.admin.updateUserById(auth.userId, {
    password: p,
  });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
});
