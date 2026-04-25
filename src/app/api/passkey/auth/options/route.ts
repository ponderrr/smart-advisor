import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import {
  getAdminClient,
  getRpId,
  resolveIdentifier,
  setChallengeCookie,
} from "../../_lib";

interface AuthOptionsBody {
  identifier?: string;
}

export async function POST(req: NextRequest) {
  let body: AuthOptionsBody;
  try {
    body = (await req.json()) as AuthOptionsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.identifier) {
    return NextResponse.json(
      { error: "Email or username is required." },
      { status: 400 },
    );
  }

  const resolved = await resolveIdentifier(body.identifier);
  if (!resolved) {
    return NextResponse.json(
      { error: "We couldn't find an account for that login." },
      { status: 404 },
    );
  }

  const admin = getAdminClient();
  const { data: passkeys } = await admin
    .from("user_passkeys")
    .select("credential_id, transports")
    .eq("user_id", resolved.userId);

  if (!passkeys || passkeys.length === 0) {
    return NextResponse.json(
      { error: "No passkey is registered for this account yet." },
      { status: 404 },
    );
  }

  const options = await generateAuthenticationOptions({
    rpID: getRpId(req),
    allowCredentials: passkeys.map(
      (row: { credential_id: string; transports: string[] | null }) => ({
        id: row.credential_id,
        transports: (row.transports ?? undefined) as
          | AuthenticatorTransportFuture[]
          | undefined,
      }),
    ),
    userVerification: "preferred",
  });

  const res = NextResponse.json(options);
  setChallengeCookie(res, {
    challenge: options.challenge,
    userId: resolved.userId,
    purpose: "authenticate",
  });
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
