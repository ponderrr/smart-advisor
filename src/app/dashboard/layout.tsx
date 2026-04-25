import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Smart Advisor",
  description: "Your Smart Advisor dashboard.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
