"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useTranslations } from "next-intl";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/features/auth/services/auth-service";

import {
  PREF_CONTENT_KEY,
  PREF_CONTENT_TONE_KEY,
  PREF_QUESTION_COUNT_KEY,
  type ContentFocus,
  type ContentTone,
} from "./use-content-preferences";
import type {
  BackupEmailForm,
  EmailForm,
  PasswordForm,
  ProfileForm,
} from "../_lib/schemas";

type MessageType = "success" | "error" | "info";

interface UseSettingsSaveHandlersParams {
  profileForm: UseFormReturn<ProfileForm>;
  emailForm: UseFormReturn<EmailForm>;
  passwordForm: UseFormReturn<PasswordForm>;
  backupEmailForm: UseFormReturn<BackupEmailForm>;
  requestVerification: (actionLabel: string) => Promise<boolean>;
  showMessage: (text: string, type: MessageType) => void;
  clearMessage: () => void;
  contentFocus: ContentFocus;
  contentTone: ContentTone;
  preferredQuestionCount: number;
  setSavingContent: (saving: boolean) => void;
  setCurrentBackupEmail: (email: string | null) => void;
}

/**
 * The settings save layer: profile / email / password / content-prefs /
 * backup-email saves, each gated by the re-auth modal. Extracted verbatim
 * from settings/page.tsx; owns its own auth + Settings i18n. The form
 * instances stay in the page (the render binds register/formState) and
 * are threaded in here.
 */
export function useSettingsSaveHandlers({
  profileForm,
  emailForm,
  passwordForm,
  backupEmailForm,
  requestVerification,
  showMessage,
  clearMessage,
  contentFocus,
  contentTone,
  preferredQuestionCount,
  setSavingContent,
  setCurrentBackupEmail,
}: UseSettingsSaveHandlersParams) {
  const { user, updateProfile, updateEmail, updatePassword, refreshUser } =
    useAuth();
  const t = useTranslations("Settings");

  const handleSaveProfile = profileForm.handleSubmit(async (data) => {
    clearMessage();
    const verified = await requestVerification(t("verifyAction.save"));
    if (!verified) return;
    const parsedAge = typeof data.age === "number" ? data.age : 25;
    const result = await updateProfile(data.newName, parsedAge);
    showMessage(
      result.error ?? t("profile.savedToast"),
      result.error ? "error" : "success",
    );
  });

  const handleSaveEmail = emailForm.handleSubmit(async (data) => {
    clearMessage();
    if (
      user?.email &&
      data.newEmail.toLowerCase() === user.email.trim().toLowerCase()
    ) {
      showMessage(t("email.differentRequired"), "error");
      return;
    }
    const verified = await requestVerification(t("verifyAction.email"));
    if (!verified) return;
    const result = await updateEmail(data.newEmail);
    showMessage(
      result.error ?? t("email.checkInbox"),
      result.error ? "error" : "success",
    );
  });

  const handleSavePassword = passwordForm.handleSubmit(async (data) => {
    clearMessage();
    const verified = await requestVerification(t("verifyAction.password"));
    if (!verified) return;
    const result = await updatePassword(data.newPassword);
    if (result.error) {
      showMessage(result.error, "error");
    } else {
      showMessage(t("password.updatedToast"), "success");
      passwordForm.reset();
    }
  });

  const handleSaveContentPreferences = async () => {
    if (typeof window === "undefined") return;
    const verified = await requestVerification(t("verifyAction.content"));
    if (!verified) return;

    setSavingContent(true);
    try {
      window.localStorage.setItem(PREF_CONTENT_KEY, contentFocus);
      window.localStorage.setItem(PREF_CONTENT_TONE_KEY, contentTone);
      window.localStorage.setItem(
        PREF_QUESTION_COUNT_KEY,
        String(preferredQuestionCount),
      );

      // Persist content_tone to profiles too so it survives a localStorage
      // clear and stays consistent across devices. content_focus and the
      // question-count slider live in localStorage only — they're per-device
      // habits, not part of the canonical profile.
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            content_tone: contentTone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        if (error) {
          console.error("[settings] save content_tone failed", error);
          showMessage(t("content.saveError"), "error");
          return;
        }
        await refreshUser?.();
      }

      showMessage(t("content.savedToast"), "success");
    } finally {
      setSavingContent(false);
    }
  };

  const handleSaveBackupEmail = backupEmailForm.handleSubmit(async (data) => {
    // Backup email is an account-recovery surface — anyone with a stolen
    // session could otherwise quietly point recovery at their own address.
    // Gate behind MFA the same way the other sensitive saves do.
    const verified = await requestVerification(
      t("verifyAction.setBackupEmail"),
    );
    if (!verified) return;
    const { error } = await authService.setBackupEmail(data.backupEmail);
    if (error) {
      showMessage(error, "error");
    } else {
      setCurrentBackupEmail(data.backupEmail);
      backupEmailForm.reset();
      showMessage(t("backupEmail.savedToast"), "success");
    }
  });

  const [removingBackupEmail, setRemovingBackupEmail] = useState(false);
  const handleRemoveBackupEmail = async () => {
    const verified = await requestVerification(
      t("verifyAction.removeBackupEmail"),
    );
    if (!verified) return;
    setRemovingBackupEmail(true);
    const { error } = await authService.removeBackupEmail();
    setRemovingBackupEmail(false);
    if (error) {
      showMessage(error, "error");
    } else {
      setCurrentBackupEmail(null);
      showMessage(t("backupEmail.removedToast"), "success");
    }
  };

  return {
    handleSaveProfile,
    handleSaveEmail,
    handleSavePassword,
    handleSaveContentPreferences,
    handleSaveBackupEmail,
    handleRemoveBackupEmail,
    removingBackupEmail,
  };
}
