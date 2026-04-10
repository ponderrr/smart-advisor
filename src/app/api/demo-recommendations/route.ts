import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  searchOpenLibraryDocs,
  openLibraryCoverUrl,
  searchTmdbMovies,
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

type DemoRequestBody = {
  contentType?: "movie" | "book" | "both" | "Movies" | "Books" | "Both" | string;
  answers?: DemoAnswer[];
};

type AiItem = {
  type: "movie" | "book";
  title: string;
  creator: string;
  year?: number;
  reason: string;
  description?: string;
  match_score?: number;
};

type DemoItem = {
  id: string;
  type: "movie" | "book";
  title: string;
  subtitle: string;
  description: string;
  image: string;
  infoLink: string;
  reason: string;
  match_score?: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeContentType(value: string | undefined): "movie" | "book" | "both" {
  const v = String(value ?? "").toLowerCase();
  if (v === "movie" || v === "movies") return "movie";
  if (v === "book" || v === "books") return "book";
  return "both";
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

function formatAnswersForPrompt(answers: DemoAnswer[]): string {
  return answers
    .map((a) => {
      const value = Array.isArray(a.value) ? a.value.join(", ") : a.value;
      return `Q: ${a.title}\nA: ${value || "(no answer)"}`;
    })
    .join("\n\n");
}

function buildPrompt(
  contentType: "movie" | "book" | "both",
  answers: DemoAnswer[],
): string {
  const movieCount =
    contentType === "movie" ? MAX_ITEMS : contentType === "book" ? 0 : 3;
  const bookCount =
    contentType === "book" ? MAX_ITEMS : contentType === "movie" ? 0 : 3;

  const breakdown =
    contentType === "both"
      ? `Return EXACTLY ${movieCount} movies and ${bookCount} books.`
      : `Return EXACTLY ${MAX_ITEMS} ${contentType === "movie" ? "movies" : "books"}.`;

  return `You are a movie and book recommendations engine. Based on a user's quiz answers, recommend real, well-known titles that match their tastes.

User's answers:
${formatAnswersForPrompt(answers)}

${breakdown}

Rules:
- Use real titles that can be found on TMDB (movies) or Open Library (books).
- "creator" must be the director (movies) or author (books).
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
      "type": "movie" | "book",
      "title": "Exact title",
      "creator": "Director or Author name",
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
            (item.type === "movie" || item.type === "book") &&
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

// ─── Dev mock fallback ───────────────────────────────────────────────────────
// Used in development when Anthropic is unreachable (e.g. credits exhausted),
// so screen recordings and offline UI work don't get blocked.

const MOCK_MOVIES: AiItem[] = [
  {
    type: "movie",
    title: "Eternal Sunshine of the Spotless Mind",
    creator: "Michel Gondry",
    year: 2004,
    description:
      "After a painful breakup, a man undergoes an experimental procedure to erase his ex from his memory — only to find himself fighting to hold on as the memories slip away.",
    reason:
      "Layered, emotionally honest, and visually inventive — a slow-burn romance that asks whether pain is worth keeping. Hits hardest if your answers leaned thoughtful and a little melancholy.",
    match_score: 94,
  },
  {
    type: "movie",
    title: "Parasite",
    creator: "Bong Joon-ho",
    year: 2019,
    description:
      "A struggling family schemes their way into the household of a wealthy one, posing as unrelated, qualified workers. The arrangement spirals into something neither family expected.",
    reason:
      "Sharp, tense, and structurally daring. The kind of film that switches genres mid-scene without losing its grip on you. A near-perfect pick when you want something that rewards close attention.",
    match_score: 88,
  },
  {
    type: "movie",
    title: "Spirited Away",
    creator: "Hayao Miyazaki",
    year: 2001,
    description:
      "A ten-year-old girl wanders into a hidden spirit world where her parents are transformed and she has to take a job at a bathhouse for the gods to win them back.",
    reason:
      "Wholesome, strange, and emotionally generous. Reads as comfort food but stays with you for years. A safe-but-not-boring pick for anyone who wants warmth without sentimentality.",
    match_score: 81,
  },
];

const MOCK_BOOKS: AiItem[] = [
  {
    type: "book",
    title: "Project Hail Mary",
    creator: "Andy Weir",
    year: 2021,
    description:
      "An astronaut wakes up alone on a spaceship with no memory of who he is or why he's there, and slowly pieces together a desperate mission to save Earth from an extinction-level event.",
    reason:
      "Optimistic, problem-solving sci-fi with one of the warmest unlikely friendships in the genre. Picks up momentum fast and pays off every setup it plants. Hard to put down.",
    match_score: 91,
  },
  {
    type: "book",
    title: "Piranesi",
    creator: "Susanna Clarke",
    year: 2020,
    description:
      "A man lives alone in a vast, labyrinthine house of endless halls and statues, keeping meticulous journals — until cracks appear in his understanding of where he is and how he got there.",
    reason:
      "Quiet, strange, and slowly unsettling. The prose itself is the experience. A great match if your answers pointed toward atmosphere over plot.",
    match_score: 86,
  },
  {
    type: "book",
    title: "The Goldfinch",
    creator: "Donna Tartt",
    year: 2013,
    description:
      "A boy survives a terrorist bombing at a museum and walks away with a small Dutch painting that becomes the secret center of his life as he grows up across years and continents.",
    reason:
      "Long, ornate, and patient. A grief story dressed as an art-world thriller. Feels rewarding rather than exhausting if you have the appetite for it.",
    match_score: 79,
  },
];

function getMockItems(contentType: "movie" | "book" | "both"): AiItem[] {
  if (contentType === "movie") return MOCK_MOVIES;
  if (contentType === "book") return MOCK_BOOKS;
  return [...MOCK_MOVIES, ...MOCK_BOOKS];
}

async function enrichAll(items: AiItem[]): Promise<DemoItem[]> {
  const tmdbKey = process.env.TMDB_API_KEY;
  const enriched = await Promise.all(
    items.map((item) =>
      item.type === "movie" ? enrichMovie(item, tmdbKey) : enrichBook(item),
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
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (answers.length === 0) {
    return NextResponse.json(
      { error: "No answers provided" },
      { status: 400 },
    );
  }

  // 2. Rate limit (fail closed if Supabase is unreachable — this route costs money per call).
  // Skipped entirely in dev so local testing/screen recordings aren't capped.
  const isDev = process.env.NODE_ENV !== "production";
  let newCount: number | null = null;

  if (!isDev) {
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
      return NextResponse.json(
        {
          error: "Demo limit reached",
          message: `You have used your ${DAILY_LIMIT} free demo runs for today. Sign up for a free account to keep going.`,
        },
        { status: 429 },
      );
    }
  }

  // 3. Call Anthropic — fall back to mock data in dev so screen recordings
  // and offline UI work don't get blocked when credits run out.
  let aiItems: AiItem[];
  try {
    aiItems = await callAnthropic(buildPrompt(contentType, answers));
  } catch (error) {
    console.error("demo-recommendations: Anthropic call failed", error);
    if (isDev) {
      console.warn(
        "demo-recommendations: using dev mock items (Anthropic unavailable)",
      );
      aiItems = getMockItems(contentType);
    } else {
      return NextResponse.json(
        { error: "Recommendation service unavailable" },
        { status: 502 },
      );
    }
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
