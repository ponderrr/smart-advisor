import { create } from "zustand";
import { Answer } from "@/features/quiz/types/answer";
import { Recommendation } from "@/features/recommendations/types/recommendation";

export type ContentType = "movie" | "book" | "music" | "both" | "mix";

interface QuizStore {
  contentType: ContentType | null;
  setContentType: (type: ContentType) => void;

  questionCount: number;
  setQuestionCount: (count: number) => void;

  answers: Answer[];
  setAnswers: (answers: Answer[]) => void;

  userAge: number | null;
  setUserAge: (age: number) => void;

  filters: { genres: string[]; moods: string[] };
  setFilters: (filters: { genres: string[]; moods: string[] }) => void;

  // Recommendations are pre-generated inside /quiz's generating step and
  // handed off here so /results can render them immediately on mount instead
  // of running its own loader. The store is in-memory only, so a hard reload
  // of /results clears these and the page falls back to its own gen flow.
  recommendations: Recommendation[];
  setRecommendations: (recs: Recommendation[]) => void;

  reset: () => void;
}

const defaultState = {
  contentType: null as ContentType | null,
  questionCount: 5,
  answers: [] as Answer[],
  userAge: null as number | null,
  filters: { genres: [] as string[], moods: [] as string[] },
  recommendations: [] as Recommendation[],
};

export const useQuizStore = create<QuizStore>((set) => ({
  ...defaultState,

  setContentType: (contentType) => set({ contentType }),
  setQuestionCount: (questionCount) => set({ questionCount }),
  setAnswers: (answers) => set({ answers }),
  setUserAge: (userAge) => set({ userAge }),
  setFilters: (filters) => set({ filters }),
  setRecommendations: (recommendations) => set({ recommendations }),
  reset: () => set(defaultState),
}));
