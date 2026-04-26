import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { requireAal2Mock, deleteUserMock, fromMock } = vi.hoisted(() => ({
  requireAal2Mock: vi.fn(),
  deleteUserMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/lib/auth/aal", () => ({
  requireAal2: requireAal2Mock,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: fromMock,
    auth: { admin: { deleteUser: deleteUserMock } },
  }),
}));

import { POST } from "./route";

function makeReq(): NextRequest {
  return new NextRequest("http://test.local/api/account/delete", {
    method: "POST",
  });
}

function chainedDelete(): {
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
} {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const del = vi.fn(() => ({ eq }));
  return { delete: del, eq };
}

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    requireAal2Mock.mockReset();
    deleteUserMock.mockReset();
    fromMock.mockReset();
  });

  it("(negative) rejects AAL1 sessions with the helper's 403 response", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: "Step-up required.", code: "AAL2_REQUIRED" },
        { status: 403 },
      ),
    });

    const res = await POST(makeReq());

    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("AAL2_REQUIRED");
    expect(deleteUserMock).not.toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("(negative) rejects unauthenticated with 401", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await POST(makeReq());

    expect(res.status).toBe(401);
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("(positive) deletes account when caller is at AAL2", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "user-123", email: "u@example.com" },
      token: "jwt",
    });
    fromMock.mockImplementation(() => chainedDelete());
    deleteUserMock.mockResolvedValue({ data: null, error: null });

    const res = await POST(makeReq());

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(deleteUserMock).toHaveBeenCalledWith("user-123");
    expect(fromMock).toHaveBeenCalledWith("sessions");
    expect(fromMock).toHaveBeenCalledWith("mfa_factors");
    expect(fromMock).toHaveBeenCalledWith("profiles");
  });

  it("returns 500 when admin deleteUser fails", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "user-123" },
      token: "jwt",
    });
    fromMock.mockImplementation(() => chainedDelete());
    deleteUserMock.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const res = await POST(makeReq());

    expect(res.status).toBe(500);
  });
});
