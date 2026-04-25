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
 */
export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: ReadonlyArray<PasswordRule> = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { label: "One number (0–9)", test: (p) => /\d/.test(p) },
  {
    label: "One special character (!@#$…)",
    test: (p) => /[^a-zA-Z0-9]/.test(p),
  },
];

/**
 * Validate password strength against all PASSWORD_RULES.
 */
export function isValidPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
