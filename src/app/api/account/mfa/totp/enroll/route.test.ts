import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getUserMock, listFactorsMock, getAalMock, authRestEnrollTotpMock } =
  vi.hoisted(() => ({
    getUserMock: vi.fn(),
    listFactorsMock: vi.fn(),
    getAalMock: vi.fn(),
    authRestEnrollTotpMock: vi.fn(),
  }));

// The route uses supabase-js (`anonClient.auth.mfa.listFactors()`) to read the
// user's factors — it stopped going through raw Auth REST. The mock client
// mirrors that surface: `auth.getUser` + `auth.mfa.listFactors`.
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock, mfa: { listFactors: listFactorsMock } },
  }),
}));

vi.mock("@/lib/auth/aal", () => ({ getAal: getAalMock }));

vi.mock("@/lib/auth/supabase-rest", () => ({
  authRestEnrollTotp: authRestEnrollTotpMock,
}));

import { POST } from "./route";

function makeReq(authHeader?: string, body?: unknown): NextRequest {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new NextRequest("http://test.local/api/account/mfa/totp/enroll", {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("POST /api/account/mfa/totp/enroll", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    listFactorsMock.mockReset();
    getAalMock.mockReset();
    authRestEnrollTotpMock.mockReset();
  });

  it("returns 401 when no Authorization header", async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
    expect(authRestEnrollTotpMock).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "x" },
    });
    const res = await POST(makeReq("Bearer bad"));
    expect(res.status).toBe(401);
    expect(authRestEnrollTotpMock).not.toHaveBeenCalled();
  });

  it("(bootstrap) enrolls at AAL1 when user has no verified factors", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    listFactorsMock.mockResolvedValue({
      data: { totp: [{ id: "f1", status: "unverified" }] },
      error: null,
    });
    authRestEnrollTotpMock.mockResolvedValue({
      ok: true,
      data: { id: "f2", type: "totp", totp: { qr_code: "qr", secret: "s" } },
      status: 200,
    });

    const res = await POST(makeReq("Bearer good", { friendlyName: "iPhone" }));

    expect(res.status).toBe(200);
    expect(getAalMock).not.toHaveBeenCalled();
    expect(authRestEnrollTotpMock).toHaveBeenCalledWith("good", "iPhone");
  });

  it("(negative) requires AAL2 when user already has a verified factor", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    listFactorsMock.mockResolvedValue({
      data: { totp: [{ id: "f1", status: "verified" }] },
      error: null,
    });
    getAalMock.mockResolvedValue("aal1");

    const res = await POST(makeReq("Bearer good"));

    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("AAL2_REQUIRED");
    expect(authRestEnrollTotpMock).not.toHaveBeenCalled();
  });

  it("(positive) enrolls a second factor at AAL2", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    listFactorsMock.mockResolvedValue({
      data: { totp: [{ id: "f1", status: "verified" }] },
      error: null,
    });
    getAalMock.mockResolvedValue("aal2");
    authRestEnrollTotpMock.mockResolvedValue({
      ok: true,
      data: { id: "f3", type: "totp" },
      status: 200,
    });

    const res = await POST(makeReq("Bearer good"));

    expect(res.status).toBe(200);
    expect(authRestEnrollTotpMock).toHaveBeenCalled();
  });

  it("returns 502 if listFactors fails", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    listFactorsMock.mockResolvedValue({
      data: null,
      error: { message: "upstream" },
    });

    const res = await POST(makeReq("Bearer good"));
    expect(res.status).toBe(502);
    expect(authRestEnrollTotpMock).not.toHaveBeenCalled();
  });

  it("forwards Supabase enroll error status", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    listFactorsMock.mockResolvedValue({
      data: { totp: [] },
      error: null,
    });
    authRestEnrollTotpMock.mockResolvedValue({
      ok: false,
      status: 422,
      error: { message: "duplicate friendly name" },
    });

    const res = await POST(makeReq("Bearer good"));
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("duplicate friendly name");
  });
});
