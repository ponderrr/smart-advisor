import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import Providers from "./providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    // "default" keeps content below the iOS status bar in standalone mode.
    // "black-translucent" would render the fixed top navbar under the
    // clock/battery since the app has no app-wide safe-area-inset-top.
    statusBarStyle: "default",
    title: "Smart Advisor",
  },
  icons: {
    icon: { url: "/svgs/smartadvisor/SmartAdvisor.svg", type: "image/svg+xml" },
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      className={inter.variable}
      suppressHydrationWarning
      // Opt-in attribute Next 15+ wants when `scroll-behavior: smooth`
      // is set globally (see globals.css). Without it, Next emits a
      // warning about smooth-scroll during route transitions.
      data-scroll-behavior="smooth"
    >
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <ServiceWorkerRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
