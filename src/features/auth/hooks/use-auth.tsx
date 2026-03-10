import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/features/auth/types/user";
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
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: string | null }>;
  clearError: () => void;
  updateProfile: (
    name: string,
    age: number,
  ) => Promise<{ error: string | null }>;
  updateEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  enrollMFA: () => Promise<{ data?: any; error: string | null }>;
  verifyMFA: (
    factorId: string,
    code: string,
  ) => Promise<{ data?: any; error: string | null }>;
  unenrollMFA: (factorId: string) => Promise<{ error: string | null }>;
  listMFAFactors: () => Promise<{ data?: any; error: string | null }>;
  signOutAllDevices: () => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
  disableAccount: () => Promise<{ error: string | null }>;
  getAALLevel: () => Promise<{ data?: any; error: string | null }>;
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

          setSession(session);

          if (event === "SIGNED_IN" && session?.user) {
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
        if (aalData && aalData.nextLevel === "aal2" && aalData.currentLevel === "aal1") {
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
        await supabase.auth.signOut();
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

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.signInWithGoogle();
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      console.error("Error signing in with Google:", error);
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

  const value = {
    user,
    session,
    loading,
    error,
    signupCooldown,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    resendVerificationEmail,
    clearError,
    updateProfile,
    updateEmail,
    updatePassword,
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
