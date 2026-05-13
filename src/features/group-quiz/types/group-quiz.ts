import type { Question } from "@/features/quiz/types/question";

export type QuizSessionStatus =
  | "lobby"
  | "in_progress"
  | "completed"
  | "cancelled";

export type QuizContentType = "movie" | "book" | "both";

export interface GroupQuizResult {
  movie?: {
    title: string;
    director?: string;
    year?: number;
    genres?: string[];
    explanation?: string;
    description?: string;
    poster_url?: string;
  };
  book?: {
    title: string;
    author?: string;
    year?: number;
    genres?: string[];
    explanation?: string;
    description?: string;
    poster_url?: string;
  };
}

export interface QuizSession {
  id: string;
  code: string;
  host_user_id: string | null;
  status: QuizSessionStatus;
  content_type: QuizContentType;
  question_count: number;
  max_participants: number;
  recommendation_id: string | null;
  questions: Question[] | null;
  result: GroupQuizResult | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string;
}

export interface QuizParticipant {
  id: string;
  session_id: string;
  user_id: string | null;
  display_name: string;
  is_host: boolean;
  joined_at: string;
  answers_submitted_at: string | null;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  participant_id: string;
  question_index: number;
  question: string;
  answer: string;
  created_at: string;
}

export interface CreateSessionInput {
  content_type: QuizContentType;
  question_count: number;
  max_participants: number;
  display_name: string;
}

export interface JoinSessionInput {
  code: string;
  display_name: string;
}
