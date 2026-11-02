---
# cssints-sbce
title: 'Docs: the Files pane and example blocks on @pierre/highlights'
status: todo
type: task
priority: deferred
created_at: 2026-11-02T14:58:30Z
updated_at: 2026-11-02T14:58:30Z
---

Recorded 2026-11-02 with the native half (cssints-h0rs, now done).

**The pick**: `@pierre/highlights` 0.3.0 (Apache-2.0) for the TypeScript side — lexers in WAT (no syntax tree), 152 languages including `tsx`, `css`, `bash`, `json`, 65 Shiki-catalog and 10 Pierre themes with `toCSS` for CSS variables, `codeToHtml` / `codeToTokens`, streaming and document edits, synchronous after import in Node, browsers and workerd; 333 kB wasm (147 kB gzipped). Shiki stays only for the API blocks, where twoslash needs types.

**Not started.** There is no Files pane in `apps/docs` yet, and swapping the plain code blocks to a second highlighter while Shiki still ships for twoslash buys nothing today — the change waits for the pane (a file tree over the repository's examples) so it has a reader that Shiki cannot serve. The theme should be built from `apps/ui/src/registry/theme.ts`'s tokens through `toCSS`, with the contrast check the rest of the UI's colours go through.
