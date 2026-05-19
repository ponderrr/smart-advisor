import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Advisor",
  description: "Redirecting to your feed.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
