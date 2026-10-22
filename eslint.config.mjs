import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * A raw colour: a hex literal, an rgb()/rgba()/hsl() call, or one of Tailwind's
 * built-in white/black swatches. Every colour the UI renders belongs to a token
 * in app/globals.css (DESIGN.md is the contract), so any of these in src/ has
 * escaped the palette. Ported from Moatlab's eslint config.
 */
const RAW_COLOUR = String.raw`#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(|\b[a-z-]+-(?:white|black)(?:\/|\b)`;

const RAW_COLOUR_MESSAGE = [
  "Raw colour. Every colour comes from a token in app/globals.css —",
  "`className=\"bg-accent-soft text-match-text\"`, or `var(--edge-strong)` in a style or SVG.",
  "If the palette has no word for what you mean, add a token; don't inline the value.",
].join(" ");

/**
 * A type size from outside the scale: a hand-typed `text-[13.5px]`, or one of
 * Tailwind's default steps. The eight steps in app/globals.css are the whole
 * scale. This is the rule that keeps the two-scales-at-once problem from
 * coming back — and it matters more than it looks, because a bare font-size
 * carries no line-height, so every ad-hoc `text-[Npx]` also silently inherits
 * whatever leading happens to be in scope.
 */
const OFF_SCALE_TYPE = String.raw`\btext-\[[0-9.]+(?:px|rem|em)\]|\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b`;

const OFF_SCALE_TYPE_MESSAGE = [
  "Type size outside the scale. Use a step from app/globals.css:",
  "text-meta | text-caption | text-body | text-lead |",
  "text-heading | text-display | text-hero | text-hero-lg.",
  "Each carries its own line-height; a bare text-[Npx] does not.",
].join(" ");

const noRawColour = [
  { selector: `Literal[value=/${RAW_COLOUR}/]`, message: RAW_COLOUR_MESSAGE },
  { selector: `TemplateElement[value.raw=/${RAW_COLOUR}/]`, message: RAW_COLOUR_MESSAGE },
  { selector: `Literal[value=/${OFF_SCALE_TYPE}/]`, message: OFF_SCALE_TYPE_MESSAGE },
  { selector: `TemplateElement[value.raw=/${OFF_SCALE_TYPE}/]`, message: OFF_SCALE_TYPE_MESSAGE },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next already registers the jsx-a11y plugin itself (with a
  // handful of rules wired up as `warn`), so re-declaring the plugin via
  // `jsxA11y.flatConfigs.recommended` directly conflicts ("Cannot redefine
  // plugin"). Apply the recommended ruleset's *rules* only — the plugin
  // registration from `nextVitals` above covers resolution — and promote
  // everything to a hard failure. This is the permanent a11y floor for
  // every future PR, not a one-time sweep.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Preserve eslint-config-next's next/image awareness: `<Image>` is a
      // custom component that renders an `<img>`, so alt-text must still be
      // enforced on it (recommended's default only knows about raw `<img>`).
      "jsx-a11y/alt-text": ["error", { elements: ["img"], img: ["Image"] }],
      // Off by default in "recommended"; our design system builds several
      // icon-only controls from non-native elements (buttons, custom
      // toggles), and this is the rule that catches them shipping with no
      // accessible name. `input`/`textarea`/etc. stay excluded — those are
      // form controls already covered by `label-has-associated-control`
      // (which correctly understands `htmlFor`/`id` pairing); enabling this
      // rule for them too would duplicate that check without its nuance.
      "jsx-a11y/control-has-associated-label": [
        "error",
        {
          ignoreElements: ["audio", "canvas", "embed", "input", "textarea", "tr", "video"],
          ignoreRoles: [
            "grid",
            "listbox",
            "menu",
            "menubar",
            "radiogroup",
            "row",
            "tablist",
            "toolbar",
            "tree",
            "treegrid",
          ],
          includeRoles: ["alert", "dialog"],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...noRawColour],
      // An underscore prefix marks a parameter that is unused on purpose.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Tests carry fixture values, never rendered UI.
    files: ["src/**/*.test.{ts,tsx}"],
    rules: { "no-restricted-syntax": "off" },
  },
]);

export default eslintConfig;
