/**
 * Web Share helper. Uses the native OS share sheet when available
 * (`navigator.share`) and gracefully falls back to copying to the
 * clipboard so behaviour is consistent on desktop browsers that don't
 * support sharing.
 *
 * Callers map the returned status to their own toast/i18n strings.
 */

export type ShareStatus = "shared" | "copied" | "cancelled" | "failed";

export interface SharePayload {
  title?: string;
  /** Free text used for the share sheet and as the clipboard fallback. */
  text?: string;
  url?: string;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function nativeShareOrCopy(
  payload: SharePayload,
): Promise<ShareStatus> {
  const { title, text, url } = payload;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    const data: ShareData = {};
    if (title) data.title = title;
    if (text) data.text = text;
    if (url) data.url = url;

    // canShare (where supported) lets us avoid a guaranteed throw.
    const canShare =
      typeof navigator.canShare !== "function" || navigator.canShare(data);

    if (canShare) {
      try {
        await navigator.share(data);
        return "shared";
      } catch (error) {
        // The user dismissing the sheet is not a failure — stay quiet.
        if (isAbortError(error)) return "cancelled";
        // Otherwise fall through to the clipboard path.
      }
    }
  }

  const clipboardText = [text, url].filter(Boolean).join("\n\n");
  if (
    clipboardText &&
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(clipboardText);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}
