import { supabase } from "@/integrations/supabase/client";
import {
  normalizeEmail,
  isValidEmail,
} from "@/features/auth/utils/validation";

async function hashCode(code: string): Promise<string> {
  const normalized = code.replace(/[-\s]/g, "").toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

class BackupService {
  async generateBackupCodes(
    count = 10,
  ): Promise<{ codes: string[]; error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { codes: [], error: "Not authenticated" };

      await supabase.from("backup_codes").delete().eq("user_id", user.id);

      const codes: string[] = [];
      for (let i = 0; i < count; i++) {
        const array = new Uint8Array(5);
        crypto.getRandomValues(array);
        const hex = Array.from(array, (b) => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();
        codes.push(`${hex.slice(0, 5)}-${hex.slice(5)}`);
      }

      const records = await Promise.all(
        codes.map(async (code) => ({
          user_id: user.id,
          code_hash: await hashCode(code),
        })),
      );

      const { error } = await supabase.from("backup_codes").insert(records);
      if (error) return { codes: [], error: "Failed to save backup codes" };

      return { codes, error: null };
    } catch (err) {
      console.error("Error generating backup codes:", err);
      return { codes: [], error: "Failed to generate backup codes" };
    }
  }

  async verifyBackupCode(code: string): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Not authenticated" };

      const codeHash = await hashCode(code);

      const { data: matches, error: fetchError } = await supabase
        .from("backup_codes")
        .select("id")
        .eq("user_id", user.id)
        .eq("code_hash", codeHash)
        .is("used_at", null)
        .limit(1);

      if (fetchError || !matches || matches.length === 0) {
        return { error: "Invalid backup code. Please check and try again." };
      }

      await supabase
        .from("backup_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", matches[0].id);

      return { error: null };
    } catch (err) {
      console.error("Error verifying backup code:", err);
      return { error: "Failed to verify backup code" };
    }
  }

  async getRemainingBackupCodeCount(): Promise<{
    count: number;
    error: string | null;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { count: 0, error: "Not authenticated" };

      const { count, error } = await supabase
        .from("backup_codes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("used_at", null);

      if (error) return { count: 0, error: "Failed to get backup code count" };
      return { count: count || 0, error: null };
    } catch (err) {
      return { count: 0, error: "Failed to get backup code count" };
    }
  }

  async setBackupEmail(email: string): Promise<{ error: string | null }> {
    try {
      if (!isValidEmail(email)) return { error: "Invalid email address" };

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Not authenticated" };

      if (normalizeEmail(email) === normalizeEmail(user.email || "")) {
        return {
          error: "Backup email must be different from your primary email",
        };
      }

      const { error } = await supabase
        .from("profiles")
        .update({ backup_email: email, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) return { error: "Failed to save backup email" };
      return { error: null };
    } catch (err) {
      console.error("Error setting backup email:", err);
      return { error: "Failed to save backup email" };
    }
  }

  async getBackupEmail(): Promise<{
    email: string | null;
    error: string | null;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { email: null, error: "Not authenticated" };

      const { data, error } = await supabase
        .from("profiles")
        .select("backup_email")
        .eq("id", user.id)
        .single();

      if (error) return { email: null, error: "Failed to fetch backup email" };
      return { email: data?.backup_email || null, error: null };
    } catch (err) {
      return { email: null, error: "Failed to fetch backup email" };
    }
  }

  async removeBackupEmail(): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Not authenticated" };

      const { error } = await supabase
        .from("profiles")
        .update({ backup_email: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) return { error: "Failed to remove backup email" };
      return { error: null };
    } catch (err) {
      return { error: "Failed to remove backup email" };
    }
  }

  async sendBackupEmailVerification(): Promise<{ error: string | null }> {
    try {
      const { email } = await this.getBackupEmail();
      if (!email) return { error: "No backup email configured" };

      const array = new Uint8Array(3);
      crypto.getRandomValues(array);
      const code = String(
        (array[0] * 65536 + array[1] * 256 + array[2]) % 1000000,
      ).padStart(6, "0");

      const codeHash = await hashCode(code);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "backup_email_verify",
          JSON.stringify({
            hash: codeHash,
            expires: Date.now() + 10 * 60 * 1000,
          }),
        );
      }

      console.info(
        `[DEV] Backup email verification code for ${email}: ${code}`,
      );

      return { error: null };
    } catch (err) {
      return { error: "Failed to send verification code" };
    }
  }

  async verifyBackupEmailCode(code: string): Promise<{ error: string | null }> {
    try {
      if (typeof window === "undefined") return { error: "Not available" };

      const stored = window.sessionStorage.getItem("backup_email_verify");
      if (!stored)
        return { error: "No pending verification. Request a new code." };

      const { hash, expires } = JSON.parse(stored);
      if (Date.now() > expires) {
        window.sessionStorage.removeItem("backup_email_verify");
        return { error: "Code expired. Request a new one." };
      }

      const inputHash = await hashCode(code);
      if (inputHash !== hash) {
        return { error: "Invalid code. Please try again." };
      }

      window.sessionStorage.removeItem("backup_email_verify");
      return { error: null };
    } catch (err) {
      return { error: "Failed to verify code" };
    }
  }
}

export const backupService = new BackupService();
