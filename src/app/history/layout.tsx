import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History — Smart Advisor",
  description: "Your saved Smart Advisor recommendations.",
  robots: { index: false, follow: false },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
