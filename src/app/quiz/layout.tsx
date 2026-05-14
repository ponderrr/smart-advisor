import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz — Smart Advisor",
  description: "Pick a format, choose the depth, and answer a short quiz.",
  robots: { index: false, follow: false },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
