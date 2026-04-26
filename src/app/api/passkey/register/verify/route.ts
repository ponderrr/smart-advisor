import { NextRequest, NextResponse } from "next/server";
import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { getAal } from "@/lib/auth/aal";
import { authRestListFactors } from "@/lib/auth/supabase-rest";
import {
  bytesToBase64Url,
  clearChallengeCookie,
  getAdminClient,
  getOrigin,
  getRpId,
  getUserFromAuthHeader,
  readChallengeCookie,
} from "../../_lib";

interface VerifyBody {
  response: RegistrationResponseJSON;
  deviceName?: string;
}

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  // Same bootstrap check as register/options. The verify step is gated even
  // though options already gated, so a session that drops AAL between options
  // and verify can't slip through. The cookie ties verify to the original user
  // (cookie.userId === user.id below), but the AAL check confirms the live
  // session state at verification time.
  const admin = getAdminClient();
  const { count: existingPasskeys } = await admin
    .from("user_passkeys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const factorsResult = await authRestListFactors(token);
  const hasVerifiedSupabaseFactor =
    factorsResult.ok && factorsResult.data.some((f) => f.status === "verified");
  const hasExistingFactor =
    (existingPasskeys ?? 0) > 0 || hasVerifiedSupabaseFactor;

  if (hasExistingFactor) {
    const aal = await getAal(token);
    if (aal !== "aal2") {
      return NextResponse.json(
        {
          error: "Step-up required. Verify your second factor to continue.",
          code: "AAL2_REQUIRED",
        },
        { status: 403 },
      );
    }
  }

  const cookie = readChallengeCookie(req);
  if (
    !cookie ||
    cookie.purpose !== "register" ||
    cookie.userId !== user.id
  ) {
    return NextResponse.json(
      { error: "Challenge missing or expired — restart registration." },
      { status: 400 },
    );
  }

  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.response) {
    return NextResponse.json(
      { error: "Missing registration response" },
      { status: 400 },
    );
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: cookie.challenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpId(req),
      requireUserVerification: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Registration verification failed.",
      },
      { status: 400 },
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json(
      { error: "Registration could not be verified." },
      { status: 400 },
    );
  }

  const { credential } = verification.registrationInfo;

  const { error } = await admin.from("user_passkeys").insert({
    user_id: user.id,
    credential_id: credential.id,
    public_key: bytesToBase64Url(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? null,
    device_name:
      typeof body.deviceName === "string" && body.deviceName.trim()
        ? body.deviceName.trim().slice(0, 60)
        : null,
  });

  if (error) {
    // 23505 = unique_violation. Hits when two tabs race the same name, or
    // when the early check in register/options was bypassed.
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "You already have a passkey with that name." },
        { status: 409 },
      );
    }
    console.error("[passkey/register/verify] insert failed", error);
    return NextResponse.json(
      { error: "Couldn't save the passkey. Please try again." },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });
  clearChallengeCookie(res);
  return res;
}
