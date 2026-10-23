import Link from 'next/link';
import { APP_NAME } from '@/lib/brand';

export function SiteFooter() {
  return (
    <footer className="border-t border-edge-soft">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-caption text-muted">
        <p>{APP_NAME} keeps your first names and your answers, and nothing else.</p>
        <Link href="/privacy" className="link">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
