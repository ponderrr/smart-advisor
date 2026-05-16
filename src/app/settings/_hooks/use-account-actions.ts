"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { authService } from "@/features/auth/services/auth-service";

type MessageType = "success" | "error" | "info";

interface UseAccountActionsParams {
  requestVerification: (actionLabel: string) => Promise<boolean>;
  showMessage: (text: string, type: MessageType) => void;
  clearMessage: () => void;
  setAccountActionLoading: (loading: boolean) => void;
}

/**
 * The destructive account actions — disable and delete. Each is gated by
 * a confirm, the re-auth modal, and (for delete) a typed "DELETE"
 * prompt. Extracted verbatim from settings/page.tsx; owns its own router
 * + Settings i18n. Kept isolated from the form-bound saves since these
 * are the highest-stakes paths.
 */
export function useAccountActions({
  requestVerification,
  showMessage,
  clearMessage,
  setAccountActionLoading,
}: UseAccountActionsParams) {
  const router = useRouter();
  const t = useTranslations("Settings");

  const handleDisableAccount = async () => {
    if (!window.confirm(t("danger.disableConfirm"))) return;
    const verified = await requestVerification(t("verifyAction.disable"));
    if (!verified) return;
    if (!window.confirm(t("danger.disableFinalConfirm"))) return;
    setAccountActionLoading(true);
    clearMessage();
    const result = await authService.disableAccount();
    if (result.error) {
      showMessage(result.error, "error");
      setAccountActionLoading(false);
      return;
    }
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t("danger.deleteConfirm"))) return;
    const verified = await requestVerification(t("verifyAction.delete"));
    if (!verified) return;
    const typed = window.prompt(t("danger.typeDeletePrompt"));
    if (typed !== "DELETE") {
      showMessage(t("danger.deletionCanceled"), "info");
      return;
    }
    setAccountActionLoading(true);
    clearMessage();
    const result = await authService.deleteAccount();
    if (result.error) {
      showMessage(result.error, "error");
      setAccountActionLoading(false);
      return;
    }
    router.push("/");
  };

  return { handleDisableAccount, handleDeleteAccount };
}
