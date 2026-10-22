import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGE_COLOUR } from '@/lib/theme-colors';

/**
 * Holds DESIGN.md (the contract) and globals.css (the values) to one set of
 * tokens, light and dark, and keeps retired patterns out of components.
 * Ported from Moatlab's test of the same name.
 */
const ROOT = path.resolve(import.meta.dirname, '../..');
const designDoc = readFileSync(path.join(ROOT, 'DESIGN.md'), 'utf8');
const css = readFileSync(path.join(ROOT, 'src/app/globals.css'), 'utf8');

function hexTokens(block: string): Map<string, string> {
  return new Map([...block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1], m[2]]));
}

function rootBlock(from: number): string {
  const start = css.indexOf(':root {', from);
  return css.slice(start, css.indexOf('}', start));
}

const light = hexTokens(rootBlock(0));
const dark = hexTokens(rootBlock(css.indexOf('@media (prefers-color-scheme: dark)')));
const documented = new Map(
  [...designDoc.matchAll(/^\| `(--[a-z0-9-]+)` \| `(#[0-9a-f]{6})` \| `(#[0-9a-f]{6})` \|/gm)].map((m) => [m[1], { light: m[2], dark: m[3] }]),
);

function sources(dir: string): { file: string; source: string }[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sources(full);
    if (!entry.endsWith('.tsx') || entry.endsWith('.test.tsx')) return [];
    return [{ file: path.relative(ROOT, full), source: readFileSync(full, 'utf8') }];
  });
}

describe('design tokens', () => {
  it('finds tokens on every side', () => {
    expect(light.size).toBeGreaterThan(15);
    expect(dark.size).toBe(light.size);
    expect(documented.size).toBe(light.size);
  });

  it('keeps the literal page colour for the browser chrome in step with --background', () => {
    expect(PAGE_COLOUR).toEqual({ light: light.get('--background'), dark: dark.get('--background') });
  });

  it('documents every token with the same light and dark values', () => {
    for (const [name, value] of light) {
      expect(documented.get(name), name).toEqual({ light: value, dark: dark.get(name) });
    }
  });
});

describe('retired patterns stay retired', () => {
  const files = sources(path.join(ROOT, 'src'));
  const RETIRED: { pattern: RegExp; why: string }[] = [
    { pattern: /backdrop-blur|bg-gradient-to-|bg-linear-to-/, why: 'surfaces are flat' },
    { pattern: /uppercase tracking-/, why: 'labels are sentence case (.eyebrow)' },
    { pattern: /className="[^"]*\bpanel\b[^"]*"[\s\S]{0,400}className="[^"]*\bpanel\b/, why: 'no panel directly inside a panel' },
    { pattern: /<select\b/, why: 'no native dropdown pickers (.option rows)' },
    { pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, why: 'icons are lucide-react, never emoji' },
  ];

  it('scans the component tree', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const { pattern, why } of RETIRED) {
    it(`has no ${pattern} (${why})`, () => {
      const offenders = files.filter(({ source }) => pattern.test(source)).map(({ file }) => file);
      expect(offenders).toEqual([]);
    });
  }
});
