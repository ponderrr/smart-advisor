import { supabase } from "@/integrations/supabase/client";
import { User } from "@/features/auth/types/user";
import {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  createDebounce,
} from "@/features/auth/utils/validation";
import { toUserFriendlyError } from "./error-messages";
import { mfaService } from "./mfa-service";
import { backupService } from "./backup-service";
import { accountService } from "./account-service";
import { sessionManagementService } from "./session-management";

class AuthService {
  private signUpDebounce = createDebounce(this._signUpImpl.bind(this), 1000);
  private signInDebounce = createDebounce(this._signInImpl.bind(this), 500);

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
      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail)) {
        return { error: "Please enter a valid email address." };
      }
      if (!isValidPassword(password)) {
        return { error: "Password must be at least 8 characters." };
      }

      const trimmedName = typeof name === "string" ? name.trim() : "";
      if (!trimmedName) return { error: "Please enter your name." };
      const trimmedUsername =
        typeof username === "string" ? username.trim() : "";
      if (!trimmedUsername) return { error: "Please enter a username." };
      if (age < 1 || age > 120) return { error: "Please enter a valid age." };

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
          error: toUserFriendlyError(
            authError.message,
            "We couldn't create your account right now. Please try again.",
          ),
        };
      if (!authData.user) return { error: "Failed to create user account" };

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
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", authData.user.id)
            .single();

          if (!existingProfile) {
            await supabase.auth.signOut();
            return {
              error: "Failed to create user profile. Please try signing in.",
            };
          }
        }
      }

      await supabase.auth.signOut();
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      const fallback =
        "An unexpected error occurred during sign up. Please try again.";
      const message =
        err instanceof Error
          ? toUserFriendlyError(err.message, fallback)
          : fallback;
      return { error: message };
    }
  }

  /* -------------------- SIGNIN -------------------- */
  async signIn(
    identifier: string,
    password: string,
  ): Promise<{ error: string | null }> {
    return this.signInDebounce(identifier, password);
  }

  /**
   * Resolves an identifier to an email address.
   * - If it looks like an email, normalize and return it.
   * - Otherwise, look it up in profiles.username and return the linked email.
   * Returns null if no match (to be reported as a generic invalid-credentials error).
   */
  private async _resolveIdentifierToEmail(
    identifier: string,
  ): Promise<string | null> {
    const trimmed = identifier.trim();
    if (!trimmed) return null;

    if (trimmed.includes("@")) {
      const normalized = normalizeEmail(trimmed);
      return isValidEmail(normalized) ? normalized : null;
    }

    // Username path: look up the profile by username (case-insensitive).
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .ilike("username", trimmed)
      .limit(1)
      .maybeSingle();

    if (error || !data?.email) return null;
    return normalizeEmail(data.email);
  }

  private async _signInImpl(
    identifier: string,
    password: string,
  ): Promise<{ error: string | null }> {
    try {
      const normalizedEmail = await this._resolveIdentifierToEmail(identifier);
      if (!normalizedEmail) {
        // Generic error so we don't leak which usernames exist.
        return { error: "Invalid email/username or password." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error)
        return {
          error: toUserFriendlyError(
            error.message,
            "Sign in failed. Please try again.",
          ),
        };
      if (!data.user) return { error: "Sign in failed. Please try again." };
      if (!data.session) return { error: "Sign in failed. Please try again." };

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError?.code === "PGRST116") {
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
        await supabase
          .from("profiles")
          .update({
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.user.id);
      }

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
          ? toUserFriendlyError(err.message, fallback)
          : fallback;
      return { error: message };
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
        options: {
          redirectTo,
          // Stay in the same tab so the PKCE code verifier cookie persists.
          // Opening a new tab would lose the verifier and cause
          // "PKCE code verifier not found in storage" errors.
          skipBrowserRedirect: false,
        },
      });
      if (error)
        return {
          error: toUserFriendlyError(
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
        { redirectTo: `${origin}/auth/reset-password` },
      );
      if (error) return { error: toUserFriendlyError(error.message) };
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
      if (error) return { error: toUserFriendlyError(error.message) };
      return { error: null };
    } catch (err) {
      console.error("Error resending verification email:", err);
      return {
        error: "Failed to resend verification email. Please try again.",
      };
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
        return { error: toUserFriendlyError(authError.message) };

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
      if (error) return { error: toUserFriendlyError(error.message) };
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
        return { user: null, error: toUserFriendlyError(error.message) };
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
          username: profile.username || undefined,
          age: profile.age,
          created_at: profile.created_at,
          mfa_enabled: profile.mfa_enabled,
          last_login: profile.last_login,
          backup_email: profile.backup_email || undefined,
          avatar_url: profile.avatar_url || undefined,
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
      if (error) return { error: toUserFriendlyError(error.message) };
      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating profile:", err);
      return { error: "An unexpected error occurred while updating profile" };
    }
  }

  /**
   * Uploads a file to the avatars storage bucket and saves the public URL
   * to profiles.avatar_url. Returns the new public URL on success.
   */
  async uploadAvatar(
    file: File,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { url: null, error: "Not signed in." };

      if (!file.type.startsWith("image/")) {
        return { url: null, error: "Please choose an image file." };
      }
      if (file.size > 5 * 1024 * 1024) {
        return { url: null, error: "Image must be 5 MB or smaller." };
      }

      // Convention: avatars/{userId}/avatar.{ext}. Always overwrite to keep
      // a single canonical avatar object per user (also avoids leaking old
      // files behind public URLs).
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return { url: null, error: toUserFriendlyError(uploadError.message) };
      }

      // Cache-bust the public URL so the new image shows up immediately.
      const { data: pub } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const url = `${pub.publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (dbError) {
        return { url: null, error: toUserFriendlyError(dbError.message) };
      }

      return { url, error: null };
    } catch (err) {
      console.error("Unexpected error uploading avatar:", err);
      return { url: null, error: "Failed to upload avatar." };
    }
  }

  async removeAvatar(): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Not signed in." };

      // Best-effort delete of any existing avatar files. Storage list is
      // bounded to the user's folder by RLS so this is safe.
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(user.id);
      if (files?.length) {
        await supabase.storage
          .from("avatars")
          .remove(files.map((f) => `${user.id}/${f.name}`));
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) return { error: toUserFriendlyError(error.message) };

      return { error: null };
    } catch (err) {
      console.error("Unexpected error removing avatar:", err);
      return { error: "Failed to remove avatar." };
    }
  }

  /* ---- Delegated methods (backward-compatible) ---- */
  signOut = () => accountService.signOut();
  signOutAllDevices = () => accountService.signOutAllDevices();
  getActiveSessions = () => accountService.getActiveSessions();
  deleteAccount = () => accountService.deleteAccount();
  disableAccount = () => accountService.disableAccount();
  updatePasswordWithTicket = (p: string) =>
    accountService.updatePasswordWithTicket(p);

  enrollMFA = () => mfaService.enroll();
  verifyMFA = (f: string, c: string) => mfaService.verify(f, c);
  unenrollMFA = (f: string) => mfaService.unenroll(f);
  listMFAFactors = () => mfaService.listFactors();
  getAALLevel = () => mfaService.getAALLevel();

  generateBackupCodes = (c?: number) => backupService.generateBackupCodes(c);
  verifyBackupCode = (c: string) => backupService.verifyBackupCode(c);
  getRemainingBackupCodeCount = () => backupService.getRemainingBackupCodeCount();
  setBackupEmail = (e: string) => backupService.setBackupEmail(e);
  getBackupEmail = () => backupService.getBackupEmail();
  removeBackupEmail = () => backupService.removeBackupEmail();
}

export const authService = new AuthService();
