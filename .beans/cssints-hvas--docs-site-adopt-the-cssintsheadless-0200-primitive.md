---
# cssints-hvas
title: 'Docs site: adopt the @cssints/headless 0.20.0 primitives in apps/docs'
status: completed
type: task
priority: normal
created_at: 2026-10-31T08:41:47Z
updated_at: 2026-10-31T08:42:08Z
---

Replace the hand-rolled playground tabs (files: close/rename; output: arrows), the / and Cmd/Ctrl+K listeners, the outline scroll listener and the copy feedback in apps/docs with createTabs, createHotkeys, createScrollspy and createStatus. Keep the CSS-only example tabs and the search's link list as they are.

## Summary of Changes

- `apps/docs/src/playground/Playground.tsx`: the file tablist and the output tablist are `createTabs` (files: `closable` + `renamable` with `onClose` / `onRename`, the Delete key and the rename field; output: roving arrows); the editor and the output pane are the selected `tabpanelProps`; `+ File` and the `Copy link` button stay host-rendered. The idle/renamed file bookkeeping moved from one `naming` object to the primitive's `onRename`.
- `apps/docs/src/playground/Playground.tsx`: the `Copied` text is a `createStatus` region, cleared after 1.5 s; the button keeps its name.
- `apps/docs/src/Search.tsx` + `apps/docs/src/Shell.tsx`: one `createHotkeys` registry binds `/`, `mod+k` and Escape; the two `window.addEventListener("keydown")` calls are gone.
- `apps/docs/src/Page.tsx`: `Outline` is `createScrollspy` (`offset` = the 56 px header + the page's 16 px anchor padding); the DOM, CSS and the authored `aria-current` ("location"/"false") are unchanged.
- Not adopted: the search combobox. Its hits are `<a href>` links that navigate, while `createCombobox` selects a value from options; it stays hand-rolled and the decision is in the PR body.
- The example Result/Code tabs (plugin/markdown.ts) stay CSS-only radio inputs so they work prerendered without JS.
