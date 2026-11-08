import { ImageResponse } from 'next/og';
import type { CSSProperties } from 'react';
import type { Tint } from '@/components/art/themes';
import { CARD_COLOUR as C } from '@/lib/theme-colors';
import { CARD_FORMATS, type CardFormat, type TogetherCardContent } from '@/lib/together/card-content';
import { Footer, display, label, loadFonts } from './render';

/**
 * A slideshow card: a pack's cover or one question, drawn on the pack's tint
 * in the light palette. Story cards keep the top and bottom 220 px clear for
 * the platform's own controls, as the share cards do.
 */

const TINT: Record<Tint, string> = {
  blush: C.tintBlush,
  lilac: C.tintLilac,
  butter: C.tintButter,
  mint: C.tintMint,
  peach: C.tintPeach,
  sky: C.tintSky,
};

const chip: CSSProperties = {
  display: 'flex',
  padding: '18px 36px',
  borderRadius: 100,
  background: C.surface,
  fontFamily: 'Inter',
  fontWeight: 600,
  fontSize: 38,
  color: C.foreground,
};

// Satori lays a fragment's children out as a row; a column div keeps them stacked.
const column: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48, width: '100%' };

function promptSize(text: string, format: CardFormat): number {
  const base = format === 'story' ? 92 : 80;
  return text.length > 60 ? base - 16 : base;
}

function CardFace({ card, format }: { card: TogetherCardContent; format: CardFormat }) {
  const pad = format === 'story' ? '240px 80px 220px' : '96px 80px 88px';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: pad, background: C.background }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 48,
          padding: '64px 72px',
          marginBottom: 72,
          borderRadius: 64,
          background: TINT[card.tint],
          textAlign: 'center',
        }}
      >
        {card.kind === 'cover' ? (
          <div style={column}>
            <span style={{ ...label, fontSize: 40 }}>{`${card.count} questions`}</span>
            <span style={{ ...display, fontSize: format === 'story' ? 128 : 112, lineHeight: 1.05 }}>{card.packTitle}</span>
            <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 44, lineHeight: 1.3, color: C.secondary }}>Read one out. Both answer.</span>
          </div>
        ) : (
          <div style={column}>
            <span style={{ ...label, fontSize: 36 }}>{`${card.packTitle} · ${card.number} of ${card.total}`}</span>
            <span style={{ ...display, fontSize: promptSize(card.prompt, format), lineHeight: 1.12 }}>{card.prompt}</span>
            {card.options.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, maxWidth: 820 }}>
                {card.options.map((option) => (
                  <span key={option} style={chip}>
                    {option}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

/** The card as a PNG. Public and the same for everyone, so it caches for a day. */
export async function renderTogetherCard(card: TogetherCardContent, format: CardFormat): Promise<Response> {
  return new ImageResponse(<CardFace card={card} format={format} />, {
    ...CARD_FORMATS[format],
    fonts: await loadFonts(),
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
