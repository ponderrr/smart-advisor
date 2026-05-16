/**
 * Debounce hook for preventing rapid successive function calls
 * Used to prevent HTTP 429 "too many requests" errors
 */
export function createDebounce<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delayMs: number = 1000,
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;

  const debounced = async (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      const executeCall = async () => {
        try {
          lastCallTime = Date.now();
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      if (timeSinceLastCall >= delayMs) {
        executeCall();
      } else {
        timeoutId = setTimeout(executeCall, delayMs - timeSinceLastCall);
      }
    });
  };

  return debounced as T;
}

/**
 * Normalize email: trim whitespace and convert to lowercase
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

/**
 * Password strength rules. The single source of truth for both client-side
 * validation and the live requirements popover shown in the auth UI.
 *
 * `key` is the translation key under `Auth.passwordRules.{key}` — consumers
 * resolve the user-facing label via useTranslations() so we keep one rule
 * list across English and Spanish.
 */
export type PasswordRuleKey =
  | "minLength"
  | "uppercase"
  | "lowercase"
  | "digit"
  | "special";

export interface PasswordRule {
  key: PasswordRuleKey;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: ReadonlyArray<PasswordRule> = [
  { key: "minLength", test: (p) => p.length >= 8 },
  { key: "uppercase", test: (p) => /[A-Z]/.test(p) },
  { key: "lowercase", test: (p) => /[a-z]/.test(p) },
  { key: "digit", test: (p) => /\d/.test(p) },
  { key: "special", test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

/**
 * Validate password strength against all PASSWORD_RULES.
 */
export function isValidPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

/**
 * Pure error-builder for the auth form. Extracted verbatim from
 * AuthForm.validate() (only the surrounding setErrors/return were left
 * behind) so the branching is directly unit-testable. `tv` resolves
 * `Auth.validation.*` keys.
 */
export type AuthFormMode =
  | "signin"
  | "signup"
  | "forgot"
  | "verify-email"
  | "mfa-challenge";

export function buildAuthFormErrors(params: {
  mode: AuthFormMode;
  email: string;
  password: string;
  username: string;
  age: string;
  confirmPassword: string;
  tv: (key: string) => string;
}): Record<string, string> {
  const { mode, email, password, username, age, confirmPassword, tv } = params;
  const nextErrors: Record<string, string> = {};
  if (!email) {
    nextErrors.email =
      mode === "signin" ? tv("emailOrUsernameRequired") : tv("emailRequired");
  } else if (mode !== "signin" && !/\S+@\S+\.\S+/.test(email)) {
    // Sign-in accepts username too — only enforce email format for signup/forgot.
    nextErrors.email = tv("emailInvalid");
  }

  if (mode === "signin" || mode === "signup") {
    if (!password) {
      nextErrors.password = tv("passwordRequired");
    } else if (mode === "signup" && !isValidPassword(password)) {
      nextErrors.password = tv("passwordRequirementsUnmet");
    }
  }

  if (mode === "signup") {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      nextErrors.username = tv("usernameRequired");
    } else if (trimmedUsername.length < 2) {
      nextErrors.username = tv("usernameTooShort");
    } else if (trimmedUsername.length > 24) {
      nextErrors.username = tv("usernameTooLong");
    } else if (!/^[a-zA-Z0-9._-]+$/.test(trimmedUsername)) {
      nextErrors.username = tv("usernameInvalid");
    }

    const parsedAge = Number(age);
    if (!age.trim()) {
      nextErrors.age = tv("ageRequired");
    } else if (!Number.isFinite(parsedAge) || !Number.isInteger(parsedAge)) {
      nextErrors.age = tv("ageNotInteger");
    } else if (parsedAge < 13 || parsedAge > 120) {
      nextErrors.age = tv("ageOutOfRange");
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = tv("confirmPasswordRequired");
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = tv("passwordsDoNotMatch");
    }
  }

  if (Object.keys(nextErrors).length > 0) {
    nextErrors.general = tv("fixHighlightedFields");
  }

  return nextErrors;
}
