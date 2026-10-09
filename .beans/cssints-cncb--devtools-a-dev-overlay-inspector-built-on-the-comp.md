---
# cssints-cncb
title: 'Devtools: a dev overlay inspector built on the compiler''s knowledge (Effect + Solid)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-09T08:40:45Z
updated_at: 2026-10-09T09:24:40Z
---

Our own devtools for cssints, built on what docs/research/devtools.md (cssints-0a3p) found: atomic-css-devtools reads rules through the CSSOM and gets @container/@supports/@scope, specificity and unlayered rules wrong, and cannot say where a class comes from.

Decided with the user (2026-10-09):
- **Form:** a dev overlay injected by the cssints Vite plugin (no install; Chrome, Firefox, Safari; testable with Playwright). A DevTools extension may wrap the same core later.
- **Data:** the compiler's knowledge. The dev server exposes per class: declarations, conditions, layer, kernel/plugin scope, tokens used, source site(s). The overlay shows an element's cssints classes as the author wrote them (grouped by cn() site), with the winner per property by the sheet's own order and specificity, and checks it against the browser's computed style.
- **UI:** Solid + cssints (the tool styles itself). Core (protocol with the dev server, state, cascade) in Effect.

## Todo
- [x] design note: data model, protocol, cascade rule, UI sketch (docs/research/devtools.md or a new section)
- [x] dev-server side: class metadata endpoint / virtual module, kept fresh on HMR
- [x] core (Effect): element -> classes -> metadata -> cascade per property, verified against getComputedStyle
- [x] overlay UI (Solid + cssints): pick element, panel with grouped rules, winner, source link (open in editor)
- [ ] tests: core unit tests, the cascade on the research's hard cases (@container, @supports, @scope, hover vs media, unlayered), Playwright on apps/demo in Chrome/Firefox/WebKit
- [ ] docs/API.md section, README
