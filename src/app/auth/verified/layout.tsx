import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Verified — Smart Advisor",
  description: "Your Smart Advisor email has been verified.",
  robots: { index: false, follow: false },
};

export default function VerifiedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
