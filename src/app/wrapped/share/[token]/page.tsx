import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminClient } from "@/app/api/passkey/_lib";
import { verifyShareToken } from "@/lib/wrapped-share-token";

import { WrappedShareView, type SharedRec } from "./view";

interface WrappedSharePageProps {
  params: Promise<{ token: string }>;
}

/** Public Year in Review view. Access is gated by the signed token in the
 *  URL — no auth required to view. Renders a slim "highlights" subset of
 *  the user's wrapped data, not the full personalized dashboard. */
export default async function WrappedSharePage({
  params,
}: WrappedSharePageProps) {
  const { token } = await params;
  let payload: ReturnType<typeof verifyShareToken>;
  try {
    payload = verifyShareToken(token);
  } catch {
    // Server is misconfigured (no WRAPPED_SHARE_SECRET). Surface as 404
    // rather than a 500 so the link doesn't leak server state.
    notFound();
  }
  if (!payload) notFound();

  const admin = getAdminClient();

  const [{ data: profile }, { data: recs }] = await Promise.all([
    admin
      .from("profiles")
      .select("name, username")
      .eq("id", payload.u)
      .maybeSingle(),
    admin
      .from("recommendations")
      .select(
        "id, type, title, director, author, artist, year, genres, poster_url, is_favorited, created_at",
      )
      .eq("user_id", payload.u)
      .gte("created_at", new Date(payload.y, 0, 1).toISOString())
      .lt("created_at", new Date(payload.y + 1, 0, 1).toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const displayName =
    profile?.username || profile?.name?.split(/\s+/)[0] || null;

  return (
    <WrappedShareView
      year={payload.y}
      displayName={displayName}
      recs={(recs as SharedRec[] | null) ?? []}
    />
  );
}

/** Per-route metadata — keeps the share preview clean even though the
 *  page itself is essentially public Year-in-Review content. */
export async function generateMetadata({
  params,
}: WrappedSharePageProps): Promise<Metadata> {
  const { token } = await params;
  let payload: ReturnType<typeof verifyShareToken>;
  try {
    payload = verifyShareToken(token);
  } catch {
    payload = null;
  }
  if (!payload) {
    return { title: "Year in Review — Smart Advisor" };
  }
  return {
    title: `Year in Review · ${payload.y} — Smart Advisor`,
    description: `A look at one Smart Advisor user's ${payload.y} picks.`,
    robots: "noindex, nofollow",
  };
}
