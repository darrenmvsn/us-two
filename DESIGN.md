# DESIGN.md

Us Two's design contract. Every colour, size and component on screen comes
from here; `src/app/globals.css` holds the values and
`src/app/design-system.test.ts` fails when the two drift or a retired pattern
comes back. Change a token here and in `globals.css` in the same commit.

## The idea

**A love note passed between two people.** Blush paper, plum ink, one rose,
and a colour for each of you: rose is you, violet is them, everywhere (avatars,
answer bubbles, the hero art). It should feel made for a couple, playful and a
little romantic, never like a form. It follows the house rules shared with
Viralab, DesignLoop and Moatlab:

1. **Colour means something.** Rose (`accent`) is "act here / selected /
   focus": the one primary button, a picked option, the open tab. Green
   (`match`) means only "you matched" or "guessed right". A miss is plain
   muted text, never red: a different answer is not a failure.
2. **Flat, one surface per region.** No stacked or nested cards: a region is
   one `.panel`, and sections inside it are separated by hairlines
   (`.divide-rows`) or borderless tinted `.bubble`s. No glows, glass,
   gradients or blur. Icons are lucide-react, never emoji; pictures are our
   own inline SVG in `src/components/art/` (outlined in ink, filled with
   tokens), so they follow light and dark mode.
3. **Tints are decoration.** The six `--tint-*` colours fill art, set and pack
   tiles and chips. They never mean "selected" or "matched", and text on them
   is `foreground`.
4. **Phone first.** Us Two is played on phones; design at 390 px (and check
   360 px) before anything wider. Main actions are full width and pinned
   within thumb reach (`.btn-block`, `.thumb-bar`); This or that picks by tap
   or by swiping towards a side; hover styles only apply on devices that
   hover; headers respect the notch (`env(safe-area-inset-top)`).
5. **Thumb-sized.** Buttons, inputs and tabs are 44 px (36 px small), options
   48 px. One primary (rose) button per region.
6. **Navigation**: left-hand tabs (`.side-tab`) on wide screens; on phones
   the same links in one bar at the bottom (`.tab-bar-item`). Never a second
   bar under the header. No native dropdown pickers: choices are `.option`
   rows.
7. **Plain words.** Sentence case, no jargon, no operator copy. Say what
   happens ("They'll see it once they've answered too"), not how it works.
8. **Motion is a reward, and optional.** Answers flip in at a reveal, a match
   bursts hearts (canvas-confetti, once per reveal), picks pop, the streak
   flame beats. Every `.anim-*` class and the burst switch off under
   `prefers-reduced-motion`. A pick also buzzes once on phones that allow it.

## Type

Two faces. Headings use **Fraunces** (SIL OFL 1.1) with its soft axis on, via
the `.display` class; `<em>` inside a `.display` heading is the rose italic,
for one or two words that carry the feeling ("just for *the two of you*"). It
is bundled from `@fontsource-variable/fraunces`, never fetched from a CDN.
Everything else is Apple's system font, SF Pro, from the `--font-sans` stack;
counts that line up use its tabular figures (`.num`), never a monospace face.
Body weights 400, 500 and 600 only. Eight steps: `text-meta` 12, `text-caption`
13, `text-body` 15, `text-lead` 17, `text-heading` 20, `text-display` 28,
`text-hero` 40, `text-hero-lg` 56, each with its own leading. ESLint refuses
any other size and any raw colour in `src/`. Inputs are 16 px so iOS does not
zoom into them.

