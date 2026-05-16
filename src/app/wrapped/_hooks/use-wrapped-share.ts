"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { supabase } from "@/integrations/supabase/client";
import { nativeShareOrCopy } from "@/lib/share";

/**
 * Owns the wrapped share flow: the share dialog open state, the lazily
 * minted (per-year cached) signed share token, the derived public share
 * URL, and the copy / native-share handlers. Extracted verbatim from
 * wrapped/page.tsx; owns its own useTranslations("Wrapped").
 */
export function useWrappedShare(year: number) {
  const t = useTranslations("Wrapped");

  // Share-token state (mints lazily on dialog open, cached per year).
  const [showShare, setShowShare] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareTokenYear, setShareTokenYear] = useState<number | null>(null);
  const [shareTokenLoading, setShareTokenLoading] = useState(false);

  // Native OS share sheet — resolved after mount to avoid SSR mismatch.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator?.share === "function");
  }, []);

  const handleOpenShare = async () => {
    setShowShare(true);
    if (shareToken && shareTokenYear === year) return;
    setShareTokenLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error(t("share.signInRequired"));
        setShareTokenLoading(false);
        return;
      }
      const res = await fetch("/api/wrapped/share-token", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(body.error ?? t("share.failed"));
        setShareTokenLoading(false);
        return;
      }
      const { token } = (await res.json()) as { token: string };
      setShareToken(token);
      setShareTokenYear(year);
    } catch (err) {
      console.error("Failed to mint share token:", err);
      toast.error(t("share.failed"));
    } finally {
      setShareTokenLoading(false);
    }
  };

  const shareUrl =
    shareToken && typeof window !== "undefined"
      ? `${window.location.origin}/wrapped/share/${shareToken}`
      : null;

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("share.linkCopied"));
    } catch {
      toast.error(t("share.copyFailed"));
    }
  };

  const handleNativeShareLink = async () => {
    if (!shareUrl) return;
    const status = await nativeShareOrCopy({
      title: t("share.dialogTitle"),
      text: t("share.dialogSubtitle", { year }),
      url: shareUrl,
    });
    if (status === "copied") toast.success(t("share.linkCopied"));
    else if (status === "failed") toast.error(t("share.shareFailed"));
  };

  return {
    showShare,
    setShowShare,
    shareToken,
    shareTokenLoading,
    canNativeShare,
    shareUrl,
    handleOpenShare,
    handleCopyShareLink,
    handleNativeShareLink,
  };
}
