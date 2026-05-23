import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  searchOpenLibraryDocs,
  openLibraryCoverUrl,
  searchTmdbMovies,
  searchDeezerAlbum,
  tmdbPosterUrl,
  tmdbWebUrl,
  sanitizeHtml,
} from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";

export const runtime = "nodejs";

const DAILY_LIMIT = 3;
const MAX_ITEMS = 6;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_TIMEOUT_MS = 30_000;

type DemoAnswer = {
  id: string;
  title: string;
  type: "single_select" | "select_all" | "fill_in_blank";
  value: string | string[];
};

type DemoContentType = "movie" | "book" | "music" | "mix";

type DemoRequestBody = {
  contentType?: string;
  answers?: DemoAnswer[];
};

type AiItem = {
  type: "movie" | "book" | "music";
  title: string;
  creator: string;
  year?: number;
  reason: string;
  description?: string;
  match_score?: number;
};

type DemoItem = {
  id: string;
  type: "movie" | "book" | "music";
  title: string;
  subtitle: string;
  description: string;
  image: string;
  infoLink: string;
  reason: string;
  match_score?: number;
  previewUrl?: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// "Mix" is the all-three option; legacy "both"/"Both" payloads (movies +
// books only) also map here so older sessions still resolve.
function normalizeContentType(value: string | undefined): DemoContentType {
  const v = String(value ?? "").toLowerCase();
  if (v === "movie" || v === "movies") return "movie";
  if (v === "book" || v === "books") return "book";
  if (v === "music") return "music";
  return "mix";
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "0.0.0.0";
}

function hashIp(ip: string): string {
  const salt = process.env.DEMO_RATE_LIMIT_SALT ?? "smart-advisor-demo";
  return createHash("sha256").update(`${ip}|${salt}`).digest("hex");
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const MAX_ANSWERS = 50;
const MAX_FIELD_LEN = 500;
const ALLOWED_TYPES = new Set(["single_select", "select_all", "fill_in_blank"]);

function isValidAnswer(x: unknown): x is DemoAnswer {
  if (!x || typeof x !== "object") return false;
  const a = x as Record<string, unknown>;
  if (typeof a.id !== "string" || a.id.length > MAX_FIELD_LEN) return false;
  if (typeof a.title !== "string" || a.title.length > MAX_FIELD_LEN) return false;
  if (typeof a.type !== "string" || !ALLOWED_TYPES.has(a.type)) return false;
  if (typeof a.value === "string") {
    return a.value.length <= MAX_FIELD_LEN;
  }
  if (Array.isArray(a.value)) {
    return a.value.every(
      (v) => typeof v === "string" && v.length <= MAX_FIELD_LEN,
    );
  }
  return false;
}

function formatAnswersForPrompt(answers: DemoAnswer[]): string {
  return answers
    .map((a) => {
      const value = Array.isArray(a.value) ? a.value.join(", ") : a.value;
      return `Q: ${a.title}\nA: ${value || "(no answer)"}`;
    })
    .join("\n\n");
}

function buildPrompt(
  contentType: DemoContentType,
  answers: DemoAnswer[],
): string {
  // Mix splits the six slots evenly across all three media.
  const mixEach = Math.floor(MAX_ITEMS / 3);
  const counts =
    contentType === "movie"
      ? { movie: MAX_ITEMS, book: 0, music: 0 }
      : contentType === "book"
        ? { movie: 0, book: MAX_ITEMS, music: 0 }
        : contentType === "music"
          ? { movie: 0, book: 0, music: MAX_ITEMS }
          : { movie: mixEach, book: mixEach, music: mixEach };

  const breakdown =
    contentType === "mix"
      ? `Return EXACTLY ${counts.movie} movies, ${counts.book} books, and ${counts.music} music albums.`
      : `Return EXACTLY ${MAX_ITEMS} ${
          contentType === "movie"
            ? "movies"
            : contentType === "book"
              ? "books"
              : "music albums"
        }.`;

  return `You are a movie, book, and music recommendations engine. Based on a user's quiz answers, recommend real, well-known titles that match their tastes.

User's answers:
${formatAnswersForPrompt(answers)}

${breakdown}

Rules:
- Use real titles that can be found on TMDB (movies), Open Library (books), or Deezer (music albums).
- "creator" must be the director (movies), author (books), or recording artist/band (music).
- For music, "title" must be a real studio album name, not a single or playlist.
- "description" is a 1–2 sentence spoiler-free synopsis of the work itself.
- "reason" is 1–2 sentences explaining specifically why THIS person will like it (must reference their answers).
- "description" and "reason" must be different — synopsis vs. fit-for-user.
- Avoid franchise sequels unless the answers clearly call for them.
- Vary your picks across different decades and styles when possible.
- "match_score" is your honest 0-100 assessment of how well this pick fits — use the full range, don't default to 90.

Return ONLY valid JSON in this exact shape, no markdown fences, no commentary:
{
  "items": [
    {
      "type": "movie" | "book" | "music",
      "title": "Exact title",
      "creator": "Director, Author, or Artist name",
      "year": 2020,
      "description": "Spoiler-free synopsis of the work.",
      "reason": "Why this fits the user.",
      "match_score": 87
    }
  ]
}`;
}

async function callAnthropic(prompt: string): Promise<AiItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content: string = data?.content?.[0]?.text ?? "{}";
    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as { items?: AiItem[] };
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items.filter(
      (item): item is AiItem =>
        Boolean(
          item &&
            (item.type === "movie" ||
              item.type === "book" ||
              item.type === "music") &&
            typeof item.title === "string" &&
            typeof item.creator === "string" &&
            typeof item.reason === "string",
        ),
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Enrichment via TMDB / OpenLibrary ───────────────────────────────────────

async function enrichMovie(
  item: AiItem,
  apiKey: string | undefined,
): Promise<DemoItem | null> {
  if (!apiKey) return null;
  const results = await searchTmdbMovies(item.title, apiKey);
  const match =
    results.find(
      (r) => r.title?.toLowerCase() === item.title.toLowerCase() && r.poster_path,
    ) ?? results.find((r) => r.poster_path);
  if (!match || !match.poster_path) return null;

  return {
    id: `movie-${match.id}`,
    type: "movie",
    title: match.title ?? item.title,
    subtitle: match.release_date
      ? `${item.creator} · ${String(match.release_date).slice(0, 4)}`
      : item.creator,
    description: sanitizeHtml(match.overview || "No description available."),
    image: tmdbPosterUrl(match.poster_path),
    infoLink: tmdbWebUrl(match.id),
    reason: item.reason,
    match_score: item.match_score,
  };
}

async function enrichBook(item: AiItem): Promise<DemoItem | null> {
  // Search by "title author" first; fall back to title only.
  const queries = [
    `${item.title} ${item.creator}`.trim(),
    item.title,
  ];
  for (const q of queries) {
    const docs = await searchOpenLibraryDocs(q, 4);
    const match =
      docs.find((d) => d.title?.toLowerCase() === item.title.toLowerCase()) ??
      docs[0];
    if (match?.cover_i && match.title) {
      const author = Array.isArray(match.author_name)
        ? match.author_name.join(", ")
        : item.creator;
      return {
        id: `book-${match.key ?? match.title}`,
        type: "book",
        title: match.title,
        subtitle: match.first_publish_year
          ? `${author} · ${match.first_publish_year}`
          : author,
        description: item.description ?? "",
        image: openLibraryCoverUrl(match.cover_i),
        infoLink: `${API_URLS.OPEN_LIBRARY_BASE}${match.key ?? ""}`,
        reason: item.reason,
        match_score: item.match_score,
      };
    }
  }
  return null;
}

async function enrichMusic(item: AiItem): Promise<DemoItem | null> {
  const album = await searchDeezerAlbum(item.title, item.creator);
  if (!album) return null;

  const year = album.year ?? item.year;
  return {
    id: `music-${item.title}-${item.creator}`,
    type: "music",
    title: item.title,
    subtitle: year ? `${item.creator} · ${year}` : item.creator,
    description: item.description ?? "",
    image: album.cover,
    infoLink:
      album.deezerUrl ??
      `https://www.deezer.com/search/${encodeURIComponent(
        `${item.title} ${item.creator}`,
      )}`,
    reason: item.reason,
    match_score: item.match_score,
    previewUrl: album.previewUrl,
  };
}

async function enrichAll(items: AiItem[]): Promise<DemoItem[]> {
  const tmdbKey = process.env.TMDB_API_KEY;
  const enriched = await Promise.all(
    items.map((item) =>
      item.type === "movie"
        ? enrichMovie(item, tmdbKey)
        : item.type === "book"
          ? enrichBook(item)
          : enrichMusic(item),
    ),
  );
  return enriched.filter((item): item is DemoItem => item !== null);
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Parse + validate input
  let body: DemoRequestBody;
  try {
    body = (await request.json()) as DemoRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const contentType = normalizeContentType(body.contentType);
  const rawAnswers = Array.isArray(body.answers) ? body.answers : [];
  if (rawAnswers.length === 0) {
    return NextResponse.json(
      { error: "No answers provided" },
      { status: 400 },
    );
  }
  if (rawAnswers.length > MAX_ANSWERS) {
    return NextResponse.json(
      { error: "Too many answers" },
      { status: 400 },
    );
  }
  if (!rawAnswers.every(isValidAnswer)) {
    return NextResponse.json(
      { error: "Invalid answer format" },
      { status: 400 },
    );
  }
  const answers = rawAnswers as DemoAnswer[];

  // 2. Rate limit (fail closed if Supabase is unreachable — this route costs money per call).
  // Only bypass when DISABLE_RATE_LIMIT is explicitly set (e.g. local dev or
  // screen-recording sessions). NODE_ENV alone isn't enough — preview deploys
  // run with NODE_ENV=production but still shouldn't be gated unless opted in.
  const bypassRateLimit = process.env.DISABLE_RATE_LIMIT === "true";
  let newCount: number | null = null;

  if (!bypassRateLimit) {
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const ipHash = hashIp(getClientIp(request));
    const day = todayUtc();

    const { data, error: rateError } = await supabase.rpc(
      "increment_demo_quota",
      { p_ip_hash: ipHash, p_day: day },
    );

    if (rateError) {
      console.error("demo-recommendations: rate limit RPC failed", rateError);
      return NextResponse.json(
        { error: "Rate limit service unavailable" },
        { status: 503 },
      );
    }

    newCount = typeof data === "number" ? data : null;

    if (newCount !== null && newCount > DAILY_LIMIT) {
      // Structured limit only — the client renders localized copy from it
      // so non-English users don't get an English string.
      return NextResponse.json(
        { error: "Demo limit reached", limit: DAILY_LIMIT },
        { status: 429 },
      );
    }
  }

  // 3. Call Anthropic for the recommendations.
  let aiItems: AiItem[];
  try {
    aiItems = await callAnthropic(buildPrompt(contentType, answers));
  } catch (error) {
    console.error("demo-recommendations: Anthropic call failed", error);
    return NextResponse.json(
      { error: "Recommendation service unavailable" },
      { status: 502 },
    );
  }

  if (aiItems.length === 0) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  // 4. Enrich with posters via TMDB / Open Library
  const items = await enrichAll(aiItems);

  return NextResponse.json(
    { items, remaining: Math.max(0, DAILY_LIMIT - (newCount ?? 0)) },
    { status: 200 },
  );
}
