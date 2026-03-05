import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const friendlyCallbackMessage = (message?: string | null) => {
  const normalized = (message || "").toLowerCase();
  if (normalized.includes("otp_expired") || normalized.includes("invalid or has expired")) {
    return "That email link has expired. Please request a new one.";
  }
  if (normalized.includes("jwt") || normalized.includes("sub claim")) {
    return "Your session is no longer valid. Please sign in again.";
  }
  return message || "We couldn't complete that link. Please try again.";
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/content-selection';
  const callbackErrorCode = searchParams.get('error_code') || searchParams.get('error');
  const callbackErrorDescription =
    searchParams.get('error_description') || searchParams.get('errorDescription');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  if (callbackErrorCode) {
    const params = new URLSearchParams({
      error: callbackErrorCode,
    });
    if (callbackErrorDescription) {
      params.set('error_description', friendlyCallbackMessage(callbackErrorDescription));
    }
    return NextResponse.redirect(`${origin}/auth?${params.toString()}`);
  }

  // Handle OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    const params = new URLSearchParams({
      error: 'oauth_exchange_failed',
      error_description: friendlyCallbackMessage(error.message),
    });
    return NextResponse.redirect(`${origin}/auth?${params.toString()}`);
  }

  // Handle email verification / password recovery via token_hash
  if ((type === 'email' || type === 'recovery') && tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'email' | 'recovery',
    });
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth?recovery=true`);
      }
      return NextResponse.redirect(`${origin}/auth?verified=true`);
    }
    const params = new URLSearchParams({
      error: error.status === 403 ? 'otp_expired' : 'verification_failed',
      error_description: friendlyCallbackMessage(error.message),
    });
    return NextResponse.redirect(`${origin}/auth?${params.toString()}`);
  }

  return NextResponse.redirect(`${origin}/auth?error=callback_error`);
}
