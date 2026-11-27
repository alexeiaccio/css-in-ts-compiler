---
# cssints-cj4i
title: 'graph-layout: crossing minimization over the dummy slots'
status: todo
type: feature
priority: high
tags:
    - layout
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-27T20:27:36Z
parent: cssints-sw9a
blocked_by:
    - cssints-e3ue
---

The first phase that changes the drawing's quality rather than its validity: the order inside a layer.

- [ ] layer sweep: barycentre (median as a switch) forward and backward passes over the slots, the ties broken by model
  order so the result is a function of the input; the greedy-switch pass as the second half
- [ ] the spec's slot projection as the driver's answer (`graph-layout.slots`), so the walk and the scenarios compare slots,
  not ids
- [ ] the numbers: crossings on a corpus of 1k random graphs, model order vs sweep vs sweep+greedy, in `docs/wayfinder.md`;
  the corpus crossings must not exceed the model-order baseline, and the six spec graphs must keep elk's slot sets under the
  pinned strategies
- [ ] deterministic: a fixed seed corpus run twice gives byte-identical output

Done when: the slot scenarios agree with elk-rs, the corpus numbers are in the wayfinder entry, and the engine's tests are
green.
