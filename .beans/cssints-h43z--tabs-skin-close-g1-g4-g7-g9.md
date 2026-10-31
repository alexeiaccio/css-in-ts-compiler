---
# cssints-h43z
title: 'Tabs skin: close G1, G4, G7, G9'
status: in-progress
type: task
priority: normal
created_at: 2026-10-31T14:39:43Z
updated_at: 2026-10-31T14:48:42Z
---

Close the skin-side gaps in packages/headless/docs/requirements/tabs.md: reflow and 200% text (G1), contrast and the non-colour active cue (G4), focus appearance and obscuring (G7), target size (G9). Work in apps/ui/src/registry/tabs and the app theme; do not touch the primitive or the headless requirement test.

- [x] Read the requirements and the skin/test/theme/tokens
- [x] G9: 24 x 24 target assertion + min-height/min-width in the skin
- [x] G7: 2 px focus ring contrast assertion + sticky header composition test + scroll-margin
- [x] G1: 320 px / 200% text / text-spacing reflow assertions
- [x] G4: tabs contrast checks in the theme + non-colour active cue assertion
- [x] Tick G1, G4, G7, G9 in tabs.md with the evidence
- [x] Verify: build/test, lint, fmt, typecheck, release:check
- [ ] Commit, push, open the PR
