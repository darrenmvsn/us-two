/**
 * The page colour as a literal, for the places that cannot read a CSS
 * variable: the browser's theme colour and the install manifest. Must equal
 * `--background` in globals.css (checked by design-system.test.ts).
 */
/* eslint-disable no-restricted-syntax -- these literals are the one sanctioned copy of the tokens */
export const PAGE_COLOUR = { light: '#fff7f4', dark: '#1a1216' } as const;

/**
 * The light tokens a share card is drawn in: the card is a PNG, so it cannot
 * read CSS variables. Each equals its token in globals.css, and the two
 * `-soft` fills are `color-mix(… 12%, var(--surface))` worked out
 * (design-system.test.ts checks both).
 */
export const CARD_COLOUR = {
  background: '#fff7f4',
  surface: '#ffffff',
  foreground: '#2a1a20',
  secondary: '#4d3a40',
  muted: '#6b555c',
  accent: '#c92a5a',
  onAccent: '#ffffff',
  you: '#d93d6b',
  them: '#7356d0',
  onPerson: '#ffffff',
  youSoft: '#fae8ed',
  themSoft: '#eeebf9',
  matchText: '#16663f',
  tintBlush: '#ffdbe4',
  tintButter: '#ffeab0',
} as const;
/* eslint-enable no-restricted-syntax */
