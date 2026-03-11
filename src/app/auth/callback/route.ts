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
  const next = searchParams.get("next") ?? "/content-selection";
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

  // Handle OAuth code exchange (Google, GitHub, etc.)
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

  // Handle email verification / password recovery via token_hash
  if (
    (type === "email" || type === "recovery" || type === "signup") &&
    tokenHash
  ) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "recovery" | "signup",
    });
    if (!error) {
      if (type === "recovery") {
        // redirect directly to reset page so user can update password
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      // Email verified — user now has an active session from verifyOtp.
      // Redirect through client-side page to signal original tab and proceed.
      const verifiedParams = new URLSearchParams({ next });
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
}
