import { supabase } from "@/integrations/supabase/client";
import { toUserFriendlyError } from "./error-messages";
import { sessionManagementService } from "./session-management";

class AccountService {
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: toUserFriendlyError(error.message) };
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signout:", err);
      return { error: "An unexpected error occurred during sign out" };
    }
  }

  async signOutAllDevices() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      if (userId) {
        await sessionManagementService.revokeAllSessions(userId);
      }

      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) return { error: toUserFriendlyError(error.message) };

      return { error: null };
    } catch (err) {
      console.error("Error signing out all devices:", err);
      return { error: "Failed to sign out all devices" };
    }
  }

  async getActiveSessions() {
    try {
      await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return { session, error: null };
    } catch (err) {
      console.error("Error getting active sessions:", err);
      return { session: null, error: "Failed to get sessions" };
    }
  }

  async deleteAccount(): Promise<{ error: string | null }> {
    try {
      // Validate and refresh session before getting the token
      await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session)
        return { error: "No active session. Please sign in again." };

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
      return {
        error: "An unexpected error occurred while deleting your account.",
      };
    }
  }

  async disableAccount(): Promise<{ error: string | null }> {
    try {
      await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session)
        return { error: "No active session. Please sign in again." };

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
      return {
        error: "An unexpected error occurred while disabling your account.",
      };
    }
  }

  async updatePasswordWithTicket(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) return { error: toUserFriendlyError(error.message) };
    return { data };
  }
}

export const accountService = new AccountService();
