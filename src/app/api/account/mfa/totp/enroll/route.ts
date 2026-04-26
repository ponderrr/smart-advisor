import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAal } from "@/lib/auth/aal";
import {
  authRestEnrollTotp,
  authRestListFactors,
} from "@/lib/auth/supabase-rest";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Enroll a TOTP factor.
 *
 * Bootstrap exception: a user with no verified factor enrolls at AAL1 — that's
 * the whole point of bootstrapping MFA. Once a verified factor exists, adding
 * a second factor requires AAL2 (re-verifying the existing factor first).
 *
 * The bootstrap check reads factors from Supabase Auth's REST surface, which
 * enforces ownership against the JWT subject — not from the public mirror
 * table that A4-04 flagged as forgeable.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } =
    await anonClient.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const factorsResult = await authRestListFactors(token);
  if (!factorsResult.ok) {
    return NextResponse.json(
      { error: "Couldn't read MFA state. Please try again." },
      { status: 502 },
    );
  }

  const hasVerifiedFactor = factorsResult.data.some(
    (f) => f.status === "verified",
  );

  if (hasVerifiedFactor) {
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

  let body: { friendlyName?: unknown } = {};
  try {
    body = (await request.json()) as { friendlyName?: unknown };
  } catch {
    // friendlyName is optional
  }
  const friendlyName =
    typeof body.friendlyName === "string" && body.friendlyName.trim()
      ? body.friendlyName.trim().slice(0, 64)
      : undefined;

  const enrollResult = await authRestEnrollTotp(token, friendlyName);
  if (!enrollResult.ok) {
    return NextResponse.json(
      { error: enrollResult.error.message },
      { status: enrollResult.status },
    );
  }

  return NextResponse.json(enrollResult.data);
}
