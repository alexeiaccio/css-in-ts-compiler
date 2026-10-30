---
# cssints-e0li
title: 'Text input and textarea: the skin over createField'
status: completed
type: task
priority: normal
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T11:25:01Z
parent: cssints-65eb
---

TetraLogical ships both as components with documented requirements; we only have createField (the ARIA wiring) and native elements.

- [ ] decide the split: createField stays behaviour; the input/textarea components add the props every host forgets (autocomplete, spellcheck, inputmode, maxlength, readonly, disabled, placeholder-independent label)
- [ ] the error/hint wiring already exists; add the states: required, readonly, disabled, invalid, filled
- [ ] no-JS: both must work without it (native elements, no JS-only affordance)
- [ ] docs page per component, requirements table per the catalogue (see the requirement template bean)
- [ ] adopt in cms-admin and issues (they hand-roll TextField today)

## Summary of Changes

Shipped in @cssints/headless 0.13.0 (PR #63): src/textbox.ts, README section, browser tests (6 each), changeset. No APG pattern exists for either, so the browser tests are the oracle.
