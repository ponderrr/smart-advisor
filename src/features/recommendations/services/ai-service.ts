import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from "@supabase/supabase-js";
import { Question } from "@/features/quiz/types/question";
import { Answer } from "@/features/quiz/types/answer";
import { supabase } from "@/integrations/supabase/client";

/** Reads the user's saved content tone from localStorage. */
const getContentTone = (): "standard" | "family" => {
  if (typeof window === "undefined") return "standard";
  const value = window.localStorage.getItem("smart_advisor_pref_content_tone");
  return value === "family" ? "family" : "standard";
};

/** Per-device mirror of the taste-tuning / hard filters blob (parity with
 *  the content-tone cache + the mobile app's prefs hot-cache). The profile
 *  row is the source of truth; this is only a fast hydration fallback. */
export const PREF_RECOMMENDATION_FILTERS_KEY =
  "smart_advisor_pref_recommendation_filters";

/** Taste tuning / hard filters threaded into the recommendation prompt. */
export interface RecommendationFilters {
  avoidGenres?: string[];
  maxRuntimeMinutes?: number | null;
  language?: string | null;
  avoidNote?: string | null;
}

/** Strips empty fields so the Edge Function only ever sees meaningful
 *  constraints; returns null when nothing meaningful is set. */
export function cleanRecommendationFilters(
  raw: unknown,
): RecommendationFilters | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  const genres = Array.isArray(f.avoidGenres)
    ? f.avoidGenres.map((g) => String(g).trim()).filter((g) => g.length > 0)
    : [];
  const runtime =
    typeof f.maxRuntimeMinutes === "number" ? f.maxRuntimeMinutes : 0;
  const language = typeof f.language === "string" ? f.language.trim() : "";
  const note = typeof f.avoidNote === "string" ? f.avoidNote.trim() : "";
  const cleaned: RecommendationFilters = {
    ...(genres.length > 0 ? { avoidGenres: genres } : {}),
    ...(runtime > 0 ? { maxRuntimeMinutes: runtime } : {}),
    ...(language.length > 0 ? { language } : {}),
    ...(note.length > 0 ? { avoidNote: note } : {}),
  };
  return Object.keys(cleaned).length > 0 ? cleaned : null;
}

/**
 * Pulls the signed-in user's saved taste-tuning / hard filters off their
 * profile row. Best-effort: a fetch failure or missing column just means
 * no filters are applied (existing behaviour). Mirrors the mobile
 * recommendation_flow loader.
 */
async function loadRecommendationFilters(): Promise<RecommendationFilters | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("recommendation_filters")
      .eq("id", user.id)
      .maybeSingle();
    if (error) return null;
    return cleanRecommendationFilters(data?.recommendation_filters);
  } catch {
    return null;
  }
}

/**
 * Conversational refinement: a follow-up generation pass that reuses the
 * original quiz context but layers a free-text steer on top. Mirrors the
 * mobile RefinementInput DTO; flattened into the Edge Function body.
 */
export interface RefinementInput {
  /** The user's verbatim steer, e.g. "more like Dune, lighter, nothing
   *  over 2 hours". Treated as the strongest signal server-side. */
  feedbackText: string;
  /** Titles already shown this session — excluded so a refine pass never
   *  repeats picks, and so "more like <title>" has context. */
  previousTitles?: string[];
}

/** Options shared by the recommendation generators. */
export interface GenerateOptions {
  /** When false, the user's personal hard filters are NOT applied — used by
   *  Group Quiz so one member's "no Horror" doesn't silently constrain a
   *  shared room. Defaults to true (solo quiz + Surprise). */
  applyFilters?: boolean;
  /** Conversational refinement steer. Absent / empty feedback → behaviour
   *  byte-for-byte unchanged (a normal generation). */
  refinement?: RefinementInput;
}

/** What kind of failure callers are dealing with. Lets the UI swap messaging
 *  (e.g. "AI is busy" vs. "Try again") and lets the retry policy back off
 *  harder when the upstream API is collectively overloaded. */
export type AIErrorKind = "overloaded" | "auth" | "network" | "generic";

export class AIServiceError extends Error {
  readonly kind: AIErrorKind;
  constructor(message: string, kind: AIErrorKind) {
    super(message);
    this.name = "AIServiceError";
    this.kind = kind;
  }
}

