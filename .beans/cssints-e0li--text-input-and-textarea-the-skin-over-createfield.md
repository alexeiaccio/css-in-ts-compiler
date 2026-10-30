---
# cssints-e0li
title: 'Text input and textarea: the skin over createField'
status: todo
type: task
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T10:51:10Z
parent: cssints-65eb
---

TetraLogical ships both as components with documented requirements; we only have createField (the ARIA wiring) and native elements.

- [ ] decide the split: createField stays behaviour; the input/textarea components add the props every host forgets (autocomplete, spellcheck, inputmode, maxlength, readonly, disabled, placeholder-independent label)
- [ ] the error/hint wiring already exists; add the states: required, readonly, disabled, invalid, filled
- [ ] no-JS: both must work without it (native elements, no JS-only affordance)
- [ ] docs page per component, requirements table per the catalogue (see the requirement template bean)
- [ ] adopt in cms-admin and issues (they hand-roll TextField today)
