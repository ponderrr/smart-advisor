"use client";

import * as Label from "@radix-ui/react-label";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconBrandGoogle,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

export type AuthMode = "signin" | "signup" | "forgot";

interface AuthFormProps {
  loading: boolean;
  authError?: string | null;
  onClearError: () => void;
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onGoogleSignIn: () => Promise<{ error: string | null }>;
  onSignUp: (
    email: string,
    password: string,
    name: string,
    age: number,
  ) => Promise<{ error: string | null }>;
  onResetPassword: (email: string) => Promise<{ error: string | null }>;
}

export const AuthForm = ({
  loading,
  authError,
  onClearError,
  onSignIn,
  onGoogleSignIn,
  onSignUp,
  onResetPassword,
}: AuthFormProps) => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const heading =
    mode === "signin"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";

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
      const result = await onSignIn(email, password);
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
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
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

      <form onSubmit={(event) => event.preventDefault()} className="mt-6 space-y-4" noValidate>
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
            className="focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600"
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
                  className="focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600"
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
        {successMessage && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{successMessage}</p>
        )}

        <StatefulButton
          key={`stateful-${mode}`}
          type="submit"
          onClick={handleAction}
          disabled={disabled}
          className="mt-1"
        >
          {actionLabel}
        </StatefulButton>

        {(mode === "signin" || mode === "signup") && (
          <div className="pt-1 text-right">
            <button
              type="button"
              onClick={() => toggleMode("forgot")}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              disabled={disabled}
            >
              Forgot Password?
            </button>
          </div>
        )}

        {(mode === "signin" || mode === "signup") && (
          <>
            <div className="relative py-1">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-3 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                or
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                resetFeedback();
                const result = await onGoogleSignIn();
                if (result.error) {
                  setErrors({ general: result.error });
                }
              }}
              className="shadow-input inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Continue with Google"
              disabled={disabled}
            >
              <IconBrandGoogle className="h-4 w-4" />
              <span>Continue with Google</span>
            </button>
          </>
        )}

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
            className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
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
  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        className={cn(
          "shadow-input flex h-10 w-full rounded-md border-none bg-gray-50 px-3 py-2 pr-10 text-sm text-black transition duration-300 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:focus-visible:ring-neutral-600",
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
    </div>
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
