import { describe, it, expect } from "vitest";
import {
  getPostVerifyTarget,
  getMfaSetupCompleteTarget,
  getMfaSetupSkipTarget,
} from "./post-verify";

describe("getPostVerifyTarget", () => {
  it("routes signup through MFA enrollment", () => {
    expect(getPostVerifyTarget("signup", "/dashboard")).toBe(
      "/account/mfa-setup?from=signup",
    );
  });

  it("routes magiclink directly to /dashboard", () => {
    expect(getPostVerifyTarget("magiclink", "/dashboard")).toBe("/dashboard");
  });

  it("routes plain email type directly to /dashboard", () => {
    expect(getPostVerifyTarget("email", "/dashboard")).toBe("/dashboard");
  });

  it("falls back to caller-provided next for other types", () => {
    expect(getPostVerifyTarget("other", "/somewhere")).toBe("/somewhere");
  });
});

describe("getMfaSetupCompleteTarget", () => {
  it("routes signup-flow completion to /dashboard", () => {
    expect(getMfaSetupCompleteTarget("signup")).toBe("/dashboard");
  });

  it("routes default-flow completion to /account/security", () => {
    expect(getMfaSetupCompleteTarget(null)).toBe("/account/security");
    expect(getMfaSetupCompleteTarget("settings")).toBe("/account/security");
  });
});

describe("getMfaSetupSkipTarget", () => {
  it("always routes to /dashboard", () => {
    expect(getMfaSetupSkipTarget()).toBe("/dashboard");
  });
});
