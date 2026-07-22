import type { Metadata } from 'next';
import './globals.css';
import SmoothScroll from '@/components/animation/SmoothScroll';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'Soundkish | Cybersecurity Enthusiast & Full-Stack Engineer',
  description:
    "Official portfolio of Soundkish — CSE Student, Cybersecurity Enthusiast, and AI Full-Stack Developer specializing in secure system architecture, penetration testing, and modern web software.",
  keywords: [
    'Cybersecurity',
    'Soundkish',
    'Kishore',
    'Penetration Testing',
    'Ethical Hacking',
    'Full-Stack Developer',
    'FastAPI',
    'Next.js',
    'AI Developer',
  ],
  authors: [{ name: 'Soundkish' }],
  openGraph: {
    title: 'Soundkish | Cybersecurity Enthusiast & Full-Stack Engineer',
    description: 'Securing Systems. Building Trust.',
    type: 'website',
    url: 'https://soundkish.dev',
    siteName: 'Soundkish Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soundkish | Cybersecurity Enthusiast',
    description: 'Securing Systems. Building Trust.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Soundkish',
    jobTitle: 'Cybersecurity Enthusiast & Software Engineer',
    description: 'Securing Systems. Building Trust.',
    url: 'https://soundkish.dev',
    knowsAbout: ['Cybersecurity', 'Ethical Hacking', 'AI Systems', 'Full-Stack Web Development'],
  };

  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
