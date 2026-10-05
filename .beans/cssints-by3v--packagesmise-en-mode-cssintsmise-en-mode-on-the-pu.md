---
# cssints-by3v
title: 'packages/mise-en-mode: @cssints/mise-en-mode on the public plugin API'
status: todo
type: feature
priority: normal
created_at: 2026-10-05T09:25:14Z
updated_at: 2026-10-05T09:25:14Z
parent: cssints-easl
blocked_by:
    - cssints-0v30
---

Step 2 of docs/research/plugin-api.md "Decision".
- [ ] New workspace package packages/mise-en-mode (@cssints/mise-en-mode, cssints peerDependency, exports like @cssints/icons, MIT), imports only cssints/plugin (and types from cssints).
- [ ] look(tokens, expression, source, overrides, { scope? }): looks are themes (Built.themes from step 1) in the declared layers app < author < viewer; aspects = top-level token groups (color, typography) as data-mode fragments [data-mode~="e/aspect"]; overrides checked against the token set in types and at build time; @scope containment; check.contrast sees looks.
- [ ] Remove src/mise-en-mode.ts, the ./mise-en-mode export and pack entry, its test and fixture from packages/cssints; move/rewrite the tests (the Mode Contract cases of test/mise-en-mode.mjs) into the package; README for the package; API.md section moves.
- [ ] Packaging check: an app that depends on @cssints/mise-en-mode (packagesOnCssints) builds; bun run test runs the package tests.
