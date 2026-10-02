---
# cssints-hbqf
title: check.contrast warnings for derived colours do not show in dev
status: completed
type: bug
priority: normal
created_at: 2026-10-02T14:44:23Z
updated_at: 2026-10-02T14:55:25Z
parent: cssints-co8y
---

## Problem

Found in cssints-uifu: a `check.contrast` on a derived colour (`color-mix()`, relative colour) should warn that it cannot read the value (API.md), and errors do show, but the warnings did not appear in a dev run (they are collected in `state.warnings` in contrast.ts). Reproduce with apps/sky's tokens, find where dev drops them (the end-of-build pass vs the per-module pass, or the logger), fix, and add a dev-mode test.

## Summary of Changes

Root cause: the warnings were not lost in the logger or in the per-module pass. \`state.warned\` (the once-per-build dedupe of contrast and support warnings) is never cleared, and a dev server has no end of build, so a warning showed on the first evaluation of a module and never again: not after an edit, not after a re-transform. Errors are not deduped, which is why they kept showing. The first evaluation in dev does warn (checked with a real \`vite\` server on apps/sky and with the logger of the test).

Fix: the client \`hotUpdate\` hook of the plugin clears \`warned\`, so an edit starts the next round of warnings; a build never calls it and still warns once (the per-module and the end pass share the set).

Test: test/themes.mjs. A dev server with a watcher on a module that has a color-mix() token derived from another, checked twice: one warning on load, one more after an edit (it got none before the fix); and a build where two modules import the checking module: one warning.

Derived tokens (valueOf): contrast.ts follows \`alias\` only. A derived token has no alias; the check reads \`TokenDef.value\`, its default literal with the references substituted. That is a warning when the literal is not a colour (color-mix over a token) and a ratio when it is (\`oklch(L C {hue})\`, which is why the Mu accent colours produced an error or a pass, never a warning). A theme that sets a token it refers to is not a subject of the check, so the derived colour passes in silence under that theme. Not right: tracked in cssints-l90l; docs/API.md says what it does now.
