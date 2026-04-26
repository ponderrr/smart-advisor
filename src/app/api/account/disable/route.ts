import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAal2 } from "@/lib/auth/aal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 },
      );
    }

    const auth = await requireAal2(request);
    if (!auth.ok) return auth.response;
    const { user } = auth;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { error: banError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { ban_duration: "876000h" }, // ~100 years = effectively disabled
    );

    if (banError) {
      console.error("Error disabling user:", banError);
      return NextResponse.json(
        { error: "Failed to disable account. Please try again." },
        { status: 500 },
      );
    }

    await adminClient
      .from("sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in account disable:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
