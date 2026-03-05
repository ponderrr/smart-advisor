import { Question } from "@/features/quiz/types/question";
import { Answer } from "@/features/quiz/types/answer";
import { supabase } from "@/integrations/supabase/client";

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
  userName: string = "User"
): Promise<Question[]> {
  try {
    // Get user session for authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/anthropic-questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          contentType,
          name: userName,
          age: userAge,
          questionCount,
        }),
      }
    );

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = "Failed to generate questions";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Failed to generate questions: ${responseText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.questions;
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
  userName: string = "User"
): Promise<RecommendationData> {
  try {
    // Get user session for authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL
      }/functions/v1/anthropic-recommendations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          answers,
          contentType,
          name: userName,
          age: userAge,
        }),
      }
    );

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = "Failed to generate recommendations";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Failed to generate recommendations: ${responseText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

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
  maxRetries: number = 3
): Promise<Question[]> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateQuestions(contentType, userAge, questionCount, userName);
    } catch (error) {
      lastError = error;

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
  maxRetries: number = 3
): Promise<RecommendationData> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateRecommendations(answers, contentType, userAge, userName);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