export function isOverloadedError(error: unknown): boolean {
  if (error instanceof AIServiceError) return error.kind === "overloaded";
  const msg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return msg.includes("overloaded_error") || msg.includes("overloaded");
}

function classifyDetail(detail: string): AIErrorKind {
  const lower = detail.toLowerCase();
  if (
    lower.includes("overloaded_error") ||
    lower.includes("overloaded") ||
    lower.includes("rate limit") ||
    lower.includes("429")
  ) {
    return "overloaded";
  }
  if (
    lower.includes("not authenticated") ||
    lower.includes("session is not authorized") ||
    lower.includes("session expired") ||
    lower.includes("unauthorized") ||
    lower.includes("401")
  ) {
    return "auth";
  }
  if (
    lower.includes("network error") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("fetch failed")
  ) {
    return "network";
  }
  return "generic";
}

function isNonRetryableError(error: unknown): boolean {
  if (error instanceof AIServiceError) return error.kind === "auth";
  const msg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  if (msg.includes("anthropic api error")) return false;
  return (
    msg.includes("not authenticated") ||
    msg.includes("session is not authorized") ||
    msg.includes("session expired")
  );
}

/** Wait this long before the next attempt. Overloaded responses mean the
 *  upstream API is collectively swamped — slamming it again in 2s isn't
 *  going to help, so we back off much harder. */
function backoffMsFor(attempt: number, kind: AIErrorKind): number {
  if (kind === "overloaded") {
    // 5s, 20s, then we give up (3rd backoff never used since attempt 3 fails fast).
    const base = attempt === 1 ? 5000 : 20000;
    return base + Math.floor(Math.random() * 2000);
  }
  // Generic retryable — short backoff: 1s, 3s.
  const base = attempt === 1 ? 1000 : 3000;
  return base + Math.floor(Math.random() * 500);
}

async function extractEdgeFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return body?.error || error.message || "Edge function returned an error";
    } catch {
      return error.message || "Edge function returned an error";
    }
  }
  if (error instanceof FunctionsRelayError) {
    return "The AI service is temporarily unavailable. Please try again.";
  }
  if (error instanceof FunctionsFetchError) {
    return "Network error connecting to AI service. Please check your connection.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export interface MovieRecommendation {
  title: string;
  director: string;
  year: number;
  genres: string[];
  explanation: string;
}

export interface BookRecommendation {
  title: string;
  author: string;
  year: number;
  genres: string[];
  explanation: string;
}

export interface MusicRecommendation {
  title: string;
  artist: string;
  year: number;
  genres: string[];
  explanation: string;
}

export interface RecommendationData {
  movieRecommendation?: MovieRecommendation;
  bookRecommendation?: BookRecommendation;
  musicRecommendation?: MusicRecommendation;
}

/**
 * Generates personalized recommendation questions using Supabase Edge Functions
 */
