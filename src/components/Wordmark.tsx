import Link from 'next/link';
import { APP_NAME } from '@/lib/brand';
import { HEART_PATH } from './art/heart-path';

/** Two hearts leaning on each other, ink and rose, and the name in the display face. */
export function Wordmark({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-heading text-foreground display">
      <WordmarkHearts />
      {APP_NAME}
    </Link>
  );
}

export function WordmarkHearts({ className = 'w-9 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={className} aria-hidden="true">
      <path d={HEART_PATH} fill="none" stroke="var(--foreground)" strokeWidth="2.4" transform="translate(1 0)" />
      <path d={HEART_PATH} fill="var(--accent)" stroke="var(--foreground)" strokeWidth="2.4" transform="translate(12 1)" />
    </svg>
  );
}
