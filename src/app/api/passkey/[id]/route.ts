import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getUserFromAuthHeader } from "../_lib";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing passkey id" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("user_passkeys")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[passkey/delete] failed", error);
    return NextResponse.json(
      { error: "Couldn't remove the passkey." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
