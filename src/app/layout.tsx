import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Smart Advisor — AI Movie & Book Recommendations",
  description:
    "Answer a short personality quiz and get a movie or book recommendation tailored specifically to you — powered by Claude AI.",
  keywords:
    "movie recommendations, book recommendations, AI recommendations, personalized picks, what to watch, what to read",
  authors: [{ name: "Smart Advisor" }],
  openGraph: {
    type: "website",
    url: "https://smartadvisor.live/",
    title: "Smart Advisor — AI Movie & Book Recommendations",
    description:
      "Answer a short personality quiz and get a movie or book recommendation tailored specifically to you — powered by Claude AI.",
    images: ["https://smartadvisor.live/images/smart-advisor-preview.png"],
    siteName: "Smart Advisor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Advisor — AI Movie & Book Recommendations",
    description:
      "Answer a short personality quiz and get a movie or book recommendation tailored specifically to you — powered by Claude AI.",
    images: ["https://smartadvisor.live/images/smart-advisor-preview.png"],
  },
  metadataBase: new URL("https://smartadvisor.live"),
  alternates: { canonical: "/" },
  robots: "index, follow",
  icons: {
    icon: { url: "/svgs/smartadvisor/SmartAdvisor.svg", type: "image/svg+xml" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
