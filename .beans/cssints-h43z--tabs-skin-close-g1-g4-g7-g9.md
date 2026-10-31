---
# cssints-h43z
title: 'Tabs skin: close G1, G4, G7, G9'
status: completed
type: task
priority: normal
created_at: 2026-10-31T14:39:43Z
updated_at: 2026-10-31T14:54:24Z
---

Close the skin-side gaps in packages/headless/docs/requirements/tabs.md: reflow and 200% text (G1), contrast and the non-colour active cue (G4), focus appearance and obscuring (G7), target size (G9). Work in apps/ui/src/registry/tabs and the app theme; do not touch the primitive or the headless requirement test.

- [x] Read the requirements and the skin/test/theme/tokens
- [x] G9: 24 x 24 target assertion + min-height/min-width in the skin
- [x] G7: 2 px focus ring contrast assertion + sticky header composition test + scroll-margin
- [x] G1: 320 px / 200% text / text-spacing reflow assertions
- [x] G4: tabs contrast checks in the theme + non-colour active cue assertion
- [x] Tick G1, G4, G7, G9 in tabs.md with the evidence
- [x] Verify: build/test, lint, fmt, typecheck, release:check
- [x] Commit, push, open the PR

## Summary of Changes

Closed G1, G4, G7 and G9 in packages/headless/docs/requirements/tabs.md.

- G1: the tablist now wraps; tabs.browser.test.tsx asserts no horizontal overflow at 320 px, at 200 % text (32 px root) and with 0.12em/0.16em/1.5 spacing.
- G4: theme.ts gates text/page 7, muted/page 4.5, highlight/page 3 and focusRing/page 3; the selected underline is 3 px against 2 px, so the cue is not colour alone. No pair fails (closest: dark highlight 3.17:1 with indigo).
- G7: the computed ring is solid, >= 2 px and >= 3:1 against the page; mountTabsUnderStickyHeader proves scroll-margin-top keeps a focused tab below a 32 px sticky header.
- G9: a one-letter tab is at least 24 x 24 px, backed by min-height/min-width; AAA 44 x 44 is recorded as not claimed.

Verification: apps/ui test (291 passed), build, typecheck; scoped lint and fmt; release:check. Repo-wide lint still has pre-existing errors in untouched files.

PR: https://github.com/alexeiaccio/css-in-ts-compiler/pull/109
