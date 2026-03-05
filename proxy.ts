import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const isDevelopment = process.env.NODE_ENV === 'development';
  const bypassAuthGuard = process.env.NEXT_DEV_BYPASS_AUTH === 'true';
  const hasMockUser = request.cookies.get('sa_mock')?.value === '1';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');
  const publicRoutes = ['/', '/auth', '/auth/callback', '/demo'];
  const isPublic = publicRoutes.some(
    route =>
      pathname === route ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/demo')
  );

  if (isApiRoute) {
    return supabaseResponse;
  }

  if (isDevelopment || bypassAuthGuard || hasMockUser) {
    return supabaseResponse;
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*$).*)',
  ],
};
