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
4. **Thumb-sized.** Buttons, inputs and tabs are 44 px (36 px small), options
   48 px. One primary (rose) button per region.
5. **Navigation**: left-hand tabs (`.side-tab`) on wide screens; on phones
   the same links in one bar at the bottom (`.tab-bar-item`). Never a second
   bar under the header. No native dropdown pickers: choices are `.option`
   rows.
6. **Plain words.** Sentence case, no jargon, no operator copy. Say what
   happens ("They'll see it once they've answered too"), not how it works.
7. **Motion is a reward, and optional.** Answers flip in at a reveal, a match
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
| `.panel` | The one surface of a region (22 px radius, hairline border) |
| `.bubble`, `.bubble-you` / `.bubble-them` | A borderless tinted fill inside a panel: an answer in a reveal |
| `.tile` | A big tinted tap target: a This or that side, a set to play |
| `.display` | A heading in Fraunces; `em` inside is the rose italic |
| `.option-heart` | The heart in an `.option` that fills when picked |
| `.anim-rise` / `-pop` / `-flip` / `-float` / `-beat` / `-wiggle` / `-drift` / `-slide-in` / `-bob` / `-picked` | Motion; stagger with `--delay` |
| `.divide-rows` | Hairlines between sections or rows inside a panel |
| `.btn` + `.btn-primary` / `.btn-outline` / `.btn-ghost`, `.btn-sm` | Buttons: pills that sink a little when pressed |
| `.input`, `.textarea` | Text fields, 16 px type |
| `.option` | A choice: `role="radio"` + `aria-checked`, or a toggle with `aria-pressed` |
| `.chip`, `.chip-match` | Small labels: the streak, "Matched" |
| `.eyebrow` | Small sentence-case label above a heading |
| `.side-tab` | Left-hand tab; `aria-current="page"` marks this page |
| `.tab-bar-item`, `.tab-bar-icon` | A phone tab in the bottom bar; the open one's icon sits in a rose pill |
| `.skeleton` | Loading placeholder |
| `.num` | Tabular figures for counts |

## Voice

Warm, short, second person. "Your turn", "Waiting for Sam", "You matched".
Headings can be a little romantic ("Our story so far", "Start yours
*tonight*"). Never "user", "submit", "session" or "data" on a screen; never a sentence a
developer would write ("No API key configured"). No competitor names.