## Token reference

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#fff7f4` | `#1a1216` | The page |
| `--surface` | `#ffffff` | `#24191e` | The one panel per region, inputs, options |
| `--surface-raised` | `#fdeee9` | `#2e2127` | Hover, quiet fills, chips |
| `--surface-strong` | `#f8dfd8` | `#3a2a31` | Progress track, empty dots |
| `--edge-soft` | `#f8e7e1` | `#2f2228` | Hairlines inside a panel |
| `--edge` | `#efd6ce` | `#3e2d34` | Panel, input and option border |
| `--edge-strong` | `#dcb9ae` | `#5a4450` | Hovered border, an empty heart |
| `--foreground` | `#2a1a20` | `#fbeff2` | Headings, answers, the ink outline on art |
| `--secondary` | `#4d3a40` | `#e2cfd5` | Body copy |
| `--muted` | `#6b555c` | `#bda5ad` | Supporting copy, labels |
| `--subtle` | `#7a6369` | `#ab929b` | Placeholders, hints |
| `--disabled` | `#b9a39f` | `#6a5560` | Inactive controls only |
| `--accent` | `#c92a5a` | `#ff6f98` | Primary button, picked option, focus, hearts: act or selected only |
| `--accent-hover` | `#b0244f` | `#ff8fb0` | Accent hover, the primary button's pressed edge |
| `--accent-text` | `#b0244f` | `#ff8fb0` | Links, the open tab, `.display em` |
| `--on-accent` | `#ffffff` | `#2a0a15` | Text on accent |
| `--on-ink` | `#ffffff` | `#1a1216` | Text on an ink fill |
| `--match` | `#1c7a50` | `#48c28a` | You matched, guessed right (fills, icons) |
| `--match-text` | `#16663f` | `#6fd6a4` | The same, as words |
| `--you` | `#d93d6b` | `#ff6f98` | The viewer: their avatar and answer bubble (`--you-soft`) |
| `--them` | `#7356d0` | `#a991ff` | The partner: their avatar and answer bubble (`--them-soft`) |
| `--on-person` | `#ffffff` | `#1a1216` | The initial on an avatar |
| `--tint-blush` | `#ffdbe4` | `#4a2532` | Decoration: art, tiles, chips |
| `--tint-lilac` | `#e7e0ff` | `#352a5c` | Decoration |
| `--tint-butter` | `#ffeab0` | `#4a3a1a` | Decoration, sparkles, the streak chip |
| `--tint-mint` | `#d3f0e0` | `#1f3d31` | Decoration |
| `--tint-peach` | `#ffdcc8` | `#4a2e22` | Decoration |
| `--tint-sky` | `#d7e9ff` | `#1f3047` | Decoration |

Every text token passes WCAG AA (4.5:1) on both `--background` and
`--surface` in its mode, and `foreground`, `secondary` and `muted` pass on
every tint. Initials on `--you` (4.35:1) are large bold type, so AA large (3:1)
applies.

## Components

| Class | Use |
|---|---|
| `.panel` | The one surface of a region (`--radius-panel`, hairline border) |
| `.bubble`, `.bubble-you` / `.bubble-them` | A borderless tinted fill inside a panel: an answer in a reveal |
| `.tile` | A big tinted tap target: a This or that side, a set to play |
| `.display` | A heading in Fraunces; `em` inside is the rose italic |
| `.option-heart` | The heart in an `.option` that fills when picked |
| `.anim-rise` | Enters by rising and fading in; stagger a list with `--delay` |
| `.anim-pop` | Springs in from small: a stamp, a chip, a score |
| `.anim-flip` | Turns in like a card: the answers at a reveal |
| `.anim-slide-in` | Slides in from the right: the next This or that pair |
| `.anim-picked` | A quick bounce on the side just picked |
| `.anim-float` | Ambient: art bobbing gently |
| `.anim-beat` | Ambient: a heart beating |
| `.anim-wiggle` | Ambient: the sealed envelope wiggling now and then |
| `.anim-drift` | Ambient: small hearts drifting up |
| `.anim-bob` | Ambient: the "still answering" dots |
| `.divide-rows` | Hairlines between sections or rows inside a panel |
| `.btn` + `.btn-primary` / `.btn-outline` / `.btn-ghost`, `.btn-sm` | Buttons: pills that sink a little when pressed |
| `.btn-block` | A screen's main action: full width and 52 px on phones, normal from 640 px |
| `.thumb-bar` | Wraps a form's main action so it stays pinned above the phone tab bar while the form is on screen |
| `.input`, `.textarea` | Text fields, 16 px type |
| `.option` | A choice: `role="radio"` + `aria-checked`, or a toggle with `aria-pressed` |
| `.chip`, `.chip-match` | Small labels: the streak, "Matched" |
| `.link` | An inline text link, rose and bold |
| `.eyebrow` | Small sentence-case label above a heading |
| `.side-tab` | Left-hand tab; `aria-current="page"` marks this page |
| `.tab-bar-item`, `.tab-bar-icon` | A phone tab in the bottom bar; the open one's icon sits in a rose pill |
| `.skeleton` | Loading placeholder |
| `.num` | Tabular figures for counts |

## Radius

