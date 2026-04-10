import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from "@supabase/supabase-js";
import { Question } from "@/features/quiz/types/question";
import { Answer } from "@/features/quiz/types/answer";
import { supabase } from "@/integrations/supabase/client";

function isNonRetryableError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  // Only treat session/auth errors as non-retryable, NOT Anthropic API key errors
  if (msg.includes("anthropic api error")) return false;

  return (
    msg.includes("not authenticated") ||
    msg.includes("session is not authorized") ||
    msg.includes("session expired")
  );
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

export interface RecommendationData {
  movieRecommendation?: MovieRecommendation;
  bookRecommendation?: BookRecommendation;
}

/**
 * Generates personalized recommendation questions using Supabase Edge Functions
 */
export async function generateQuestions(
  contentType: "movie" | "book" | "both",
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

      if (
        errorDetail.includes("session is not authorized") ||
        errorDetail.includes("not authenticated") ||
        errorDetail.includes("session expired")
      ) {
        throw new Error(
          "Your session is not authorized for question generation.",
        );
      }
      throw new Error(errorDetail || "Failed to generate questions");
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
  contentType: "movie" | "book" | "both",
  userAge: number,
  userName: string = "User",
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

    // supabase.functions.invoke automatically sends the session token
    const { data, error } = await supabase.functions.invoke(
      "anthropic-recommendations",
      {
        body: {
          answers,
          contentType,
          name: userName,
          age: userAge,
        },
      },
    );

    if (error) {
      const errorDetail = await extractEdgeFunctionError(error);
      if (
        errorDetail.includes("401") ||
        errorDetail.toLowerCase().includes("unauthorized")
      ) {
        throw new Error("Your session is not authorized for recommendations.");
      }
      throw new Error(errorDetail || "Failed to generate recommendations");
    }

    // Transform edge function response shape into the expected RecommendationData shape
    const result: RecommendationData = {};
    if (data.recommendations) {
      for (const rec of data.recommendations) {
        if (rec.type === "movie") result.movieRecommendation = rec;
        if (rec.type === "book") result.bookRecommendation = rec;
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
 * Retry wrapper for question generation with exponential backoff
 */
export async function generateQuestionsWithRetry(
  contentType: "movie" | "book" | "both",
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
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Retry wrapper for recommendation generation w/ exponential backoff
 */
export async function generateRecommendationsWithRetry(
  answers: Answer[],
  contentType: "movie" | "book" | "both",
  userAge: number,
  userName: string = "User",
  maxRetries: number = 3,
): Promise<RecommendationData> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateRecommendations(
        answers,
        contentType,
        userAge,
        userName,
      );
    } catch (error) {
      lastError = error;

      if (isNonRetryableError(error)) {
        break;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
