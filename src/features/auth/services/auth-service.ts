import { supabase } from "@/integrations/supabase/client";
import { User } from "@/features/auth/types/user";

export interface AuthError {
  message: string;
}

class AuthService {
  private toUserFriendlyError(rawMessage: string | undefined, fallback = "An unexpected error occurred"): string {
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
    if (message.includes("for security purposes") && message.includes("after")) {
      return "Please wait about a minute before requesting another email.";
    }

    return fallback;
  }

  /* -------------------- SIGNUP -------------------- */
  async signUp(email: string, password: string, name: string, age: number): Promise<{ error: string | null }> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const firstName = name.trim().split(/\s+/)[0] || "there";

      const getRedirectUrl = () =>
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "https://smartadvisor.live/auth/callback";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name, full_name: name, first_name: firstName, age },
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (authError) return { error: this.toUserFriendlyError(authError.message, "We couldn't create your account right now. Please try again.") };
      if (!authData.user) return { error: "Failed to create user account" };

      // Handle profile creation if auto-confirmation
      if (authData.session || authData.user.email_confirmed_at) {
        const { error: profileError } = await supabase.from("profiles").upsert([{
          id: authData.user.id,
          name,
          age,
          email: normalizedEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }], { onConflict: "id" });

        if (profileError) {
          await supabase.auth.signOut();
          return { error: "Failed to create user profile. Please try signing in." };
        }
      }

      await supabase.auth.signOut(); // ensure signup ends with no active session
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      return { error: "An unexpected error occurred during sign up. Please try again." };
    }
  }

  /* -------------------- SIGNIN -------------------- */
  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) return { error: this.toUserFriendlyError(error.message, "Sign in failed. Please try again.") };
      if (!data.user) return { error: "Sign in failed. Please try again." };

      // Ensure profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError?.code === "PGRST116") {
        await supabase.from("profiles").upsert([{
          id: data.user.id,
          name: data.user.user_metadata?.name || "User",
          age: data.user.user_metadata?.age || 25,
          email: data.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }], { onConflict: "id" });
      } else if (profileError) {
        await supabase.auth.signOut();
        return { error: "Failed to load user profile. Please try again." };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signin:", err);
      return { error: "An unexpected error occurred during sign in. Please try again." };
    }
  }

  /* -------------------- SIGNOUT -------------------- */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: this.toUserFriendlyError(error.message) };
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signout:", err);
      return { error: "An unexpected error occurred during sign out" };
    }
  }

  /* -------------------- GOOGLE OAUTH -------------------- */
  async signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "https://smartadvisor.live/auth/callback";
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
      if (error) return { error: this.toUserFriendlyError(error.message, "Unable to continue with Google sign-in.") };
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during Google sign-in:", err);
      return { error: "Unable to continue with Google sign-in." };
    }
  }

  /* -------------------- PASSWORD & EMAIL -------------------- */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const origin = typeof window !== "undefined" ? window.location.origin : "https://smartadvisor.live";
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${origin}/auth/callback` });
      if (error) return { error: this.toUserFriendlyError(error.message) };
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during password reset:", err);
      return { error: "An unexpected error occurred while sending reset email. Please try again." };
    }
  }

  async updateEmail(email: string): Promise<{ error: string | null }> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/\S+@\S+\.\S+/.test(normalizedEmail)) return { error: "Please enter a valid email address." };

      const { error: authError } = await supabase.auth.updateUser({ email: normalizedEmail });
      if (authError) return { error: this.toUserFriendlyError(authError.message) };

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase.from("profiles").update({ email: normalizedEmail, updated_at: new Date().toISOString() }).eq("id", user.id);
      }
      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating email:", err);
      return { error: "An unexpected error occurred while updating email." };
    }
  }

  async updatePassword(password: string): Promise<{ error: string | null }> {
    try {
      if (password.length < 8) return { error: "Password must be at least 8 characters." };
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: this.toUserFriendlyError(error.message) };
      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating password:", err);
      return { error: "An unexpected error occurred while updating password." };
    }
  }

  /* -------------------- PROFILE -------------------- */
  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) return { user: null, error: this.toUserFriendlyError(error.message) };
      if (!data.user) return { user: null, error: null };

      const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      if (profileError) return { user: null, error: "Failed to fetch user profile" };

      return { user: { id: data.user.id, email: data.user.email || "", name: profile.name, age: profile.age, created_at: profile.created_at }, error: null };
    } catch (err) {
      console.error("Error in getCurrentUser:", err);
      return { user: null, error: "Failed to get current user" };
    }
  }

  async updateProfile({ name, age }: { name: string; age: number }): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: "No authenticated user found" };
      const { error } = await supabase.from("profiles").update({ name, age, updated_at: new Date().toISOString() }).eq("id", user.id);
      if (error) return { error: this.toUserFriendlyError(error.message) };
      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating profile:", err);
      return { error: "An unexpected error occurred while updating profile" };
    }
  }

  /* -------------------- MFA & SECURITY -------------------- */
  async enrollMFA() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) return { error: this.toUserFriendlyError(error.message) };
    return { data };
  }

  async verifyMFA(factorId: string, code: string) {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) return { error: this.toUserFriendlyError(error.message) };
    return { data };
  }

  async unenrollMFA(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) return { error: this.toUserFriendlyError(error.message) };
    return { success: true };
  }

  async listMFAFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return { error: this.toUserFriendlyError(error.message) };
    return { data };
  }

  async getActiveSessions() {
    const { data: { session } } = await supabase.auth.getSession();
    return { session };
  }

  async signOutAllDevices() {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) return { error: this.toUserFriendlyError(error.message) };
    return { success: true };
  }

  async updatePasswordWithTicket(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) return { error: this.toUserFriendlyError(error.message) };
    return { data };
  }
}

export const authService = new AuthService();