| Token | Value | Use |
|---|---|---|
| `--radius-tail` | `6px` | The corner of an answer bubble nearest its avatar |
| `--radius-control` | `14px` | Inputs, options, small icon tiles (`rounded-control`) |
| `--radius-bubble` | `18px` | Answer bubbles |
| `--radius-panel` | `22px` | Panels and big tiles (`rounded-panel`) |
| `--radius-pill` | `9999px` | Buttons, chips, tabs, avatars |

Tailwind's own `rounded-sm` to `rounded-3xl` are off the scale; use the
token utilities above or `rounded-full`.

## Motion

Every transition and animation in `globals.css` takes its timing from these
tokens; a literal `ms` or `cubic-bezier()` there fails the design test.

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | `120ms` | Colour and press feedback |
| `--dur-base` | `160ms` | A control changing size or fill |
| `--dur-press` | `300ms` | The bounce on a This or that pick |
| `--dur-pop` | `320ms` | A heart filling, the open tab's pill |
| `--dur-slide` | `360ms` | The next This or that pair sliding in |
| `--dur-enter` | `420ms` | Panels and chips entering |
| `--dur-flip` | `560ms` | Answers flipping in at a reveal |
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entering and sliding: fast start, gentle stop |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Pops: a small overshoot that reads as joy |
| `--loop-bob` | `1s` | Ambient loop: answering dots |
| `--loop-pulse` | `1.4s` | Ambient loop: loading skeleton |
| `--loop-beat` | `1.6s` | Ambient loop: beating heart |
| `--loop-wiggle` | `2.8s` | Ambient loop: envelope wiggle |
| `--loop-float` | `4s` | Ambient loop: floating art |
| `--loop-drift` | `7s` | Ambient loop: drifting hearts |

Rules: a one-off reward (reveal, match, pick) may move; reading text never
does. Every `.anim-*` class switches off under `prefers-reduced-motion`, and
script motion (`HeartBurst`, `CountUp`, haptics) checks it too. A drag that
follows the finger (the This or that swipe) is direct manipulation, not
animation, and stays on.

## Illustrations and brand assets

Pictures are inline SVG React components in `src/components/art/`, drawn
for Us Two. Before drawing a new one, reuse what is there:

| Asset | File | Use |
|---|---|---|
| The heart | `heart-path.ts` (`HEART_PATH`, 24 x 24) | Every heart: logo, progress, burst, score |
| Two hearts mark | `../Wordmark.tsx` (`WordmarkHearts`) | Logo; the app icon is the same drawing |
| Avatars | `Avatar.tsx` (`Avatar`, `CouplePair`, `EmptySeat`) | A person is always their initial in their colour |
| Sparkle | `Sparkle.tsx` | Butter four-point star, the one decoration |
| Scenes | `HeroArt.tsx`, `SealedNote.tsx`, `InviteArt.tsx` | Landing and join; waiting; invite |
| Ambient | `FloatingHearts.tsx`, `HeartBurst.tsx`, `CountUp.tsx` | Decoration and rewards |
| Set and pack pictures | `themes.ts` (`setTheme`, `packTheme`) | A lucide icon on a tint per set and pack; add a row for each new one |

Drawing rules, so a new picture matches:

1. **Ink outline, token fills.** Outlines are `var(--foreground)` at 3 px
   (2 to 2.5 px on small details), round joins. Fills are tokens only
   (`var(--surface)`, `var(--tint-*)`, `var(--you)`, `var(--them)`,
   `var(--accent)`), never hex, so dark mode works with no extra code.
2. **Flat.** No gradients, shadows or blur; one soft ground shape
   (`--surface-strong` ellipse or a `--tint-blush` blob) at most.
3. **Rose is you, violet is them**, inside pictures too.
4. **Decoration is hidden from screen readers** (`aria-hidden="true"`); a
   picture that carries meaning gets `role="img"` and an `aria-label`.
5. **Motion through the classes** (`anim-float`, `anim-beat`), never a new
   keyframe inside a component.

Brand files: `src/app/icon.svg` is the source of the app icon. The PNGs
(`public/icon-192.png`, `public/icon-512.png`, `src/app/apple-icon.png`) are
generated from it with `npm run icons`; never edit them by hand. The icon's
three colours are the light `--background`, `--foreground` and `--accent`
(checked by the design test). Photos and stock images are not used.

## Voice

Warm, short, second person. "Your turn", "Waiting for Sam", "You matched".
Headings can be a little romantic ("Our story so far", "Start yours
*tonight*"). Never "user", "submit", "session" or "data" on a screen; never a sentence a
developer would write ("No API key configured"). No competitor names.
