import { NextRequest, NextResponse } from "next/server";
import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import {
  base64UrlToBytes,
  clearChallengeCookie,
  getAdminClient,
  getOrigin,
  getRpId,
  readChallengeCookie,
} from "../../_lib";

interface VerifyBody {
  response: AuthenticationResponseJSON;
}

export async function POST(req: NextRequest) {
  const cookie = readChallengeCookie(req);
  if (!cookie || cookie.purpose !== "authenticate") {
    return NextResponse.json(
      { error: "Challenge missing or expired — start over." },
      { status: 400 },
    );
  }

  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const credentialIdFromAssertion = body?.response?.id;
  if (!credentialIdFromAssertion) {
    return NextResponse.json(
      { error: "Missing credential id in assertion." },
      { status: 400 },
    );
  }

  const admin = getAdminClient();
  const { data: stored } = await admin
    .from("user_passkeys")
    .select("id, user_id, credential_id, public_key, counter, transports")
    .eq("credential_id", credentialIdFromAssertion)
    .maybeSingle();

  if (!stored || stored.user_id !== cookie.userId) {
    return NextResponse.json(
      { error: "Passkey not recognized." },
      { status: 400 },
    );
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: cookie.challenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpId(req),
      credential: {
        id: stored.credential_id,
        publicKey: base64UrlToBytes(stored.public_key),
        counter: Number(stored.counter ?? 0),
        transports: (stored.transports ?? undefined) as
          | AuthenticatorTransportFuture[]
          | undefined,
      },
      requireUserVerification: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Passkey verification failed.",
      },
      { status: 400 },
    );
  }

  if (!verification.verified) {
    return NextResponse.json(
      { error: "Passkey verification failed." },
      { status: 400 },
    );
  }

  // Bump replay counter and last-used timestamp.
  await admin
    .from("user_passkeys")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", stored.id);

  // Mint a session: generate a magic-link token server-side; client
  // exchanges it via supabase.auth.verifyOtp() to get the actual session.
  const { data: userRow, error: userErr } = await admin
    .from("profiles")
    .select("email")
    .eq("id", stored.user_id)
    .maybeSingle();

  if (userErr || !userRow?.email) {
    return NextResponse.json(
      { error: "Could not load user record for sign-in." },
      { status: 500 },
    );
  }

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: userRow.email,
  });

  if (linkErr || !link?.properties?.hashed_token) {
    console.error("[passkey/auth/verify] generateLink failed", linkErr);
    return NextResponse.json(
      { error: "Could not start the session. Please try again." },
      { status: 500 },
    );
  }

  const res = NextResponse.json({
    email: userRow.email,
    token_hash: link.properties.hashed_token,
  });
  clearChallengeCookie(res);
  return res;
}

type AuthenticatorTransportFuture =
  | "ble"
  | "cable"
  | "hybrid"
  | "internal"
  | "nfc"
  | "smart-card"
  | "usb";
