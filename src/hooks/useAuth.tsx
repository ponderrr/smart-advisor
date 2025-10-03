import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/User";
import { authService } from "@/services/auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    age: number
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  updateProfile: (
    name: string,
    age: number
  ) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // New function to handle user profile fetching with AbortController
  const fetchUserProfile = async (
    supabaseUser: SupabaseUser,
    signal?: AbortSignal
  ) => {
    try {
      setLoading(true);
      setError(null);
      console.log(
        "useAuth: fetchUserProfile - attempting to get current user..."
      );

      // Check if operation was aborted
      if (signal?.aborted) {
        console.log("useAuth: fetchUserProfile aborted");
        return;
      }

      const { user: profileUser, error: profileError } =
        await authService.getCurrentUser();

      // Check again if operation was aborted after async call
      if (signal?.aborted) {
        console.log("useAuth: fetchUserProfile aborted after API call");
        return;
      }

      if (profileError) {
        console.error("useAuth: Error loading user profile:", profileError);
        setError(profileError);
        setUser(null);
      } else {
        setUser(profileUser);
        console.log(
          "useAuth: User profile loaded successfully.",
          profileUser?.id
        );
      }
    } catch (err) {
      // Don't set error if operation was aborted
      if (signal?.aborted) {
        console.log("useAuth: fetchUserProfile aborted during error handling");
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
        console.log("Initializing auth state...");
        setError(null);

        // Check if operation was aborted before starting
        if (abortController.signal.aborted) return;

        // Set up auth state listener first
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.id);

          if (!mounted || abortController.signal.aborted) return;

          setSession(session);

          // The fetchUserProfile useEffect will handle loading the user profile.
          // We only set loading to false if there's no session user.
          if (!session?.user) {
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

        console.log("Initial session:", initialSession?.user?.id || "none");

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

  // useEffect to fetch user profile whenever the session user changes
  useEffect(() => {
    if (!mounted) return;

    const abortController = new AbortController();

    const handleSessionChange = async () => {
      if (session?.user) {
        fetchUserProfile(session.user, abortController.signal);
      } else if (session === null) {
        // If session becomes explicitly null, ensure user is null and loading is false
        setUser(null);
        setLoading(false);
      }
    };

    handleSessionChange();

    return () => {
      abortController.abort();
    };
  }, [session?.user, mounted]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Attempting signin...");

      const result = await authService.signIn(email, password);

      if (result.error) {
        setError(result.error);
        console.error("Signin failed:", result.error);
      } else {
        console.log("Signin successful");
        // Auth state change will be handled by the listener and subsequent useEffect for profile fetch
      }

      return result;
    } catch (error) {
      console.error("Error signing in:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
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
      console.log("Attempting signup...");

      const result = await authService.signUp(email, password, name, age);

      if (result.error) {
        setError(result.error);
        console.error("Signup failed:", result.error);
      } else {
        console.log("Signup successful");
        // Auth state change will be handled by the listener and subsequent useEffect for profile fetch
      }

      return result;
    } catch (error) {
      console.error("Error signing up:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Attempting signout...");

      const result = await authService.signOut();

      if (result.error) {
        setError(result.error);
        console.error("Signout failed:", result.error);
      } else {
        console.log("Signout successful");
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

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
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
