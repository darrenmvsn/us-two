<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Engineering Quality Bar

Act as a principal engineer on every change. Maintain a very high engineering bar at all times. Code is not complete until it is production-ready, cleanly designed, maintainable, extensible, testable, and aligned with the existing architecture.

- Read the surrounding code and follow established project patterns before introducing new abstractions.
- Use Clean Architecture principles: keep domain/business logic independent from UI, framework, transport, persistence, and provider concerns.
- Keep route handlers, server actions, React components, and infrastructure adapters thin. They should validate, authorize, translate, and delegate; core decisions belong in domain/application modules.
- Design for extensibility without over-engineering. Prefer clear interfaces, provider boundaries, and domain-focused modules when behavior is expected to grow or vary.
- Optimize for maintainability and testability. Complex behavior must be isolated into small deterministic units that can be tested without a browser, network, database, or LLM unless the integration itself is under test.
- Prefer small, cohesive functions and files. Avoid dumping-ground modules, generic `utils` files, hidden side effects, circular dependencies, and broad refactors unrelated to the task.
- Use domain-specific names that describe the product concept clearly. Avoid vague names like `data`, `manager`, `helper`, or `thing`.
- Validate all external inputs at boundaries with typed schemas or equivalent checks. Treat auth, ownership, idempotency, retries, and error states as first-class production concerns.
- Preserve backwards compatibility unless the task explicitly requires a breaking change. Add migrations and safe defaults for persisted data.
- Keep implementations deterministic where possible, especially stubs, tests, grading logic, and retry-sensitive code paths.
- Prefer proven framework/library primitives over custom infrastructure when they fit the requirement. Do not hand-roll complex state, streaming, auth, validation, or persistence behavior without a clear reason.
- Add or update tests for meaningful behavior changes, edge cases, and regression-prone paths. Do not rely on manual verification alone for core logic.
- Run the relevant verification before finishing: at minimum type/lint/test for touched areas when dependencies are available. If a command cannot be run, state exactly why.
- Leave the codebase cleaner than you found it within the changed scope: no dead code, no duplicated logic, no console/debug leftovers, no inconsistent formatting, and no TODOs that hide required work.
- Reject code smell proactively. If an implementation feels hard to reason about, hard to test, hard to extend, or easy to misuse, stop and improve the design before proceeding.

## Open source first

Founder instruction (2026-10-21): before you build anything, in any function
(product code, GTM, billing, support, analytics, ops, agent tooling), look for
an open-source project that already does it, and port, vendor or self-host it
when it fits. Building from scratch is the fallback.

- **Search first:** GitHub, awesome-lists, Hacker News (Algolia API; reddit.com
  is blocked from the cloud sandbox) and the project's docs. Prefer an active
  project: pushed in the last six months, releases, more than one maintainer.
- **Check the licence in the repo's own `LICENSE` file**, never the badge or
  GitHub's sidebar ("other" usually means an open core):
  - MIT, Apache-2.0, BSD, ISC, MPL-2.0: use, modify, vendor and serve; keep the
    copyright notice (and Apache's `NOTICE`).
  - GPL/LGPL: only as a separate service or unmodified dependency; never copy
    its code into ours.
  - AGPL-3.0: run it unmodified as its own container. Modifying it and serving
    it over the network obliges us to publish the changes; never copy AGPL code
    into this repo.
  - Open core (`ee/`, `enterprise/` folders): only the code outside them is
    open; use the community image and never enable or copy the paid folders.
  - BSL, ELv2, SSPL, FSL, Sustainable Use (n8n), Commons Clause: source-available,
    not open source; assume we may not offer it to customers. No licence at
    all: don't use it.
- **Fit:** it must run at $0 on the shared Oracle Always Free ARM VM (2 OCPU /
  12 GB for Viralab and every mini app; Us Two's slot is 0.5 CPU, 512 MB):
  an arm64 image, its RAM measured or estimated. A library beats a service.
- **Record it in the PR:** name, URL, licence, last push, and why it was used,
  ported or rejected. Ported code keeps its licence and copyright header.
- **Per-function picks** already made for every app are on the open-source
  stack page, https://claude.ai/artifact/948zVQ1cpr3LSqcC6F8ogN. Don't
  re-research them without cause.

## Shared guidelines and learnings

Us Two is one of the mini apps in the Viralab project, and every agent working on
it (Claude Code on a laptop, cloud and project threads, subagents,
other tools) follows this file and shares one store of lessons.

- **At session start, read every file in `learnings/`.** They are what previous
  agents got wrong here.
- **When you are corrected, introduce a bug, hit a failure that surprised you,
  or make a review finding that generalises, add one entry to
  `learnings/<topic>.md` in the same commit.** Format, filing and what not to
  write: `learnings/README.md`. A lesson saved only to a session's or project's
  memory reaches no other agent, so it goes in `learnings/` as well.
- **Before adding or changing a route under `src/app/api/` or a server action,
  read `docs/architecture/api-routes.md`** and follow its order of work,
  response shape and status codes.
- **When briefing another agent, include this section**: read `learnings/`
  first, add an entry when one applies, follow the API route contract, and
  check open source (with its licence) before building.

## Design standard

`DESIGN.md` is the UI contract: tokens (light and dark), type scale and the
component classes in `src/app/globals.css`. Build screens from those classes
(`.panel`, `.divide-rows`, `.btn-*`, `.option`, `.chip`, `.side-tab`,
`.tab-bar-item`, `.eyebrow`, `.link`) and tokens; rose (`accent`) means "act /
selected" only, and green (`match`) means only "you matched". No stacked or
nested cards, no second nav bar, no native dropdown pickers, no emoji as
icons. `src/app/design-system.test.ts` fails when `DESIGN.md` and
`globals.css` disagree or a retired pattern comes back. Change a token in both
files in one commit. Check every screen at 390px and 1440px, light and dark.

## Product rules

- **Answers are private until both are in.** The server never sends a
  partner's answer or picks before the viewer has answered
  (`src/lib/couple/views.ts`, `src/lib/this-or-that/duels.ts`); keep it that
  way in every new view or API.
- **No accounts and no personal data beyond a first name.** A player is a
  random cookie token, stored only as its hash. Never ask for an email, a phone
  number or anything about the relationship beyond the game.
- **$0 to run.** No model, speech or paid API calls. If one is ever added it
  needs a per-couple meter and a daily ceiling first, as Viralab's and
  DesignLoop's do.
- **Question and set ids are permanent.** Rounds store the id; add new
  questions at the end of a pack, never repurpose an id or reorder a This or
  that set that has shipped.
- **Copy is warm, short and plain** (DESIGN.md § Voice). No competitor names.
