"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { authService } from "@/features/auth/services/auth-service";
import { MFAFactor } from "@/features/auth/types/mfa";

/**
 * Promise-based re-auth gate for sensitive settings actions. Callers
 * `await requestVerification(label)`; the returned promise resolves true
 * once the user passes the TOTP modal (or false on cancel). Extracted
 * verbatim from settings/page.tsx; owns its own Settings i18n. mfaEnabled
 * is threaded in (it lives with the MFA panel state in the page).
 */
export function useReauthVerification(mfaEnabled: boolean) {
  const t = useTranslations("Settings");

  // MFA verification modal state
  const [verifyModal, setVerifyModal] = useState<{
    open: boolean;
    actionLabel: string;
    mode: "totp" | "enroll";
  }>({ open: false, actionLabel: "", mode: "totp" });
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const verifyResolveRef = useRef<((ok: boolean) => void) | null>(null);

  const requestVerification = useCallback(
    (actionLabel: string): Promise<boolean> => {
      return new Promise((resolve) => {
        verifyResolveRef.current = resolve;
        setVerifyCode("");
        setVerifyError("");
        setVerifyLoading(false);
        setVerifyModal({
          open: true,
          actionLabel,
          mode: mfaEnabled ? "totp" : "enroll",
        });
      });
    },
    [mfaEnabled],
  );

  const closeVerifyModal = useCallback((result: boolean) => {
    setVerifyModal((prev) => ({ ...prev, open: false }));
    verifyResolveRef.current?.(result);
    verifyResolveRef.current = null;
  }, []);

  const handleVerifySubmit = useCallback(async () => {
    if (verifyCode.length !== 6) {
      setVerifyError(t("verifyModal.enterCode"));
      return;
    }
    setVerifyLoading(true);
    setVerifyError("");
    const { data: factors } = await authService.listMFAFactors();
    const factor = factors?.totp?.find(
      (f: MFAFactor) => f.status === "verified",
    );
    if (!factor) {
      setVerifyError(t("verifyModal.noFactor"));
      setVerifyLoading(false);
      return;
    }
    const result = await authService.verifyMFA(factor.id, verifyCode);
    setVerifyLoading(false);
    if (result.error) {
      setVerifyError(result.error);
    } else {
      closeVerifyModal(true);
    }
  }, [verifyCode, closeVerifyModal, t]);

  // Auto-submit the verify modal once six digits are in (TOTP mode only —
  // the enroll mode inside this modal has its own input).
  useEffect(() => {
    if (
      verifyModal.open &&
      verifyModal.mode === "totp" &&
      verifyCode.length === 6 &&
      !verifyLoading
    ) {
      handleVerifySubmit();
    }
  }, [
    verifyCode,
    verifyModal.open,
    verifyModal.mode,
    verifyLoading,
    handleVerifySubmit,
  ]);

  return {
    requestVerification,
    verifyModal,
    verifyCode,
    setVerifyCode,
    verifyError,
    setVerifyError,
    verifyLoading,
    closeVerifyModal,
    handleVerifySubmit,
  };
}
