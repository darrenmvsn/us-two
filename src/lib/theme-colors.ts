/**
 * The page colour as a literal, for the places that cannot read a CSS
 * variable: the browser's theme colour and the install manifest. Must equal
 * `--background` in globals.css (checked by design-system.test.ts).
 */
/* eslint-disable no-restricted-syntax -- these two literals are the one sanctioned copy of --background */
export const PAGE_COLOUR = { light: '#faf7f2', dark: '#141211' } as const;
/* eslint-enable no-restricted-syntax */
