import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Port of Next.js /api/demo-recommendations — no-auth, per-IP rate limited.
// Returns raw AI items; the mobile client enriches artwork (Open Library /
// Deezer / tmdb-proxy) the same way the authed flow does.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const DAILY_LIMIT = 3;
const MAX_ITEMS = 6;
const MODEL = "claude-haiku-4-5-20251001";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(s),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildPrompt(contentType: string, answers: unknown[]): string {
  const each = Math.floor(MAX_ITEMS / 3);
  const breakdown = contentType === "mix"
    ? `Return EXACTLY ${each} movies, ${each} books, and ${each} music albums.`
    : `Return EXACTLY ${MAX_ITEMS} ${
      contentType === "movie"
        ? "movies"
        : contentType === "book"
        ? "books"
        : "music albums"
    }.`;
  return `You are a movie, book, and music recommendations engine. Based on a user's quiz answers, recommend real, well-known titles that match their tastes.

User's answers:
${JSON.stringify(answers, null, 2)}

${breakdown}

Rules:
- Use real titles findable on TMDB (movies), Open Library (books), or Deezer (music albums).
- "creator" is the director (movies), author (books), or recording artist/band (music).
- For music, "title" is a real studio album, not a single.
- "description" is a 1-2 sentence spoiler-free synopsis of the work.
- "reason" is 1-2 sentences on why THIS person will like it (reference their answers).
- "description" and "reason" must differ.
- "match_score" is an honest 0-100 fit assessment — use the full range.

Return ONLY valid JSON, no markdown fences:
{"items":[{"type":"movie|book|music","title":"","creator":"","year":2020,"description":"","reason":"","match_score":87}]}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.json().catch(() => null) as
    | { contentType?: string; answers?: unknown[] }
    | null;
  if (!body || !Array.isArray(body.answers) || body.answers.length === 0) {
    return json({ error: "No answers provided" }, 400);
  }
  if (body.answers.length > 50) {
    return json({ error: "Too many answers" }, 400);
  }
  const contentType = body.contentType ?? "mix";

  const bypass = Deno.env.get("DISABLE_RATE_LIMIT") === "true";
  let remaining = DAILY_LIMIT;
  if (!bypass) {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !serviceKey) return json({ error: "Server config error" }, 500);
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const ip = (req.headers.get("x-forwarded-for") ?? "0.0.0.0")
      .split(",")[0].trim();
    const salt = Deno.env.get("DEMO_RATE_LIMIT_SALT") ?? "smart-advisor-demo";
    const ipHash = await sha256(`${ip}|${salt}`);
    const day = new Date().toISOString().slice(0, 10);
    const { data, error } = await admin.rpc("increment_demo_quota", {
      p_ip_hash: ipHash,
      p_day: day,
    });
    if (error) return json({ error: "Rate limiter unavailable" }, 503);
    const count = typeof data === "number" ? data : 0;
    if (count > DAILY_LIMIT) {
      return json({ error: "Demo limit reached", limit: DAILY_LIMIT }, 429);
    }
    remaining = Math.max(0, DAILY_LIMIT - count);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "Server config error" }, 500);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        { role: "user", content: buildPrompt(contentType, body.answers) },
      ],
    }),
  });
  if (!res.ok) return json({ error: "AI unavailable" }, 502);

  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "{}";
  let items: unknown[] = [];
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    items = Array.isArray(parsed.items) ? parsed.items : [];
  } catch (_) {
    return json({ error: "AI returned an unreadable response" }, 502);
  }

  return json({ items, remaining });
});
