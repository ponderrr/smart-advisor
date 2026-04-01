"use client";

import * as Label from "@radix-ui/react-label";
import { AnimatePresence, motion } from "framer-motion";
import { IconBrandGoogle } from "@tabler/icons-react";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MfaSetup } from "./mfa-setup";
import { MfaChallengeScreen } from "./mfa-challenge-screen";
import { VerifyEmailScreen } from "./verify-email-screen";
import { FormField, PasswordInput, AuthHoverButton } from "./auth-shared";
import { MFAFactor, MFAListFactorsData } from "../types/mfa";

export type AuthMode =
  | "signin"
  | "signup"
  | "forgot"
  | "verify-email"
  | "mfa-challenge"
  | "mfa-setup";

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
  "mfa-setup": [
    "Secure your account",
    "Add extra protection",
    "Enable two-factor auth",
  ],
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
  onGoogleSignIn: () => Promise<{ error: string | null }>;
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
}

export const AuthForm = ({
  loading,
  authError,
  signupCooldown = false,
  onClearError,
  onSignIn,
  onGoogleSignIn,
  onSignUp,
  onResetPassword,
  onResendVerificationEmail,
  onVerifyMFA,
  onListMFAFactors,
  onVerifyBackupCode,
  initialMfaRequired = false,
  onMfaChallengeResolved,
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [headingChoice, setHeadingChoice] = useState<Record<AuthMode, number>>({
    signin: 0,
    signup: 0,
    forgot: 0,
    "verify-email": 0,
    "mfa-challenge": 0,
    "mfa-setup": 0,
  });
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPendingMfa, setSignupPendingMfa] = useState(false);

  // MFA challenge state
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaInputMode, setMfaInputMode] = useState<"totp" | "backup">("totp");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  // When initialMfaRequired changes to true (e.g. OAuth callback), load factors
  useEffect(() => {
    if (initialMfaRequired && !mfaFactorId) {
      setMode("mfa-challenge");
      onListMFAFactors().then((result) => {
        if (result.data?.totp && result.data.totp.length > 0) {
          setMfaFactorId(result.data.totp[0].id);
        }
      });
    }
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
      "mfa-setup": Math.floor(
        Math.random() * MODE_HEADINGS["mfa-setup"].length,
      ),
    });
  }, []);

  const callbackError = searchParams?.get("error") ?? null;
  const callbackErrorDescription =
    searchParams?.get("error_description") ?? null;
  const isExpiredVerificationLink =
    callbackError === "otp_expired" || callbackError === "verification_failed";

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
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Enter a valid email";
    }

    if (mode === "signin" || mode === "signup") {
      if (!password) {
        nextErrors.password = "Password is required";
      } else if (mode === "signup" && password.length < 6) {
        nextErrors.password = "Use at least 6 characters";
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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAction = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    resetFeedback();

    if (!validate()) {
      return { error: "Please correct the highlighted fields" };
    }

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
          const factorsResult = await onListMFAFactors();
          if (factorsResult.data?.totp && factorsResult.data.totp.length > 0) {
            setMfaFactorId(factorsResult.data.totp[0].id);
          }
          setMode("mfa-challenge");
        } else {
          const factorsResult = await onListMFAFactors();
          const hasVerified = factorsResult.data?.totp?.some(
            (f: MFAFactor) => f.status === "verified",
          );
          if (!hasVerified) {
            setMode("mfa-setup");
          } else {
            router.replace("/dashboard");
          }
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
          setErrors({ general: result.error });
        } else {
          onMfaChallengeResolved?.();
          router.replace("/dashboard");
        }
      } else {
        const trimmed = mfaCode.trim();
        if (!trimmed) {
          setErrors({ general: "Please enter a backup code" });
          return;
        }
        const result = await onVerifyBackupCode(trimmed);
        if (result.error) {
          setErrors({ general: result.error });
        } else {
          onMfaChallengeResolved?.();
          router.replace("/dashboard");
        }
      }
    } finally {
      setMfaVerifying(false);
    }
  };

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6",
        mode === "signup" && "min-h-[620px]",
        mode === "signin" && "min-h-[500px]",
        mode === "forgot" && "min-h-[430px]",
        mode === "verify-email" && "min-h-[400px]",
        mode === "mfa-challenge" && "min-h-[440px]",
        mode === "mfa-setup" && "min-h-[500px]",
      )}
    >
      <AnimatePresence mode="wait">
        {mode === "mfa-setup" ? (
          <motion.div
            key="mfa-setup"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col h-full"
          >
            <MfaSetup
              onComplete={() => router.replace("/dashboard")}
              onSkip={() => router.replace("/dashboard")}
            />
          </motion.div>
        ) : mode === "verify-email" ? (
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
              <h1
                className={cn(
                  "text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100",
                  mode === "forgot" && "whitespace-nowrap text-2xl sm:text-3xl",
                )}
              >
                {heading}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
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
              <FormField
                label="Email"
                htmlFor="auth-email"
                error={errors.email}
              >
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500"
                />
              </FormField>

              <AnimatePresence initial={false}>
                {(mode === "signin" || mode === "signup") && (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <FormField
                      label="Password"
                      htmlFor="auth-password"
                      error={errors.password}
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
                        showPassword={showPassword}
                        onTogglePassword={() =>
                          setShowPassword((prev) => !prev)
                        }
                      />
                    </FormField>
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
                    className="space-y-4"
                  >
                    <FormField
                      label="Username"
                      htmlFor="auth-username"
                      error={errors.username}
                    >
                      <Input
                        id="auth-username"
                        type="text"
                        placeholder="yourname"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                      />
                    </FormField>

                    <FormField
                      label="Age"
                      htmlFor="auth-age"
                      error={errors.age}
                    >
                      <Input
                        id="auth-age"
                        type="number"
                        placeholder="18"
                        value={age}
                        onChange={(event) => setAge(event.target.value)}
                      />
                    </FormField>

                    <FormField
                      label="Confirm password"
                      htmlFor="auth-confirm-password"
                      error={errors.confirmPassword}
                    >
                      <PasswordInput
                        id="auth-confirm-password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>,
                        ) => setConfirmPassword(event.target.value)}
                        showPassword={showConfirmPassword}
                        onTogglePassword={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                      />
                    </FormField>
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
                    if (result.error) setErrors({ general: result.error });
                    else
                      setSuccessMessage(
                        "Verification email sent. Check your inbox.",
                      );
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-400 hover:bg-slate-100 hover:text-violet-700 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {isResendingVerification
                    ? "Resending..."
                    : "Resend verification link"}
                </AuthHoverButton>
              )}

              {mode === "signup" && signupCooldown && (
                <p className="text-center text-sm text-red-500">
                  Please wait a moment before trying again.
                </p>
              )}

              <StatefulButton
                key={`stateful-${mode}`}
                type="submit"
                onClick={handleAction}
                disabled={buttonDisabled}
                hoverGlow
                className="mt-1"
              >
                {actionLabel}
              </StatefulButton>

              <AnimatePresence initial={false}>
                {(mode === "signin" || mode === "signup") && (
                  <motion.div
                    key="auth-extra-controls"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
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

                    <div className="relative py-1">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-3 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        or
                      </span>
                    </div>

                    <AuthHoverButton
                      type="button"
                      onClick={async () => {
                        resetFeedback();
                        const result = await onGoogleSignIn();
                        if (result.error) setErrors({ general: result.error });
                      }}
                      className="shadow-input inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 transition-all hover:border-violet-400 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      disabled={buttonDisabled}
                    >
                      <IconBrandGoogle className="h-4 w-4" />
                      <span>Continue with Google</span>
                    </AuthHoverButton>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="pt-1 text-center text-sm text-slate-600 dark:text-slate-400">
                {mode === "forgot"
                  ? "Remembered your password?"
                  : mode === "signup"
                    ? "Already have an account?"
                    : "Don't have an account?"}{" "}
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
                  className="font-semibold text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
                  disabled={buttonDisabled}
                >
                  {mode === "forgot"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Sign in"
                      : "Sign up"}
                </button>
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
