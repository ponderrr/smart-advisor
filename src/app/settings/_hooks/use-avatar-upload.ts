"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/features/auth/hooks/use-auth";

type MessageType = "success" | "error" | "info";

/**
 * Owns the profile avatar upload/remove flow: the uploading flag, the
 * hidden file input ref, and the two handlers. Extracted verbatim from
 * settings/page.tsx — pulls uploadAvatar/removeAvatar from useAuth and
 * owns its own Settings translations; result reporting is delegated to
 * the page's message system via the onMessage callback.
 */
export function useAvatarUpload(
  onMessage: (text: string, type: MessageType) => void,
) {
  const { uploadAvatar, removeAvatar } = useAuth();
  const t = useTranslations("Settings");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    // Reset so re-selecting the same file still fires onChange.
    event.target.value = "";
    if (!file) return;
    setAvatarUploading(true);
    const result = await uploadAvatar(file);
    setAvatarUploading(false);
    if (result.error) {
      onMessage(result.error, "error");
    } else {
      onMessage(t("profile.pictureUpdated"), "success");
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    const result = await removeAvatar();
    setAvatarUploading(false);
    if (result.error) {
      onMessage(result.error, "error");
    } else {
      onMessage(t("profile.pictureRemoved"), "success");
    }
  };

  return {
    avatarUploading,
    avatarInputRef,
    handleAvatarFileChange,
    handleRemoveAvatar,
  };
}
