import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In or Create Account — Smart Advisor",
  description:
    "Sign in or create a free Smart Advisor account to save your personalized movie and book picks.",
  alternates: { canonical: "/auth" },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
