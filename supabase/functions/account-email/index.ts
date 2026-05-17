import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, requireAal2 } from "../_shared/aal2.ts";

// Port of Next.js /api/account/email — AAL2-gated email change.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = await requireAal2(req);
  if (!auth.ok) return auth.response;

  const { email } = await req.json().catch(() => ({}));
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  const { error } = await auth.admin.auth.admin.updateUserById(auth.userId, {
    email: normalized,
  });
  if (error) return json({ error: error.message }, 500);

  await auth.admin.from("profiles").update({
    email: normalized,
    updated_at: new Date().toISOString(),
  }).eq("id", auth.userId);

  return json({ ok: true });
});
