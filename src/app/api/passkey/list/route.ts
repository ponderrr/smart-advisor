import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getUserFromAuthHeader } from "../_lib";

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("user_passkeys")
    .select("id, device_name, transports, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[passkey/list] failed", error);
    return NextResponse.json(
      { error: "Couldn't load your passkeys." },
      { status: 500 },
    );
  }

  return NextResponse.json({ passkeys: data ?? [] });
}
