/**
 * Characterization tests for AuthForm.
 *
 * These pin the *current observable behavior* of the 1,082-line auth
 * surface (sign-in / sign-up / forgot / MFA-challenge) so it can be
 * decomposed safely afterwards — the 76 existing tests don't cover this
 * component at all. They assert behavior, not implementation, so they
 * should survive a behavior-preserving refactor unchanged.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";

import enMessages from "../../../../messages/en.json";
import { AuthForm } from "./auth-form";

// next/navigation is unavailable in jsdom — stub router + empty query.
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Hoisted so tests can flip passkey support and assert signIn calls.
const { browserSupported, passkeySignIn } = vi.hoisted(() => ({
  browserSupported: vi.fn(() => false),
  passkeySignIn: vi.fn(async () => ({ error: null as string | null })),
}));
vi.mock("../services/passkey-service", () => ({
  passkeyService: { browserSupported, signIn: passkeySignIn },
}));

const makeProps = () => ({
  loading: false,
  authError: null as string | null,
  signupCooldown: false,
  initialMfaRequired: false,
  onClearError: vi.fn(),
  onSignIn: vi.fn(async () => ({ error: null as string | null })),
  onSignUp: vi.fn(async () => ({ error: null as string | null })),
  onResetPassword: vi.fn(async () => ({ error: null as string | null })),
  onResendVerificationEmail: vi.fn(async () => ({
    error: null as string | null,
  })),
  onVerifyMFA: vi.fn(async () => ({ error: null as string | null })),
  onListMFAFactors: vi.fn(async () => ({ data: null, error: null })),
  onVerifyBackupCode: vi.fn(async () => ({ error: null as string | null })),
});

const renderForm = (props: Partial<ReturnType<typeof makeProps>> = {}) => {
  const merged = { ...makeProps(), ...props };
  render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <AuthForm {...merged} />
    </NextIntlClientProvider>,
  );
  return merged;
};

beforeEach(() => {
  vi.clearAllMocks();
  browserSupported.mockReturnValue(false);
});

describe("AuthForm characterization", () => {
  it("renders the sign-in form by default", () => {
    renderForm();
    expect(
      screen.getByPlaceholderText("you@example.com or username"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign In" }),
    ).toBeInTheDocument();
  });

  it("does not call onSignIn when submitted with empty fields", async () => {
    // Security-relevant invariant: invalid input must never reach the auth
    // callback. (The exact post-submit DOM is intentionally not asserted —
    // it's a UI detail; this pins the contract that matters for refactor.)
    const props = renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await new Promise((r) => setTimeout(r, 50));
    expect(props.onSignIn).not.toHaveBeenCalled();
  });

  it("calls onSignIn with the entered credentials", async () => {
    const props = renderForm();
    await userEvent.type(
      screen.getByPlaceholderText("you@example.com or username"),
      "test@example.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("••••••••"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => {
      expect(props.onSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
        false,
      );
    });
  });

  it("surfaces a server auth error", () => {
    renderForm({ authError: "Invalid login credentials" });
    expect(
      screen.getByText("Invalid login credentials"),
    ).toBeInTheDocument();
  });

  it("renders the MFA challenge (not the sign-in form) when initialMfaRequired", () => {
    renderForm({ initialMfaRequired: true });
    // In mfa-challenge mode the email/username sign-in field is gone.
    expect(
      screen.queryByPlaceholderText("you@example.com or username"),
    ).not.toBeInTheDocument();
  });

  it("submits a reset request from forgot-password mode", async () => {
    const props = renderForm();
    // Switch to forgot mode via its trigger, then submit.
    await userEvent.click(
      screen.getByRole("button", { name: enMessages.Auth.forgotPassword }),
    );
    // forgot mode switches the email field placeholder to the email-only form.
    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "reset@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Send reset link" }),
    );
    await waitFor(() => {
      expect(props.onResetPassword).toHaveBeenCalledWith("reset@example.com");
    });
  });

  it("hides the sign-in/sign-up toggle in MFA-challenge mode", () => {
    renderForm({ initialMfaRequired: true });
    expect(
      screen.queryByRole("radio", { name: "Sign in" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: "Sign up" }),
    ).not.toBeInTheDocument();
  });
});

describe("AuthForm — sign-up mode", () => {
  const switchToSignUp = async () => {
    await userEvent.click(screen.getByRole("radio", { name: "Sign up" }));
  };

  it("reveals the extra sign-up fields and relabels the submit", async () => {
    renderForm();
    await switchToSignUp();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Age")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Account" }),
    ).toBeInTheDocument();
  });

  it("does not call onSignUp when sign-up fields are invalid", async () => {
    const props = renderForm();
    await switchToSignUp();
    await userEvent.click(
      screen.getByRole("button", { name: "Create Account" }),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(props.onSignUp).not.toHaveBeenCalled();
  });

  it("calls onSignUp with valid input", async () => {
    const props = renderForm();
    await switchToSignUp();
    await userEvent.type(screen.getByLabelText("Email"), "newuser@example.com");
    await userEvent.type(screen.getByLabelText("Username"), "newuser");
    await userEvent.type(screen.getByLabelText("Age"), "25");
    await userEvent.type(screen.getByLabelText("Password"), "Password1!");
    await userEvent.type(
      screen.getByLabelText("Confirm password"),
      "Password1!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Create Account" }),
    );
    await waitFor(() => {
      expect(props.onSignUp).toHaveBeenCalledWith(
        "newuser@example.com",
        "Password1!",
        "newuser",
        "newuser",
        25,
      );
    });
  });
});

describe("AuthForm — passkey", () => {
  it("offers passkey sign-in and forwards the identifier", async () => {
    browserSupported.mockReturnValue(true);
    renderForm();
    await userEvent.type(
      screen.getByPlaceholderText("you@example.com or username"),
      "user@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Sign in with a passkey" }),
    );
    await waitFor(() => {
      expect(passkeySignIn).toHaveBeenCalledWith("user@example.com");
    });
  });

  it("hides the passkey option when unsupported", () => {
    browserSupported.mockReturnValue(false);
    renderForm();
    expect(
      screen.queryByRole("button", { name: "Sign in with a passkey" }),
    ).not.toBeInTheDocument();
  });
});
