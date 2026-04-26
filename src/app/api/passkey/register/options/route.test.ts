import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getUserFromAuthHeaderMock,
  getAdminClientMock,
  setChallengeCookieMock,
  generateRegistrationOptionsMock,
  getAalMock,
  authRestListFactorsMock,
  countSelectMock,
} = vi.hoisted(() => ({
  getUserFromAuthHeaderMock: vi.fn(),
  getAdminClientMock: vi.fn(),
  setChallengeCookieMock: vi.fn(),
  generateRegistrationOptionsMock: vi.fn(),
  getAalMock: vi.fn(),
  authRestListFactorsMock: vi.fn(),
  countSelectMock: vi.fn(),
}));

vi.mock("../../_lib", () => ({
  RP_NAME: "Test",
  getRpId: () => "test.local",
  getUserFromAuthHeader: getUserFromAuthHeaderMock,
  getAdminClient: getAdminClientMock,
  setChallengeCookie: setChallengeCookieMock,
}));
vi.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: generateRegistrationOptionsMock,
}));
vi.mock("@/lib/auth/aal", () => ({ getAal: getAalMock }));
vi.mock("@/lib/auth/supabase-rest", () => ({
  authRestListFactors: authRestListFactorsMock,
}));

import { POST } from "./route";

function makeReq(authHeader?: string, body?: unknown): NextRequest {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new NextRequest("http://test.local/api/passkey/register/options", {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function adminWithExistingCount(count: number) {
  // .from("user_passkeys").select("id", { count, head: true }).eq("user_id", x)
  const countSelect = vi.fn();
  countSelect.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ count, error: null }),
  });
  // .from("user_passkeys").select("credential_id, transports").eq("user_id", x)
  const credSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  });
  // dynamic dispatch on first arg of select
  const select = vi.fn((...args: unknown[]) => {
    if (args[0] === "id") return countSelect();
    return credSelect();
  });
  return {
    from: vi.fn(() => ({ select })),
  };
}

beforeEach(() => {
  getUserFromAuthHeaderMock.mockReset();
  getAdminClientMock.mockReset();
  setChallengeCookieMock.mockReset();
  generateRegistrationOptionsMock.mockReset();
  getAalMock.mockReset();
  authRestListFactorsMock.mockReset();
  countSelectMock.mockReset();
});

describe("POST /api/passkey/register/options", () => {
  it("returns 401 when not authenticated", async () => {
    getUserFromAuthHeaderMock.mockResolvedValue(null);
    const res = await POST(makeReq("Bearer bad"));
    expect(res.status).toBe(401);
    expect(generateRegistrationOptionsMock).not.toHaveBeenCalled();
  });

  it("(bootstrap) allows AAL1 when user has no existing factor", async () => {
    getUserFromAuthHeaderMock.mockResolvedValue({
      id: "u1",
      email: "u@example.com",
    });
    getAdminClientMock.mockReturnValue(adminWithExistingCount(0));
    authRestListFactorsMock.mockResolvedValue({
      ok: true,
      data: [],
      status: 200,
    });
    generateRegistrationOptionsMock.mockResolvedValue({
      challenge: "ch",
      rp: { id: "test.local", name: "Test" },
      user: { id: "u1", name: "u@example.com", displayName: "U" },
    });

    const res = await POST(makeReq("Bearer good"));

    expect(res.status).toBe(200);
    expect(getAalMock).not.toHaveBeenCalled();
    expect(generateRegistrationOptionsMock).toHaveBeenCalled();
  });

  it("(negative) requires AAL2 when user already has a passkey", async () => {
    getUserFromAuthHeaderMock.mockResolvedValue({ id: "u1" });
    getAdminClientMock.mockReturnValue(adminWithExistingCount(1));
    authRestListFactorsMock.mockResolvedValue({
      ok: true,
      data: [],
      status: 200,
    });
    getAalMock.mockResolvedValue("aal1");

    const res = await POST(makeReq("Bearer good"));

    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("AAL2_REQUIRED");
    expect(generateRegistrationOptionsMock).not.toHaveBeenCalled();
  });

  it("(negative) requires AAL2 when user has a verified Supabase factor", async () => {
    getUserFromAuthHeaderMock.mockResolvedValue({ id: "u1" });
    getAdminClientMock.mockReturnValue(adminWithExistingCount(0));
    authRestListFactorsMock.mockResolvedValue({
      ok: true,
      data: [{ id: "f1", factor_type: "totp", status: "verified" }],
      status: 200,
    });
    getAalMock.mockResolvedValue("aal1");

    const res = await POST(makeReq("Bearer good"));

    expect(res.status).toBe(403);
  });

  it("(positive) enrolls additional passkey at AAL2", async () => {
    getUserFromAuthHeaderMock.mockResolvedValue({
      id: "u1",
      email: "u@example.com",
    });
    getAdminClientMock.mockReturnValue(adminWithExistingCount(1));
    authRestListFactorsMock.mockResolvedValue({
      ok: true,
      data: [],
      status: 200,
    });
    getAalMock.mockResolvedValue("aal2");
    generateRegistrationOptionsMock.mockResolvedValue({
      challenge: "ch",
      rp: { id: "test.local", name: "Test" },
      user: { id: "u1", name: "u@example.com", displayName: "U" },
    });

    const res = await POST(makeReq("Bearer good"));

    expect(res.status).toBe(200);
    expect(generateRegistrationOptionsMock).toHaveBeenCalled();
  });
});
