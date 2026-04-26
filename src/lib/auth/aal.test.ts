import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getUserMock, getAALMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  getAALMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      mfa: { getAuthenticatorAssuranceLevel: getAALMock },
    },
  }),
}));

import { requireAal2, getAal } from "./aal";

function makeReq(authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new NextRequest("http://test.local/x", { headers });
}

describe("getAal", () => {
  beforeEach(() => {
    getAALMock.mockReset();
  });

  it("returns aal2 when Supabase reports aal2", async () => {
    getAALMock.mockResolvedValue({
      data: { currentLevel: "aal2", nextLevel: "aal2" },
      error: null,
    });
    expect(await getAal("token")).toBe("aal2");
  });

  it("returns aal1 when Supabase reports aal1", async () => {
    getAALMock.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });
    expect(await getAal("token")).toBe("aal1");
  });

  it("treats null currentLevel as aal1", async () => {
    getAALMock.mockResolvedValue({
      data: { currentLevel: null, nextLevel: "aal1" },
      error: null,
    });
    expect(await getAal("token")).toBe("aal1");
  });

  it("returns null when Supabase reports an error", async () => {
    getAALMock.mockResolvedValue({
      data: null,
      error: { message: "invalid token" },
    });
    expect(await getAal("token")).toBe(null);
  });

  it("returns null on thrown exception (fail closed)", async () => {
    getAALMock.mockRejectedValue(new Error("network"));
    expect(await getAal("token")).toBe(null);
  });

  it("returns null when token is empty", async () => {
    expect(await getAal("")).toBe(null);
    expect(getAALMock).not.toHaveBeenCalled();
  });
});

describe("requireAal2", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getAALMock.mockReset();
  });

  it("returns 401 when no Authorization header is set", async () => {
    const result = await requireAal2(makeReq());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
  });

  it("returns 401 when Authorization is not a Bearer token", async () => {
    const result = await requireAal2(makeReq("Basic abcd"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
  });

  it("returns 401 when getUser returns no user", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid" },
    });
    const result = await requireAal2(makeReq("Bearer xyz"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
  });

  it("returns 403 with AAL2_REQUIRED when user is at aal1", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    getAALMock.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });
    const result = await requireAal2(makeReq("Bearer xyz"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(403);
    const body = (await result.response.json()) as {
      error: string;
      code: string;
    };
    expect(body.code).toBe("AAL2_REQUIRED");
  });

  it("returns ok with user and token when at aal2", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "u@example.com" } },
      error: null,
    });
    getAALMock.mockResolvedValue({
      data: { currentLevel: "aal2", nextLevel: "aal2" },
      error: null,
    });
    const result = await requireAal2(makeReq("Bearer xyz"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.id).toBe("u1");
    expect(result.token).toBe("xyz");
  });

  it("fails closed (403) when AAL check returns an error", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    getAALMock.mockResolvedValue({ data: null, error: { message: "x" } });
    const result = await requireAal2(makeReq("Bearer xyz"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(403);
  });
});
