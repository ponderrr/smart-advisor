import { createClient } from "@/lib/supabase/server";
import { NextResponse, NextRequest } from "next/server";

const friendlyCallbackMessage = (message?: string | null) => {
  const normalized = (message || "").toLowerCase();
  if (
    normalized.includes("otp_expired") ||
    normalized.includes("invalid or has expired")
  ) {
    return "That email link has expired. Please request a new one.";
  }
  if (normalized.includes("jwt") || normalized.includes("sub claim")) {
    return "Your session is no longer valid. Please sign in again.";
  }
  if (normalized.includes("pkce") || normalized.includes("code verifier")) {
    return "Your sign-in session expired. Please try again.";
  }
  return message || "We couldn't complete that link. Please try again.";
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";
  const callbackErrorCode =
    searchParams.get("error_code") || searchParams.get("error");
  const callbackErrorDescription =
    searchParams.get("error_description") ||
    searchParams.get("errorDescription");

  // Use the shared server client — it reads/writes cookies so the PKCE
  // code verifier that was stored during signInWithOAuth() is available.
  const supabase = await createClient();

  if (callbackErrorCode) {
    const params = new URLSearchParams({
      error: callbackErrorCode,
    });
    if (callbackErrorDescription) {
      params.set(
        "error_description",
        friendlyCallbackMessage(callbackErrorDescription),
      );
    }
    return NextResponse.redirect(`${origin}/auth?${params.toString()}`);
  }

  // Handle PKCE code exchange (used by Supabase email confirmation /
  // magic-link flows when configured for the SSR auth client).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if MFA is required (user has enrolled factors)
      const { data: aalData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (
        aalData &&
        aalData.nextLevel === "aal2" &&
        aalData.currentLevel === "aal1"
      ) {
        // Redirect to auth page with mfa_required flag so the client shows the challenge
        return NextResponse.redirect(`${origin}/auth?mfa_required=true`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Exchange failed — provide a user-friendly error
    const params = new URLSearchParams({
      error: "oauth_exchange_failed",
      error_description: friendlyCallbackMessage(error.message),
    });
    return NextResponse.redirect(`${origin}/auth?${params.toString()}`);
  }

  // Handle email verification / password recovery / email change / magic link
  const VERIFIABLE_TYPES = [
    "email",
    "recovery",
    "signup",
    "email_change",
    "magiclink",
  ] as const;
  type VerifiableType = (typeof VERIFIABLE_TYPES)[number];

  if (
    type &&
    (VERIFIABLE_TYPES as readonly string[]).includes(type) &&
    tokenHash
  ) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as VerifiableType,
    });
    if (!error) {
      if (type === "recovery") {
        // redirect directly to reset page so user can update password
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      if (type === "email_change") {
        // confirmed email change — send user back to account settings
        return NextResponse.redirect(`${origin}/account?email_changed=true`);
      }
      // Email verified — user now has an active session from verifyOtp.
      // Redirect through client-side page to signal original tab and proceed.
      // Signup and magic-link verifications always land on /dashboard so a
      // brand-new account sees the welcome state instead of being dumped
      // into a fresh quiz; old email templates that bake `next=/content-
      // selection` into the link can't override that intent.
      const safeNext =
        type === "signup" || type === "magiclink" || type === "email"
          ? "/dashboard"
          : next;
      const verifiedParams = new URLSearchParams({ next: safeNext });
      return NextResponse.redirect(
        `${origin}/auth/verified?${verifiedParams.toString()}`,
      );
    }
    const params = new URLSearchParams({
      error: error.status === 403 ? "otp_expired" : "verification_failed",
      error_description: friendlyCallbackMessage(error.message),
    });
    return NextResponse.redirect(`${origin}/auth?${params.toString()}`);
  }

  // Fallback: no code, no token_hash — malformed or expired link.
  const params = new URLSearchParams({
    error: "missing_params",
    error_description:
      "That link is missing information or has already been used. Please request a new one.",
  });
  return NextResponse.redirect(`${origin}/auth?${params.toString()}`);
}
