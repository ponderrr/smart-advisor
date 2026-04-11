import { supabase } from "@/integrations/supabase/client";
import { toUserFriendlyError } from "./error-messages";
import { MFAEnrollData, MFAFactor } from "@/features/auth/types/mfa";

class MfaService {
  async enroll() {
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

      // Inspect existing factors before attempting to enroll.
      try {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactors = (factors?.totp ?? []) as unknown as MFAFactor[];

        // If there's already a VERIFIED factor, MFA is enabled. Bail out
        // with a clear message instead of trying to enroll a duplicate.
        const verified = totpFactors.find((f) => f.status === "verified");
        if (verified) {
          return {
            error:
              "Two-factor authentication is already enabled on this account. Disable it first if you want to re-enroll.",
            data: null,
          };
        }

        // Clean up any unverified factors left behind by aborted attempts.
        for (const f of totpFactors) {
          if (f.status === "unverified") {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
        }
      } catch {
        // Non-critical — proceed with enrollment.
      }

      // Pass an explicit, unique friendly name. Supabase enforces uniqueness
      // even for empty strings, which was causing the "factor with the
      // friendly name '' for this user already exists" error.
      const friendlyName = `Smart Advisor TOTP ${Date.now()}`;

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
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
