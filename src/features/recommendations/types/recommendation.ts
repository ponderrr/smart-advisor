export interface Recommendation {
  id: string;
  user_id: string;
  type: "movie" | "book" | "music";
  title: string;
  director?: string;
  author?: string;
  artist?: string;
  year?: number;
  rating?: number;
  genres: string[];
  poster_url?: string;
  preview_url?: string;
  explanation?: string;
  is_favorited: boolean;
  content_type: "movie" | "book" | "music" | "both" | "mix";
  created_at: string;
  description?: string;
  /** AI-supplied 0-100 fit score. Falls back to a stable hash of id when missing. */
  match_score?: number;
}
