import { NextRequest, NextResponse } from "next/server";
import { requireAal2 } from "@/lib/auth/aal";
import { authRestUpdateUser } from "@/lib/auth/supabase-rest";
import { isValidEmail, normalizeEmail } from "@/features/auth/utils/validation";

export async function POST(request: NextRequest) {
  const auth = await requireAal2(request);
  if (!auth.ok) return auth.response;
  const { token } = auth;

  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.email !== "string") {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 },
    );
  }
  const newEmail = normalizeEmail(body.email);
  if (!isValidEmail(newEmail)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const result = await authRestUpdateUser(token, { email: newEmail });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
