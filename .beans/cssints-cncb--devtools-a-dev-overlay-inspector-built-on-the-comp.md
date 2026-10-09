---
# cssints-cncb
title: 'Devtools: a dev overlay inspector built on the compiler''s knowledge (Effect + Solid)'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T08:40:45Z
updated_at: 2026-10-09T11:53:18Z
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
- [x] tests: core unit tests, the cascade on the research's hard cases (@container, @supports, @scope, hover vs media, unlayered), Playwright on apps/demo in Chrome/Firefox/WebKit
- [x] docs/API.md section, README

## Summary of Changes

- Design: docs/research/devtools.md "Our devtools" (data model, transport, cascade rule, verification, UI, opt-in, shadow root).
- Server: `cssints({ devtools: true })` adds a serve-only plugin (packages/cssints/src/devtools-server.ts): a script tag, `virtual:cssints/devtools`, the table over HMR (`cssints:devtools:get` -> `cssints:devtools`) from the plugin's records (usedBy, the sites of each module recorded beside siteOf, the registry), `cssints:devtools:stale` after each client transform. plugin.ts: the option, one map filled in the dev loop, the plugin appended. Test: packages/cssints/test/devtools.mjs.
- Core (packages/devtools/src/core, Effect): table schema and model, sheet parser, specificity and states, cascade per longhand (layer, specificity, order; at-rules decided by a probe sheet), verification on a childless clone with the cause of a mismatch, token sources, Page service with a DOM layer, session over a Transport.
- UI (src/ui, Solid + cssints): toggle (Alt+Shift+C, corner button), hover preview / click pick, panel by call site with open-in-editor, winners, struck overridden, inactive with failing conditions, tokens; Esc, arrows. Built ahead into dist/overlay.js with its sheet inlined into a shadow root.
- Demo wired (devtools on, components/Inspect.tsx with the hard cases). Tests: core.mjs (happy-dom), build.mjs (nothing in a build), browsers.mjs (Chrome, Firefox, WebKit: all ok).
- Docs: API.md "Debugging: the devtools overlay", packages/devtools/README.md, wayfinder entry, AGENTS.md layout.

Not done: apps/sky is not wired (its test/dev.mjs reads every HMR message as an update and breaks on the stale event; the overlay works on sky by hand). Limits: @scope proximity, logical/physical pairs, elements in other shadow roots, server-rendered pages.
