import { supabase } from "@/integrations/supabase/client";
import { toUserFriendlyError } from "./error-messages";

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

      // Clean up any existing unverified TOTP factors before enrolling
      // (a previous enrollment attempt that wasn't completed)
      try {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const unverified = factors?.totp?.filter(
          (f: any) => f.status === "unverified",
        );
        if (unverified?.length) {
          for (const f of unverified) {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
        }
      } catch {
        // Non-critical — proceed with enrollment
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) {
        console.error("MFA enroll error:", error.message, error);

        // If there's a conflict with existing factors, try one more time after cleanup
        if (
          error.message.includes("already") ||
          error.message.includes("conflict") ||
          error.message.includes("exceeded")
        ) {
          try {
            const { data: retryFactors } =
              await supabase.auth.mfa.listFactors();
            const allUnverified = retryFactors?.totp?.filter(
              (f: any) => f.status === "unverified",
            );
            if (allUnverified?.length) {
              for (const f of allUnverified) {
                await supabase.auth.mfa.unenroll({ factorId: f.id });
              }
              // Retry enrollment after cleanup
              const { data: retryData, error: retryError } =
                await supabase.auth.mfa.enroll({ factorType: "totp" });
              if (!retryError && retryData) {
                // Success on retry — continue with this data
                return this.finalizeEnroll(retryData, user.id);
              }
            }
          } catch {
            // Retry failed
          }
        }

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

  private async finalizeEnroll(data: any, userId: string) {
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
