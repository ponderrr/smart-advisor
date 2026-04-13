import { describe, it, expect } from "vitest";
import { normalizeEmail, isValidEmail, isValidPassword } from "./validation";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Foo@BAR.com ")).toBe("foo@bar.com");
  });

  it("is idempotent", () => {
    expect(normalizeEmail(normalizeEmail("A@B.COM"))).toBe("a@b.com");
  });
});

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("alice@example.com")).toBe(true);
    expect(isValidEmail("a@b.co")).toBe(true);
  });

  it("rejects obviously broken input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("requires at least 8 characters", () => {
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("12345678")).toBe(true);
  });
});
