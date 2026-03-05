import { supabase } from "@/integrations/supabase/client";
import { User } from "@/features/auth/types/user";

export interface AuthError {
  message: string;
}

class AuthService {
  private toUserFriendlyError(rawMessage: string | undefined, fallback: string): string {
    const message = (rawMessage || "").toLowerCase();

    if (message.includes("user from sub claim in jwt does not exist")) {
      return "Your session is no longer valid. Please sign in again.";
    }
    if (message.includes("jwt") && message.includes("expired")) {
      return "Your session expired. Please sign in again.";
    }
    if (message.includes("invalid refresh token") || message.includes("refresh token")) {
      return "Your session expired. Please sign in again.";
    }
    if (message.includes("otp_expired") || message.includes("email link is invalid") || message.includes("expired")) {
      return "That email link has expired. Please request a new one.";
    }
    if (message.includes("email not confirmed")) {
      return "Please verify your email before signing in.";
    }
    if (message.includes("invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }
    if (message.includes("too many requests") || message.includes("rate limit")) {
      return "Too many attempts right now. Please wait a moment and try again.";
    }

    return fallback;
  }

  async signUp(
    email: string,
    password: string,
    name: string,
    age: number
  ): Promise<{ error: string | null }> {
    try {
      if (process.env.NODE_ENV === 'development') console.log("Starting signup process for:", email);
      const normalizedEmail = email.trim().toLowerCase();
      const firstName = name.trim().split(/\s+/)[0] || "there";

      // Determine the correct redirect URL based on environment
      const getRedirectUrl = () => {
        if (typeof window !== "undefined") {
          return `${window.location.origin}/auth/callback`;
        }
        return "https://smartadvisor.live/auth/callback";
      };

      // Create the auth user with explicit redirect URL
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name,
            full_name: name,
            first_name: firstName,
            age,
          },
          // Use dynamic redirect URL that works for both local and production
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (authError) {
        console.error("Sign up auth error:", authError);
        return {
          error: this.toUserFriendlyError(
            authError.message,
            "We couldn't create your account right now. Please try again.",
          ),
        };
      }

      if (!authData.user) {
        console.error("No user returned from signup");
        return { error: "Failed to create user account" };
      }

      // Supabase anti-enumeration behavior for existing confirmed users:
      // user is returned but identities array can be empty and no new email is sent.
      if (
        !authData.session &&
        Array.isArray(authData.user.identities) &&
        authData.user.identities.length === 0
      ) {
        // Do not leak account existence details. Treat this as a neutral success path.
        return { error: null };
      }

      if (process.env.NODE_ENV === 'development') console.log("Auth user created successfully:", authData.user.id);

      // Check if email confirmation is required
      if (
        !authData.session &&
        authData.user &&
        !authData.user.email_confirmed_at
      ) {
        if (process.env.NODE_ENV === 'development') console.log("Email confirmation required");
        return { error: null }; // Don't treat this as an error
      }

      // If we get here, email confirmation is not required (auto-confirm is enabled)
      // Create profile immediately
      const { error: profileError } = await supabase.from("profiles").upsert([
        {
          id: authData.user.id,
          name,
          age,
          email: normalizedEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: "id" });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Ensure no auth state lingers if profile setup fails.
        await supabase.auth.signOut();
        return {
          error: "Failed to create user profile. Please try signing in.",
        };
      }

      // Keep signup flow explicit: user confirms email, then signs in intentionally.
      // This also clears any unexpected session/token created by auto-confirm setups.
      await supabase.auth.signOut();

      if (process.env.NODE_ENV === 'development') console.log("Profile created successfully");
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      return {
        error: "An unexpected error occurred during sign up. Please try again.",
      };
    }
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ error: string | null }> {
    try {
      if (process.env.NODE_ENV === 'development') console.log("Starting signin process for:", email);

      // Validate inputs
      if (!email || !password) {
        return { error: "Email and password are required" };
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        return { error: "Please enter a valid email address" };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error("Sign in error:", error);

        // Provide more specific error messages
        if (error.message.includes("Invalid login credentials")) {
          return {
            error:
              "Invalid email or password. Please check your credentials and try again.",
          };
        }
        if (error.message.includes("Email not confirmed")) {
          return {
            error:
              "Please check your email and click the confirmation link before signing in.",
          };
        }
        if (error.message.includes("Too many requests")) {
          return {
            error:
              "Too many login attempts. Please wait a moment and try again.",
          };
        }

        return {
          error: this.toUserFriendlyError(
            error.message,
            "Sign in failed. Please try again.",
          ),
        };
      }

      if (!data.user) {
        console.error("No user returned from signin");
        return { error: "Sign in failed. Please try again." };
      }

      if (process.env.NODE_ENV === 'development') console.log("User signed in successfully:", data.user.id);

      // Verify profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        if (profileError.code === "PGRST116") {
          // Profile doesn't exist, create one
          const { error: createError } = await supabase
            .from("profiles")
            .upsert([
              {
                id: data.user.id,
                name: data.user.user_metadata?.name || "User",
                age: data.user.user_metadata?.age || 25,
                email: data.user.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ], { onConflict: "id" });

          if (createError) {
            console.error("Error creating missing profile:", createError);
            await supabase.auth.signOut();
            return {
              error: "Account setup incomplete. Please contact support.",
            };
          }
        } else {
          await supabase.auth.signOut();
          return { error: "Failed to load user profile. Please try again." };
        }
      }

      if (process.env.NODE_ENV === 'development') console.log("Profile verified successfully");
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signin:", err);
      return {
        error: "An unexpected error occurred during sign in. Please try again.",
      };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      if (process.env.NODE_ENV === 'development') console.log("Starting signout process");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        return {
          error: this.toUserFriendlyError(
            error.message,
            "Unable to sign out right now. Please try again.",
          ),
        };
      }
      if (process.env.NODE_ENV === 'development') console.log("User signed out successfully");
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signout:", err);
      return { error: "An unexpected error occurred during sign out" };
    }
  }

  async signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "https://smartadvisor.live/auth/callback";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        console.error("Google sign-in error:", error);
        return {
          error: this.toUserFriendlyError(
            error.message,
            "Unable to continue with Google sign-in.",
          ),
        };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error during Google sign-in:", err);
      return { error: "Unable to continue with Google sign-in." };
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      if (!email) {
        return { error: "Email is required" };
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        return { error: "Please enter a valid email address" };
      }

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://smartadvisor.live";
      const normalizedEmail = email.trim().toLowerCase();

      // Best-effort database existence check.
      // If blocked by RLS, continue with reset flow to avoid false negatives.
      const { data: profileRows, error: profileLookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", normalizedEmail)
        .limit(1);

      if (!profileLookupError && (!profileRows || profileRows.length === 0)) {
        return {
          error:
            "No account found for this email. Please check your email address or sign up.",
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${origin}/auth/callback`,
        },
      );

      if (error) {
        console.error("Reset password error:", error);
        return {
          error: this.toUserFriendlyError(
            error.message,
            "Unable to send reset email right now. Please try again.",
          ),
        };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error during password reset:", err);
      return {
        error:
          "An unexpected error occurred while sending reset email. Please try again.",
      };
    }
  }

  async resendVerificationEmail(
    email: string
  ): Promise<{ error: string | null }> {
    try {
      if (!email) {
        return { error: "Enter your email to resend verification." };
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        return { error: "Please enter a valid email address" };
      }

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://smartadvisor.live";

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Resend verification error:", error);
        return {
          error: this.toUserFriendlyError(
            error.message,
            "Unable to resend verification email right now. Please try again.",
          ),
        };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error during resend verification:", err);
      return {
        error: "Unable to resend verification email right now. Please try again.",
      };
    }
  }

  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      if (process.env.NODE_ENV === 'development') console.log("authService.getCurrentUser: Attempting to get user...");
      let user = null;
      let userError = null;

      try {
        const { data: userData, error: userErr } =
          await supabase.auth.getUser();
        user = userData.user;
        userError = userErr;
      } catch (err) {
        console.error(
          "authService.getCurrentUser: Error in supabase.auth.getUser() call:",
          err
        );
        return {
          user: null,
          error: "Failed to retrieve user from auth system",
        };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          "authService.getCurrentUser: Result of supabase.auth.getUser() - user:",
          user
        );
      }
      if (process.env.NODE_ENV === 'development') {
        console.log(
          "authService.getCurrentUser: Result of supabase.auth.getUser() - error:",
          userError
        );
      }

      if (userError) {
        console.error(
          "authService.getCurrentUser: Error getting user:",
          userError
        );
        return {
          user: null,
          error: this.toUserFriendlyError(
            userError.message,
            "We couldn't verify your session. Please sign in again.",
          ),
        };
      }

      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            "authService.getCurrentUser: No user found after getUser()."
          );
        }
        return { user: null, error: null };
      }

      if (process.env.NODE_ENV === 'development') console.log("authService.getCurrentUser: User found:", user.id);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (process.env.NODE_ENV === 'development') {
        console.log(
          "authService.getCurrentUser: Result of profile fetch - profile:",
          profile
        );
      }
      if (process.env.NODE_ENV === 'development') {
        console.log(
          "authService.getCurrentUser: Result of profile fetch - error:",
          profileError
        );
      }

      if (profileError) {
        console.error(
          "authService.getCurrentUser: Error fetching profile:",
          profileError
        );

        if (profileError.code === "PGRST116") {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              "authService.getCurrentUser: Profile not found, attempting to create..."
            );
          }
          // Profile doesn't exist, create one
          const { error: createError } = await supabase
            .from("profiles")
            .upsert([
              {
                id: user.id,
                name: user.user_metadata?.name || "User",
                age: user.user_metadata?.age || 25,
                email: user.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ], { onConflict: "id" });

          if (createError) {
            console.error(
              "authService.getCurrentUser: Error creating missing profile:",
              createError
            );
            return { user: null, error: "Failed to create user profile" };
          }
          if (process.env.NODE_ENV === 'development') {
            console.log(
              "authService.getCurrentUser: Profile created successfully."
            );
          }

          // Return the created profile
          return {
            user: {
              id: user.id,
              email: user.email || "",
              name: user.user_metadata?.name || "User",
              age: user.user_metadata?.age || 25,
              created_at: new Date().toISOString(),
            },
            error: null,
          };
        }

        return { user: null, error: "Failed to fetch user profile" };
      }

      if (!profile) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            "authService.getCurrentUser: User profile is null after fetch."
          );
        }
        return { user: null, error: "User profile not found" };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          "authService.getCurrentUser: Profile fetched successfully.",
          profile.id
        );
      }
      return {
        user: {
          id: user.id,
          email: user.email || "",
          name: profile.name,
          age: profile.age,
          created_at: profile.created_at,
        },
        error: null,
      };
    } catch (err) {
      console.error("Error in getCurrentUser:", err);
      return { user: null, error: "Failed to get current user" };
    }
  }

  async updateProfile({
    name,
    age,
  }: {
    name: string;
    age: number;
  }): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user for profile update:", userError);
        return {
          error: this.toUserFriendlyError(
            userError.message,
            "Unable to update profile right now. Please try again.",
          ),
        };
      }

      if (!user) {
        return { error: "No authenticated user found" };
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name,
          age,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return {
          error: this.toUserFriendlyError(
            updateError.message,
            "Unable to update profile right now. Please try again.",
          ),
        };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating profile:", err);
      return { error: "An unexpected error occurred while updating profile" };
    }
  }
}

export const authService = new AuthService();
