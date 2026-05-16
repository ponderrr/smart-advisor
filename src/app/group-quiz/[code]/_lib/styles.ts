/**
 * Shared group-quiz CTA class strings. Extracted verbatim from page.tsx
 * so the page render and the extracted view components share one source
 * without a page⇄component import cycle.
 */

/** Primary CTA. Pair with tone.barGradient. Disabled state freezes
 *  shadow + adds not-allowed. */
export const PRIMARY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r font-black tracking-tight text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-sm disabled:hover:shadow-sm";

/** Hero CTAs with a translate-on-hover lift (Start Quiz / Reveal). */
export const HERO_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r font-black tracking-tight text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-lg disabled:hover:translate-y-0 disabled:hover:shadow-lg";
