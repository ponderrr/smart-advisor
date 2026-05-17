import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, requireAal2 } from "../_shared/aal2.ts";

// Port of Next.js /api/account/delete — AAL2-gated cascade delete.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = await requireAal2(req);
  if (!auth.ok) return auth.response;

  try {
    await auth.admin.from("sessions").delete().eq("user_id", auth.userId);
    await auth.admin.from("mfa_factors").delete().eq("user_id", auth.userId);
    await auth.admin.from("profiles").delete().eq("id", auth.userId);
    const { error } = await auth.admin.auth.admin.deleteUser(auth.userId);
    if (error) {
      return json({ error: "Failed to delete account. Please try again." }, 500);
    }
    return json({ success: true });
  } catch (_) {
    return json({ error: "Failed to delete account. Please try again." }, 500);
  }
});
