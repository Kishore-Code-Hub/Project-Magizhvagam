import type { Metadata } from 'next';
import './globals.css';
import SmoothScroll from '@/components/animation/SmoothScroll';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import CustomCursor from '@/components/ui/CustomCursor';

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#050505] text-white">
        <ThemeProvider>
          <CustomCursor />
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
