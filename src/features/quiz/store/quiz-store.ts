import { create } from "zustand";
import { Answer } from "@/features/quiz/types/answer";

export type ContentType = "movie" | "book" | "both";

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

  reset: () => void;
}

const defaultState = {
  contentType: null as ContentType | null,
  questionCount: 5,
  answers: [] as Answer[],
  userAge: null as number | null,
  filters: { genres: [] as string[], moods: [] as string[] },
};

export const useQuizStore = create<QuizStore>((set) => ({
  ...defaultState,

  setContentType: (contentType) => set({ contentType }),
  setQuestionCount: (questionCount) => set({ questionCount }),
  setAnswers: (answers) => set({ answers }),
  setUserAge: (userAge) => set({ userAge }),
  setFilters: (filters) => set({ filters }),
  reset: () => set(defaultState),
}));
