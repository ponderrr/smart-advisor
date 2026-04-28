import { NextRequest, NextResponse } from "next/server";
import { requireAal2 } from "@/lib/auth/aal";
import { authRestUpdateUser } from "@/lib/auth/supabase-rest";
import { isValidPassword } from "@/features/auth/utils/validation";

export async function POST(request: NextRequest) {
  const auth = await requireAal2(request);
  if (!auth.ok) return auth.response;
  const { token } = auth;

  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.password !== "string") {
    return NextResponse.json(
      { error: "Password is required." },
      { status: 400 },
    );
  }
  if (!isValidPassword(body.password)) {
    return NextResponse.json(
      {
        error:
          "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
      },
      { status: 400 },
    );
  }

  const result = await authRestUpdateUser(token, { password: body.password });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
