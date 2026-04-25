import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import {
  RP_NAME,
  getRpId,
  getUserFromAuthHeader,
  getAdminClient,
  setChallengeCookie,
} from "../../_lib";

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const { data: existing } = await admin
    .from("user_passkeys")
    .select("credential_id, transports")
    .eq("user_id", user.id);

  const excludeCredentials = (existing ?? []).map(
    (row: { credential_id: string; transports: string[] | null }) => ({
      id: row.credential_id,
      transports: (row.transports ?? undefined) as
        | AuthenticatorTransportFuture[]
        | undefined,
    }),
  );

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpId(req),
    userID: new TextEncoder().encode(user.id),
    userName: user.email ?? user.id,
    userDisplayName:
      (user.user_metadata?.name as string | undefined) ?? user.email ?? "User",
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const res = NextResponse.json(options);
  setChallengeCookie(res, {
    challenge: options.challenge,
    userId: user.id,
    purpose: "register",
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
