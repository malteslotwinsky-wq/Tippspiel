import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

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
  themeColor: '#f8fafc',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Navigation />
        <main className="container-app page-wrapper">
          {children}
        </main>
      </body>
    </html>
  );
}
