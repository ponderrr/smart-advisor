import { v4 as uuidv4 } from "uuid";
import { Question, QuestionType } from "@/features/quiz/types/question";

interface QuestionTemplate {
  text: string;
  type: QuestionType;
  placeholder?: string;
}

const MOVIE_QUESTIONS: QuestionTemplate[] = [
  {
    text: "What kind of story are you in the mood for right now?",
    type: "single_select",
  },
  {
    text: "How do you feel about the pacing of the movie?",
    type: "single_select",
  },
  { text: "What kind of ending do you prefer?", type: "single_select" },
  {
    text: "Are you looking for something you have seen recommended everywhere, or something more niche?",
    type: "single_select",
  },
  { text: "What type of main character do you prefer?", type: "single_select" },
  {
    text: "Do you want something set in the real world or something more fantastical?",
    type: "single_select",
  },
  { text: "How important is visual style to you?", type: "single_select" },
  {
    text: "What era or time period appeals to you right now?",
    type: "single_select",
  },
  {
    text: "Would you prefer a standalone film or the start of a franchise?",
    type: "single_select",
  },
  { text: "What emotional tone are you after?", type: "single_select" },
  {
    text: "Which genres interest you right now? Select all that apply.",
    type: "select_all",
  },
  {
    text: "Which elements do you enjoy most in a movie? Select all that apply.",
    type: "select_all",
  },
  {
    text: "Describe your ideal movie night in a few words.",
    type: "fill_in_blank",
    placeholder: "e.g. cozy thriller with a twist ending",
  },
  {
    text: "What movie have you recently enjoyed, and what did you like about it?",
    type: "fill_in_blank",
    placeholder: "e.g. Inception — loved the layered storytelling",
  },
  {
    text: "What level of intensity are you comfortable with?",
    type: "single_select",
  },
];

const BOOK_QUESTIONS: QuestionTemplate[] = [
  {
    text: "What kind of reading experience are you looking for?",
    type: "single_select",
  },
  {
    text: "How long of a book are you willing to commit to?",
    type: "single_select",
  },
  {
    text: "Do you prefer stories told from one perspective or multiple?",
    type: "single_select",
  },
  {
    text: "Are you in the mood for something literary or something more genre-driven?",
    type: "single_select",
  },
  {
    text: "What kind of setting appeals to you most right now?",
    type: "single_select",
  },
  {
    text: "Do you want something that challenges you or something comforting?",
    type: "single_select",
  },
  {
    text: "How important is an engaging opening to you?",
    type: "single_select",
  },
  { text: "Would you prefer fiction or nonfiction?", type: "single_select" },
  {
    text: "What emotional tone are you after in a book?",
    type: "single_select",
  },
  {
    text: "Do you prefer a fast page-turner or a slow thoughtful read?",
    type: "single_select",
  },
  {
    text: "Which genres appeal to you right now? Select all that apply.",
    type: "select_all",
  },
  {
    text: "What themes do you enjoy exploring in books? Select all that apply.",
    type: "select_all",
  },
  {
    text: "Describe the kind of book you're in the mood for.",
    type: "fill_in_blank",
    placeholder: "e.g. a gripping sci-fi with deep characters",
  },
  {
    text: "Name a book you've loved and what made it special.",
    type: "fill_in_blank",
    placeholder: "e.g. Dune — the world-building was incredible",
  },
  {
    text: "Are you interested in recently published books or timeless classics?",
    type: "single_select",
  },
];

const BOTH_QUESTIONS: QuestionTemplate[] = [
  {
    text: "What kind of story are you in the mood for right now?",
    type: "single_select",
  },
  {
    text: "Do you prefer fast-paced or slow-burn narratives?",
    type: "single_select",
  },
  {
    text: "Are you looking for popular recommendations or hidden gems?",
    type: "single_select",
  },
  {
    text: "What emotional tone appeals to you right now?",
    type: "single_select",
  },
  {
    text: "Do you want something comforting or something that challenges you?",
    type: "single_select",
  },
  {
    text: "How important is world-building to your enjoyment?",
    type: "single_select",
  },
  {
    text: "Would you prefer a standalone story or the start of something bigger?",
    type: "single_select",
  },
  {
    text: "What era or time period interests you right now?",
    type: "single_select",
  },
  {
    text: "Do you prefer character-driven or plot-driven stories?",
    type: "single_select",
  },
  {
    text: "Which genres are you drawn to right now? Select all that apply.",
    type: "select_all",
  },
  {
    text: "What elements make a story great for you? Select all that apply.",
    type: "select_all",
  },
  {
    text: "Describe the kind of recommendation you're hoping for.",
    type: "fill_in_blank",
    placeholder: "e.g. something mind-bending with a satisfying payoff",
  },
  {
    text: "What's something you've recently watched or read that you loved?",
    type: "fill_in_blank",
    placeholder: "e.g. Severance — loved the mystery and atmosphere",
  },
  {
    text: "Are you in the mood for something dark or something uplifting?",
    type: "single_select",
  },
  {
    text: "Would you prefer real-world settings or fantasy and sci-fi?",
    type: "single_select",
  },
];

const QUESTION_POOLS: Record<"movie" | "book" | "both", QuestionTemplate[]> = {
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

  return selected.map((template) => ({
    id: uuidv4(),
    text: template.text,
    content_type: contentType,
    user_age_range: ageRange,
    type: template.type,
    placeholder: template.placeholder,
  }));
}
