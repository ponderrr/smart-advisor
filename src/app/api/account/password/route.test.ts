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
  return new NextRequest("http://test.local/api/account/password", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("POST /api/account/password", () => {
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

    const res = await POST(makeReq({ password: "ValidP@ss123" }));

    expect(res.status).toBe(403);
    expect(authRestUpdateUserMock).not.toHaveBeenCalled();
  });

  it("rejects weak password with 400", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });

    const res = await POST(makeReq({ password: "short" }));

    expect(res.status).toBe(400);
    expect(authRestUpdateUserMock).not.toHaveBeenCalled();
  });

  it("(positive) updates password at AAL2", async () => {
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

    const res = await POST(makeReq({ password: "ValidP@ss123" }));

    expect(res.status).toBe(200);
    expect(authRestUpdateUserMock).toHaveBeenCalledWith("jwt", {
      password: "ValidP@ss123",
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
      error: { message: "same as old password" },
    });

    const res = await POST(makeReq({ password: "ValidP@ss123" }));

    expect(res.status).toBe(422);
  });
});
