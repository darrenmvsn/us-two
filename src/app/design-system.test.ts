import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARD_COLOUR, PAGE_COLOUR } from '@/lib/theme-colors';

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

  it('draws share cards in the light tokens', () => {
    const kebab = (name: string) => `--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
    const mixOnSurface = (token: string) => {
      // color-mix(in srgb, var(--token) 12%, var(--surface)), per channel.
      const [a, b] = [light.get(token)!, light.get('--surface')!].map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
      return `#${a!.map((c, i) => Math.round(c * 0.12 + b![i]! * 0.88).toString(16).padStart(2, '0')).join('')}`;
    };
    for (const [name, value] of Object.entries(CARD_COLOUR)) {
      const expected = name.endsWith('Soft') ? mixOnSurface(kebab(name.slice(0, -4))) : light.get(kebab(name));
      expect(value, name).toBe(expected);
    }
  });

  it('documents every token with the same light and dark values', () => {
    for (const [name, value] of light) {
      expect(documented.get(name), name).toEqual({ light: value, dark: dark.get(name) });
    }
  });
});

/** Non-colour tokens (motion, radius) as `name -> value`, from globals.css and from DESIGN.md's tables. */
function scaleTokens(source: string, pattern: RegExp): Map<string, string> {
  return new Map([...source.matchAll(pattern)].map((m) => [m[1]!, m[2]!.trim()]));
}

const SCALE_PREFIX = '(--(?:dur|ease|loop|radius)-[a-z-]+)';
const scaleInCss = scaleTokens(css, new RegExp(`${SCALE_PREFIX}:\\s*([^;]+);`, 'g'));
const scaleInDoc = scaleTokens(designDoc, new RegExp(`^\\| \`${SCALE_PREFIX}\` \\| \`([^\`]+)\` \\|`, 'gm'));
const componentsLayer = css.slice(css.indexOf('@layer components {'));

describe('motion and radius tokens', () => {
  it('documents every motion and radius token with the same value', () => {
    expect(scaleInCss.size).toBeGreaterThan(15);
    expect(Object.fromEntries(scaleInDoc)).toEqual(Object.fromEntries(scaleInCss));
  });

  it('takes every component timing from a token, never a literal', () => {
    const withoutVars = componentsLayer.replace(/var\([^)]*\)/g, '');
    expect(withoutVars.match(/(?<![\w.-])\d+(?:\.\d+)?m?s\b|cubic-bezier\(/g) ?? []).toEqual([]);
  });
});

describe('component classes', () => {
  const defined = new Set([...componentsLayer.matchAll(/^\.([a-z][a-z0-9-]*)[\s,:[{]/gm)].map((m) => m[1]!));
  const documented = new Set([...designDoc.matchAll(/`\.([a-z][a-z0-9-]*)`/g)].map((m) => m[1]!));

  it('documents every component class in DESIGN.md', () => {
    expect(defined.size).toBeGreaterThan(20);
    expect([...defined].filter((name) => !documented.has(name))).toEqual([]);
  });
});

describe('app icon', () => {
  it('draws only with the light page, ink and rose', () => {
    const icon = readFileSync(path.join(ROOT, 'src/app/icon.svg'), 'utf8');
    const used = new Set(icon.match(/#[0-9a-f]{6}/gi)?.map((c) => c.toLowerCase()));
    const allowed = new Set(['--background', '--foreground', '--accent'].map((t) => light.get(t)));
    expect([...used].filter((c) => !allowed.has(c))).toEqual([]);
  });
});

describe('retired patterns stay retired', () => {
  const files = sources(path.join(ROOT, 'src'));
  const RETIRED: { pattern: RegExp; why: string }[] = [
    { pattern: /backdrop-blur|bg-gradient-to-|bg-linear-to-/, why: 'surfaces are flat' },
    { pattern: /uppercase tracking-/, why: 'labels are sentence case (.eyebrow)' },
    { pattern: /className="[^"]*\bpanel\b[^"]*"[\s\S]{0,400}className="[^"]*\bpanel\b/, why: 'no panel directly inside a panel' },
    { pattern: /<select\b/, why: 'no native dropdown pickers (.option rows)' },
    { pattern: /\brounded-(?:sm|md|lg|xl|2xl|3xl)\b/, why: 'radii come from the scale (rounded-control, rounded-panel, rounded-full)' },
    { pattern: /@keyframes/, why: 'keyframes live in globals.css; components use the .anim-* classes' },
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
