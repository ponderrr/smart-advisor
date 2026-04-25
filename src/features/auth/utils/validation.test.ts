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
    expect(isValidPassword("Aa1!567")).toBe(false);
    expect(isValidPassword("Aa1!5678")).toBe(true);
  });

  it("requires an uppercase letter", () => {
    expect(isValidPassword("aa1!5678")).toBe(false);
  });

  it("requires a lowercase letter", () => {
    expect(isValidPassword("AA1!5678")).toBe(false);
  });

  it("requires a number", () => {
    expect(isValidPassword("Aaaa!bcd")).toBe(false);
  });

  it("requires a special character", () => {
    expect(isValidPassword("Aa12345678")).toBe(false);
  });
});
