---
# cssints-rw4e
title: 'Reset: buttons keep the UA border (bevel looks like a shadow); the reset should drop it'
status: in-progress
type: bug
created_at: 2026-10-12T16:18:30Z
updated_at: 2026-10-12T16:18:30Z
---

User (2026-10-12, from the devtools panel on /overview): inside the example the reset seems not to work: buttons with shadows; maybe the reset has no border reset for buttons?

Confirmed: packages/reset/src/make.ts only makes controls inherit font/colour; button/[type=button|submit|reset] keep the UA border (the bevel) and background. The overview example (apps/docs/examples/overview) sets colour, radius and bg but no border, so the bevel shows.

- [ ] reset: buttons (button, input[type=button|submit|reset]) get border 0 (and the UA background dropped when it is unstyled: decide; Tailwind preflight does background transparent) in the base, :where() so any style wins; inputs/textarea/select keep their UA borders; Baseline variants regenerated (bun run variants), reset tests
- [ ] screenshots before/after of csssky, demo, docs, the overview example frame; the apps' tests that measure layout stay green (csssky browser tests, contrast), report any size change
- [ ] README of @cssints/reset, docs, changeset
