export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  age: number;
  created_at: string;
  mfa_enabled?: boolean;
  last_login?: string;
}
