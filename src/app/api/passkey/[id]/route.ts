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

export async function PATCH(
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

  let body: { device_name?: unknown };
  try {
    body = (await req.json()) as { device_name?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const trimmed =
    typeof body.device_name === "string" ? body.device_name.trim() : "";
  if (!trimmed) {
    return NextResponse.json(
      { error: "Name cannot be empty." },
      { status: 400 },
    );
  }
  if (trimmed.length > 60) {
    return NextResponse.json(
      { error: "Name is too long (60 character max)." },
      { status: 400 },
    );
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("user_passkeys")
    .update({ device_name: trimmed })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "You already have a passkey with that name." },
        { status: 409 },
      );
    }
    console.error("[passkey/rename] failed", error);
    return NextResponse.json(
      { error: "Couldn't rename the passkey." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, device_name: trimmed });
}
