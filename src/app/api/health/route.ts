import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    maintenance: process.env.MAINTENANCE_MODE === "true",
    timestamp: new Date().toISOString(),
  });
}
