import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser-only singleton.
// Server code (Route Handlers, Server Components, middleware) must use
// createClient() from "@/lib/supabase/server" instead — that version
// reads/writes cookies so the PKCE code verifier survives across requests.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
