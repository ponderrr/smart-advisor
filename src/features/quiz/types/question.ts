export type QuestionType = "single_select" | "select_all" | "fill_in_blank";

export interface Question {
  id: string;
  text: string;
  content_type: "movie" | "book" | "both";
  user_age_range: string;
  type: QuestionType;
  /** Placeholder hint for fill_in_blank questions */
  placeholder?: string;
}