export async function generateQuestions(
  contentType: "movie" | "book" | "music" | "both" | "mix",
  userAge: number,
  questionCount: number = 5,
  userName: string = "User",
): Promise<Question[]> {
  try {
    // Validate session exists (getUser() actually verifies with Supabase)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // supabase.functions.invoke automatically sends the session token
    const { data, error } = await supabase.functions.invoke(
      "anthropic-questions",
      {
        body: {
          contentType,
          name: userName,
          age: userAge,
          questionCount,
          contentTone: getContentTone(),
        },
      },
    );

    if (error) {
      // Log full error details for debugging
      console.error("Edge function error object:", {
        name: error?.name,
        message: error?.message,
        context: error?.context,
        status: error?.context?.status,
        statusText: error?.context?.statusText,
      });

      const errorDetail = await extractEdgeFunctionError(error);
      console.error("Extracted error detail:", errorDetail);

      const kind = classifyDetail(errorDetail);
      if (kind === "auth") {
        throw new AIServiceError(
          "Your session is not authorized for question generation.",
          "auth",
        );
      }
      throw new AIServiceError(
        errorDetail || "Failed to generate questions",
        kind,
      );
    }

    if (!data?.questions || !Array.isArray(data.questions)) {
      throw new Error("Invalid response format from question generation");
    }

    const validTypes = ["single_select", "select_all", "fill_in_blank"];

    // Map edge function response to the frontend Question shape
    return data.questions.map((q: Record<string, unknown>) => ({
      id: typeof q.id === "string" ? q.id : "",
      text: (typeof q.text === "string" ? q.text : (q.question as string)) ?? "",
      type:
        typeof q.type === "string" && validTypes.includes(q.type)
          ? (q.type as Question["type"])
          : "single_select",
      content_type: contentType,
      user_age_range:
        userAge < 18
          ? "under_18"
          : userAge < 30
            ? "18_29"
            : userAge < 50
              ? "30_49"
              : "50_plus",
      options: Array.isArray(q.options)
        ? (q.options as unknown[]).filter(
            (o): o is string => typeof o === "string",
          )
        : undefined,
      placeholder: typeof q.placeholder === "string" ? q.placeholder : undefined,
    }));
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

/**
 * Generates personalized recommendations using Supabase Edge Functions
 */
export async function generateRecommendations(
  answers: Answer[],
  contentType: "movie" | "book" | "music" | "both" | "mix",
  userAge: number,
  userName: string = "User",
  options?: GenerateOptions,
): Promise<RecommendationData> {
  try {
    // Validate session exists
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Solo paths (quiz, Surprise) thread the user's saved hard filters into
    // the prompt with no caller wiring; Group Quiz opts out.
    const recommendationFilters =
      options?.applyFilters === false
        ? null
        : await loadRecommendationFilters();

    const refinement =
      options?.refinement && options.refinement.feedbackText.trim().length > 0
        ? options.refinement
        : null;

    // supabase.functions.invoke automatically sends the session token
    const { data, error } = await supabase.functions.invoke(
      "anthropic-recommendations",
      {
        body: {
          answers,
          contentType,
          name: userName,
          age: userAge,
          contentTone: getContentTone(),
          ...(recommendationFilters ? { recommendationFilters } : {}),
          ...(refinement ? { refinement } : {}),
        },
      },
    );

    if (error) {
      const errorDetail = await extractEdgeFunctionError(error);
      const kind = classifyDetail(errorDetail);
      if (kind === "auth") {
        throw new AIServiceError(
          "Your session is not authorized for recommendations.",
          "auth",
        );
      }
      throw new AIServiceError(
        errorDetail || "Failed to generate recommendations",
        kind,
      );
    }

    // Transform edge function response shape into the expected RecommendationData shape
    const result: RecommendationData = {};
    if (data.recommendations) {
      for (const rec of data.recommendations) {
        if (rec.type === "movie") result.movieRecommendation = rec;
        if (rec.type === "book") result.bookRecommendation = rec;
        if (rec.type === "music") result.musicRecommendation = rec;
      }
      return result;
    }

    // Fallback: if response already matches expected shape
    return data;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw error;
  }
}

/**
 * Retry wrapper for question generation. Backoff depends on the error
 * kind — overloaded responses get a much longer wait (5s, 20s) so the
 * upstream API has room to recover; generic retryable errors get a
 * snappy 1s, 3s. Both add a bit of jitter.
 */
export async function generateQuestionsWithRetry(
  contentType: "movie" | "book" | "music" | "both" | "mix",
  userAge: number,
  questionCount: number = 5,
  userName: string = "User",
  maxRetries: number = 3,
): Promise<Question[]> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateQuestions(
        contentType,
        userAge,
        questionCount,
        userName,
      );
    } catch (error) {
      lastError = error;

      if (isNonRetryableError(error)) {
        break;
      }

      if (attempt < maxRetries) {
        const kind: AIErrorKind =
          error instanceof AIServiceError ? error.kind : "generic";
        await new Promise((resolve) =>
          setTimeout(resolve, backoffMsFor(attempt, kind)),
        );
      }
    }
  }

  throw lastError;
}

/**
 * Retry wrapper for recommendation generation. Same kind-aware backoff
 * policy as the question wrapper.
 */
export async function generateRecommendationsWithRetry(
  answers: Answer[],
  contentType: "movie" | "book" | "music" | "both" | "mix",
  userAge: number,
  userName: string = "User",
  maxRetries: number = 3,
  options?: GenerateOptions,
): Promise<RecommendationData> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateRecommendations(
        answers,
        contentType,
        userAge,
        userName,
        options,
      );
    } catch (error) {
      lastError = error;

      if (isNonRetryableError(error)) {
        break;
      }

      if (attempt < maxRetries) {
        const kind: AIErrorKind =
          error instanceof AIServiceError ? error.kind : "generic";
        await new Promise((resolve) =>
          setTimeout(resolve, backoffMsFor(attempt, kind)),
        );
      }
    }
  }

  throw lastError;
}
