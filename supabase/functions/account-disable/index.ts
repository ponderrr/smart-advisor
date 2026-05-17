import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, requireAal2 } from "../_shared/aal2.ts";

// Port of Next.js /api/account/disable — AAL2-gated soft-disable (long ban
// + revoke sessions).
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = await requireAal2(req);
  if (!auth.ok) return auth.response;

  const { error } = await auth.admin.auth.admin.updateUserById(auth.userId, {
    ban_duration: "876000h", // ~100 years
  });
  if (error) {
    return json({ error: "Failed to disable account. Please try again." }, 500);
  }

  await auth.admin.from("sessions").update({
    revoked_at: new Date().toISOString(),
  }).eq("user_id", auth.userId);

  return json({ success: true });
});
