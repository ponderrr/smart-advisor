import { redirect } from "next/navigation";

/**
 * The demo is now a single morphing route: /demo handles the quiz, the
 * in-card loading skeleton, and the results/error payoff without ever
 * navigating. This stale path just forwards old links/bookmarks home to
 * /demo so they don't 404.
 */
export default function DemoResultsRedirect() {
  redirect("/demo");
}
