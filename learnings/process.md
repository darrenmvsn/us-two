# Process

- **2026-10-22** Put component classes in `@layer components`: unlayered CSS beats Tailwind's layered utilities, so `.option`'s font size and alignment silently overrode `text-heading text-center` on the This or that buttons. Evidence: `src/app/globals.css`. Tags: `css`
- **2026-10-22** A new dynamic route fails `tsc` on `PageProps<'/…/[id]'>` until the route types exist; run `npx next typegen` before type-checking. Evidence: `src/app/us/this-or-that/[duelId]/page.tsx`. Tags: `next`
- **2026-10-22** `npm install` needs the repo's `.npmrc` (`legacy-peer-deps=true`), as in Moatlab. Tags: `npm`
- **2026-10-22** ImageMagick here has no SVG delegate (`rsvg-convert` missing); draw PNG icons with Pillow instead. Tags: `tooling`
