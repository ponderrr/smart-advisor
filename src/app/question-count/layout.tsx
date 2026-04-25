import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Length — Smart Advisor",
  description: "Choose how deep you want your recommendation quiz to go.",
  robots: { index: false, follow: false },
};

export default function QuestionCountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
