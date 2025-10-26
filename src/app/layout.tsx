import type {Metadata, Viewport} from 'next';
import {cn} from '@/lib/utils';
import {ThemeProvider} from '@/components/layout/ThemeProvider';
import {ClientLayout} from '@/components/layout/ClientLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoinKeeper',
  description:
    'A personal finance management application that runs entirely in your browser.',
  openGraph: {
    title: 'CoinKeeper',
    description: 'Manage Your Finances, Entirely Yours.',
    url: 'https://coinkeeper.rendzzx.com',
    siteName: 'coinkeeper',
    images: [
      {
        url: '/banner/banner.png',
        width: 1920,
        height: 1080,
        alt: 'CoinKeeper Banner',
      },
    ],
    locale: 'en-US',
    type: 'website',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#2D6373',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className={cn('font-body antialiased min-h-screen bg-background')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
