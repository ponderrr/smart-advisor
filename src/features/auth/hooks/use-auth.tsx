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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string,
    rememberFor30Days?: boolean
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    age: number
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInAsMockUser: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  resendVerificationEmail: (
    email: string
  ) => Promise<{ error: string | null }>;
  clearError: () => void;
  updateProfile: (
    name: string,
    age: number
  ) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REMEMBER_UNTIL_KEY = "smart_advisor_remember_until";
const VOLATILE_SESSION_KEY = "smart_advisor_volatile_session";
const MOCK_USER_KEY = "smart_advisor_mock_user";
const MOCK_USER_COOKIE = "sa_mock";
const MOCK_USER: User = {
  id: "mock-user-id",
  email: "mock@smartadvisor.local",
  name: "Mock User",
  age: 25,
  created_at: new Date().toISOString(),
};

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

const setMockSession = (enabled: boolean) => {
  if (typeof window === "undefined") return;
  if (enabled) {
    window.sessionStorage.setItem(MOCK_USER_KEY, "1");
    document.cookie = `${MOCK_USER_COOKIE}=1; path=/; samesite=lax`;
    return;
  }

  window.sessionStorage.removeItem(MOCK_USER_KEY);
  document.cookie = `${MOCK_USER_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
};

const hasMockSession = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(MOCK_USER_KEY) === "1";
};

const shouldKeepExistingSession = () => {
  if (typeof window === "undefined") return false;

  const volatileSession = window.sessionStorage.getItem(VOLATILE_SESSION_KEY) === "1";
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

  // New function to handle user profile fetching with AbortController
  const fetchUserProfile = async (
    _supabaseUser: SupabaseUser,
    signal?: AbortSignal
  ) => {
    // Check if operation was aborted before any state updates
    if (signal?.aborted) {
      if (process.env.NODE_ENV === 'development') console.log("useAuth: fetchUserProfile aborted");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (process.env.NODE_ENV === 'development') {
        console.log(
          "useAuth: fetchUserProfile - attempting to get current user..."
        );
      }

      const { user: profileUser, error: profileError } =
        await authService.getCurrentUser();

      // Check again if operation was aborted after async call
      if (signal?.aborted) {
        if (process.env.NODE_ENV === 'development') console.log("useAuth: fetchUserProfile aborted after API call");
        return;
      }

      if (profileError) {
        console.error("useAuth: Error loading user profile:", profileError);
        setError(profileError);
        setUser(null);
      } else {
        setUser(profileUser);
        if (process.env.NODE_ENV === 'development') {
          console.log(
            "useAuth: User profile loaded successfully.",
            profileUser?.id
          );
        }
      }
    } catch (err) {
      // Don't set error if operation was aborted
      if (signal?.aborted) {
        if (process.env.NODE_ENV === 'development') console.log("useAuth: fetchUserProfile aborted during error handling");
        return;
      }
      console.error("useAuth: Unexpected error loading profile:", err);
      setUser(null);
      setError("An unexpected error occurred while loading profile.");
    } finally {
      // Only update loading state if not aborted
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
        if (process.env.NODE_ENV === 'development') console.log("Initializing auth state...");
        setError(null);

        // Check if operation was aborted before starting
        if (abortController.signal.aborted) return;

        // Set up auth state listener first
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (process.env.NODE_ENV === 'development') console.log("Auth state changed:", event, session?.user?.id);

          if (!mounted || abortController.signal.aborted) return;

          setSession(session);

          if (event === "SIGNED_IN" && session?.user) {
            setMockSession(false);
            fetchUserProfile(session.user, abortController.signal);
          } else if (!session?.user && hasMockSession()) {
            setUser(MOCK_USER);
            setLoading(false);
          } else if (!session?.user) {
            setUser(null);
            setLoading(false);
          }
        });
        subscription = sub;

        // Check if operation was aborted before API call
        if (abortController.signal.aborted) return;

        // Check for existing session
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

        if (process.env.NODE_ENV === 'development') console.log("Initial session:", initialSession?.user?.id || "none");

        if (!initialSession?.user && hasMockSession()) {
          setUser(MOCK_USER);
          setSession(null);
          setLoading(false);
          return;
        }

        if (initialSession?.user && !shouldKeepExistingSession()) {
          if (process.env.NODE_ENV === "development") {
            console.log("No valid remember/session preference found. Signing out stale session.");
          }
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
      if (process.env.NODE_ENV === 'development') console.log("Attempting signin...");

      const result = await authService.signIn(email, password);

      if (result.error) {
        setError(result.error);
        console.error("Signin failed:", result.error);
      } else {
        setMockSession(false);
        setSessionPreference(rememberFor30Days);
        if (process.env.NODE_ENV === 'development') console.log("Signin successful");
        // Auth state change will be handled by the listener and subsequent useEffect for profile fetch
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
    age: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      if (process.env.NODE_ENV === 'development') console.log("Attempting signup...");

      const result = await authService.signUp(email, password, name, age);

      if (result.error) {
        setError(result.error);
        console.error("Signup failed:", result.error);
      } else {
        setMockSession(false);
        clearSessionPreference();
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        if (process.env.NODE_ENV === 'development') console.log("Signup successful");
        // Auth state change will be handled by the listener and subsequent useEffect for profile fetch
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
      if (process.env.NODE_ENV === 'development') console.log("Attempting signout...");

      const result = await authService.signOut();

      if (result.error) {
        setError(result.error);
        console.error("Signout failed:", result.error);
      } else {
        setMockSession(false);
        clearSessionPreference();
        if (process.env.NODE_ENV === 'development') console.log("Signout successful");
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

  const signInAsMockUser = async () => {
    try {
      setLoading(true);
      setError(null);
      setMockSession(true);
      setSessionPreference(false);
      setUser(MOCK_USER);
      setSession(null);
      return { error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to continue with mock user.";
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

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInAsMockUser,
    resetPassword,
    resendVerificationEmail,
    clearError,
    updateProfile,
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
