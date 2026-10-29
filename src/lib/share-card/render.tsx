import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import type { CSSProperties, ReactElement } from 'react';
import { HEART_PATH } from '@/components/art/heart-path';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';
import { CARD_COLOUR as C } from '@/lib/theme-colors';
import type { CardBubble, CardContent, DuelCardContent, RoundCardContent } from './card-content';

/**
 * Draws a share card: a 1080 x 1920 PNG, the size of a phone story, in the
 * app's light palette. Fraunces for headings, Inter for labels (both SIL OFL,
 * in `assets/fonts`). The top and bottom 220 px carry nothing important, as a
 * story app lays its own controls there.
 */

export const CARD_SIZE = { width: 1080, height: 1920 } as const;

const FONT_DIR = path.join(process.cwd(), 'assets/fonts');

let fonts: Promise<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts']> | null = null;

function loadFonts() {
  fonts ??= Promise.all([
    readFile(path.join(FONT_DIR, 'fraunces-latin-600-normal.woff')),
    readFile(path.join(FONT_DIR, 'inter-latin-500-normal.woff')),
    readFile(path.join(FONT_DIR, 'inter-latin-600-normal.woff')),
  ]).then(([fraunces, inter500, inter600]) => [
    { name: 'Fraunces', data: fraunces, weight: 600 as const, style: 'normal' as const },
    { name: 'Inter', data: inter500, weight: 500 as const, style: 'normal' as const },
    { name: 'Inter', data: inter600, weight: 600 as const, style: 'normal' as const },
  ]);
  return fonts;
}

const display: CSSProperties = { fontFamily: 'Fraunces', fontWeight: 600, color: C.foreground };
const label: CSSProperties = { fontFamily: 'Inter', fontWeight: 500, color: C.muted };

function Heart({ size, fill, stroke }: { size: number; fill: string; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d={HEART_PATH} fill={fill} stroke={stroke ?? 'none'} strokeWidth={stroke ? 0.9 : 0} />
    </svg>
  );
}

function Avatar({ name, colour, size = 120 }: { name: string; colour: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: colour,
        border: `8px solid ${C.background}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter',
        fontWeight: 600,
        fontSize: size * 0.42,
        color: C.onPerson,
      }}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}

function Couple({ people }: { people: CardContent['people'] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Avatar name={people.me} colour={C.you} />
      <div style={{ display: 'flex', marginLeft: -24 }}>
        <Avatar name={people.partner} colour={C.them} />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width={96} height={64} viewBox="0 0 36 24">
          <path d={HEART_PATH} fill="none" stroke={C.foreground} strokeWidth="2.4" transform="translate(1 0)" />
          <path d={HEART_PATH} fill={C.accent} stroke={C.foreground} strokeWidth="2.4" transform="translate(12 1)" />
        </svg>
        <span style={{ ...display, fontSize: 64 }}>{APP_NAME}</span>
      </div>
      <span style={{ ...label, fontSize: 34 }}>{APP_TAGLINE}</span>
    </div>
  );
}

function DuelCard({ card }: { card: DuelCardContent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, textAlign: 'center' }}>
      <Couple people={card.people} />
      <span style={{ ...label, fontSize: 38 }}>{card.eyebrow}</span>
      <div style={{ display: 'flex', position: 'relative', width: 560, height: 520, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', position: 'absolute', top: -20, left: 0 }}>
          <Heart size={560} fill={C.accent} stroke={C.foreground} />
        </div>
        <span style={{ ...display, fontSize: 260, color: C.onAccent, marginTop: -40 }}>{String(card.matched)}</span>
      </div>
      <span style={{ ...display, fontSize: 76, lineHeight: 1.1, maxWidth: 880 }}>{card.headline}</span>
      <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 44, lineHeight: 1.3, color: C.secondary, maxWidth: 860 }}>{card.verdict}</span>
    </div>
  );
}

function Bubble({ bubble }: { bubble: CardBubble }) {
  const you = bubble.who === 'you';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, flexDirection: you ? 'row' : 'row-reverse', alignSelf: you ? 'flex-start' : 'flex-end', maxWidth: 840 }}>
      <Avatar name={bubble.name} colour={you ? C.you : C.them} size={104} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '36px 44px',
          background: you ? C.youSoft : C.themSoft,
          borderRadius: 48,
          borderBottomLeftRadius: you ? 14 : 48,
          borderBottomRightRadius: you ? 48 : 14,
        }}
      >
        <span style={{ ...label, fontSize: 34 }}>{bubble.label}</span>
        <span style={{ ...display, fontSize: 56, lineHeight: 1.2 }}>{bubble.text}</span>
      </div>
    </div>
  );
}

function RoundCard({ card }: { card: RoundCardContent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 56, width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, textAlign: 'center' }}>
        <Couple people={card.people} />
        <span style={{ ...label, fontSize: 38 }}>{card.eyebrow}</span>
        <span style={{ ...display, fontSize: 80, lineHeight: 1.1 }}>{card.prompt}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <Bubble bubble={card.bubbles[0]} />
        <Bubble bubble={card.bubbles[1]} />
      </div>
      {card.matched ? (
        <div
          style={{
            display: 'flex',
            alignSelf: 'center',
            alignItems: 'center',
            gap: 16,
            padding: '20px 40px',
            borderRadius: 100,
            background: C.surface,
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 40,
            color: C.matchText,
          }}
        >
          <Heart size={44} fill={C.accent} />
          Same answer
        </div>
      ) : null}
    </div>
  );
}

function Card({ card }: { card: CardContent }): ReactElement {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '240px 96px 220px',
        background: C.background,
      }}
    >
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
        {card.kind === 'duel' ? <DuelCard card={card} /> : <RoundCard card={card} />}
      </div>
      <Footer />
    </div>
  );
}

/** The card as a PNG response. Private: it carries both names. */
export async function renderShareCard(card: CardContent): Promise<Response> {
  return new ImageResponse(<Card card={card} />, {
    ...CARD_SIZE,
    fonts: await loadFonts(),
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
