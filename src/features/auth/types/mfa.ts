/**
 * MFA-related types that mirror the Supabase Auth Factor types.
 * Defined locally to avoid deep imports from @supabase/auth-js internals.
 */

export interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: "totp" | "phone" | "webauthn";
  status: "verified" | "unverified";
  created_at: string;
  updated_at: string;
  last_challenged_at?: string;
}

export interface MFAListFactorsData {
  all: MFAFactor[];
  totp: MFAFactor[];
  phone: MFAFactor[];
}

export interface MFAEnrollData {
  id: string;
  type: "totp";
  friendly_name?: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export interface AALData {
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
}
