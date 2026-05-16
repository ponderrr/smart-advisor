import { NextRequest, NextResponse } from "next/server";

import { getUserFromAuthHeader } from "@/app/api/passkey/_lib";
import { signShareToken } from "@/lib/wrapped-share-token";

/** Mint a signed share token for the authed user's Year in Review.
 *  Anyone holding the resulting token can view that user's wrapped
 *  data for the given year via /wrapped/share/[token]. */
export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { year?: unknown } = {};
  try {
    body = (await req.json()) as { year?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const year = typeof body.year === "number" ? Math.floor(body.year) : NaN;
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const token = signShareToken({ userId: user.id, year });
    return NextResponse.json({ token });
  } catch (err) {
    console.error("share-token sign failed:", err);
    return NextResponse.json(
      { error: "Share links are not configured on this server." },
      { status: 503 },
    );
  }
}
