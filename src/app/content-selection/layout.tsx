import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pick a Format — Smart Advisor",
  description: "Choose whether you want a movie, a book, or both.",
  robots: { index: false, follow: false },
};

export default function ContentSelectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
