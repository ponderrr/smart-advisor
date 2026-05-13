"use client";

import { useEffect } from "react";

/**
 * Confirms before the user navigates away from a page that has unsaved
 * quiz progress. Covers every realistic exit path:
 *   - browser-level navigation (refresh, close tab, type URL) via the
 *     native `beforeunload` event (browser shows its own generic dialog).
 *   - in-app `<a href>` / Next `<Link>` clicks via a capture-phase document
 *     click handler that intercepts BEFORE Next's client-side router takes
 *     over.
 *   - browser back button / mobile swipe-back via a `popstate` sentinel.
 *   - programmatic `router.push` / `router.replace` calls that bypass anchor
 *     clicks (e.g. from buttons) — patched at the `history.pushState` /
 *     `history.replaceState` level so Next.js's underlying navigation API
 *     also goes through the confirm.
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

    // Counter that lets us bypass the patched pushState/replaceState for
    // calls we initiate ourselves (sentinel push) or that have already
    // been confirmed via the click handler.
    let bypassCount = 0;

    const isSameRoute = (urlArg: unknown) => {
      if (!urlArg || typeof urlArg !== "string") return true;
      try {
        const target = new URL(urlArg, window.location.href);
        return target.pathname === window.location.pathname;
      } catch {
        return false;
      }
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
      } else {
        // User confirmed — Next.js's Link will now call pushState. Bypass
        // the patched pushState so we don't double-prompt.
        bypassCount += 1;
      }
    };

    // Patch history.pushState / replaceState so programmatic router.push
    // from buttons (e.g. navbar CTAs) also flows through the confirm.
    const origPushState = window.history.pushState.bind(window.history);
    const origReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function (
      state: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      if (bypassCount > 0) {
        bypassCount -= 1;
        return origPushState(state, unused, url);
      }
      // Hash-only changes / same-path replaces shouldn't prompt — user is
      // staying on the quiz.
      if (isSameRoute(url)) return origPushState(state, unused, url);
      if (!window.confirm(prompt)) return;
      return origPushState(state, unused, url);
    } as typeof window.history.pushState;

    window.history.replaceState = function (
      state: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      if (bypassCount > 0) {
        bypassCount -= 1;
        return origReplaceState(state, unused, url);
      }
      if (isSameRoute(url)) return origReplaceState(state, unused, url);
      if (!window.confirm(prompt)) return;
      return origReplaceState(state, unused, url);
    } as typeof window.history.replaceState;

    // Browser back-button trap: push a sentinel history entry. When the
    // user presses Back, that pop fires `popstate`. We confirm; if they
    // bail out, we re-arm by pushing another sentinel; if they confirm,
    // we step back one more so they actually leave.
    bypassCount += 1;
    origPushState(null, "", window.location.href);

    const onPopState = () => {
      if (window.confirm(prompt)) {
        window.history.back();
      } else {
        bypassCount += 1;
        origPushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    // Capture phase so we intercept before Next.js Link's onClick fires.
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick, true);
      // Restore the originals — leave nothing patched after the guard.
      window.history.pushState = origPushState;
      window.history.replaceState = origReplaceState;
    };
  }, [enabled, message]);
};
