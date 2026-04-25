"use client";

import * as Label from "@radix-ui/react-label";
import { AnimatePresence, motion } from "motion/react";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MfaChallengeScreen } from "./mfa-challenge-screen";
import { VerifyEmailScreen } from "./verify-email-screen";
import {
  AuthHoverButton,
  FieldRequirements,
  FormField,
  PasswordInput,
} from "./auth-shared";
import { PASSWORD_RULES, isValidPassword } from "../utils/validation";
import { MFAFactor, MFAListFactorsData } from "../types/mfa";
import { passkeyService } from "../services/passkey-service";
import { Fingerprint } from "lucide-react";

export type AuthMode =
  | "signin"
  | "signup"
  | "forgot"
  | "verify-email"
  | "mfa-challenge";

const MODE_HEADINGS = {
  signin: [
    "Welcome back",
    "Great to see you again",
    "Ready for your next pick?",
  ],
  signup: [
    "Create your account",
    "Join Smart Advisor",
    "Let's set up your profile",
  ],
  forgot: [
    "Reset your password",
    "Recover access",
    "Get back into your account",
  ],
  "verify-email": ["Check your inbox", "Almost there", "One last step"],
  "mfa-challenge": ["Verify your identity", "One more step", "Security check"],
} as const;

interface AuthFormProps {
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
  onListMFAFactors: () => Promise<{ data?: MFAListFactorsData | null; error: string | null }>;
  onVerifyBackupCode: (code: string) => Promise<{ error: string | null }>;
  initialMfaRequired?: boolean;
  onMfaChallengeResolved?: () => void;
  onMfaChallengeStarted?: () => void;
  onPasskeySignedIn?: () => void;
}

