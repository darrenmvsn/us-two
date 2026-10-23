# Process

- **2026-10-22** Put component classes in `@layer components`: unlayered CSS beats Tailwind's layered utilities, so `.option`'s font size and alignment silently overrode `text-heading text-center` on the This or that buttons. Evidence: `src/app/globals.css`. Tags: `css`
- **2026-10-22** A new dynamic route fails `tsc` on `PageProps<'/…/[id]'>` until the route types exist; run `npx next typegen` before type-checking. Evidence: `src/app/us/this-or-that/[duelId]/page.tsx`. Tags: `next`
- **2026-10-22** `npm install` needs the repo's `.npmrc` (`legacy-peer-deps=true`), as in Moatlab. Tags: `npm`
- **2026-10-22** ImageMagick here has no SVG delegate (`rsvg-convert` missing); draw PNG icons with Pillow instead. Tags: `tooling`
- **2026-10-23** `w-full box-content px-4` on a header made it 100% plus its padding and widened every phone page by 32 px. Put the safe-area padding on an outer element and the width and gutters on an inner one, and run the 360 px overflow check after any header change. Evidence: `src/app/page.tsx` header. Tags: `css`, `mobile`
- **2026-10-23** The design test only compared colour tokens, so motion timings, radii and a whole class (`.link`) drifted out of DESIGN.md unnoticed. It now diffs every `--dur-`/`--ease-`/`--loop-`/`--radius-` token and every component class against DESIGN.md; a check that cannot fail is not a check, so prove a new guard bites before trusting it. Evidence: `src/app/design-system.test.ts`. Tags: `design`, `tests`
