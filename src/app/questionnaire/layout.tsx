import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz — Smart Advisor",
  description: "Answer a short quiz so Smart Advisor can pick for you.",
  robots: { index: false, follow: false },
};

export default function QuestionnaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
