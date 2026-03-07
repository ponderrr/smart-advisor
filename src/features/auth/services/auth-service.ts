import { supabase } from "@/integrations/supabase/client";
import { User } from "@/features/auth/types/user";
import {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  createDebounce,
} from "@/features/auth/utils/validation";
import { sessionManagementService } from "@/features/auth/services/session-management";

export interface AuthError {
  message: string;
}

class AuthService {
  private signUpDebounce = createDebounce(this._signUpImpl.bind(this), 1000);
  private signInDebounce = createDebounce(this._signInImpl.bind(this), 500);

  private toUserFriendlyError(
    rawMessage: string | undefined,
    fallback = "An unexpected error occurred",
  ): string {
    const message = (rawMessage || "").toLowerCase();

    if (message.includes("user from sub claim in jwt does not exist")) {
      return "Your session is no longer valid. Please sign in again.";
    }
    if (message.includes("jwt") && message.includes("expired")) {
      return "Your session expired. Please sign in again.";
    }
    if (
      message.includes("invalid refresh token") ||
      message.includes("refresh token")
    ) {
      return "Your session expired. Please sign in again.";
    }
    if (
      message.includes("otp_expired") ||
      message.includes("email link is invalid") ||
      message.includes("expired")
    ) {
      return "That email link has expired. Please request a new one.";
    }
    if (message.includes("email not confirmed")) {
      return "Please verify your email before signing in.";
    }
    if (message.includes("invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }
    if (
      message.includes("too many requests") ||
      message.includes("rate limit")
    ) {
      return "Too many attempts right now. Please wait a moment and try again.";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "A network error occurred. Please check your connection and try again.";
    }
    if (
      message.includes("for security purposes") &&
      message.includes("after")
    ) {
      return "Please wait about a minute before requesting another email.";
    }
    if (message.includes("mfa required")) {
      return "MFA verification required. Please enter your code.";
    }
    if (message.includes("invalid totp") || message.includes("invalid otp")) {
      return "Invalid authentication code. Please try again.";
    }

    return fallback;
  }

  /* -------------------- SIGNUP -------------------- */
  async signUp(
    email: string,
    password: string,
    name: string,
    username: string,
    age: number,
  ): Promise<{ error: string | null }> {
    return this.signUpDebounce(email, password, name, username, age);
  }

  private async _signUpImpl(
    email: string,
    password: string,
    name: string,
    username: string,
    age: number,
  ): Promise<{ error: string | null }> {
    try {
      // Validate inputs
      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail)) {
        return { error: "Please enter a valid email address." };
      }
      if (!isValidPassword(password)) {
        return { error: "Password must be at least 8 characters." };
      }

      const trimmedName = typeof name === "string" ? name.trim() : "";
      if (!trimmedName) {
        return { error: "Please enter your name." };
      }
      const trimmedUsername = typeof username === "string" ? username.trim() : "";
      if (!trimmedUsername) {
        return { error: "Please enter a username." };
      }
      if (age < 1 || age > 120) {
        return { error: "Please enter a valid age." };
      }

      const firstName = trimmedName.split(/\s+/)[0] || "there";

      const getRedirectUrl = () =>
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "https://smartadvisor.live/auth/callback";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: trimmedName,
            full_name: trimmedName,
            first_name: firstName,
            age,
          },
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (authError)
        return {
          error: this.toUserFriendlyError(
            authError.message,
            "We couldn't create your account right now. Please try again.",
          ),
        };
      if (!authData.user) return { error: "Failed to create user account" };

      // Handle profile creation if auto-confirmation
      if (authData.session || authData.user.email_confirmed_at) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          [
            {
              id: authData.user.id,
              name: trimmedName,
              username: trimmedUsername,
              age,
              email: normalizedEmail,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "id" },
        );

        if (profileError) {
          await supabase.auth.signOut();
          return {
            error: "Failed to create user profile. Please try signing in.",
          };
        }
      }

