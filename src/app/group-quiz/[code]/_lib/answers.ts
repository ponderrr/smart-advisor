import type { QuestionValue } from "@/features/quiz/components/question-card";

/**
 * Shared answer helpers for the group-quiz room. Extracted verbatim from
 * page.tsx so both the page render (hasAnswer) and the action layer
 * (formatAnswerForStorage) can use them without a page⇄hook cycle.
 */

export type LocalAnswers = Record<string, QuestionValue>;

export const formatAnswerForStorage = (
  type: "single_select" | "select_all" | "fill_in_blank",
  value: QuestionValue | undefined,
) => {
  if (value === undefined || value === null) return "";
  if (type === "select_all") {
    return Array.isArray(value) ? value.join(", ") : "";
  }
  return typeof value === "string" ? value : "";
};

export const hasAnswer = (value: QuestionValue | undefined) => {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
};
