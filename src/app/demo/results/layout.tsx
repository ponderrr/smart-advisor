import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Demo Picks — Smart Advisor",
  description:
    "See the movie or book Smart Advisor picked for you based on a short demo quiz.",
  robots: { index: false, follow: true },
};

export default function DemoResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
