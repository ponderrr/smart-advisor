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

/** Supabase widened AuthenticatorAssuranceLevels to an extensible string
 *  union in ~v2.66+, so we mirror that here rather than re-narrowing —
 *  in practice the values are still "aal1" / "aal2". */
export type AALLevel = "aal1" | "aal2" | (string & {});

export interface AALData {
  currentLevel: AALLevel | null;
  nextLevel: AALLevel | null;
}
