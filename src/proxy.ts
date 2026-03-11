import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First update the request cookies so downstream code sees them
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Then create a fresh response that carries the updated request
          supabaseResponse = NextResponse.next({ request });
          // Finally set the cookies on the response so the browser stores them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do NOT use supabase.auth.getSession() here — it reads from
  // cookies without validating the JWT. Use getUser() which contacts the
  // Supabase auth server and guarantees the session is valid.
  // This also refreshes the session if the access token is expired, which
  // writes updated cookies via setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Skip protection for API routes (they handle auth themselves)
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // Public routes that don't require authentication
  const isPublic =
    pathname === "/" ||
    pathname === "/demo" ||
    pathname.startsWith("/demo/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/auth";

  // Redirect unauthenticated users to sign-in
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Files with extensions (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*$).*)",
  ],
};
