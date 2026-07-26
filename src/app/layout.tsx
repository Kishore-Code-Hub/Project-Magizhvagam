import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import SmoothScroll from '@/components/animation/SmoothScroll';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import AtmosphereLayers from '@/components/animation/AtmosphereLayers';
import { BootProvider } from '@/providers/BootProvider';
import { AudioProvider } from '@/providers/AudioProvider';
import { FullscreenPWAControls } from '@/components/ui/FullscreenPWAControls';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  const realIp = headerList.get('x-real-ip');
  const userAgent = headerList.get('user-agent') || '';
  const host = headerList.get('host') || '';

  const clientIp = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : realIp || '192.168.56.103';

  const initialTelemetry = {
    ip: clientIp,
    userAgent,
    host,
  };

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
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} theme-cyber-green scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
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
      <body className="antialiased min-h-screen bg-[#050505] text-white relative font-sans">
        <AtmosphereLayers />
        <ThemeProvider>
          <AudioProvider>
            <BootProvider initialTelemetry={initialTelemetry}>
              <SmoothScroll>{children}</SmoothScroll>
              <FullscreenPWAControls />
            </BootProvider>
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

