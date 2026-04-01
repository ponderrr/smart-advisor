// ─── Route Paths ──────────────────────────────────────────────
export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  AUTH_CALLBACK: "/auth/callback",
  AUTH_RESET_PASSWORD: "/auth/reset-password",
  AUTH_VERIFIED: "/auth/verified",
  DASHBOARD: "/dashboard",
  DEMO: "/demo",
  DEMO_RESULTS: "/demo/results",
  CONTENT_SELECTION: "/content-selection",
  QUESTION_COUNT: "/question-count",
  QUESTIONNAIRE: "/questionnaire",
  RESULTS: "/results",
  HISTORY: "/history",
  SETTINGS: "/settings",
  ACCOUNT_SECURITY: "/account/security",
  ACCOUNT_MFA_SETUP: "/account/mfa-setup",
} as const;

// ─── localStorage / sessionStorage Keys ───────────────────────
export const STORAGE_KEYS = {
  PREF_CONTENT_FOCUS: "smart_advisor_pref_content_focus",
  PREF_DISCOVERY: "smart_advisor_pref_discovery",
  PREF_QUESTION_COUNT: "smart_advisor_pref_question_count",
  DISMISSED_BANNERS: "smart_advisor_dismissed_banners",
  MFA_PROMPT_DISMISSED_AT: "smart_advisor_mfa_prompt_dismissed_at",
  REMEMBER_UNTIL: "smart_advisor_remember_until",
  EMAIL_VERIFIED: "smart_advisor_email_verified",
  DEMO_ANSWERS: "smart_advisor_demo_answers",
  VOLATILE_SESSION: "smart_advisor_volatile_session",
  GENERATED_SESSIONS: "smart_advisor_generated_sessions",
  BACKUP_EMAIL_VERIFY: "backup_email_verify",
} as const;

// ─── External API Base URLs ───────────────────────────────────
export const API_URLS = {
  OPEN_LIBRARY_SEARCH: "https://openlibrary.org/search.json",
  OPEN_LIBRARY_COVERS: "https://covers.openlibrary.org/b/id",
  OPEN_LIBRARY_SUBJECTS: "https://openlibrary.org/subjects",
  OPEN_LIBRARY_BASE: "https://openlibrary.org",
  TMDB_BASE: "https://api.themoviedb.org/3",
  TMDB_IMAGE: "https://image.tmdb.org/t/p/w500",
  TMDB_WEB: "https://www.themoviedb.org",
  IPIFY: "https://api.ipify.org?format=json",
  SITE_URL: "https://smartadvisor.live",
} as const;

// ─── Default Timeout for External Fetches ─────────────────────
export const FETCH_TIMEOUT_MS = 8000;
