import type { Metadata } from 'next';
import { Fraunces, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/components/Web3Provider';
import { Navbar } from '@/components/Navbar';
import { ToastContainer } from '@/components/ToastContainer';
import { WrongNetwork } from '@/components/WrongNetwork';
import { ThemeProvider } from '@/components/ThemeProvider';
import { MobileBottomNav } from '@/components/MobileBottomNav';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-ui',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Bhishi.eth — Community Savings on Chain',
  description: 'Trustless chit-fund circles on Ethereum. No organizer needed. Your Trust Score, on-chain.',
  keywords: ['bhishi', 'chit fund', 'ethereum', 'defi', 'savings', 'web3'],
  openGraph: {
    title: 'Bhishi.eth',
    description: 'Trustless chit-fund circles on Ethereum',
    type: 'website',
  },
};

import { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen antialiased font-ui" suppressHydrationWarning>
        <Web3Provider>
          <ThemeProvider>
            <WrongNetwork />
            <Suspense fallback={<div className="h-16 border-b-2 border-border bg-surface" />}>
              <Navbar />
            </Suspense>
            <main>{children}</main>
            <Suspense fallback={null}>
              <MobileBottomNav />
            </Suspense>
            <ToastContainer />
          </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
