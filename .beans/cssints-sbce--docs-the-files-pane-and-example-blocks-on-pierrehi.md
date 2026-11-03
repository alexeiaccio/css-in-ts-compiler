---
# cssints-sbce
title: 'Docs: the Files pane and example blocks on @pierre/highlights'
status: completed
type: task
priority: deferred
created_at: 2026-11-02T14:58:30Z
updated_at: 2026-11-03T10:33:05Z
---

Recorded 2026-11-02 with the native half (cssints-h0rs, now done).

**The pick**: `@pierre/highlights` 0.3.0 (Apache-2.0) for the TypeScript side — lexers in WAT (no syntax tree), 152 languages including `tsx`, `css`, `bash`, `json`, 65 Shiki-catalog and 10 Pierre themes with `toCSS` for CSS variables, `codeToHtml` / `codeToTokens`, streaming and document edits, synchronous after import in Node, browsers and workerd; 333 kB wasm (147 kB gzipped). Shiki stays only for the API blocks, where twoslash needs types.

**Not started.** There is no Files pane in `apps/docs` yet, and swapping the plain code blocks to a second highlighter while Shiki still ships for twoslash buys nothing today — the change waits for the pane (a file tree over the repository's examples) so it has a reader that Shiki cannot serve. The theme should be built from `apps/ui/src/registry/theme.ts`'s tokens through `toCSS`, with the contrast check the rest of the UI's colours go through.

## Summary of Changes

**Done, 2026-11-03 — build time, which is all the pane needs.** `apps/docs/plugin/code.ts` highlights with `@pierre/highlights` 0.3.0: the files of an example's Result/Code panel, the README blocks the type-check skips, and the landing page's install line and samples. Shiki renders only the ts blocks twoslash type-checks, with a Shiki theme built from the same table, so one palette paints the whole page.

**The theme is the default palette's.** Each kind's colour is the RYBitten cube at the accent's hue (`DEFAULT_HUE`: keyword at 0°, type +30°, function −30°, string −90°, tag +90°, …) at a contrast floor on the code's paper: 4.6:1 in light, 7:1 in dark. The paper is fixed (`src/code.ts`, the default palette's `bgSubtle` per mode) rather than a token, because Munsell's warm `bgSubtle` takes fixed colours to 3.5:1 and the site promises 4.5 in every palette. Both highlighters emit the same `--shiki-light-*`/`--shiki-dark-*` custom properties (`cssVariablePrefix: "--shiki-"` is Pierre's option too), so `src/prose.ts`'s existing mode switch paints either, and a new pair of rules applies the comments' italic.

**Evidence:** `test/code.mjs` measures every syntax colour against the paper and pins the paper to the palette; `test/build.mjs` asserts the paper's light/dark rules and the font-style switch; `test/frames.mjs` (the Code tab, light/dark), `test/browser.mjs` and the build are green; `bun run --filter cssints-docs typecheck` and the files' lint are clean.

**Cost:** the 276 kB wasm runs at build time only and is not in the client; the pages' size is unchanged.

**Not done, deliberately:** no highlighting in the browser. A live pane (fetch a file, highlight on demand, 147 kB gzip in the page) is what Pierre-in-the-client is for, and the panel's files are known at build time, so nothing needs it yet. `toCSS` was not used: with the colours in our own table the variables are already ours, and a CSS-variable theme would put them beyond `test/code.mjs`'s reach.
