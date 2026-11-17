---
# cssints-iihm
title: Every new option on a primitive is six edits in the spec bridges
status: todo
type: task
priority: normal
created_at: 2026-11-17T09:43:30Z
updated_at: 2026-11-17T09:43:30Z
---

Implementing `feedback` (#209) needed edits in six places that have nothing to do with feedback:

- `packages/apg-specs/src/apg/slider.bridge.ts` (`parseSlice`),
- the `CONFIG_KEYS` sets in `switch.bridge.ts` and `checkbox.bridge.ts`,
- the `default: throw` of the normalisers for `spinbutton`, `slider-multithumb` and `checkbox-group`.

Each normaliser throws `Unsupported` on a config key it does not know, by design ("never widen the generator to accept them silently"). The cost: adding any option to any primitive is a six-file edit in another package, and forgetting one turns the new option into a runtime throw in every scenario that passes it — after the primitive is written and tested.

**Direction**: keep the throw for a key that would *change the modelled behaviour* (an event, a value, a mode the spec has), and ignore-with-a-warning for a key that is an **output sink** (`feedback`) or otherwise invisible to the model. One list of "keys the model ignores" in `apg-specs`, so the next sink is one entry rather than six edits — plus a bridge test asserting a sink key is accepted and silently ignored.
