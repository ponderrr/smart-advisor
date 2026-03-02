import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Smart Advisor — AI Movie & Book Recommendations',
  description: 'Answer a short personality quiz and get a movie or book recommendation tailored specifically to you — powered by Claude AI.',
  keywords: 'movie recommendations, book recommendations, AI recommendations, personalized picks, what to watch, what to read',
  authors: [{ name: 'Smart Advisor' }],
  openGraph: {
    type: 'website',
    url: 'https://smartadvisor.live/',
    title: 'Smart Advisor — AI Movie & Book Recommendations',
    description: 'Answer a short personality quiz and get a movie or book recommendation tailored specifically to you — powered by Claude AI.',
    images: ['https://smartadvisor.live/smart-advisor-preview.png'],
    siteName: 'Smart Advisor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Advisor — AI Movie & Book Recommendations',
    description: 'Answer a short personality quiz and get a movie or book recommendation tailored specifically to you — powered by Claude AI.',
    images: ['https://smartadvisor.live/smart-advisor-preview.png'],
  },
  robots: 'index, follow',
  icons: {
    icon: '/smartadvisor.svg',
    apple: '/smartadvisor.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
