import type { Metadata } from 'next';
import './globals.css';
import SmoothScroll from '@/components/animation/SmoothScroll';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'Kishore | Cybersecurity Enthusiast & Full-Stack Engineer',
  description:
    'Official portfolio of Kishore — CSE Student, Cybersecurity Enthusiast, and AI Full-Stack Developer specializing in secure system architecture, penetration testing, and modern web software.',
  keywords: [
    'Cybersecurity',
    'Kishore',
    'Penetration Testing',
    'Ethical Hacking',
    'Full-Stack Developer',
    'Next.js',
    'AI Developer',
  ],
  authors: [{ name: 'Kishore' }],
  openGraph: {
    title: 'Kishore | Cybersecurity Enthusiast & Full-Stack Engineer',
    description: 'Securing Systems. Building Trust.',
    type: 'website',
    url: 'https://soundkish.dev',
    siteName: 'Kishore Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kishore | Cybersecurity Enthusiast',
    description: 'Securing Systems. Building Trust.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import AtmosphereLayers from '@/components/animation/AtmosphereLayers';
import { BootProvider } from '@/providers/BootProvider';
import { FullscreenPWAControls } from '@/components/ui/FullscreenPWAControls';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Kishore',
    jobTitle: 'Cybersecurity Enthusiast & Software Engineer',
    description: 'Securing Systems. Building Trust.',
    url: 'https://soundkish.dev',
    knowsAbout: ['Cybersecurity', 'Ethical Hacking', 'AI Systems', 'Full-Stack Web Development'],
  };

  return (
    <html lang="en" className="theme-cyber-green scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#050505" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#050505] text-white relative">
        <AtmosphereLayers />
        <ThemeProvider>
          <BootProvider>
            <SmoothScroll>{children}</SmoothScroll>
            <FullscreenPWAControls />
          </BootProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
