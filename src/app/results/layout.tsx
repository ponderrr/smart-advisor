import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Picks — Smart Advisor",
  description: "Personalized movie and book recommendations from Smart Advisor.",
  robots: { index: false, follow: false },
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
