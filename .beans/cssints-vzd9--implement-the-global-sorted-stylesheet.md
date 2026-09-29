---
# cssints-vzd9
title: Implement the global sorted stylesheet
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-29T14:20:21Z
updated_at: 2026-09-29T14:20:21Z
parent: cssints-vy0o
---

## Question

Implement the output pipeline decided in cssints-euf0.

- [ ] One virtual CSS module (for example `virtual:cssints.css`), imported once from the entry, instead of per-module `cssints.css?file=` and `layers.css`. It starts with `@layer _.a, _.b, _.c, _.d, _.e;`.
- [ ] Dev: rules collected per source module and deduplicated across modules. Invalidating the virtual module on change updates it without a reload. The HMR invariants of cssints-hdui still hold: `race.mjs` and mbt pass, and the model is updated if the flow changes.
- [ ] Build (Vite 8 / Rolldown only): a placeholder in the CSS, filled in `renderChunk` once all modules are transformed.
- [ ] Sort: layer, then condition (min-width ascending, then pseudo order; only layer `_.a` exists until conditions land), then shorthand before longhand (`padding` before `padding-left`), then class name.
- [ ] LightningCSS targets from the same browserslist query as `support.ts`; the demo config uses them.
- [ ] Fixtures and a test: `cx(pl(2), p(4))` and `cx(p(4), pl(2))` both give padding-left from pl; two modules with the same rule give one rule; the demo build has one CSS file.
