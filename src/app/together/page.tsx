import type { Metadata } from 'next';
import Link from 'next/link';
import { TINT_BG, packTheme } from '@/components/art/themes';
import { questionsIn } from '@/lib/questions/packs';
import { togetherPacks } from '@/lib/together/deck';

export const metadata: Metadata = {
  title: 'Play together',
  description: 'Questions for couples to play on one phone tonight. Pick a pack, read a card out loud, both answer.',
};

export default function TogetherPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-display display">
          Together, <em>on one phone.</em>
        </h1>
        <p className="text-secondary">Pick a pack, read each card out loud and both answer. Free, nothing to sign up for.</p>
      </div>
      <ul className="flex flex-col gap-2">
        {togetherPacks().map((pack) => {
          const theme = packTheme(pack.id);
          const Icon = theme.icon;
          return (
            <li key={pack.id}>
              <Link href={`/together/${pack.id}`} className="option items-start gap-3">
                <span className={`${TINT_BG[theme.tint]} size-11 rounded-full grid place-items-center shrink-0`} aria-hidden="true">
                  <Icon className="size-5" />
                </span>
                <span className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>{pack.title}</span>
                    <span className="text-caption text-muted font-normal num">{questionsIn(pack.id).length} cards</span>
                  </span>
                  <span className="text-body text-secondary font-normal">{pack.blurb}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
