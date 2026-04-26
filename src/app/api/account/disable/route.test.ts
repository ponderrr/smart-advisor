import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { requireAal2Mock, updateUserByIdMock, fromMock } = vi.hoisted(() => ({
  requireAal2Mock: vi.fn(),
  updateUserByIdMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/lib/auth/aal", () => ({
  requireAal2: requireAal2Mock,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: fromMock,
    auth: { admin: { updateUserById: updateUserByIdMock } },
  }),
}));

import { POST } from "./route";

function makeReq(): NextRequest {
  return new NextRequest("http://test.local/api/account/disable", {
    method: "POST",
  });
}

function chainedUpdate() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq }));
  return { update };
}

describe("POST /api/account/disable", () => {
  beforeEach(() => {
    requireAal2Mock.mockReset();
    updateUserByIdMock.mockReset();
    fromMock.mockReset();
  });

  it("(negative) rejects AAL1 sessions with 403", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: "Step-up required.", code: "AAL2_REQUIRED" },
        { status: 403 },
      ),
    });

    const res = await POST(makeReq());

    expect(res.status).toBe(403);
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("(negative) rejects unauthenticated with 401", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await POST(makeReq());

    expect(res.status).toBe(401);
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("(positive) bans the user when caller is at AAL2", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "user-456" },
      token: "jwt",
    });
    updateUserByIdMock.mockResolvedValue({ data: null, error: null });
    fromMock.mockImplementation(() => chainedUpdate());

    const res = await POST(makeReq());

    expect(res.status).toBe(200);
    expect(updateUserByIdMock).toHaveBeenCalledWith(
      "user-456",
      expect.objectContaining({ ban_duration: expect.any(String) }),
    );
    expect(fromMock).toHaveBeenCalledWith("sessions");
  });

  it("returns 500 when banning fails", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "user-456" },
      token: "jwt",
    });
    updateUserByIdMock.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const res = await POST(makeReq());

    expect(res.status).toBe(500);
  });
});
