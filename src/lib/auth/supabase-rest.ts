/**
 * Direct Supabase REST helpers for API routes that authenticate via Bearer
 * header. These bypass the auth-js client because its MFA / updateUser methods
 * read from a local session that the API-route flow doesn't have.
 *
 * Each call forwards the user's JWT in Authorization, plus the apikey header
 * Supabase requires. Server-side ownership is enforced by Supabase against
 * the JWT subject — not by trusting any caller-supplied user id.
 */

function getEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

export type RestResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: { message: string }; status: number };

async function restCall<T>(
  path: string,
  init: RequestInit,
  jwt: string,
): Promise<RestResult<T>> {
  const { url, anonKey } = getEnv();
  if (!url || !anonKey) {
    return {
      ok: false,
      status: 500,
      error: { message: "Server configuration error." },
    };
  }

  let resp: Response;
  try {
    resp = await fetch(`${url}${path}`, {
      ...init,
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${jwt}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: {
        message: err instanceof Error ? err.message : "Network error",
      },
    };
  }

  let body: unknown;
  try {
    body = await resp.json();
  } catch {
    body = null;
  }

  if (!resp.ok) {
    const errBody = body as
      | { message?: string; error?: string; msg?: string }
      | null;
    return {
      ok: false,
      status: resp.status,
      error: {
        message:
          errBody?.message ??
          errBody?.error ??
          errBody?.msg ??
          resp.statusText,
      },
    };
  }

  return { ok: true, status: resp.status, data: body as T };
}

export type RawFactor = {
  id: string;
  factor_type: string;
  status: "verified" | "unverified";
  friendly_name?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function authRestListFactors(
  jwt: string,
): Promise<RestResult<RawFactor[]>> {
  return restCall<RawFactor[]>("/auth/v1/factors", { method: "GET" }, jwt);
}

export async function authRestEnrollTotp(
  jwt: string,
  friendlyName?: string,
): Promise<
  RestResult<{
    id: string;
    type: string;
    totp?: { qr_code?: string; secret?: string; uri?: string };
  }>
> {
  return restCall(
    "/auth/v1/factors",
    {
      method: "POST",
      body: JSON.stringify({
        factor_type: "totp",
        friendly_name: friendlyName,
      }),
    },
    jwt,
  );
}

export async function authRestUnenrollFactor(
  jwt: string,
  factorId: string,
): Promise<RestResult<unknown>> {
  return restCall(
    `/auth/v1/factors/${encodeURIComponent(factorId)}`,
    { method: "DELETE" },
    jwt,
  );
}

export async function authRestUpdateUser(
  jwt: string,
  payload: { email?: string; password?: string },
): Promise<RestResult<unknown>> {
  return restCall(
    "/auth/v1/user",
    { method: "PUT", body: JSON.stringify(payload) },
    jwt,
  );
}

export async function rpcRestRenameFactor(
  jwt: string,
  factorId: string,
  newName: string,
): Promise<RestResult<boolean>> {
  return restCall<boolean>(
    "/rest/v1/rpc/rename_mfa_factor",
    {
      method: "POST",
      body: JSON.stringify({ p_factor_id: factorId, p_new_name: newName }),
    },
    jwt,
  );
}
