export interface EnvValidationResult {
  isValid: boolean;
  missingKeys: string[];
  warnings: string[];
}

export const validateEnvironment = (): EnvValidationResult => {
  // Cast process.env to allow dynamic key access
  const env = process.env as Record<string, string | undefined>;

  // Only validate client-side environment variables that are actually needed
  const requiredClientKeys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  const missingKeys = requiredClientKeys.filter((key) => !env[key]);
  const warnings: string[] = [];

  if (missingKeys.length > 0) {
    warnings.push(
      `Missing required client environment variables: ${missingKeys.join(
        ", "
      )}. The application cannot function without these.`
    );
  }

  // Check for accidentally exposed service keys (SECURITY CRITICAL)
  const exposedKeys: string[] = [];

  if (env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    exposedKeys.push("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  }
  if (env.NEXT_PUBLIC_TMDB_API_KEY) {
    exposedKeys.push("NEXT_PUBLIC_TMDB_API_KEY");
  }
  if (exposedKeys.length > 0) {
    warnings.push(
      `CRITICAL SECURITY VULNERABILITY: The following API keys are exposed in the client bundle: ${exposedKeys.join(
        ", "
      )}. Remove these immediately!`
    );
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
    warnings,
  };
};
