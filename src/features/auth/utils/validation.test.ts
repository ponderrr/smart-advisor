import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  buildAuthFormErrors,
} from "./validation";

// tv() echoes the key so assertions match on the resolved key name.
const tv = (k: string) => k;
const base = {
  email: "",
  password: "",
  username: "",
  age: "",
  confirmPassword: "",
  tv,
};

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

describe("buildAuthFormErrors", () => {
  it("flags a missing identifier differently per mode", () => {
    expect(buildAuthFormErrors({ ...base, mode: "signin" }).email).toBe(
      "emailOrUsernameRequired",
    );
    expect(buildAuthFormErrors({ ...base, mode: "signup" }).email).toBe(
      "emailRequired",
    );
  });

  it("accepts a username (not just email) for sign-in", () => {
    const errs = buildAuthFormErrors({
      ...base,
      mode: "signin",
      email: "just_a_username",
      password: "anything",
    });
    expect(errs.email).toBeUndefined();
    expect(Object.keys(errs)).toHaveLength(0);
  });

  it("enforces email format + password strength on sign-up", () => {
    const errs = buildAuthFormErrors({
      ...base,
      mode: "signup",
      email: "bad-email",
      password: "weak",
      username: "u",
      age: "9",
      confirmPassword: "different",
    });
    expect(errs.email).toBe("emailInvalid");
    expect(errs.password).toBe("passwordRequirementsUnmet");
    expect(errs.username).toBe("usernameTooShort");
    expect(errs.age).toBe("ageOutOfRange");
    expect(errs.confirmPassword).toBe("passwordsDoNotMatch");
    expect(errs.general).toBe("fixHighlightedFields");
  });

  it("returns no errors for a fully valid sign-up", () => {
    const errs = buildAuthFormErrors({
      mode: "signup",
      email: "new@example.com",
      password: "Password1!",
      username: "newuser",
      age: "25",
      confirmPassword: "Password1!",
      tv,
    });
    expect(errs).toEqual({});
  });

  it("only validates the email for forgot-password mode", () => {
    expect(
      buildAuthFormErrors({ ...base, mode: "forgot", email: "" }).email,
    ).toBe("emailRequired");
    expect(
      buildAuthFormErrors({
        ...base,
        mode: "forgot",
        email: "ok@example.com",
      }),
    ).toEqual({});
  });
});
