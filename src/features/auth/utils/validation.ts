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
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
