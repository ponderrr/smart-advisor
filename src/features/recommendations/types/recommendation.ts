export interface Recommendation {
  id: string;
  user_id: string;
  type: "movie" | "book";
  title: string;
  director?: string;
  author?: string;
  year?: number;
  rating?: number;
  genres: string[];
  poster_url?: string;
  explanation?: string;
  is_favorited: boolean;
  content_type: "movie" | "book" | "both";
  created_at: string;
  description?: string;
  /** AI-supplied 0-100 fit score. Falls back to a stable hash of id when missing. */
  match_score?: number;
}
