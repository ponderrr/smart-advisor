import { redirect } from "next/navigation";

/**
 * /dashboard is retired. Feed is the logged-in home, milestones live at
 * /milestones, recent picks at /history, analytics in /wrapped. This stub
 * keeps the old URL alive (bookmarks, deep-link emails, mobile push) by
 * redirecting to /feed.
 */
export default function DashboardRedirect() {
  redirect("/feed");
}
