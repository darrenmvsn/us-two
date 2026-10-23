import type { Metadata, Viewport } from 'next';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';
import { PAGE_COLOUR } from '@/lib/theme-colors';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${APP_NAME}: questions for couples`, template: `%s · ${APP_NAME}` },
  description: `${APP_TAGLINE} Answer on your own phone, see theirs once you have both answered. Play This or that. No app to download.`,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: PAGE_COLOUR.light },
    { media: '(prefers-color-scheme: dark)', color: PAGE_COLOUR.dark },
  ],
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
