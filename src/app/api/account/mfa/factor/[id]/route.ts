import { NextRequest, NextResponse } from "next/server";
import { requireAal2 } from "@/lib/auth/aal";
import {
  authRestUnenrollFactor,
  rpcRestRenameFactor,
} from "@/lib/auth/supabase-rest";

/**
 * Rename or delete a Supabase MFA factor.
 *
 * Both operations require AAL2 — by definition the user already has at least
 * one verified factor (the one they're managing), so the bootstrap exception
 * doesn't apply.
 *
 * Rename forwards to the existing rename_mfa_factor RPC (auth.uid() ownership
 * check inside SQL). Delete forwards to Supabase Auth's REST DELETE on the
 * factor; the auth server itself enforces AAL2 on verified-factor unenroll,
 * but we keep the app-level gate for a consistent error shape.
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAal2(request);
  if (!auth.ok) return auth.response;
  const { token } = auth;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing factor id" }, { status: 400 });
  }

  let body: { friendlyName?: unknown };
  try {
    body = (await request.json()) as { friendlyName?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const trimmed =
    typeof body.friendlyName === "string" ? body.friendlyName.trim() : "";
  if (!trimmed) {
    return NextResponse.json(
      { error: "Name cannot be empty." },
      { status: 400 },
    );
  }
  if (trimmed.length > 64) {
    return NextResponse.json(
      { error: "Name is too long (64 character max)." },
      { status: 400 },
    );
  }

  const result = await rpcRestRenameFactor(token, id, trimmed);
  if (!result.ok) {
    if (result.error.message.includes("23505")) {
      return NextResponse.json(
        { error: "You already have an authenticator with that name." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: result.error.message },
      { status: result.status },
    );
  }

  if (result.data === false) {
    return NextResponse.json(
      { error: "Authenticator not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, friendly_name: trimmed });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAal2(request);
  if (!auth.ok) return auth.response;
  const { token } = auth;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing factor id" }, { status: 400 });
  }

  const result = await authRestUnenrollFactor(token, id);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
