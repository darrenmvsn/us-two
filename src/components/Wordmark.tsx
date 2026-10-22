import Link from 'next/link';
import { APP_NAME } from '@/lib/brand';

/** Two overlapping rings and the name. The rings use the ink and the rose, nothing else. */
export function Wordmark({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold text-lead text-foreground">
      <svg width="28" height="20" viewBox="0 0 28 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="var(--foreground)" strokeWidth="2.5" />
        <circle cx="18" cy="10" r="8" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      </svg>
      {APP_NAME}
    </Link>
  );
}
