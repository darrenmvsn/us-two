# DESIGN.md

Us Two's design contract. Every colour, size and component on screen comes
from here; `src/app/globals.css` holds the values and
`src/app/design-system.test.ts` fails when the two drift or a retired pattern
comes back. Change a token here and in `globals.css` in the same commit.

## The idea

**A note passed between two people.** Warm paper, dark ink, one rose. It
follows the house rules shared with Viralab, DesignLoop and Moatlab:

1. **Colour means something.** Rose (`accent`) is "act here / selected /
   focus": the one primary button, a picked option, the open tab. Green
   (`match`) means only "you matched" or "guessed right". A miss is plain
   muted text, never red: a different answer is not a failure.
2. **Flat, one surface per region.** No stacked or nested cards: a region is
   one `.panel`, and sections inside it are separated by hairlines
   (`.divide-rows`). No glows, glass, gradients, blur or emoji as icons
   (icons are lucide-react).
3. **Thumb-sized.** Buttons, inputs and tabs are 44 px (36 px small), options
   48 px. One primary (rose) button per region.
4. **Navigation**: left-hand tabs (`.side-tab`) on wide screens; on phones
   the same links in one bar at the bottom (`.tab-bar-item`). Never a second
   bar under the header. No native dropdown pickers: choices are `.option`
   rows.
5. **Plain words.** Sentence case, no jargon, no operator copy. Say what
   happens ("They'll see it once they've answered too"), not how it works.

## Type

Apple's system font, SF Pro, from the `--font-sans` stack; counts that line
up use its tabular figures (`.num`), never a monospace face. Never downloaded.
Weights 400, 500 and 600 only. Eight steps: `text-meta` 12, `text-caption`
13, `text-body` 15, `text-lead` 17, `text-heading` 20, `text-display` 28,
`text-hero` 40, `text-hero-lg` 56, each with its own leading. ESLint refuses
any other size and any raw colour in `src/`. Inputs are 16 px so iOS does not
zoom into them.

## Token reference

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#faf7f2` | `#141211` | The page |
| `--surface` | `#ffffff` | `#1c1a18` | The one panel per region, inputs, options |
| `--surface-raised` | `#f3eee6` | `#24211e` | Hover, quiet fills, chips |
| `--surface-strong` | `#e8e1d6` | `#2f2b27` | The open side tab, progress track |
| `--edge-soft` | `#efe9e0` | `#26231f` | Hairlines inside a panel |
| `--edge` | `#e0d8cc` | `#332f2a` | Panel, input and option border |
| `--edge-strong` | `#c4b9aa` | `#4b453e` | Hovered border |
| `--foreground` | `#1d1a17` | `#f5f1ec` | Headings, answers |
| `--secondary` | `#45403a` | `#d6cfc6` | Body copy |
| `--muted` | `#5e5750` | `#ada59b` | Supporting copy, labels |
| `--subtle` | `#6d665e` | `#9c948a` | Placeholders, hints |
| `--disabled` | `#aaa197` | `#615a52` | Inactive controls only |
| `--accent` | `#c0335a` | `#f0688c` | Primary button, picked option, focus: act or selected only |
| `--accent-hover` | `#a82a4e` | `#f58aa6` | Accent hover |
| `--accent-text` | `#a82a4e` | `#f58aa6` | Links, the open phone tab |
| `--on-accent` | `#ffffff` | `#1a0d12` | Text on accent |
| `--on-ink` | `#ffffff` | `#141211` | Text on an ink fill |
| `--match` | `#1d7a4f` | `#3fb57d` | You matched, guessed right (fills, icons) |
| `--match-text` | `#17663f` | `#5cc893` | The same, as words |

Every text token passes WCAG AA (4.5:1) on both `--background` and
`--surface` in its mode; the lowest is `--match` on the light page at 4.98.

## Components

| Class | Use |
|---|---|
| `.panel` | The one surface of a region (14 px radius, hairline border) |
| `.divide-rows` | Hairlines between sections or rows inside a panel |
| `.btn` + `.btn-primary` / `.btn-outline` / `.btn-ghost`, `.btn-sm` | Buttons |
| `.input`, `.textarea` | Text fields, 16 px type |
| `.option` | A choice: `role="radio"` + `aria-checked`, or a toggle with `aria-pressed` |
| `.chip`, `.chip-match` | Small labels: the streak, "Matched" |
| `.eyebrow` | Small sentence-case label above a heading |
| `.side-tab` | Left-hand tab; `aria-current="page"` marks this page |
| `.tab-bar-item` | A phone tab in the bottom bar |
| `.skeleton` | Loading placeholder |
| `.num` | Tabular figures for counts |

## Voice

Warm, short, second person. "Your turn", "Waiting for Sam", "You matched".
Never "user", "submit", "session" or "data" on a screen; never a sentence a
developer would write ("No API key configured"). No competitor names.
