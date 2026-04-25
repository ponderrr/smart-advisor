import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account — Smart Advisor",
  description: "Manage your Smart Advisor account security and settings.",
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
