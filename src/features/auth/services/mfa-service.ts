import { supabase } from "@/integrations/supabase/client";
import { toUserFriendlyError } from "./error-messages";
import { MFAEnrollData, MFAFactor } from "@/features/auth/types/mfa";

class MfaService {
  async enroll(friendlyName?: string) {
    try {
      // Use getUser() to validate the session with the server, not getSession()
      // which can return stale tokens from local storage
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          error: "You must be signed in to enable MFA. Please sign in again.",
          data: null,
        };
      }

      // Clean up any unverified factors left behind by aborted attempts so
      // the next enroll call starts fresh.
      try {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactors = (factors?.totp ?? []) as unknown as MFAFactor[];
        for (const f of totpFactors) {
          if (f.status === "unverified") {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
        }
      } catch {
        // Non-critical — proceed with enrollment.
      }

      // We can't auto-detect the *phone* the code lives on — navigator.userAgent
      // describes this browser. So the caller supplies a user-typed name
      // (e.g. "iPhone"), and we append the time-of-day since Supabase rejects
      // duplicate friendly_names per user.
      const trimmed = friendlyName?.trim();
      const datePart = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const label = `${trimmed || "Authenticator"} · ${datePart}`;

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: label,
      });

      if (error) {
        console.error("MFA enroll error:", error.message, error);
        return {
          error: toUserFriendlyError(
            error.message,
            "Failed to start MFA enrollment. Please try again.",
          ),
          data: null,
        };
      }

      return this.finalizeEnroll(data, user.id);
    } catch (err) {
      console.error("Error enrolling MFA:", err);
      return { error: "Failed to enroll MFA. Please try again.", data: null };
    }
  }

  private async finalizeEnroll(data: MFAEnrollData, userId: string) {
    if (data?.id) {
      try {
        await supabase.from("mfa_factors").insert({
          user_id: userId,
          factor_type: "totp",
          factor_id: data.id,
          is_verified: false,
          enrolled_at: new Date().toISOString(),
        });
      } catch {
        // Non-critical — local tracking only
      }
    }
    return { data, error: null };
  }

  async verify(factorId: string, code: string) {
    try {
      if (!code || code.length !== 6) {
        return { error: "Enter a valid 6-digit code", data: null };
      }

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (error) {
        return { error: toUserFriendlyError(error.message), data: null };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from("mfa_factors")
          .update({ is_verified: true, last_used_at: new Date().toISOString() })
          .eq("factor_id", factorId)
          .eq("user_id", user.id);

        await supabase
          .from("profiles")
          .update({ mfa_enabled: true, updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }

      await supabase.auth.refreshSession();

      return { data, error: null };
    } catch (err) {
      console.error("Error verifying MFA:", err);
      return { error: "Failed to verify MFA code", data: null };
    }
  }

  async unenroll(factorId: string) {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) return { error: toUserFriendlyError(error.message) };

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from("mfa_factors")
          .update({ deleted_at: new Date().toISOString() })
          .eq("factor_id", factorId)
          .eq("user_id", user.id);

        const { data: factors, error: factorsError } = await supabase
          .from("mfa_factors")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .eq("is_verified", true);

        if (!factorsError && (!factors || factors.length === 0)) {
          await supabase
            .from("profiles")
            .update({
              mfa_enabled: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        }
      }

      await supabase.auth.refreshSession();

      return { error: null };
    } catch (err) {
      console.error("Error unenrolling MFA:", err);
      return { error: "Failed to unenroll MFA" };
    }
  }

  async rename(factorId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return { error: "Name cannot be empty." };
    if (trimmed.length > 64) {
      return { error: "Name is too long (64 character max)." };
    }

    try {
      const { data, error } = await supabase.rpc("rename_mfa_factor", {
        p_factor_id: factorId,
        p_new_name: trimmed,
      });

      if (error) {
        // Postgres unique-constraint violation surfaces as 23505. Supabase
        // rejects duplicate friendly_names per user, so translate that to
        // a plain English message.
        if ((error as { code?: string }).code === "23505") {
          return { error: "You already have an authenticator with that name." };
        }
        return { error: toUserFriendlyError(error.message) };
      }

      // RPC returns FOUND — false means nothing matched (wrong id or not yours).
      if (data === false) {
        return { error: "Authenticator not found." };
      }

      return { error: null };
    } catch (err) {
      console.error("Error renaming MFA factor:", err);
      return { error: "Failed to rename authenticator. Please try again." };
    }
  }

  async listFactors() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error)
        return { error: toUserFriendlyError(error.message), data: null };
      return { data, error: null };
    } catch (err) {
      console.error("Error listing MFA factors:", err);
      return { error: "Failed to list MFA factors", data: null };
    }
  }

  async getAALLevel() {
    try {
      const { data, error } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error)
        return { data: null, error: toUserFriendlyError(error.message) };
      return { data, error: null };
    } catch (err) {
      console.error("Error getting AAL level:", err);
      return {
        data: null,
        error: "Failed to get authenticator assurance level",
      };
    }
  }
}

export const mfaService = new MfaService();
