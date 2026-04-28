import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { requireAal2Mock, getAdminClientMock, fromMock } = vi.hoisted(() => ({
  requireAal2Mock: vi.fn(),
  getAdminClientMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/lib/auth/aal", () => ({ requireAal2: requireAal2Mock }));
vi.mock("../_lib", () => ({ getAdminClient: getAdminClientMock }));

import { PATCH, DELETE } from "./route";

beforeEach(() => {
  requireAal2Mock.mockReset();
  getAdminClientMock.mockReset();
  fromMock.mockReset();
  getAdminClientMock.mockReturnValue({ from: fromMock });
});

function makeReq(method: "PATCH" | "DELETE", body?: unknown): NextRequest {
  return new NextRequest("http://test.local/api/passkey/abc", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "passkey-abc" });

function chainedDelete() {
  const finalPromise = Promise.resolve({ error: null });
  const eq2 = vi.fn(() => finalPromise);
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const del = vi.fn(() => ({ eq: eq1 }));
  return { from: vi.fn(() => ({ delete: del })) };
}

function chainedUpdate() {
  const finalPromise = Promise.resolve({ error: null });
  const eq2 = vi.fn(() => finalPromise);
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const update = vi.fn(() => ({ eq: eq1 }));
  return { from: vi.fn(() => ({ update })) };
}

describe("DELETE /api/passkey/[id]", () => {
  it("(negative) rejects AAL1 with 403 AAL2_REQUIRED", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: "Step-up required.", code: "AAL2_REQUIRED" },
        { status: 403 },
      ),
    });

    const res = await DELETE(makeReq("DELETE"), { params });

    expect(res.status).toBe(403);
    expect(getAdminClientMock).not.toHaveBeenCalled();
  });

  it("(positive) deletes passkey at AAL2", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      token: "jwt",
    });
    const adminMock = chainedDelete();
    getAdminClientMock.mockReturnValue(adminMock);

    const res = await DELETE(makeReq("DELETE"), { params });

    expect(res.status).toBe(200);
    expect(adminMock.from).toHaveBeenCalledWith("user_passkeys");
  });
});

describe("PATCH /api/passkey/[id]", () => {
  it("(negative) rejects AAL1 with 403 AAL2_REQUIRED", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: "Step-up required.", code: "AAL2_REQUIRED" },
        { status: 403 },
      ),
    });

    const res = await PATCH(makeReq("PATCH", { device_name: "iPhone" }), {
      params,
    });

    expect(res.status).toBe(403);
    expect(getAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects empty name with 400", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      token: "jwt",
    });

    const res = await PATCH(makeReq("PATCH", { device_name: "  " }), {
      params,
    });

    expect(res.status).toBe(400);
  });

  it("(positive) renames passkey at AAL2", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      token: "jwt",
    });
    const adminMock = chainedUpdate();
    getAdminClientMock.mockReturnValue(adminMock);

    const res = await PATCH(makeReq("PATCH", { device_name: "iPad" }), {
      params,
    });

    expect(res.status).toBe(200);
    expect(adminMock.from).toHaveBeenCalledWith("user_passkeys");
  });
});
