"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useMessages } from "next-intl";

import {
  PASSWORD_RULES,
  isValidPassword,
  buildAuthFormErrors,
} from "../utils/validation";
import { MFAFactor, MFAListFactorsData } from "../types/mfa";
import { passkeyService } from "../services/passkey-service";

export type AuthMode =
  | "signin"
  | "signup"
  | "forgot"
  | "verify-email"
  | "mfa-challenge";

// Heading text lives in messages/{en,es}.json under Auth.headings.{key}.
// Mode → namespace key mapping (camelCase to satisfy JSON conventions).
const MODE_HEADING_KEY: Record<AuthMode, string> = {
  signin: "signin",
  signup: "signup",
  forgot: "forgot",
  "verify-email": "verifyEmail",
  "mfa-challenge": "mfaChallenge",
};

const MODE_HEADING_COUNTS: Record<AuthMode, number> = {
  signin: 3,
  signup: 3,
  forgot: 3,
  "verify-email": 3,
  "mfa-challenge": 3,
};

export interface AuthFormProps {
  loading: boolean;
  authError?: string | null;
  signupCooldown?: boolean;
  onClearError: () => void;
  onSignIn: (
    email: string,
    password: string,
    rememberFor30Days: boolean,
  ) => Promise<{ error: string | null; mfaRequired?: boolean }>;
  onSignUp: (
    email: string,
    password: string,
    name: string,
    username: string,
    age: number,
  ) => Promise<{ error: string | null }>;
  onResetPassword: (email: string) => Promise<{ error: string | null }>;
  onResendVerificationEmail: (
    email: string,
  ) => Promise<{ error: string | null }>;
  onVerifyMFA: (
    factorId: string,
    code: string,
  ) => Promise<{ data?: unknown; error: string | null }>;
  onListMFAFactors: () => Promise<{
    data?: MFAListFactorsData | null;
    error: string | null;
  }>;
  onVerifyBackupCode: (code: string) => Promise<{ error: string | null }>;
  initialMfaRequired?: boolean;
  onMfaChallengeResolved?: () => void;
  onMfaChallengeStarted?: () => void;
  onPasskeySignedIn?: () => void;
}

/**
 * All AuthForm state, derived values, effects, and handlers. Extracted
 * verbatim from AuthForm so the component is a thin render of this bag.
 * The render JSX was left byte-identical; this is a pure relocation.
 */
