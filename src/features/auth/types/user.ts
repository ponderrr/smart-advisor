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
}
