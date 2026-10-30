---
# cssints-bn0g
title: Command palette composition (first on the primitives)
status: completed
type: task
priority: normal
created_at: 2026-10-30T18:27:07Z
updated_at: 2026-10-30T18:38:44Z
---

First composition on @cssints/headless primitives (parent work: cssints-yntz). Build createCommandPalette: dialog + searchbox + filterable list, per docs/research/compositions-2026-10.md. The filterable menu and date picker stay for later PRs.

- [ ] src/command-palette.ts
- [ ] test/command-palette.browser.test.tsx
- [ ] export from src/index.ts
- [ ] README section + docs/API.md entry
- [ ] changeset (minor)
- [x] verify: tsc, tests, lint, fmt, release:check

## Summary of Changes

`createCommandPalette` in `packages/headless/src/command-palette.ts`: a dialog (createDialogModal) holding a searchbox (createTextInput) and a filtered listbox, with a polite result count (createStatus) and a document hotkey (createHotkeys via `attach()`). Focus stays in the field with `aria-activedescendant`; the arrow loop returns to the field; Home/End follow the caret while there is text; Enter runs the highlight, Escape closes; plain case-insensitive label+keyword filtering; groups, empty state, reset on close, focus return. Exported from `src/index.ts`, README section, docs/API.md entry, minor changeset. 9 browser tests; tsc, lint, fmt, full headless suite and release:check pass.

PR: https://github.com/alexeiaccio/css-in-ts-compiler/pull/92 (not merged, not published).
