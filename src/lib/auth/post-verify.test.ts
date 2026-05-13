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
  it("routes signup-flow completion to /onboarding", () => {
    expect(getMfaSetupCompleteTarget("signup")).toBe(
      "/onboarding?from=signup",
    );
  });

  it("routes default-flow completion to /account/security", () => {
    expect(getMfaSetupCompleteTarget(null)).toBe("/account/security");
    expect(getMfaSetupCompleteTarget("settings")).toBe("/account/security");
  });
});

describe("getMfaSetupSkipTarget", () => {
  it("routes signup-flow skip to /onboarding", () => {
    expect(getMfaSetupSkipTarget("signup")).toBe("/onboarding?from=signup");
  });

  it("routes default-flow skip to /dashboard", () => {
    expect(getMfaSetupSkipTarget()).toBe("/dashboard");
    expect(getMfaSetupSkipTarget(null)).toBe("/dashboard");
    expect(getMfaSetupSkipTarget("settings")).toBe("/dashboard");
  });
});