      await supabase.auth.signOut(); // ensure signup ends with no active session
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      const fallback =
        "An unexpected error occurred during sign up. Please try again.";
      const message =
        err instanceof Error
          ? this.toUserFriendlyError(err.message, fallback)
          : fallback;
      return { error: message };
    }
  }

  /* -------------------- SIGNIN -------------------- */
  async signIn(
    email: string,
    password: string,
  ): Promise<{ error: string | null }> {
    return this.signInDebounce(email, password);
  }

  private async _signInImpl(
    email: string,
    password: string,
  ): Promise<{ error: string | null }> {
    try {
      const normalizedEmail = normalizeEmail(email);

      if (!isValidEmail(normalizedEmail)) {
        return { error: "Please enter a valid email address." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error)
        return {
          error: this.toUserFriendlyError(
            error.message,
            "Sign in failed. Please try again.",
          ),
        };
      if (!data.user) return { error: "Sign in failed. Please try again." };
      if (!data.session) return { error: "Sign in failed. Please try again." };

      // Ensure profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError?.code === "PGRST116") {
        // Profile doesn't exist, create it
        const { error: createError } = await supabase.from("profiles").insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || "User",
          age: data.user.user_metadata?.age || 25,
          email: data.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        });

        if (createError) {
          console.error("Error creating profile:", createError);
          await supabase.auth.signOut();
          return { error: "Failed to create user profile. Please try again." };
        }
      } else if (profileError) {
        await supabase.auth.signOut();
        return { error: "Failed to load user profile. Please try again." };
      } else {
        // Update last login
        await supabase
          .from("profiles")
          .update({
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.user.id);
      }

      // Create session record for session management
      if (typeof window !== "undefined") {
        await sessionManagementService.createSessionRecord(
          data.user.id,
          data.session.access_token,
          navigator.userAgent,
        );
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signin:", err);
      const fallback =
        "An unexpected error occurred during sign in. Please try again.";
      const message =
        err instanceof Error
          ? this.toUserFriendlyError(err.message, fallback)
          : fallback;
      return { error: message };
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
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "https://smartadvisor.live/auth/callback";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error)
        return {
          error: this.toUserFriendlyError(
            error.message,
            "Unable to continue with Google sign-in.",
          ),
        };
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
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://smartadvisor.live";
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        // redirect users to dedicated reset page rather than generic callback
        { redirectTo: `${origin}/auth/reset-password` },
      );
      if (error) return { error: this.toUserFriendlyError(error.message) };
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
    email: string,
  ): Promise<{ error: string | null }> {
    try {
      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail)) {
        return { error: "Please enter a valid email address." };
      }

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://smartadvisor.live";
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) return { error: this.toUserFriendlyError(error.message) };
      return { error: null };
    } catch (err) {
      console.error("Error resending verification email:", err);
      return { error: "Failed to resend verification email. Please try again." };
    }
  }

  async updateEmail(email: string): Promise<{ error: string | null }> {
    try {
      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail))
        return { error: "Please enter a valid email address." };

      const { error: authError } = await supabase.auth.updateUser({
        email: normalizedEmail,
      });
      if (authError)
        return { error: this.toUserFriendlyError(authError.message) };

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from("profiles")
          .update({
            email: normalizedEmail,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating email:", err);
      return { error: "An unexpected error occurred while updating email." };
    }
  }

  async updatePassword(password: string): Promise<{ error: string | null }> {
    try {
      if (password.length < 8)
        return { error: "Password must be at least 8 characters." };
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
      if (error)
        return { user: null, error: this.toUserFriendlyError(error.message) };
      if (!data.user) return { user: null, error: null };

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      if (profileError)
        return { user: null, error: "Failed to fetch user profile" };

      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          name: profile.name,
          age: profile.age,
          created_at: profile.created_at,
          mfa_enabled: profile.mfa_enabled,
          last_login: profile.last_login,
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
      } = await supabase.auth.getUser();
      if (!user) return { error: "No authenticated user found" };
      const { error } = await supabase
        .from("profiles")
        .update({ name, age, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) return { error: this.toUserFriendlyError(error.message) };
      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating profile:", err);
      return { error: "An unexpected error occurred while updating profile" };
    }
  }

  /* -------------------- MFA & SECURITY -------------------- */
  async enrollMFA() {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error)
        return { error: this.toUserFriendlyError(error.message, "Failed to start MFA enrollment. Please try again."), data: null };

      // Store MFA factor in database (non-blocking — don't fail enrollment if DB insert fails)
      if (data?.id) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user?.id) {
            await supabase.from("mfa_factors").insert({
              user_id: user.id,
              factor_type: "totp",
              factor_id: data.id,
              is_verified: false,
              enrolled_at: new Date().toISOString(),
            });
          }
        } catch (dbErr) {
          console.warn("Non-critical: failed to store MFA factor in DB:", dbErr);
        }
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error enrolling MFA:", err);
      return { error: "Failed to enroll MFA. Please try again.", data: null };
    }
  }

  async verifyMFA(factorId: string, code: string) {
    try {
      if (!code || code.length !== 6) {
        return { error: "Enter a valid 6-digit code", data: null };
      }

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (error)
        return { error: this.toUserFriendlyError(error.message), data: null };

      // Mark factor as verified in database
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from("mfa_factors")
          .update({ is_verified: true, last_used_at: new Date().toISOString() })
          .eq("factor_id", factorId)
          .eq("user_id", user.id);

        // Update MFA enabled status in profile
        await supabase
          .from("profiles")
          .update({ mfa_enabled: true, updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error verifying MFA:", err);
      return { error: "Failed to verify MFA code", data: null };
    }
  }

  async unenrollMFA(factorId: string) {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) return { error: this.toUserFriendlyError(error.message) };

      // Soft delete from database and check if any verified factors remain
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from("mfa_factors")
          .update({ deleted_at: new Date().toISOString() })
          .eq("factor_id", factorId)
          .eq("user_id", user.id);

        // Check if there are any remaining active factors
        const { data: factors, error: factorsError } = await supabase
          .from("mfa_factors")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .eq("is_verified", true);

        if (!factorsError && (!factors || factors.length === 0)) {
          // No verified factors left, disable MFA
          await supabase
            .from("profiles")
            .update({
              mfa_enabled: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        }
      }

      return { error: null };
    } catch (err) {
      console.error("Error unenrolling MFA:", err);
      return { error: "Failed to unenroll MFA" };
    }
  }

  async listMFAFactors() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error)
        return { error: this.toUserFriendlyError(error.message), data: null };
      return { data, error: null };
    } catch (err) {
      console.error("Error listing MFA factors:", err);
      return { error: "Failed to list MFA factors", data: null };
    }
  }

  async getActiveSessions() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return { session, error: null };
    } catch (err) {
      console.error("Error getting active sessions:", err);
      return { session: null, error: "Failed to get sessions" };
    }
  }

  async signOutAllDevices() {
    try {
      // Get user ID BEFORE signing out (session is destroyed after signOut)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      // Revoke all sessions in database first
      if (userId) {
        await sessionManagementService.revokeAllSessions(userId);
      }

      // Now sign out globally (invalidates all Supabase sessions)
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) return { error: this.toUserFriendlyError(error.message) };

      return { error: null };
    } catch (err) {
      console.error("Error signing out all devices:", err);
      return { error: "Failed to sign out all devices" };
    }
  }

  /* -------------------- ACCOUNT MANAGEMENT -------------------- */
  async deleteAccount(): Promise<{ error: string | null }> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return { error: "No active session. Please sign in again." };

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Failed to delete account." };
      }

      await supabase.auth.signOut();
      return { error: null };
    } catch (err) {
      console.error("Error deleting account:", err);
      return { error: "An unexpected error occurred while deleting your account." };
    }
  }

  async disableAccount(): Promise<{ error: string | null }> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return { error: "No active session. Please sign in again." };

      const response = await fetch("/api/account/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Failed to disable account." };
      }

      await supabase.auth.signOut();
      return { error: null };
    } catch (err) {
      console.error("Error disabling account:", err);
      return { error: "An unexpected error occurred while disabling your account." };
    }
  }

  async updatePasswordWithTicket(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) return { error: this.toUserFriendlyError(error.message) };
    return { data };
  }
}

export const authService = new AuthService();
