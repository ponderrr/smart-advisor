/**
 * Where the user lands after the OTP-verify step in /auth/callback.
 *
 * Brand-new signups go through /account/mfa-setup so the user can enroll
 * a second factor before reaching the app. Magic-link and plain-email
 * verifications skip that step — these belong to existing users who either
 * already have a factor or have explicitly chosen not to. Other types
 * (recovery, email_change) are routed elsewhere by their callers and never
 * pass through this helper.
 */
export function getPostVerifyTarget(
  type: string,
  fallback: string,
): string {
  if (type === "signup") return "/account/mfa-setup?from=signup";
  if (type === "magiclink" || type === "email") return "/dashboard";
  return fallback;
}

/**
 * Where /account/mfa-setup routes the user when they finish (or skip)
 * enrollment. When ?from=signup, this is the post-verify enrollment step
 * and both outcomes land in the app. Otherwise the page is being used to
 * add a factor mid-flow from /settings or /account/security, so completing
 * stays on the security surface.
 */
export function getMfaSetupCompleteTarget(from: string | null): string {
  return from === "signup" ? "/dashboard" : "/account/security";
}

/**
 * Where /account/mfa-setup routes when the user skips enrollment. Always
 * /dashboard — skipping should never trap the user on the enrollment page.
 */
export function getMfaSetupSkipTarget(): string {
  return "/dashboard";
}
