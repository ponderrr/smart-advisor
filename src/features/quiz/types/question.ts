export interface Question {
  id: string;
  text: string;
  content_type: "movie" | "book" | "both";
  user_age_range: string;
}
