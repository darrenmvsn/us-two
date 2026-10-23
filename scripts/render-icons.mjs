/**
 * Draws the app icon PNGs from src/app/icon.svg, the one source of the
 * icon (DESIGN.md § Illustrations and brand assets). Run `npm run icons`
 * after changing the SVG. Uses resvg (MPL-2.0) as an unmodified dependency.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ROOT = path.resolve(import.meta.dirname, '..');
const source = readFileSync(path.join(ROOT, 'src/app/icon.svg'), 'utf8');
// Home-screen icons are masked by the phone, so the PNGs drop the SVG's rounded corners.
const square = source.replace(/<rect([^>]*?)\srx="[^"]*"/, '<rect$1');

const OUTPUTS = [
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  { file: 'src/app/apple-icon.png', size: 180 },
];

for (const { file, size } of OUTPUTS) {
  const png = new Resvg(square, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(path.join(ROOT, file), png);
  console.log(`${file} (${size} px)`);
}
