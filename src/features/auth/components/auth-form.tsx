"use client";

import * as Label from "@radix-ui/react-label";
import { AnimatePresence, motion } from "motion/react";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { Fingerprint } from "lucide-react";
import { MfaChallengeScreen } from "./mfa-challenge-screen";
import { VerifyEmailScreen } from "./verify-email-screen";
import {
  AuthHoverButton,
  FieldRequirements,
  FormField,
  PasswordInput,
} from "./auth-shared";
import { useAuthForm, type AuthFormProps } from "./use-auth-form";

export type { AuthMode, AuthFormProps } from "./use-auth-form";

/**
 * Thin presentational shell. All state/effects/handlers live in
 * useAuthForm — the render below is byte-identical to the pre-refactor
 * component (verbatim relocation, no behavior change).
 */
export const AuthForm = (props: AuthFormProps) => {
  const {
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
    router,
    searchParams,
    t,
    tv,
    tPasswordRules,
    messages,
    headingsByMode,
    postAuthDestination,
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
    clearCallbackParams,
    resetFeedback,
    toggleMode,
    validate,
    handleAction,
    handlePasskeySignIn,
    friendlyMfaError,
    handleMfaVerify,
  } = useAuthForm(props);

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
                  ? t("eyebrow.signin")
                  : mode === "signup"
                    ? t("eyebrow.signup")
                    : t("eyebrow.forgot")}
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
                  ? t("subtitle.signin")
                  : mode === "signup"
                    ? t("subtitle.signup")
                    : t("subtitle.forgot")}
              </p>
            </motion.div>

            {(mode === "signin" || mode === "signup") && (
              <div className="mt-5">
                <SegmentedControl<"signin" | "signup">
                  layoutId="auth-mode-toggle"
                  value={mode}
                  onChange={(next) => toggleMode(next)}
                  disabled={buttonDisabled}
                  ariaLabel={t("modeToggle.ariaLabel")}
                  options={[
                    { value: "signin", label: t("modeToggle.signin") },
                    { value: "signup", label: t("modeToggle.signup") },
                  ]}
                />
              </div>
            )}

            <form
              onSubmit={(event) => event.preventDefault()}
              className="mt-6 space-y-4"
              noValidate
            >
              <div>
                <div ref={emailAnchorRef}>
                  <FormField
                    label={
                      mode === "signin"
                        ? t("labels.emailOrUsername")
                        : t("labels.email")
                    }
                    htmlFor="auth-email"
                    invalid={submitAttempted && !emailMetForMode}
                  >
                    <Input
                      id="auth-email"
                      type={mode === "signin" ? "text" : "email"}
                      autoComplete={mode === "signin" ? "username" : "email"}
                      placeholder={
                        mode === "signin"
                          ? t("placeholders.emailOrUsername")
                          : t("placeholders.email")
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
                  title={tv("popoverTitles.email")}
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
                        label={t("labels.password")}
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
                          placeholder={t("placeholders.password")}
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
                      title={tv("popoverTitles.password")}
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
                          label={t("labels.username")}
                          htmlFor="auth-username"
                          invalid={submitAttempted && !usernameAllMet}
                        >
                          <Input
                            id="auth-username"
                            type="text"
                            placeholder={t("placeholders.username")}
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
                        title={tv("popoverTitles.username")}
                      />
                    </div>

                    <div>
                      <div ref={ageAnchorRef}>
                        <FormField
                          label={t("labels.age")}
                          htmlFor="auth-age"
                          invalid={submitAttempted && !ageAllMet}
                        >
                          <Input
                            id="auth-age"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={t("placeholders.age")}
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
                        title={tv("popoverTitles.age")}
                      />
                    </div>

                    <div>
                      <div ref={confirmPasswordAnchorRef}>
                        <FormField
                          label={t("labels.confirmPassword")}
                          htmlFor="auth-confirm-password"
                          invalid={submitAttempted && !confirmAllMet}
                        >
                          <PasswordInput
                            id="auth-confirm-password"
                            placeholder={t("placeholders.password")}
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
                        title={tv("popoverTitles.confirmPassword")}
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
                      setSuccessMessage(t("resendSuccess"));
                      // Drop the ?error=otp_expired params so the banner +
                      // resend button disappear once the new email is on
                      // the way.
                      clearCallbackParams();
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-400 hover:bg-slate-100 hover:text-violet-700 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {isResendingVerification
                    ? t("resendingVerification")
                    : t("resendVerification")}
                </AuthHoverButton>
              )}

              {mode === "signup" && signupCooldown && !formError && (
                <p className="text-center text-sm text-red-500">
                  {t("cooldown")}
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
                      {t("passkeyDivider")}
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
                      ? t("passkeyWaiting")
                      : t("passkeySignIn")}
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
                        {t("rememberMe")}
                      </Label.Root>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => toggleMode("forgot")}
                        className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        disabled={buttonDisabled}
                      >
                        {t("forgotPassword")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom text link is now only used by the forgot-password
                  flow to send users back to sign-in. The signin/signup
                  swap lives in the segmented control above the form. */}
              {mode === "forgot" && (
                <div className="pt-2 text-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {t("toggle.forgot.prompt")}
                  </span>{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode("signin")}
                    className="text-sm font-black tracking-tight text-violet-600 underline-offset-2 transition-colors hover:text-violet-500 hover:underline disabled:opacity-60 dark:text-violet-400 dark:hover:text-violet-300"
                    disabled={buttonDisabled}
                  >
                    {t("toggle.forgot.cta")}
                  </button>
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
