import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Smart Advisor",
  description: "Manage your Smart Advisor account settings.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
