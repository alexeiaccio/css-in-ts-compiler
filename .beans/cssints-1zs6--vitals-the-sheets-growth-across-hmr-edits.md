---
# cssints-1zs6
title: 'vitals: the sheet''s growth across HMR edits'
status: completed
type: feature
priority: normal
created_at: 2026-11-07T11:08:55Z
updated_at: 2026-11-07T12:21:22Z
parent: cssints-7rmb
---

The most cssints-specific number there is: after each edit, how many bytes the sheet grew, which file did it, and what the curve looks like over the session.

Build:
- The dev server (the `apply: "serve"` plugin, packages/cssints/src/plugin.ts + whatever renders the sheet) keeps a small ring of edits: `{ at, file, bytes, classes }` for the last ~30 transforms. It must stay cheap: the sheet is already rendered for the table, so this is a `length` and a class count, not a re-render.
- Deliver it where `src/vitals` can read it without Effect: the existing `cssints:devtools`/`cssints:devtools:stale` HMR messages are the channel the overlay already uses (`session.ts`); add a compact `sheet: [{ file, bytes, classes }]` to the payload the page asks for, or a second event, and let `src/vitals` subscribe through `import.meta.hot.on(...)` behind a guard (no dev server → no row).
- Print in the console group: `sheet   41.2 kB (+312 B, Showcase.tsx)` and a sparkline of the last N sizes, the biggest edit, and `bytes per class` (the sheet's cost of one class, which is what a `cn()` decision buys).
- Keep the entry standalone: without Vite/`import.meta.hot`, the module must not reference the plugin at all.

Check: a fixture app dev server (packages/cssints/test fixtures have HMR apps) edits a style twice and asserts the two sizes and the delta in the page's `report()`, and that a build has no `import.meta.hot` path.

Pitfall: a `stale` event fires after every transform, including modules that change no style — the history should only keep edits whose sheet bytes changed.


## Outcome (2026-11-07)

The dev server measures the sheet where it renders it (`packages/cssints/src/plugin.ts`, `load("\\0virtual:cssints.css")`):
`{ file, bytes, classes }` on the client HMR channel as `cssints:edits`, the file being the last hot update
(`hotUpdate`), and the last measurement cached for a late subscriber that asks `cssints:edits:get` (the vitals module
loads after the page's sheet). `@cssints/devtools/vitals` keeps a ring of 30 (a repeated measurement is not a point),
prints `sheet 64.4 kB · +29 B on src/registry/button/button.tsx · 3 loads · 81 B a class ▁▁█`, and the row is absent off
a dev server.

Check: `packages/cssints/test/devtools.mjs` requests the sheet and asserts the event, then the `edits:get` reply is the
same measurement; `apps/ui/test/vitals.mjs` asserts the first measurement on the kit site (`64.4 kB · 1 load`). Verified
by hand with a real edit: appending a `cn()` to button.tsx moved the sheet +29 B, named the file, and the sparkline grew.
Note for the next tickets: the row depends on the **built** plugin in app tests (`cssints/vite` resolves to dist under
Node), so `bun run build:packages` must precede them, as for every app test.