export const AuthForm = ({
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
}: AuthFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isResendingVerification, setIsResendingVerification] = useState(false);
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
      { label: "Contains @", met: trimmedEmail.includes("@") },
      {
        label: "Has a domain (example.com)",
        met: /^\S+@\S+\.\S+$/.test(trimmedEmail),
      },
    ],
    [trimmedEmail],
  );

  const parsedAge = Number(age);
  const ageRules = useMemo(
    () => [
      { label: "Whole number", met: age.length > 0 && /^\d+$/.test(age) },
      {
        label: "Between 13 and 120",
        met:
          age.length > 0 &&
          Number.isFinite(parsedAge) &&
          parsedAge >= 13 &&
          parsedAge <= 120,
      },
    ],
    [age, parsedAge],
  );

  const trimmedUsername = username.trim();
  const usernameRules = useMemo(
    () => [
      {
        label: "2–24 characters",
        met: trimmedUsername.length >= 2 && trimmedUsername.length <= 24,
      },
      {
        label: "Letters, numbers, dots, dashes, or underscores",
        met:
          trimmedUsername.length > 0 &&
          /^[a-zA-Z0-9._-]+$/.test(trimmedUsername),
      },
    ],
    [trimmedUsername],
  );
  const passwordRules = useMemo(
    () =>
      PASSWORD_RULES.map((rule) => ({
        label: rule.label,
        met: rule.test(password),
      })),
    [password],
  );
  const confirmPasswordRules = useMemo(
    () => [
      {
        label: "Matches your password",
        met: confirmPassword.length > 0 && confirmPassword === password,
      },
    ],
    [confirmPassword, password],
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
      signin: Math.floor(Math.random() * MODE_HEADINGS.signin.length),
      signup: Math.floor(Math.random() * MODE_HEADINGS.signup.length),
      forgot: Math.floor(Math.random() * MODE_HEADINGS.forgot.length),
      "verify-email": Math.floor(
        Math.random() * MODE_HEADINGS["verify-email"].length,
      ),
      "mfa-challenge": Math.floor(
        Math.random() * MODE_HEADINGS["mfa-challenge"].length,
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

  const headingPool = MODE_HEADINGS[mode];
  const heading = headingPool[headingChoice[mode] % headingPool.length];

  const actionLabel =
    mode === "signin"
      ? "Sign In"
      : mode === "signup"
        ? "Create Account"
        : "Send reset link";

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
      [nextMode]: Math.floor(Math.random() * MODE_HEADINGS[nextMode].length),
    }));
    resetFeedback();
    clearCallbackParams();
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!email) {
      nextErrors.email =
        mode === "signin" ? "Email or username is required" : "Email is required";
    } else if (mode !== "signin" && !/\S+@\S+\.\S+/.test(email)) {
      // Sign-in accepts username too — only enforce email format for signup/forgot.
      nextErrors.email = "Enter a valid email";
    }

    if (mode === "signin" || mode === "signup") {
      if (!password) {
        nextErrors.password = "Password is required";
      } else if (mode === "signup" && !isValidPassword(password)) {
        nextErrors.password = "Password does not meet all requirements";
      }
    }

    if (mode === "signup") {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        nextErrors.username = "Username is required";
      } else if (trimmedUsername.length < 2) {
        nextErrors.username = "Use at least 2 characters";
      } else if (trimmedUsername.length > 24) {
        nextErrors.username = "Use 24 characters or fewer";
      } else if (!/^[a-zA-Z0-9._-]+$/.test(trimmedUsername)) {
        nextErrors.username =
          "Use letters, numbers, dots, dashes, or underscores";
      }

      const parsedAge = Number(age);
      if (!age.trim()) {
        nextErrors.age = "Age is required";
      } else if (!Number.isFinite(parsedAge) || !Number.isInteger(parsedAge)) {
        nextErrors.age = "Age must be a whole number";
      } else if (parsedAge < 13 || parsedAge > 120) {
        nextErrors.age = "Enter an age between 13 and 120";
      }

      if (!confirmPassword) {
        nextErrors.confirmPassword = "Confirm your password";
      } else if (confirmPassword !== password) {
        nextErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      nextErrors.general = "Please fix the highlighted fields.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAction = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    resetFeedback();

    if (!validate()) {
      setSubmitAttempted(true);
      return { error: "Please correct the highlighted fields" };
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
        setSuccessMessage(
          "If an account exists for this email, a password reset link has been sent.",
        );
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
        email: "Email or username is required",
        general: "Enter your email or username to use a passkey.",
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
      router.replace("/dashboard");
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
        ? "That code expired. Wait for a new one in your authenticator and try again."
        : "That backup code is no longer valid.";
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
        ? "That code didn't match. Double-check your authenticator and try again."
        : "That backup code didn't match. Each code only works once.";
    }
    return raw;
  };

  const handleMfaVerify = async () => {
    resetFeedback();
    setMfaVerifying(true);

    try {
      if (mfaInputMode === "totp") {
        if (mfaCode.length !== 6) {
          setErrors({ general: "Please enter a 6-digit code" });
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
          setTimeout(() => router.replace("/dashboard"), 2800);
        }
      } else {
        const trimmed = mfaCode.trim();
        if (!trimmed) {
          setErrors({ general: "Please enter a backup code" });
          return;
        }
        const result = await onVerifyBackupCode(trimmed);
        if (result.error) {
          setErrors({ general: friendlyMfaError(result.error, "backup") });
          setMfaCode("");
        } else {
          setMfaSuccess(true);
          onMfaChallengeResolved?.();
          setTimeout(() => router.replace("/dashboard"), 2800);
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

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6",
        mode === "signup" && "md:min-h-[620px]",
        mode === "signin" && "md:min-h-[500px]",
        mode === "forgot" && "md:min-h-[430px]",
        mode === "verify-email" && "md:min-h-[400px]",
        mode === "mfa-challenge" && "md:min-h-[440px]",
      )}
    >
      <AnimatePresence mode="wait">
        {mode === "verify-email" ? (
          <motion.div
            key="verify-email"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col h-full"
          >
            <VerifyEmailScreen
              email={signupEmail}
              onResend={async () => {
                setIsResendingVerification(true);
                const result = await onResendVerificationEmail(signupEmail);
                setIsResendingVerification(false);
                return result;
              }}
              isResending={isResendingVerification}
              onBackToSignIn={() => toggleMode("signin")}
              showMfaHint={signupPendingMfa}
            />
          </motion.div>
        ) : mode === "mfa-challenge" ? (
          <motion.div
            key="mfa-challenge"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col h-full"
          >
            <MfaChallengeScreen
              mfaCode={mfaCode}
              onMfaCodeChange={setMfaCode}
              mfaInputMode={mfaInputMode}
              onToggleMfaInputMode={() => {
                setMfaInputMode((m) => (m === "totp" ? "backup" : "totp"));
                setMfaCode("");
                resetFeedback();
              }}
              onVerify={handleMfaVerify}
              verifying={mfaVerifying}
              success={mfaSuccess}
              error={formError}
              onBackToSignIn={() => toggleMode("signin")}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                {mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Reset password"}
              </p>
              <h1
                className={cn(
                  "mt-2 text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl dark:text-slate-100",
                  mode === "forgot" && "whitespace-nowrap text-2xl sm:text-3xl",
                )}
              >
                {heading}
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {mode === "signin"
                  ? "Sign in to continue your recommendation journey."
                  : mode === "signup"
                    ? "Set up your account to get personalized picks."
                    : "Enter your email and we will send a secure reset link."}
              </p>
            </motion.div>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="mt-6 space-y-4"
              noValidate
            >
              <div>
                <div ref={emailAnchorRef}>
                  <FormField
                    label={mode === "signin" ? "Email or username" : "Email"}
                    htmlFor="auth-email"
                    invalid={submitAttempted && !emailMetForMode}
                  >
                    <Input
                      id="auth-email"
                      type={mode === "signin" ? "text" : "email"}
                      autoComplete={mode === "signin" ? "username" : "email"}
                      placeholder={
                        mode === "signin"
                          ? "you@example.com or username"
                          : "you@example.com"
                      }
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      className="focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500"
                    />
                  </FormField>
                </div>
                <FieldRequirements
                  rules={emailRules}
                  visible={
                    (mode === "signup" || mode === "forgot") &&
                    (emailFocused || (submitAttempted && !emailAllMet))
                  }
                  anchorRef={emailAnchorRef}
                  title="Email requirements"
                />
              </div>

              <AnimatePresence initial={false}>
                {(mode === "signin" || mode === "signup") && (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <div ref={passwordAnchorRef}>
                      <FormField
                        label="Password"
                        htmlFor="auth-password"
                        invalid={submitAttempted && !passwordMetForMode}
                      >
                        <PasswordInput
                          id="auth-password"
                          autoComplete={
                            mode === "signin"
                              ? "current-password"
                              : "new-password"
                          }
                          placeholder="••••••••"
                          value={password}
                          onChange={(
                            event: React.ChangeEvent<HTMLInputElement>,
                          ) => setPassword(event.target.value)}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          showPassword={showPassword}
                          onTogglePassword={() =>
                            setShowPassword((prev) => !prev)
                          }
                        />
                      </FormField>
                    </div>
                    <FieldRequirements
                      rules={passwordRules}
                      visible={
                        mode === "signup" &&
                        (passwordFocused ||
                          (submitAttempted && !passwordAllMet))
                      }
                      anchorRef={passwordAnchorRef}
                      title="Password requirements"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {mode === "signup" && (
                  <motion.div
                    key="signup-extra"
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    className="space-y-4"
                  >
                    <div>
                      <div ref={usernameAnchorRef}>
                        <FormField
                          label="Username"
                          htmlFor="auth-username"
                          invalid={submitAttempted && !usernameAllMet}
                        >
                          <Input
                            id="auth-username"
                            type="text"
                            placeholder="yourname"
                            value={username}
                            maxLength={24}
                            onChange={(event) => setUsername(event.target.value)}
                            onFocus={() => setUsernameFocused(true)}
                            onBlur={() => setUsernameFocused(false)}
                          />
                        </FormField>
                      </div>
                      <FieldRequirements
                        rules={usernameRules}
                        visible={
                          usernameFocused ||
                          (submitAttempted && !usernameAllMet)
                        }
                        anchorRef={usernameAnchorRef}
                        title="Username requirements"
                      />
                    </div>

                    <div>
                      <div ref={ageAnchorRef}>
                        <FormField
                          label="Age"
                          htmlFor="auth-age"
                          invalid={submitAttempted && !ageAllMet}
                        >
                          <Input
                            id="auth-age"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="18"
                            maxLength={3}
                            value={age}
                            onChange={(event) =>
                              setAge(event.target.value.replace(/\D/g, ""))
                            }
                            onFocus={() => setAgeFocused(true)}
                            onBlur={() => setAgeFocused(false)}
                          />
                        </FormField>
                      </div>
                      <FieldRequirements
                        rules={ageRules}
                        visible={
                          ageFocused || (submitAttempted && !ageAllMet)
                        }
                        anchorRef={ageAnchorRef}
                        title="Age requirements"
                      />
                    </div>

                    <div>
                      <div ref={confirmPasswordAnchorRef}>
                        <FormField
                          label="Confirm password"
                          htmlFor="auth-confirm-password"
                          invalid={submitAttempted && !confirmAllMet}
                        >
                          <PasswordInput
                            id="auth-confirm-password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(
                              event: React.ChangeEvent<HTMLInputElement>,
                            ) => setConfirmPassword(event.target.value)}
                            onFocus={() => setConfirmPasswordFocused(true)}
                            onBlur={() => setConfirmPasswordFocused(false)}
                            showPassword={showConfirmPassword}
                            onTogglePassword={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                          />
                        </FormField>
                      </div>
                      <FieldRequirements
                        rules={confirmPasswordRules}
                        visible={
                          confirmPasswordFocused ||
                          (submitAttempted && !confirmAllMet)
                        }
                        anchorRef={confirmPasswordAnchorRef}
                        title="Confirm password"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {formError && <p className="text-sm text-red-500">{formError}</p>}
              {callbackMessage && (
                <p
                  className={cn(
                    "text-sm",
                    callbackMessage.tone === "success"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500",
                  )}
                >
                  {callbackMessage.text}
                </p>
              )}
              {successMessage && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {successMessage}
                </p>
              )}

              {showResendVerification && (
                <AuthHoverButton
                  type="button"
                  disabled={buttonDisabled || isResendingVerification}
                  onClick={async () => {
                    resetFeedback();
                    setIsResendingVerification(true);
                    const result = await onResendVerificationEmail(email);
                    setIsResendingVerification(false);
                    if (result.error) {
                      setErrors({ general: result.error });
                    } else {
                      setSuccessMessage(
                        "Verification email sent. Check your inbox.",
                      );
                      // Drop the ?error=otp_expired params so the banner +
                      // resend button disappear once the new email is on
                      // the way.
                      clearCallbackParams();
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-400 hover:bg-slate-100 hover:text-violet-700 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {isResendingVerification
                    ? "Resending..."
                    : "Resend verification link"}
                </AuthHoverButton>
              )}

              {mode === "signup" && signupCooldown && !formError && (
                <p className="text-center text-sm text-red-500">
                  Please wait a moment before trying again.
                </p>
              )}

              <StatefulButton
                type="submit"
                onClick={handleAction}
                disabled={buttonDisabled}
                className="mt-1"
              >
                {actionLabel}
              </StatefulButton>

              {mode === "signin" && passkeySupported && (
                <div className="mt-3">
                  <div className="relative my-3 flex items-center">
                    <span
                      aria-hidden="true"
                      className="h-px flex-1 bg-slate-200 dark:bg-slate-700"
                    />
                    <span className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      or
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-px flex-1 bg-slate-200 dark:bg-slate-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePasskeySignIn}
                    disabled={passkeySigningIn || buttonDisabled}
                    className="group flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-bold tracking-tight text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50/80 hover:text-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-violet-500/60 dark:hover:bg-violet-900/20 dark:hover:text-violet-300"
                  >
                    <Fingerprint
                      className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                    />
                    {passkeySigningIn
                      ? "Waiting for passkey..."
                      : "Sign in with a passkey"}
                  </button>
                </div>
              )}

              <AnimatePresence initial={false}>
                {(mode === "signin" || mode === "signup") && (
                  <motion.div
                    key="auth-extra-controls"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    className="overflow-hidden space-y-4 pt-1"
                  >
                    <div className="flex items-center gap-2 rounded-lg px-1 py-1">
                      <Checkbox
                        id="remember-for-30-days"
                        checked={rememberFor30Days}
                        onCheckedChange={(checked) =>
                          setRememberFor30Days(Boolean(checked))
                        }
                        className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-violet-600 dark:border-slate-600"
                        disabled={buttonDisabled}
                      />
                      <Label.Root
                        htmlFor="remember-for-30-days"
                        className="cursor-pointer select-none text-xs font-medium text-slate-600 dark:text-slate-400"
                      >
                        Keep me signed in for 30 days
                      </Label.Root>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => toggleMode("forgot")}
                        className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        disabled={buttonDisabled}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-2 text-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {mode === "forgot"
                    ? "Remembered your password?"
                    : mode === "signup"
                      ? "Already have an account?"
                      : "Don't have an account?"}
                </span>{" "}
                <button
                  type="button"
                  onClick={() =>
                    toggleMode(
                      mode === "forgot"
                        ? "signin"
                        : mode === "signup"
                          ? "signin"
                          : "signup",
                    )
                  }
                  className="text-sm font-black tracking-tight text-violet-600 underline-offset-2 transition-colors hover:text-violet-500 hover:underline disabled:opacity-60 dark:text-violet-400 dark:hover:text-violet-300"
                  disabled={buttonDisabled}
                >
                  {mode === "forgot"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Sign in"
                      : "Sign up"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
