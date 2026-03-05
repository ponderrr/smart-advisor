"use client";

import * as Label from "@radix-ui/react-label";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import {
  IconBrandGoogle,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export type AuthMode = "signin" | "signup" | "forgot";

const MODE_HEADINGS = {
  signin: ["Welcome back", "Great to see you again", "Ready for your next pick?"],
  signup: ["Create your account", "Join Smart Advisor", "Let’s set up your profile"],
  forgot: ["Reset your password", "Recover access", "Get back into your account"],
} as const;

interface AuthFormProps {
  loading: boolean;
  authError?: string | null;
  onClearError: () => void;
  onSignIn: (
    email: string,
    password: string,
    rememberFor30Days: boolean
  ) => Promise<{ error: string | null }>;
  onGoogleSignIn: () => Promise<{ error: string | null }>;
  onSignUp: (
    email: string,
    password: string,
    name: string,
    age: number,
  ) => Promise<{ error: string | null }>;
  onResetPassword: (email: string) => Promise<{ error: string | null }>;
  onResendVerificationEmail: (email: string) => Promise<{ error: string | null }>;
}

export const AuthForm = ({
  loading,
  authError,
  onClearError,
  onSignIn,
  onGoogleSignIn,
  onSignUp,
  onResetPassword,
  onResendVerificationEmail,
}: AuthFormProps) => {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberFor30Days, setRememberFor30Days] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [headingChoice, setHeadingChoice] = useState<Record<AuthMode, number>>({
    signin: 0,
    signup: 0,
    forgot: 0,
  });

  useEffect(() => {
    setHeadingChoice({
      signin: Math.floor(Math.random() * MODE_HEADINGS.signin.length),
      signup: Math.floor(Math.random() * MODE_HEADINGS.signup.length),
      forgot: Math.floor(Math.random() * MODE_HEADINGS.forgot.length),
    });
  }, []);


  const callbackError = searchParams.get("error");
  const callbackErrorDescription = searchParams.get("error_description");
  const isExpiredVerificationLink =
    callbackError === "otp_expired" || callbackError === "verification_failed";
  const callbackMessage = useMemo(() => {
    if (searchParams.get("verified") === "true") {
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

  const disabled = loading;

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
    }
    setRememberFor30Days(false);
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
      }
      return result;
    }

    const inferredName =
      email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "New User";
    const name = inferredName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");

    const result = await onSignUp(email, password, name, Number(age));

    if (result.error) {
      setErrors({ general: result.error });
      return result;
    }

    setSuccessMessage(
      "Account created successfully. Please check your email to confirm your account.",
    );
    setPassword("");
    setConfirmPassword("");
    setAge("");
    return { error: null };
  };

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-[min-height] duration-300 dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6",
        mode === "signup" && "min-h-[560px]",
        mode === "signin" && "min-h-[500px]",
        mode === "forgot" && "min-h-[430px]",
      )}
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
        <FormField label="Email" htmlFor="auth-email" error={errors.email}>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(errors.email)}
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
              <FormField label="Password" htmlFor="auth-password" error={errors.password}>
                <PasswordInput
                  id="auth-password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.password)}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((prev) => !prev)}
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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-4"
            >
              <FormField label="Age" htmlFor="auth-age" error={errors.age}>
                <Input
                  id="auth-age"
                  type="number"
                  min={13}
                  max={120}
                  step={1}
                  inputMode="numeric"
                  placeholder="18"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.age)}
                  className="[appearance:textfield] focus-visible:ring-slate-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:focus-visible:ring-slate-500"
                />
              </FormField>

              <FormField
                label="Confirm password"
                htmlFor="auth-confirm-password"
                error={errors.confirmPassword}
              >
                <PasswordInput
                  id="auth-confirm-password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
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
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{successMessage}</p>
        )}

        {showResendVerification && (
          <AuthHoverButton
            type="button"
            disabled={disabled || isResendingVerification}
            onClick={async () => {
              setErrors({});
              setSuccessMessage(null);
              setIsResendingVerification(true);
              const result = await onResendVerificationEmail(email);
              setIsResendingVerification(false);
              if (result.error) {
                setErrors({ general: result.error });
                return;
              }
              setSuccessMessage(
                "Verification email sent. Please check your inbox and spam folder.",
              );
            }}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-400 hover:bg-slate-100 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:border-violet-400 dark:hover:bg-slate-800 dark:hover:text-violet-300"
          >
            {isResendingVerification ? "Resending..." : "Resend verification link"}
          </AuthHoverButton>
        )}

        <StatefulButton
          key={`stateful-${mode}`}
          type="submit"
          onClick={handleAction}
          disabled={disabled}
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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-1">
                <motion.label
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 rounded-lg px-1 py-1"
                >
                  <motion.div
                    animate={rememberFor30Days ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Checkbox
                      id="remember-for-30-days"
                      checked={rememberFor30Days}
                      onCheckedChange={(checked) => setRememberFor30Days(Boolean(checked))}
                      className={cn(
                        "h-4 w-4 rounded border-slate-300 text-white transition-colors data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600",
                        "dark:border-slate-600 dark:data-[state=checked]:bg-violet-400 dark:data-[state=checked]:border-violet-400",
                      )}
                      disabled={disabled}
                    />
                  </motion.div>
                  <Label.Root
                    htmlFor="remember-for-30-days"
                    className="cursor-pointer select-none text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Keep me signed in for 30 days
                  </Label.Root>
                </motion.label>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleMode("forgot")}
                    className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    disabled={disabled}
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative py-1">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-3 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    or
                  </span>
                </div>

                <AuthHoverButton
                  type="button"
                  onClick={async () => {
                    resetFeedback();
                    const result = await onGoogleSignIn();
                    if (result.error) {
                      setErrors({ general: result.error });
                    }
                  }}
                  className="shadow-input inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-violet-400 dark:hover:bg-violet-500/20 dark:hover:text-violet-200"
                  aria-label="Continue with Google"
                  disabled={disabled}
                >
                  <IconBrandGoogle className="h-4 w-4" />
                  <span>Continue with Google</span>
                </AuthHoverButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="pt-1 text-center text-sm text-slate-600 dark:text-slate-400">
          {mode === "forgot" ? "Remembered your password?" : mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
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
            disabled={disabled}
          >
            {mode === "forgot" ? "Sign in" : mode === "signup" ? "Sign in" : "Sign up"}
          </button>
        </p>
      </form>
    </div>
  );
};

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showPassword: boolean;
  onTogglePassword: () => void;
}

