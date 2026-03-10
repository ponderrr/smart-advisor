export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  /** For select_all questions, stores selected options as JSON array string */
  selected_options?: string[];
  created_at: string;
}
