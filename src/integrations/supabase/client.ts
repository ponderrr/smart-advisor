import { Database } from "@/integrations/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file",
    );
  }

  // Require dynamically to sidestep static export analysis
  // (webpack cannot inspect require calls, so it won't trigger the earlier error)
  const { createBrowserClient, createServerClient } = require("@supabase/ssr");

  // For client-side (browser)
  if (typeof window !== "undefined") {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  // For server-side (SSR) – must use server client so PKCE code verifier is
  // read from cookies and written back. createBrowserClient doesn't handle this.
  const { cookies } = require("next/headers");
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Export a singleton for backward compatibility, but prefer createClient() in new code
let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (_supabase) return _supabase;
  _supabase = createClient();
  return _supabase;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});
