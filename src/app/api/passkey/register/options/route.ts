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

  // Best-effort: read the proposed name early so we can reject a duplicate
  // before kicking off the WebAuthn ceremony (otherwise the user does Touch
  // ID for nothing). Body is optional — old clients still work.
  let proposedName: string | undefined;
  try {
    const body = (await req.json()) as { device_name?: unknown };
    if (typeof body?.device_name === "string") {
      proposedName = body.device_name.trim() || undefined;
    }
  } catch {
    // No body / invalid JSON — fall through to legacy behavior.
  }

  const admin = getAdminClient();

  if (proposedName) {
    const { data: clash } = await admin
      .from("user_passkeys")
      .select("id")
      .eq("user_id", user.id)
      .ilike("device_name", proposedName)
      .limit(1)
      .maybeSingle();
    if (clash) {
      return NextResponse.json(
        { error: "You already have a passkey with that name." },
        { status: 409 },
      );
    }
  }

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
