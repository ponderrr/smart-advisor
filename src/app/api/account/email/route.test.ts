import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { requireAal2Mock, authRestUpdateUserMock } = vi.hoisted(() => ({
  requireAal2Mock: vi.fn(),
  authRestUpdateUserMock: vi.fn(),
}));

vi.mock("@/lib/auth/aal", () => ({ requireAal2: requireAal2Mock }));
vi.mock("@/lib/auth/supabase-rest", () => ({
  authRestUpdateUser: authRestUpdateUserMock,
}));

import { POST } from "./route";

function makeReq(body?: unknown): NextRequest {
  return new NextRequest("http://test.local/api/account/email", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("POST /api/account/email", () => {
  beforeEach(() => {
    requireAal2Mock.mockReset();
    authRestUpdateUserMock.mockReset();
  });

  it("(negative) rejects AAL1 with 403 AAL2_REQUIRED", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: "Step-up required.", code: "AAL2_REQUIRED" },
        { status: 403 },
      ),
    });

    const res = await POST(makeReq({ email: "new@example.com" }));

    expect(res.status).toBe(403);
    expect(authRestUpdateUserMock).not.toHaveBeenCalled();
  });

  it("rejects malformed email with 400", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });

    const res = await POST(makeReq({ email: "not-an-email" }));

    expect(res.status).toBe(400);
    expect(authRestUpdateUserMock).not.toHaveBeenCalled();
  });

  it("rejects missing email with 400", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });

    const res = await POST(makeReq({}));

    expect(res.status).toBe(400);
  });

  it("(positive) updates email at AAL2", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });
    authRestUpdateUserMock.mockResolvedValue({
      ok: true,
      data: {},
      status: 200,
    });

    const res = await POST(makeReq({ email: "  NEW@example.COM  " }));

    expect(res.status).toBe(200);
    expect(authRestUpdateUserMock).toHaveBeenCalledWith("jwt", {
      email: "new@example.com",
    });
  });

  it("forwards Supabase error status", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });
    authRestUpdateUserMock.mockResolvedValue({
      ok: false,
      status: 422,
      error: { message: "email already in use" },
    });

    const res = await POST(makeReq({ email: "taken@example.com" }));

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("email already in use");
  });
});
