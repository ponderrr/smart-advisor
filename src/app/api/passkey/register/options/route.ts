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
  try {
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

    const { data: existing, error: existingError } = await admin
      .from("user_passkeys")
      .select("credential_id, transports")
      .eq("user_id", user.id);

    if (existingError) {
      console.error("[passkey/register/options] user_passkeys lookup failed", {
        userId: user.id,
        error: existingError,
      });
      return NextResponse.json(
        { error: "Couldn't read your existing passkeys." },
        { status: 500 },
      );
    }

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
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        "User",
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
  } catch (err) {
    console.error("[passkey/register/options] unhandled error", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      host: req.headers.get("host"),
    });
    return NextResponse.json(
      { error: "Couldn't start passkey setup. Please try again." },
      { status: 500 },
    );
  }
}

type AuthenticatorTransportFuture =
  | "ble"
  | "cable"
  | "hybrid"
  | "internal"
  | "nfc"
  | "smart-card"
  | "usb";
