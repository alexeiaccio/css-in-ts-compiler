---
# cssints-iihm
title: Every new option on a primitive is six edits in the spec bridges
status: completed
type: task
priority: normal
created_at: 2026-11-17T09:43:30Z
updated_at: 2026-11-17T15:58:39Z
---

Implementing `feedback` (#209) needed edits in six places that have nothing to do with feedback:

- `packages/apg-specs/src/apg/slider.bridge.ts` (`parseSlice`),
- the `CONFIG_KEYS` sets in `switch.bridge.ts` and `checkbox.bridge.ts`,
- the `default: throw` of the normalisers for `spinbutton`, `slider-multithumb` and `checkbox-group`.

Each normaliser throws `Unsupported` on a config key it does not know, by design ("never widen the generator to accept them silently"). The cost: adding any option to any primitive is a six-file edit in another package, and forgetting one turns the new option into a runtime throw in every scenario that passes it — after the primitive is written and tested.

**Direction**: keep the throw for a key that would *change the modelled behaviour* (an event, a value, a mode the spec has), and ignore-with-a-warning for a key that is an **output sink** (`feedback`) or otherwise invisible to the model. One list of "keys the model ignores" in `apg-specs`, so the next sink is one entry rather than six edits — plus a bridge test asserting a sink key is accepted and silently ignored.

## Summary of Changes

PR **#215** (`refactor/ignored-config`, merged as `460d253b`).

The rule, as it now lives in `packages/apg-specs/src/scenario.ts` beside `Unsupported`: **a key the model cannot observe** (an output callback, a preference, a host seam) is accepted and ignored; **a key that would change modelled behaviour** must reach the model, so it is not listed and still throws. Two exports — `IGNORED_CONFIG_KEYS: ReadonlySet<string>` (single member: `feedback`) and `checkUnknownConfigKey(key, value)`, the one rejection point, keeping the old `config key=value` message shape.

The six special cases #209 left (`parseSlice` in `slider.bridge.ts`, the `CONFIG_KEYS` sets in `switch`/`checkbox`, the `default: throw` of `spinbutton`, `slider-multithumb`, `checkbox-group`) are gone, and the same one-line routing was applied to **44 normalisers** across the bridges (`canvas`, `patterns/*`, the shared `listbox-shared.ts` included) — one verdict everywhere.

**Tests** (`test/apg/bridge-config.test.ts`, 15): both halves for the six bridges (a config with each ignored key yields the same steps as without it; `{ nonsense: 1 }` still throws `Unsupported` naming the key), plus a coverage test that globs all 48 `*.bridge.ts` and mounts each with `{ feedback: true }` — chosen over a bridge↔normaliser table because the table would re-create the staleness the six edits had. Mutation-checked: reverting `tooltip.bridge.ts` to a bare throw fails it.

**Cost of the next sink key**: one line in `IGNORED_CONFIG_KEYS`, proved by that coverage test — instead of six edits in six files, one of which is forgotten and throws at scenario runtime.

Checks: apg-specs 53 files / 1030 passed; headless 79 / 1457; `typecheck` 47/47; lint and fmt clean in the touched files (the rest is pre-existing master drift).
