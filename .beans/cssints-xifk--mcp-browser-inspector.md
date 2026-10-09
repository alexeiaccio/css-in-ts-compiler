---
# cssints-xifk
title: 'MCP: browser inspector'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T08:45:25Z
updated_at: 2026-10-09T12:20:05Z
parent: cssints-0phg
---

For an agent, what the devtools overlay shows a human: by selector on an open page, an element's cssints classes, the winner per property and its source. Reuse the overlay's Effect core (cssints-cncb) through Playwright.

## Todo
- [x] open/attach a page (playwright-core), run the core's cascade on an element
- [x] tools: inspect element, why does property X have value Y
- [x] tests in Chrome on apps/demo

## Summary of Changes

- `@cssints/devtools/inject` (`src/core/inject.ts`): the core in a page without the overlay, `__cssintsDevtools`
  with `load(table)`, `inspect(selector, prop?)` (the overlay's `inspect` on `domPage`) and `blur()`.
- `packages/mcp/src/browser.ts`: the `Inspector` service, a headless Chromium of playwright-core for the session
  (an installed Chrome as the fallback), one page per url kept open, the inject entry bundled by Vite on the first
  call and added to the page, the table from `Live` handed over when it changes; `hover`/`focus` (Playwright) or the
  pointer away and the focus dropped, `width`/`height` for the viewport.
- Tools `inspect_element` (classes by call, per property the winner with its call, what it overrides and why, what
  does not apply with the failing condition, ✓/✗/? with the reason, tokens) and `why_property` (one property:
  winner, its conditions held or not, what it beats and why, the computed value; a property no rule sets says so).
- `test/browser.mjs` (`bun run test:browser`): the demo in Chromium: hover vs media in one layer (hovered, not
  hovered, 400 px), `@container` narrow and wide, the unlayered `.mine` rule reported ✗.
