export function toUserFriendlyError(
  rawMessage: string | undefined,
  fallback = "An unexpected error occurred",
): string {
  const message = (rawMessage || "").toLowerCase();

  if (message.includes("user from sub claim in jwt does not exist")) {
    return "Your session is no longer valid. Please sign in again.";
  }
  if (message.includes("jwt") && message.includes("expired")) {
    return "Your session expired. Please sign in again.";
  }
  if (
    message.includes("invalid refresh token") ||
    message.includes("refresh token")
  ) {
    return "Your session expired. Please sign in again.";
  }
  if (
    message.includes("otp_expired") ||
    message.includes("email link is invalid") ||
    message.includes("expired")
  ) {
    return "That email link has expired. Please request a new one.";
  }
  if (message.includes("email not confirmed")) {
    return "Please verify your email before signing in.";
  }
  if (
    message.includes("user already registered") ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return "An account already exists for this email. Try signing in instead.";
  }
  if (message.includes("invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (
    message.includes("too many requests") ||
    message.includes("rate limit")
  ) {
    return "Too many attempts right now. Please wait a moment and try again.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "A network error occurred. Please check your connection and try again.";
  }
  if (
    message.includes("for security purposes") &&
    message.includes("after")
  ) {
    return "Please wait about a minute before requesting another email.";
  }
  if (message.includes("mfa required")) {
    return "MFA verification required. Please enter your code.";
  }
  if (message.includes("invalid totp") || message.includes("invalid otp")) {
    return "Invalid authentication code. Please try again.";
  }
  if (
    message.includes("friendly_name") &&
    (message.includes("already") ||
      message.includes("duplicate") ||
      message.includes("conflict"))
  ) {
    return "You already have an authenticator with that name.";
  }

  return fallback;
}
