import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/features/auth/types/user";
import {
  MFAEnrollData,
  MFAListFactorsData,
  AALData,
} from "@/features/auth/types/mfa";
import { authService } from "@/features/auth/services/auth-service";
import { sessionManagementService } from "@/features/auth/services/session-management";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string,
    rememberFor30Days?: boolean,
  ) => Promise<{ error: string | null; mfaRequired?: boolean }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    username: string,
    age: number,
  ) => Promise<{ error: string | null }>;
  signupCooldown: boolean;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: string | null }>;
  clearError: () => void;
  updateProfile: (
    name: string,
    age: number,
  ) => Promise<{ error: string | null }>;
  updateEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  uploadAvatar: (
    file: File,
  ) => Promise<{ url: string | null; error: string | null }>;
  removeAvatar: () => Promise<{ error: string | null }>;
  enrollMFA: () => Promise<{
    data?: MFAEnrollData | null;
    error: string | null;
  }>;
  verifyMFA: (
    factorId: string,
    code: string,
  ) => Promise<{ data?: unknown; error: string | null }>;
  unenrollMFA: (factorId: string) => Promise<{ error: string | null }>;
  listMFAFactors: () => Promise<{
    data?: MFAListFactorsData | null;
    error: string | null;
  }>;
  mfaPending: boolean;
  clearMfaPending: () => void;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  signOutAllDevices: () => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
  disableAccount: () => Promise<{ error: string | null }>;
  getAALLevel: () => Promise<{ data?: AALData | null; error: string | null }>;
  generateBackupCodes: () => Promise<{
    codes: string[];
    error: string | null;
  }>;
  verifyBackupCode: (code: string) => Promise<{ error: string | null }>;
  getRemainingBackupCodeCount: () => Promise<{
    count: number;
    error: string | null;
  }>;
  setBackupEmail: (email: string) => Promise<{ error: string | null }>;
  getBackupEmail: () => Promise<{ email: string | null; error: string | null }>;
  removeBackupEmail: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REMEMBER_UNTIL_KEY = "smart_advisor_remember_until";
const VOLATILE_SESSION_KEY = "smart_advisor_volatile_session";

const setSessionPreference = (rememberFor30Days: boolean) => {
  if (typeof window === "undefined") return;

  if (rememberFor30Days) {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(
      REMEMBER_UNTIL_KEY,
      String(Date.now() + thirtyDaysMs),
    );
    window.sessionStorage.removeItem(VOLATILE_SESSION_KEY);
    return;
  }

  window.localStorage.removeItem(REMEMBER_UNTIL_KEY);
  window.sessionStorage.setItem(VOLATILE_SESSION_KEY, "1");
};

const clearSessionPreference = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REMEMBER_UNTIL_KEY);
  window.sessionStorage.removeItem(VOLATILE_SESSION_KEY);
};

