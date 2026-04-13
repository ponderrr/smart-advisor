import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Try the Demo — Smart Advisor",
  description:
    "Take a short quiz and preview how Smart Advisor picks a movie or book tailored to you — no account required.",
  alternates: { canonical: "/demo" },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
