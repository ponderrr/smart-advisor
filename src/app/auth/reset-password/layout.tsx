import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password — Smart Advisor",
  description: "Reset your Smart Advisor account password.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
