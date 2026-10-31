---
# cssints-nklh
title: 'Tabs: the narrow accordion, the no-JS fallback and the AT run protocol (G2, G10, G12)'
status: completed
type: task
priority: normal
created_at: 2026-10-31T15:11:42Z
updated_at: 2026-10-31T15:12:44Z
---

Close the last testable gaps in packages/headless/docs/requirements/tabs.md in the skin, and record the AT table protocol.

- [x] Read the requirements, the skin, fixtures, accordion skin, theme and primitives
- [x] G2: narrow mode in tabs.tsx composes the accordion over the same selection; chevron before label; one mode in the DOM
- [x] G2: breakpoint tests at 800/799 px, selection kept both ways, one Tab stop path
- [x] G10: TabsFallback (links, then a heading and content per section) and the three fallback tests
- [x] G12: How to run the table (pairs, per-row record, failing-case proof, not-run rule); gap stays open
- [x] Tick G2 and G10 in tabs.md with the test names; note the protocol on G12
- [x] Verify install, apps/ui test/build/typecheck/theme:check, fmt/lint, release:check
- [x] Commit, push, open the PR

## Summary of Changes

Closed G2 and G10 in `packages/headless/docs/requirements/tabs.md`; G12 stays open with the run protocol.

- **G2, the skin not the primitive:** `Tabs` takes `narrow` and renders the accordion skin over the same items and panels. Its open set is the tabs' selection (`value={[selected]}`) and a toggle calls `tabs.select`, so section 3 stays open when the wide tablist shrinks and tab 3 stays selected when the open accordion grows. It is not collapsible (one open), the chevron is before the label, and only one mode is rendered, so there is one Tab stop per section and no `aria-hidden` over focusable content. `packages/headless/src/tabs.ts` is untouched.
- **G2 evidence:** the fixture drives `matchMedia("(max-width: 799px)")`; tests "is a tablist at 800 px and wider, never an accordion", "is an accordion with one button per section and one open below 800 px", "keeps section 3 open when the wide tablist shrinks", "keeps section 3 selected when the open accordion grows", "keeps one Tab stop per section and the hidden mode out of the tab order".
- **G10:** `TabsFallback` renders the in-page links, then an `h2` and the full content per section. Tests "reaches all four sections from its links without script" (static markup, nothing hidden), "keeps all four contents when the tabs replace the fallback", "never renders the fallback beside the interactive tabs". apps/ui has no prerender step, so the host's server renders it and the test is the contract (`apps/ui/README.md`).
- **G12:** added "How to run the table": the five pairings, a `pass`/`fail` record with what was said (exact words where asked) and a date, a deliberately failing case first, and the rule that a row stays `not run` until a dated `pass`. The gap stays open, now with the protocol.

Verification: `bun install --frozen-lockfile`; apps/ui test 299 passed (8 new); build; typecheck; theme:check; `vp fmt --check` on the touched files; `diff:check --base HEAD` clean; `release:check` passed. Repo-wide `vp lint` still fails on pre-existing errors in untouched files; the touched files have no diagnostics.

PR: https://github.com/alexeiaccio/css-in-ts-compiler/pull/110
