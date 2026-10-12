---
# cssints-rw4e
title: 'Reset: buttons keep the UA border (bevel looks like a shadow); the reset should drop it'
status: completed
type: bug
created_at: 2026-10-12T16:18:30Z
updated_at: 2026-10-12T16:18:30Z
---

User (2026-10-12, from the devtools panel on /overview): inside the example the reset seems not to work: buttons with shadows; maybe the reset has no border reset for buttons?

Confirmed: packages/reset/src/make.ts only makes controls inherit font/colour; button/[type=button|submit|reset] keep the UA border (the bevel) and background. The overview example (apps/docs/examples/overview) sets colour, radius and bg but no border, so the bevel shows.

- [x] reset: buttons (button, input[type=button|submit|reset]) get border 0 (and the UA background dropped when it is unstyled: decide; Tailwind preflight does background transparent) in the base, :where() so any style wins; inputs/textarea/select keep their UA borders; Baseline variants regenerated (bun run variants), reset tests
- [x] screenshots before/after of csssky, demo, docs, the overview example frame; the apps' tests that measure layout stay green (csssky browser tests, contrast), report any size change
- [x] README of @cssints/reset, docs, changeset

## Summary of Changes

- `packages/reset/src/make.ts`: the base has `:where(button, input[type="button"], input[type="submit"], input[type="reset"]) { border: 0 }`, after the controls rule, in layer `reset`. Only the border: the UA background and padding stay (a button with a text colour only is a flat grey chip, not broken; Tailwind's preflight drops the background, normalize.css does not, and the user asked about the border). Inputs, textareas and selects keep their borders.
- `bun run variants` rewrites nothing (a variant module only calls `make(id)`); all 29 groups compile and keep the rule (`border` is in every group), so the README table of dropped declarations is unchanged. dist of packages/reset rebuilt (the chunk hash changed, so every group file moved); nothing else tracked embeds the base.
- Tests: the full reset has 20 declarations; the rule is in the base, in layer `reset` before `_.a`, and an author `border()` is in a layer above; every variant has it. README: the CSS block and the base bullet; changeset (minor).
- Screenshots (shots/rw4e before/after): the overview Result frame loses the bevel on Save and Cancel; csssky and demo unchanged (their buttons set their own border); docs frames with unstyled buttons (layout, runtime-cn-cv, reset) lose the bevel, a button without a border of its own is 2 px smaller in each dimension. All csssky and docs tests stay green.
