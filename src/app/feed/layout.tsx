import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed — Smart Advisor",
  description: "Picks, takes and group sessions from people you follow.",
  robots: { index: false, follow: false },
};

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
