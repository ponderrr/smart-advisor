export interface EnvValidationResult {
  isValid: boolean;
  missingKeys: string[];
  warnings: string[];
}

export const validateEnvironment = (): EnvValidationResult => {
  // Cast import.meta.env to allow dynamic key access
  const env = import.meta.env as Record<string, string | undefined>;

  // Only validate client-side environment variables that are actually needed
  const requiredClientKeys = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

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
  const exposedKeys = [];

  if (env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    exposedKeys.push("VITE_SUPABASE_SERVICE_ROLE_KEY");
  }
  if (env.VITE_TMDB_API_KEY) {
    exposedKeys.push("VITE_TMDB_API_KEY");
  }
  if (env.VITE_GOOGLE_BOOKS_API_KEY) {
    exposedKeys.push("VITE_GOOGLE_BOOKS_API_KEY");
  }

  if (exposedKeys.length > 0) {
    warnings.push(
      `CRITICAL SECURITY VULNERABILITY: The following API keys are exposed in the client bundle: ${exposedKeys.join(
        ", "
      )}. Remove these immediately!`
    );
  }

  // Optional environment variables that enhance features but aren't required
  if (env.DEV) {
    const optionalEnvVars = {
      VITE_TMDB_API_KEY: import.meta.env.VITE_TMDB_API_KEY,
      VITE_GOOGLE_BOOKS_API_KEY: import.meta.env.VITE_GOOGLE_BOOKS_API_KEY,
    };

    const missingOptional = Object.entries(optionalEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingOptional.length > 0) {
      console.info(
        "Optional environment variables missing (enhanced features may be limited):",
        missingOptional
      );
      console.info(
        "These services will fall back to default behavior via Edge Functions"
      );
    }
  }

  // Only log warnings in development mode
  if (env.DEV && warnings.length > 0) {
    console.warn("Environment validation warnings:");
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
    warnings,
  };
};