const shouldKeepExistingSession = () => {
  if (typeof window === "undefined") return false;

  // The user just finished an auth round-trip in this tab (email verification
  // or OAuth callback). Signing them back out here would send them to /auth
  // and undo the flow. Mark the tab as volatile so they stay signed in at
  // least until they close it.
  const pathname = window.location.pathname;
  if (pathname === "/auth/verified" || pathname === "/auth/callback") {
    try {
      window.sessionStorage.setItem(VOLATILE_SESSION_KEY, "1");
    } catch {
      // Ignore storage errors — worst case we fall through to the check below.
    }
    return true;
  }

  const volatileSession =
    window.sessionStorage.getItem(VOLATILE_SESSION_KEY) === "1";
  const rememberUntilRaw = window.localStorage.getItem(REMEMBER_UNTIL_KEY);
  const rememberUntil = Number(rememberUntilRaw);
  const hasValidRemember =
    Number.isFinite(rememberUntil) && rememberUntil > Date.now();

  if (rememberUntilRaw && !hasValidRemember) {
    window.localStorage.removeItem(REMEMBER_UNTIL_KEY);
  }

  return volatileSession || hasValidRemember;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [signupCooldown, setSignupCooldown] = useState(false);
  const [mfaPending, setMfaPending] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  // Supabase fires SIGNED_IN during signUp() before we sign the user back out
  // to force email verification. Ignore auth events while signup is in flight
  // so the transient session doesn't leak into state and trigger a redirect.
  const signupInProgressRef = useRef(false);

  const fetchUserProfile = async (
    _supabaseUser: SupabaseUser,
    signal?: AbortSignal,
  ) => {
    if (signal?.aborted) return;

    try {
      setLoading(true);
      setError(null);

      const { user: profileUser, error: profileError } =
        await authService.getCurrentUser();

      if (signal?.aborted) return;

      if (profileError) {
        console.error("useAuth: Error loading user profile:", profileError);
        setError(profileError);
        setUser(null);
      } else {
        setUser(profileUser);
      }
    } catch (err) {
      if (signal?.aborted) return;
      console.error("useAuth: Unexpected error loading profile:", err);
      setUser(null);
      setError("An unexpected error occurred while loading profile.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let subscription: { unsubscribe: () => void } | null = null;
    const abortController = new AbortController();

    const initializeAuth = async () => {
      try {
        setError(null);

        if (abortController.signal.aborted) return;

        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted || abortController.signal.aborted) return;
          if (signupInProgressRef.current) return;

          setSession(session);

          if (event === "SIGNED_IN" && session?.user) {
            setSessionExpired(false);
            fetchUserProfile(session.user, abortController.signal);
            // Ensure a session record exists for Active Sessions tracking
            if (typeof window !== "undefined" && session.access_token) {
              sessionManagementService
                .createSessionRecord(
                  session.user.id,
                  session.access_token,
                  navigator.userAgent,
                )
                .catch(() => {
                  // Non-critical: don't block auth flow if session tracking fails
                });
            }
          } else if (event === "TOKEN_REFRESHED" && session?.user) {
            setSession(session);
          } else if (event === "SIGNED_OUT") {
            // If user had a session before, mark as expired (vs explicit sign out)
            const hadSession = !!user;
            setUser(null);
            setLoading(false);
            if (hadSession) {
              setSessionExpired(true);
            }
          } else if (!session?.user) {
            setUser(null);
            setLoading(false);
          }
        });
        subscription = sub;

        if (abortController.signal.aborted) return;

        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted || abortController.signal.aborted) return;

        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        if (initialSession?.user && !shouldKeepExistingSession()) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        // If there's an initial session with a user, fetch their profile immediately
        if (initialSession?.user) {
          fetchUserProfile(initialSession.user, abortController.signal);
        } else {
          setLoading(false);
        }
      } catch (err) {
        // Don't set error if operation was aborted
        if (abortController.signal.aborted) return;

        console.error("Unexpected error during initial auth setup:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during auth initialization";
        setError(errorMessage);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      abortController.abort();
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [mounted]);

  const signIn = async (
    email: string,
    password: string,
    rememberFor30Days = false,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signIn(email, password);

      if (result.error) {
        setError(result.error);
      } else {
        setSessionPreference(rememberFor30Days);

        // Check AAL level — if MFA is enrolled, currentLevel may be aal1 while nextLevel is aal2
        const { data: aalData } = await authService.getAALLevel();
        if (
          aalData &&
          aalData.nextLevel === "aal2" &&
          aalData.currentLevel === "aal1"
        ) {
          // Set mfaPending BEFORE returning so React batches it with
          // setLoading(false) in the finally block — this prevents the
          // auth page redirect useEffect from firing during the gap.
          setMfaPending(true);
          return { error: null, mfaRequired: true };
        }
      }

      return result;
    } catch (error) {
      console.error("Error signing in:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    username: string,
    age: number,
  ) => {
    if (signupCooldown) {
      const msg = "Please wait a moment before trying again.";
      setError(msg);
      return { error: msg };
    }

    signupInProgressRef.current = true;
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signUp(
        email,
        password,
        name,
        username,
        age,
      );

      if (result.error) {
        setError(result.error);
        const lower = result.error.toLowerCase();
        if (
          lower.includes("too many attempts") ||
          lower.includes("rate limit")
        ) {
          setSignupCooldown(true);
          setTimeout(() => setSignupCooldown(false), 30000);
        }
      } else {
        clearSessionPreference();
        setUser(null);
        setSession(null);
      }

      return result;
    } catch (error) {
      console.error("Error signing up:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      signupInProgressRef.current = false;
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signOut();

      if (result.error) {
        setError(result.error);
      } else {
        clearSessionPreference();
        setMfaPending(false);
        setSessionExpired(false);
        setUser(null);
        setSession(null);
        setLoading(false); // Explicitly set loading to false on sign out
      }

      return result;
    } catch (error) {
      console.error("Error signing out:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.resetPassword(email);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.resendVerificationEmail(email);
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      console.error("Error resending verification email:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (name: string, age: number) => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error("No user logged in");
      }

      const result = await authService.updateProfile({ name, age });

      if (result.error) {
        setError(result.error);
      } else {
        setUser({ ...user, name, age });
      }

      return result;
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { url: null, error: "Not signed in." };
    const result = await authService.uploadAvatar(file);
    if (result.url && !result.error) {
      setUser({ ...user, avatar_url: result.url });
    }
    return result;
  };

  const removeAvatar = async () => {
    if (!user) return { error: "Not signed in." };
    const result = await authService.removeAvatar();
    if (!result.error) {
      setUser({ ...user, avatar_url: undefined });
    }
    return result;
  };

  const updateEmail = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.updateEmail(email);
      if (result.error) {
        setError(result.error);
      } else if (user) {
        setUser({ ...user, email: email.trim().toLowerCase() });
      }

      return result;
    } catch (error) {
      console.error("Error updating email:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.updatePassword(password);
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      console.error("Error updating password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // MFA Methods
  const enrollMFA = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.enrollMFA();
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      console.error("Error enrolling MFA:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage, data: null };
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async (factorId: string, code: string) => {
    try {
      setError(null);
      const result = await authService.verifyMFA(factorId, code);
      if (result.error) {
        setError(result.error);
      } else {
        setMfaPending(false);
      }
      return result;
    } catch (error) {
      console.error("Error verifying MFA:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage, data: null };
    }
  };

  const unenrollMFA = async (factorId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.unenrollMFA(factorId);
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      console.error("Error unenrolling MFA:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const listMFAFactors = async () => {
    try {
      const result = await authService.listMFAFactors();
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      console.error("Error listing MFA factors:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage, data: null };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const signOutAllDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.signOutAllDevices();
      if (result.error) {
        setError(result.error);
      } else {
        clearSessionPreference();
        setUser(null);
        setSession(null);
      }
      return result;
    } catch (error) {
      console.error("Error signing out all devices:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.deleteAccount();
      if (result.error) {
        setError(result.error);
      } else {
        clearSessionPreference();
        setUser(null);
        setSession(null);
      }
      return result;
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const disableAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.disableAccount();
      if (result.error) {
        setError(result.error);
      } else {
        clearSessionPreference();
        setUser(null);
        setSession(null);
      }
      return result;
    } catch (error) {
      console.error("Error disabling account:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getAALLevel = async () => {
    try {
      const result = await authService.getAALLevel();
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      console.error("Error getting AAL level:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const generateBackupCodes = async () => {
    try {
      return await authService.generateBackupCodes();
    } catch (error) {
      console.error("Error generating backup codes:", error);
      return { codes: [], error: "Failed to generate backup codes" };
    }
  };

  const verifyBackupCode = async (code: string) => {
    try {
      const result = await authService.verifyBackupCode(code);
      if (result.error) {
        setError(result.error);
      } else {
        setMfaPending(false);
      }
      return result;
    } catch (error) {
      console.error("Error verifying backup code:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify backup code";
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const getRemainingBackupCodeCount = async () => {
    try {
      return await authService.getRemainingBackupCodeCount();
    } catch (error) {
      return { count: 0, error: "Failed to get backup code count" };
    }
  };

  const setBackupEmail = async (email: string) => {
    return authService.setBackupEmail(email);
  };

  const getBackupEmail = async () => {
    return authService.getBackupEmail();
  };

  const removeBackupEmail = async () => {
    return authService.removeBackupEmail();
  };

  const clearMfaPending = () => setMfaPending(false);
  const clearSessionExpired = () => setSessionExpired(false);

  const value = {
    user,
    session,
    loading,
    error,
    signupCooldown,
    mfaPending,
    clearMfaPending,
    sessionExpired,
    clearSessionExpired,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendVerificationEmail,
    clearError,
    updateProfile,
    updateEmail,
    updatePassword,
    uploadAvatar,
    removeAvatar,
    enrollMFA,
    verifyMFA,
    unenrollMFA,
    listMFAFactors,
    signOutAllDevices,
    deleteAccount,
    disableAccount,
    getAALLevel,
    generateBackupCodes,
    verifyBackupCode,
    getRemainingBackupCodeCount,
    setBackupEmail,
    getBackupEmail,
    removeBackupEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
