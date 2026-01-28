import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tennis Tippspiel',
  description: 'Grand Slam Tippspiel für Tennis',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tennis Tippspiel',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={`${inter.className} antialiased`}>
        <Navigation />
        <main className="section page-container">
          {children}
        </main>
      </body>
    </html>
  );
}
