export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  age: number;
  created_at: string;
  mfa_enabled?: boolean;
  last_login?: string;
  backup_email?: string;
  avatar_url?: string;
  content_tone?: "family" | "standard" | null;
  locale?: string | null;
  setup_completed_at?: string | null;
  /** Short "about me" bio shown on the public profile. */
  bio?: string | null;
  /** Curated interest tags, chosen from a fixed set. */
  interests?: string[];
  /** Legacy freeform tags — superseded by the per-format tag columns
   *  below. Kept on the type so existing rows aren't dropped; the
   *  Settings editor no longer surfaces this field. */
  tags?: string[];
  /** Freeform user-authored tags scoped to movies. */
  movie_tags?: string[];
  /** Freeform user-authored tags scoped to books. */
  book_tags?: string[];
  /** Freeform user-authored tags scoped to music. */
  music_tags?: string[];
}