export function useAuthForm(props: AuthFormProps) {
  const {
    loading,
    authError,
    signupCooldown = false,
    onClearError,
    onSignIn,
    onSignUp,
    onResetPassword,
    onResendVerificationEmail,
    onVerifyMFA,
    onListMFAFactors,
    onVerifyBackupCode,
    initialMfaRequired = false,
    onMfaChallengeResolved,
    onMfaChallengeStarted,
    onPasskeySignedIn,
  } = props;

  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Auth");
  const tv = useTranslations("Auth.validation");
  const messages = useMessages() as {
    Auth?: { headings?: Record<string, string[]> };
  };
  const headingsByMode = messages.Auth?.headings ?? {};
  // Honor `?next=/some/path` after sign-in so deep-link auth (e.g. from
  // /group-quiz "Sign in to host") returns to the originating page instead
  // of dropping people on /dashboard. Only allow same-origin relative paths.
  const postAuthDestination = (() => {
    const raw = searchParams?.get("next") ?? null;
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/dashboard";
  })();
  const [mode, setMode] = useState<AuthMode>(
    initialMfaRequired ? "mfa-challenge" : "signin",
  );
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberFor30Days, setRememberFor30Days] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [headingChoice, setHeadingChoice] = useState<Record<AuthMode, number>>({
    signin: 0,
    signup: 0,
    forgot: 0,
    "verify-email": 0,
    "mfa-challenge": 0,
  });
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPendingMfa, setSignupPendingMfa] = useState(false);

  // MFA challenge state
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaInputMode, setMfaInputMode] = useState<"totp" | "backup">("totp");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaSuccess, setMfaSuccess] = useState(false);

  // Passkey sign-in state
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeySigningIn, setPasskeySigningIn] = useState(false);

  useEffect(() => {
    setPasskeySupported(passkeyService.browserSupported());
  }, []);

  // Signup requirement-popover focus state + anchors
  const [emailFocused, setEmailFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [ageFocused, setAgeFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const emailAnchorRef = useRef<HTMLDivElement>(null);
  const usernameAnchorRef = useRef<HTMLDivElement>(null);
  const ageAnchorRef = useRef<HTMLDivElement>(null);
  const passwordAnchorRef = useRef<HTMLDivElement>(null);
  const confirmPasswordAnchorRef = useRef<HTMLDivElement>(null);

  const trimmedEmail = email.trim();
  const emailRules = useMemo(
    () => [
      { label: tv("rules.emailContainsAt"), met: trimmedEmail.includes("@") },
      {
        label: tv("rules.emailHasDomain"),
        met: /^\S+@\S+\.\S+$/.test(trimmedEmail),
      },
    ],
    [trimmedEmail, tv],
  );

  const parsedAge = Number(age);
  const ageRules = useMemo(
    () => [
      {
        label: tv("rules.ageWholeNumber"),
        met: age.length > 0 && /^\d+$/.test(age),
      },
      {
        label: tv("rules.ageInRange"),
        met:
          age.length > 0 &&
          Number.isFinite(parsedAge) &&
          parsedAge >= 13 &&
          parsedAge <= 120,
      },
    ],
    [age, parsedAge, tv],
  );

  const trimmedUsername = username.trim();
  const usernameRules = useMemo(
    () => [
      {
        label: tv("rules.usernameLength"),
        met: trimmedUsername.length >= 2 && trimmedUsername.length <= 24,
      },
      {
        label: tv("rules.usernameAllowedChars"),
        met:
          trimmedUsername.length > 0 &&
          /^[a-zA-Z0-9._-]+$/.test(trimmedUsername),
      },
    ],
    [trimmedUsername, tv],
  );
  const tPasswordRules = useTranslations("Auth.passwordRules");
  const passwordRules = useMemo(
    () =>
      PASSWORD_RULES.map((rule) => ({
        label: tPasswordRules(rule.key),
        met: rule.test(password),
      })),
    [password, tPasswordRules],
  );
  const confirmPasswordRules = useMemo(
    () => [
      {
        label: tv("rules.confirmPasswordMatches"),
        met: confirmPassword.length > 0 && confirmPassword === password,
      },
    ],
    [confirmPassword, password, tv],
  );

  const emailAllMet = emailRules.every((r) => r.met);
  const usernameAllMet = usernameRules.every((r) => r.met);
  const ageAllMet = ageRules.every((r) => r.met);
  const passwordAllMet = passwordRules.every((r) => r.met);
  const confirmAllMet = confirmPasswordRules.every((r) => r.met);

  // Per-mode "is this field OK?" helpers so sign-in / forgot / signup share the
  // red-label-plus-banner pattern with appropriate strictness.
  const emailMetForMode =
    mode === "signin" ? trimmedEmail.length > 0 : emailAllMet;
  const passwordMetForMode =
    mode === "signin" ? password.length > 0 : passwordAllMet;

  // When initialMfaRequired changes to true (e.g. OAuth callback), load factors.
  // Intentionally effect-trigger on `initialMfaRequired` only — `onListMFAFactors`
  // isn't memoized in the parent, and `mfaFactorId` is only read as a guard.
  useEffect(() => {
    if (initialMfaRequired && !mfaFactorId) {
      setMode("mfa-challenge");
      onListMFAFactors().then((result) => {
        if (result.data?.totp && result.data.totp.length > 0) {
          setMfaFactorId(result.data.totp[0].id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMfaRequired]);

  useEffect(() => {
    setHeadingChoice({
      signin: Math.floor(Math.random() * MODE_HEADING_COUNTS.signin),
      signup: Math.floor(Math.random() * MODE_HEADING_COUNTS.signup),
      forgot: Math.floor(Math.random() * MODE_HEADING_COUNTS.forgot),
      "verify-email": Math.floor(
        Math.random() * MODE_HEADING_COUNTS["verify-email"],
      ),
      "mfa-challenge": Math.floor(
        Math.random() * MODE_HEADING_COUNTS["mfa-challenge"],
      ),
    });
  }, []);

  const callbackError = searchParams?.get("error") ?? null;
  const callbackErrorDescription =
    searchParams?.get("error_description") ?? null;
  const isExpiredVerificationLink =
    callbackError === "otp_expired" || callbackError === "verification_failed";

  /**
   * Strip callback query params (?error=…&error_description=…&verified=…)
   * from the URL. Without this the "expired link" banner + Resend button
   * stick around forever because they're derived from the URL itself.
   */
  const clearCallbackParams = () => {
    if (
      searchParams?.get("error") ||
      searchParams?.get("error_description") ||
      searchParams?.get("verified")
    ) {
      router.replace("/auth");
    }
  };

  const callbackMessage = useMemo(() => {
    if (searchParams?.get("verified") === "true") {
      return {
        text: "Email verified successfully. You can sign in now.",
        tone: "success" as const,
      };
    }
    if (isExpiredVerificationLink) {
      return {
        text:
          callbackErrorDescription ||
          "This verification link expired. Enter your email below to resend a new one.",
        tone: "error" as const,
      };
    }
    return null;
  }, [searchParams, isExpiredVerificationLink, callbackErrorDescription]);

  const headingPool = headingsByMode[MODE_HEADING_KEY[mode]] ?? [];
  const heading =
    headingPool.length > 0
      ? headingPool[headingChoice[mode] % headingPool.length]
      : "";

  const actionLabel =
    mode === "signin"
      ? t("actions.signin")
      : mode === "signup"
        ? t("actions.signup")
        : t("actions.forgot");

  const buttonDisabled = submitting || (mode === "signup" && signupCooldown);

  const formError = useMemo(
    () => errors.general || authError || null,
    [errors.general, authError],
  );

  const showResendVerification =
    mode === "signin" &&
    (isExpiredVerificationLink ||
      formError?.toLowerCase().includes("confirm your email") ||
      formError?.toLowerCase().includes("email not confirmed"));

  const resetFeedback = () => {
    setErrors({});
    setSubmitAttempted(false);
    setSuccessMessage(null);
    onClearError();
  };

  const toggleMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (nextMode !== "signup") {
      setAge("");
      setUsername("");
    }
    setRememberFor30Days(false);
    setMfaCode("");
    setMfaFactorId("");
    setMfaInputMode("totp");
    setHeadingChoice((prev) => ({
      ...prev,
      [nextMode]: Math.floor(Math.random() * MODE_HEADING_COUNTS[nextMode]),
    }));
    resetFeedback();
    clearCallbackParams();
  };

  const validate = () => {
    const nextErrors = buildAuthFormErrors({
      mode,
      email,
      password,
      username,
      age,
      confirmPassword,
      tv: (k: string) => tv(k),
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAction = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    resetFeedback();

    if (!validate()) {
      setSubmitAttempted(true);
      return { error: tv("correctHighlightedFields") };
    }
    setSubmitAttempted(false);

    setSubmitting(true);

    try {
      if (mode === "forgot") {
        const result = await onResetPassword(email);
        if (result.error) {
          setErrors({ general: result.error });
          return result;
        }
        setSuccessMessage(t("resetSuccess"));
        return { error: null };
      }

      if (mode === "signin") {
        const result = await onSignIn(email, password, rememberFor30Days);
        if (result.error) {
          setErrors({ general: result.error });
        } else if (result.mfaRequired) {
          // Signal parent BEFORE async work to block redirect immediately
          onMfaChallengeStarted?.();
          const factorsResult = await onListMFAFactors();
          if (factorsResult.data?.totp && factorsResult.data.totp.length > 0) {
            setMfaFactorId(factorsResult.data.totp[0].id);
          }
          setMode("mfa-challenge");
        } else {
          // Safety net: if a verified TOTP factor exists but the AAL check
          // didn't mark MFA required, still present the challenge rather than
          // silently bypassing it.
          const factorsResult = await onListMFAFactors();
          const verifiedFactor = factorsResult.data?.totp?.find(
            (f: MFAFactor) => f.status === "verified",
          );
          if (verifiedFactor) {
            onMfaChallengeStarted?.();
            setMfaFactorId(verifiedFactor.id);
            setMode("mfa-challenge");
          }
          // No verified factor → let the parent redirect to dashboard.
        }
        return result;
      }

      // SIGN UP LOGIC
      const result = await onSignUp(
        email,
        password,
        username.trim(),
        username.trim(),
        Number(age),
      );

      if (result.error) {
        setErrors({ general: result.error });
        return result;
      }

      setSignupEmail(email);
      setSignupPendingMfa(true);
      setMode("verify-email");
      return { error: null };
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasskeySignIn = async () => {
    resetFeedback();
    const identifier = email.trim();
    if (!identifier) {
      setErrors({
        email: tv("emailOrUsernameRequired"),
        general: tv("passkeyIdentifierRequired"),
      });
      setSubmitAttempted(true);
      return;
    }

    setPasskeySigningIn(true);
    try {
      const { error } = await passkeyService.signIn(identifier);
      if (error) {
        setErrors({ general: error });
        return;
      }
      // Tell the parent to suppress the AAL elevation check that would
      // otherwise race our redirect and flash the MFA challenge screen.
      onPasskeySignedIn?.();
      router.replace(postAuthDestination);
    } finally {
      setPasskeySigningIn(false);
    }
  };

  /**
   * Friendlier copy for the noisy error strings the auth APIs return on a
   * wrong/expired code. Falls back to the raw error for anything we don't
   * recognize so unusual cases (network errors, etc.) still surface.
   */
  const friendlyMfaError = (raw: string, mode: "totp" | "backup") => {
    const normalized = raw.toLowerCase();
    if (normalized.includes("expired")) {
      return mode === "totp"
        ? tv("mfaError.totpExpired")
        : tv("mfaError.backupExpired");
    }
    if (
      normalized.includes("invalid") ||
      normalized.includes("incorrect") ||
      normalized.includes("doesn't match") ||
      normalized.includes("does not match") ||
      normalized.includes("not match") ||
      normalized.includes("wrong")
    ) {
      return mode === "totp"
        ? tv("mfaError.totpMismatch")
        : tv("mfaError.backupMismatch");
    }
    return raw;
  };

  const handleMfaVerify = async () => {
    resetFeedback();
    setMfaVerifying(true);

    try {
      if (mfaInputMode === "totp") {
        if (mfaCode.length !== 6) {
          setErrors({ general: tv("enterSixDigitCode") });
          return;
        }
        const result = await onVerifyMFA(mfaFactorId, mfaCode);
        if (result.error) {
          setErrors({ general: friendlyMfaError(result.error, "totp") });
          setMfaCode("");
        } else {
          setMfaSuccess(true);
          onMfaChallengeResolved?.();
          // Brief confirmation before the redirect so the verify success
          // doesn't feel like a silent flash.
          setTimeout(() => router.replace(postAuthDestination), 2800);
        }
      } else {
        const trimmed = mfaCode.trim();
        if (!trimmed) {
          setErrors({ general: tv("enterBackupCode") });
          return;
        }
        const result = await onVerifyBackupCode(trimmed);
        if (result.error) {
          setErrors({ general: friendlyMfaError(result.error, "backup") });
          setMfaCode("");
        } else {
          setMfaSuccess(true);
          onMfaChallengeResolved?.();
          setTimeout(() => router.replace(postAuthDestination), 2800);
        }
      }
    } finally {
      setMfaVerifying(false);
    }
  };

  // Auto-submit the MFA challenge when six TOTP digits are present. Backup
  // codes aren't a fixed length, so we only do this for TOTP.
  useEffect(() => {
    if (
      mode === "mfa-challenge" &&
      mfaInputMode === "totp" &&
      mfaCode.length === 6 &&
      !mfaVerifying
    ) {
      handleMfaVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mfaCode, mfaInputMode, mode]);

  return {
    // props (defaulted) — render references these directly
    loading,
    authError,
    signupCooldown,
    onClearError,
    onSignIn,
    onSignUp,
    onResetPassword,
    onResendVerificationEmail,
    onVerifyMFA,
    onListMFAFactors,
    onVerifyBackupCode,
    initialMfaRequired,
    onMfaChallengeResolved,
    onMfaChallengeStarted,
    onPasskeySignedIn,
    // infra
    router,
    searchParams,
    t,
    tv,
    tPasswordRules,
    messages,
    headingsByMode,
    postAuthDestination,
    // state + setters
    mode,
    setMode,
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    age,
    setAge,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    rememberFor30Days,
    setRememberFor30Days,
    errors,
    setErrors,
    submitAttempted,
    setSubmitAttempted,
    successMessage,
    setSuccessMessage,
    isResendingVerification,
    setIsResendingVerification,
    submitting,
    setSubmitting,
    headingChoice,
    setHeadingChoice,
    signupEmail,
    setSignupEmail,
    signupPendingMfa,
    setSignupPendingMfa,
    mfaFactorId,
    setMfaFactorId,
    mfaCode,
    setMfaCode,
    mfaInputMode,
    setMfaInputMode,
    mfaVerifying,
    setMfaVerifying,
    mfaSuccess,
    setMfaSuccess,
    passkeySupported,
    setPasskeySupported,
    passkeySigningIn,
    setPasskeySigningIn,
    emailFocused,
    setEmailFocused,
    usernameFocused,
    setUsernameFocused,
    ageFocused,
    setAgeFocused,
    passwordFocused,
    setPasswordFocused,
    confirmPasswordFocused,
    setConfirmPasswordFocused,
    emailAnchorRef,
    usernameAnchorRef,
    ageAnchorRef,
    passwordAnchorRef,
    confirmPasswordAnchorRef,
    // derived
    trimmedEmail,
    emailRules,
    parsedAge,
    ageRules,
    trimmedUsername,
    usernameRules,
    passwordRules,
    confirmPasswordRules,
    emailAllMet,
    usernameAllMet,
    ageAllMet,
    passwordAllMet,
    confirmAllMet,
    emailMetForMode,
    passwordMetForMode,
    callbackError,
    callbackErrorDescription,
    isExpiredVerificationLink,
    callbackMessage,
    headingPool,
    heading,
    actionLabel,
    buttonDisabled,
    formError,
    showResendVerification,
    // handlers
    clearCallbackParams,
    resetFeedback,
    toggleMode,
    validate,
    handleAction,
    handlePasskeySignIn,
    friendlyMfaError,
    handleMfaVerify,
  };
}
