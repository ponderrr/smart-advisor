"use client";

import { useEffect } from "react";

/**
 * Confirms before the user navigates away from a page that has unsaved
 * quiz progress. Covers both:
 *   - browser-level navigation (refresh, close tab, type URL) via the
 *     native `beforeunload` event (browser shows its own generic dialog).
 *   - in-app navigation (clicks on `<a href>` / Next `<Link>`) via a
 *     capture-phase document click handler that intercepts BEFORE Next's
 *     client-side router takes over.
 *
 * Pass `enabled = true` to arm the guard. Toggle it off (e.g. when the
 * quiz finishes) to allow free navigation.
 */
export const useLeaveGuard = (enabled: boolean, message?: string) => {
  useEffect(() => {
    if (!enabled) return;
    const prompt =
      message ?? "You have a quiz in progress. Leave and lose your answers?";

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore the returnValue text and show their own
      // generic dialog, but it must be set to trigger the prompt at all.
      e.returnValue = prompt;
      return prompt;
    };

    const onClick = (e: MouseEvent) => {
      // Only left-clicks without modifiers count as same-tab navigation.
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      // Skip new-tab/window targets — those keep this page mounted.
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Same-page hash links never unmount the quiz.
      if (href.startsWith("#")) return;

      // Internal-only check: skip absolute http(s) links.
      if (/^https?:\/\//i.test(href)) return;

      // Same path → no nav happens, no need to prompt.
      try {
        const targetUrl = new URL(href, window.location.href);
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search
        ) {
          return;
        }
      } catch {
        // Malformed href — let it fall through.
      }

      if (!window.confirm(prompt)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    // Capture phase so we intercept before Next.js Link's onClick fires.
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [enabled, message]);
};
