import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const {
  requireAal2Mock,
  rpcRestRenameFactorMock,
  authRestUnenrollFactorMock,
} = vi.hoisted(() => ({
  requireAal2Mock: vi.fn(),
  rpcRestRenameFactorMock: vi.fn(),
  authRestUnenrollFactorMock: vi.fn(),
}));

vi.mock("@/lib/auth/aal", () => ({ requireAal2: requireAal2Mock }));
vi.mock("@/lib/auth/supabase-rest", () => ({
  rpcRestRenameFactor: rpcRestRenameFactorMock,
  authRestUnenrollFactor: authRestUnenrollFactorMock,
}));

import { PATCH, DELETE } from "./route";

function makeReq(method: "PATCH" | "DELETE", body?: unknown): NextRequest {
  return new NextRequest("http://test.local/api/account/mfa/factor/abc", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "factor-abc" });

describe("PATCH /api/account/mfa/factor/[id]", () => {
  beforeEach(() => {
    requireAal2Mock.mockReset();
    rpcRestRenameFactorMock.mockReset();
  });

  it("(negative) rejects AAL1 with 403 AAL2_REQUIRED", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: "Step-up required.", code: "AAL2_REQUIRED" },
        { status: 403 },
      ),
    });

    const res = await PATCH(makeReq("PATCH", { friendlyName: "iPhone" }), {
      params,
    });

    expect(res.status).toBe(403);
    expect(rpcRestRenameFactorMock).not.toHaveBeenCalled();
  });

  it("rejects empty body with 400", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });

    const res = await PATCH(makeReq("PATCH", { friendlyName: "  " }), {
      params,
    });

    expect(res.status).toBe(400);
    expect(rpcRestRenameFactorMock).not.toHaveBeenCalled();
  });

  it("rejects names over 64 chars with 400", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });

    const res = await PATCH(
      makeReq("PATCH", { friendlyName: "x".repeat(65) }),
      { params },
    );

    expect(res.status).toBe(400);
  });

  it("(positive) renames factor at AAL2", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });
    rpcRestRenameFactorMock.mockResolvedValue({
      ok: true,
      data: true,
      status: 200,
    });

    const res = await PATCH(makeReq("PATCH", { friendlyName: "iPad" }), {
      params,
    });

    expect(res.status).toBe(200);
    expect(rpcRestRenameFactorMock).toHaveBeenCalledWith(
      "jwt",
      "factor-abc",
      "iPad",
    );
  });

  it("returns 404 when RPC returns false (factor not found)", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });
    rpcRestRenameFactorMock.mockResolvedValue({
      ok: true,
      data: false,
      status: 200,
    });

    const res = await PATCH(makeReq("PATCH", { friendlyName: "iPad" }), {
      params,
    });

    expect(res.status).toBe(404);
  });

  it("returns 409 on unique-violation (23505)", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });
    rpcRestRenameFactorMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: { message: "duplicate key value violates unique constraint (23505)" },
    });

    const res = await PATCH(makeReq("PATCH", { friendlyName: "Existing" }), {
      params,
    });

    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/account/mfa/factor/[id]", () => {
  beforeEach(() => {
    requireAal2Mock.mockReset();
    authRestUnenrollFactorMock.mockReset();
  });

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
    expect(authRestUnenrollFactorMock).not.toHaveBeenCalled();
  });

  it("(positive) unenrolls factor at AAL2", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });
    authRestUnenrollFactorMock.mockResolvedValue({
      ok: true,
      data: { id: "factor-abc" },
      status: 200,
    });

    const res = await DELETE(makeReq("DELETE"), { params });

    expect(res.status).toBe(200);
    expect(authRestUnenrollFactorMock).toHaveBeenCalledWith(
      "jwt",
      "factor-abc",
    );
  });

  it("forwards Supabase error status", async () => {
    requireAal2Mock.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      token: "jwt",
    });
    authRestUnenrollFactorMock.mockResolvedValue({
      ok: false,
      status: 422,
      error: { message: "cannot unenroll" },
    });

    const res = await DELETE(makeReq("DELETE"), { params });

    expect(res.status).toBe(422);
  });
});
