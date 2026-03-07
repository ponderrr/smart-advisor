import { v4 as uuidv4 } from "uuid";
import { Question } from "@/features/quiz/types/question";

const MOVIE_QUESTIONS = [
  "What kind of story are you in the mood for right now?",
  "How do you feel about the pacing of the movie?",
  "What kind of ending do you prefer?",
  "Are you looking for something you have seen recommended everywhere, or something more niche?",
  "What type of main character do you prefer?",
  "Do you want something set in the real world or something more fantastical?",
  "How important is visual style to you?",
  "What era or time period appeals to you right now?",
  "Would you prefer a standalone film or the start of a franchise?",
  "What emotional tone are you after?",
  "Do you prefer dialogue-heavy or action-driven stories?",
  "Are you open to foreign language films?",
  "How long of a movie are you willing to sit through?",
  "Do you prefer character studies or plot-driven narratives?",
  "What level of intensity are you comfortable with?",
];

const BOOK_QUESTIONS = [
  "What kind of reading experience are you looking for?",
  "How long of a book are you willing to commit to?",
  "Do you prefer stories told from one perspective or multiple?",
  "Are you in the mood for something literary or something more genre-driven?",
  "What kind of setting appeals to you most right now?",
  "Do you want something that challenges you or something comforting?",
  "How important is an engaging opening to you?",
  "Would you prefer fiction or nonfiction?",
  "What emotional tone are you after in a book?",
  "Do you prefer a fast page-turner or a slow thoughtful read?",
  "Are you open to graphic novels or illustrated works?",
  "Do you prefer standalone books or series?",
  "How important is the writing style versus the plot?",
  "Would you like something with a clear resolution or an open ending?",
  "Are you interested in recently published books or timeless classics?",
];

const BOTH_QUESTIONS = [
  "What kind of story are you in the mood for right now?",
  "Do you prefer fast-paced or slow-burn narratives?",
  "Are you looking for popular recommendations or hidden gems?",
  "What emotional tone appeals to you right now?",
  "Do you want something comforting or something that challenges you?",
  "How important is world-building to your enjoyment?",
  "Would you prefer a standalone story or the start of something bigger?",
  "What era or time period interests you right now?",
  "Do you prefer character-driven or plot-driven stories?",
  "Are you open to genres you do not usually explore?",
  "What kind of ending satisfies you most?",
  "How much time are you willing to invest?",
  "Do you want something thought-provoking or purely entertaining?",
  "Are you in the mood for something dark or something uplifting?",
  "Would you prefer real-world settings or fantasy and sci-fi?",
];

const QUESTION_POOLS: Record<"movie" | "book" | "both", string[]> = {
  movie: MOVIE_QUESTIONS,
  book: BOOK_QUESTIONS,
  both: BOTH_QUESTIONS,
};

function getAgeRange(age: number): string {
  if (age < 18) return "under_18";
  if (age < 30) return "18_29";
  if (age < 50) return "30_49";
  return "50_plus";
}

/**
 * Generates fallback questions locally when the edge function is unavailable.
 * Shuffles the pool and picks the requested count.
 */
export function generateFallbackQuestions(
  contentType: "movie" | "book" | "both",
  userAge: number,
  questionCount: number,
): Question[] {
  const pool = [...QUESTION_POOLS[contentType]];

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, Math.min(questionCount, pool.length));
  const ageRange = getAgeRange(userAge);

  return selected.map((text) => ({
    id: uuidv4(),
    text,
    content_type: contentType,
    user_age_range: ageRange,
  }));
}
