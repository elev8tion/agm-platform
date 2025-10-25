import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Agentic Marketing Dashboard',
    template: '%s | Agentic Marketing Dashboard',
  },
  description: 'AI-powered marketing command center with autonomous agents',
  keywords: ['AI', 'Marketing', 'Automation', 'Agents', 'CRM'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Agentic Marketing Dashboard',
    description: 'AI-powered marketing command center with autonomous agents',
    siteName: 'Agentic Marketing Dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentic Marketing Dashboard',
    description: 'AI-powered marketing command center with autonomous agents',
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
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={cn('min-h-screen bg-slate-950 font-sans antialiased', inter.variable)}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
