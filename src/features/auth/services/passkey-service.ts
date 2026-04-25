import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";

export interface PasskeySummary {
  id: string;
  device_name: string | null;
  transports: string[] | null;
  created_at: string;
  last_used_at: string | null;
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
}

/** Translate WebAuthn ceremony errors into user-facing copy.
 *  - NotAllowedError fires when the user dismisses the prompt or it times
 *    out; the raw message ("not allowed by the user agent...") is opaque.
 *  - InvalidStateError on register means the authenticator already holds a
 *    matching credential.
 */
function friendlyCeremonyError(err: unknown, kind: "register" | "sign-in"): string {
  if (err instanceof Error) {
    if (err.name === "NotAllowedError") {
      return kind === "register"
        ? "Passkey setup was cancelled or timed out."
        : "Passkey sign-in was cancelled or timed out.";
    }
    if (err.name === "InvalidStateError") {
      return "This device already has a passkey for your account.";
    }
    if (err.name === "SecurityError") {
      return "Passkeys can't be used on this domain. Try again on the production site.";
    }
    if (err.message) return err.message;
  }
  return kind === "register"
    ? "Couldn't set up the passkey. Please try again."
    : "Couldn't sign in with a passkey. Please try again.";
}

class PasskeyService {
  browserSupported(): boolean {
    return typeof window !== "undefined" && browserSupportsWebAuthn();
  }

  async platformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.browserSupported()) return false;
    try {
      return await platformAuthenticatorIsAvailable();
    } catch {
      return false;
    }
  }

  async register(
    deviceName?: string,
  ): Promise<{ error: string | null }> {
    if (!this.browserSupported()) {
      return { error: "Passkeys aren't supported in this browser." };
    }

    const token = await getAccessToken();
    if (!token) {
      return { error: "You must be signed in to add a passkey." };
    }

    // Mirrors mfa-service.enroll: when the user leaves the name blank we
    // synthesize a date-stamped label so each row in the list stays
    // distinguishable instead of N copies of "Passkey". The unique index
    // excludes blank names; this keeps every saved row inside it.
    const trimmed = deviceName?.trim();
    const datePart = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const finalName = trimmed || `Passkey · ${datePart}`;

    let optionsRes: Response;
    try {
      optionsRes = await fetch("/api/passkey/register/options", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ device_name: finalName }),
      });
    } catch {
      return { error: "Network error. Please try again." };
    }

    const optionsJson = (await optionsRes.json().catch(() => null)) as
      | PublicKeyCredentialCreationOptionsJSON
      | { error?: string }
      | null;

    if (!optionsRes.ok) {
      return {
        error: readErrorMessage(optionsJson, "Couldn't start passkey setup."),
      };
    }

    let attestation;
    try {
      attestation = await startRegistration({
        optionsJSON: optionsJson as PublicKeyCredentialCreationOptionsJSON,
      });
    } catch (err) {
      return { error: friendlyCeremonyError(err, "register") };
    }

    let verifyRes: Response;
    try {
      verifyRes = await fetch("/api/passkey/register/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ response: attestation, deviceName: finalName }),
      });
    } catch {
      return { error: "Network error. Please try again." };
    }

    const verifyJson = (await verifyRes.json().catch(() => null)) as
      | { ok?: true; error?: string }
      | null;

    if (!verifyRes.ok) {
      return {
        error: readErrorMessage(
          verifyJson,
          "Couldn't verify the passkey. Please try again.",
        ),
      };
    }

    return { error: null };
  }

  async signIn(identifier: string): Promise<{ error: string | null }> {
    if (!this.browserSupported()) {
      return { error: "Passkeys aren't supported in this browser." };
    }

    let optionsRes: Response;
    try {
      optionsRes = await fetch("/api/passkey/auth/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
    } catch {
      return { error: "Network error. Please try again." };
    }

    const optionsJson = (await optionsRes.json().catch(() => null)) as
      | PublicKeyCredentialRequestOptionsJSON
      | { error?: string }
      | null;

    if (!optionsRes.ok) {
      return {
        error: readErrorMessage(
          optionsJson,
          "Couldn't start passkey sign-in.",
        ),
      };
    }

    let assertion;
    try {
      assertion = await startAuthentication({
        optionsJSON: optionsJson as PublicKeyCredentialRequestOptionsJSON,
      });
    } catch (err) {
      return { error: friendlyCeremonyError(err, "sign-in") };
    }

    let verifyRes: Response;
    try {
      verifyRes = await fetch("/api/passkey/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion }),
      });
    } catch {
      return { error: "Network error. Please try again." };
    }

    const verifyJson = (await verifyRes.json().catch(() => null)) as
      | { email?: string; token_hash?: string; error?: string }
      | null;

    if (!verifyRes.ok || !verifyJson?.token_hash) {
      return {
        error: readErrorMessage(
          verifyJson,
          "Passkey verification failed. Please try again.",
        ),
      };
    }

    // Exchange the hashed magic-link token for an actual Supabase session.
    // The email is encoded in the hash, so passing it explicitly causes
    // "Only the token_hash and type should be provided".
    const { error: otpError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: verifyJson.token_hash,
    });

    if (otpError) {
      return { error: otpError.message };
    }

    return { error: null };
  }

  async list(): Promise<{ data: PasskeySummary[]; error: string | null }> {
    const token = await getAccessToken();
    if (!token) return { data: [], error: "You must be signed in." };

    let res: Response;
    try {
      res = await fetch("/api/passkey/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return { data: [], error: "Network error. Please try again." };
    }

    const json = (await res.json().catch(() => null)) as
      | { passkeys?: PasskeySummary[]; error?: string }
      | null;

    if (!res.ok) {
      return {
        data: [],
        error: readErrorMessage(json, "Couldn't load your passkeys."),
      };
    }

    return { data: json?.passkeys ?? [], error: null };
  }

  async rename(
    id: string,
    deviceName: string,
  ): Promise<{ error: string | null }> {
    const trimmed = deviceName.trim();
    if (!trimmed) return { error: "Name cannot be empty." };
    if (trimmed.length > 60) {
      return { error: "Name is too long (60 character max)." };
    }

    const token = await getAccessToken();
    if (!token) return { error: "You must be signed in." };

    let res: Response;
    try {
      res = await fetch(`/api/passkey/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ device_name: trimmed }),
      });
    } catch {
      return { error: "Network error. Please try again." };
    }

    const json = (await res.json().catch(() => null)) as
      | { ok?: true; device_name?: string; error?: string }
      | null;

    if (!res.ok) {
      return {
        error: readErrorMessage(json, "Couldn't rename the passkey."),
      };
    }

    return { error: null };
  }

  async remove(id: string): Promise<{ error: string | null }> {
    const token = await getAccessToken();
    if (!token) return { error: "You must be signed in." };

    let res: Response;
    try {
      res = await fetch(`/api/passkey/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return { error: "Network error. Please try again." };
    }

    const json = (await res.json().catch(() => null)) as
      | { ok?: true; error?: string }
      | null;

    if (!res.ok) {
      return {
        error: readErrorMessage(json, "Couldn't remove the passkey."),
      };
    }

    return { error: null };
  }
}

export const passkeyService = new PasskeyService();