const PasswordInput = ({
  showPassword,
  onTogglePassword,
  className,
  ...props
}: PasswordInputProps) => {
  const radius = 100;
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      style={{
        background: useMotionTemplate`
          radial-gradient(
            ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
            #8b5cf6,
            transparent 80%
          )
        `,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input relative rounded-lg p-[2px] transition duration-300"
    >
      <input
        type={showPassword ? "text" : "password"}
        className={cn(
          "shadow-input flex h-10 w-full rounded-md border-none bg-gray-50 px-3 py-2 pr-10 text-sm text-black transition duration-400 group-hover/input:shadow-none placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:focus-visible:ring-slate-500",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        onClick={onTogglePassword}
        className="absolute inset-y-0 right-1 inline-flex items-center justify-center rounded-md px-2 text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        disabled={props.disabled}
      >
        {showPassword ? (
          <IconEyeOff className="h-4 w-4" />
        ) : (
          <IconEye className="h-4 w-4" />
        )}
      </button>
    </motion.div>
  );
};

const FormField = ({ label, htmlFor, error, children }: FormFieldProps) => {
  return (
    <div className="space-y-1.5">
      <Label.Root
        htmlFor={htmlFor}
        className={cn(
          "text-sm font-medium text-slate-700 dark:text-slate-300",
          error && "text-red-500",
        )}
      >
        {label}
      </Label.Root>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

const AuthHoverButton = ({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const radius = 110;
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const background = useMotionTemplate`
    radial-gradient(
      ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
      rgba(139,92,246,0.5),
      transparent 80%
    )
  `;

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onMouseMove?.(event);
    const { left, top } = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - left);
    mouseY.set(event.clientY - top);
  };

  return (
    <motion.button
      {...props}
      onMouseMove={handleMouseMove}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event);
        setVisible(true);
      }}
      onMouseLeave={(event) => {
        props.onMouseLeave?.(event);
        setVisible(false);
      }}
      style={{
        ...(props.style ?? {}),
        backgroundImage: background,
      }}
      className={className}
    >
      {children}
    </motion.button>
  );
};
