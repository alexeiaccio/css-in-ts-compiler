# @cssints/apg-specs — APG widget specs

The Quint specs behind [`@cssints/headless`](../headless/README.md): one spec per WAI-ARIA APG pattern (plus the canvas camera/pointer contract), the generated models and typed scaffolding, the `SpecBridge` for each pattern, the ported upstream scenario sets, and the spec-only verification. Private: it is the test oracle of the widgets, and of `native/headless`, not a published package.

The generated files (`*.model.generated.json`, `*.scaffolding.generated.ts`) are written by the code generation of [`@quint-machine/core`](https://www.npmjs.com/package/@quint-machine/core) and are never edited by hand. Ticket ids like `effects-of-atmosphere-dx00` in the comments of the specs and tests are tickets of the repository these files came from.

## Layout

```
specs/apg/<pattern>.qnt                           # APG pattern specs (one behavior-machine each)
specs/canvas/<machine>.qnt                        # canvas camera + pointer specs
shared/<module>.qnt                               # vocabulary + pure defs: aria, focusgroup, popover, invokers, details-group
src/<service>/<machine>.model.generated.json      # generated model document
src/<service>/<machine>.scaffolding.generated.ts  # generated typed scaffolding
src/apg/<pattern>.bridge.ts                       # scenario vocabulary <-> spec events/state
src/scenario.ts                                   # scenario decoder + replay/differential-walk runtime
scenarios/apg/*.json, scenarios/canvas/*.json     # ported upstream scenario sets
scenarios/parts.json                              # part names per pattern
test/<service>/<machine>.test.ts                  # spec-only verification
scripts/generate-all.ts                           # regenerates every spec under specs/
```

Platform-contract modules (`shared/focusgroup.qnt` roving tabindex, `shared/popover.qnt` light dismiss, `shared/invokers.qnt` `commandfor`/`command`, `shared/details-group.qnt` `<details name>`) are one per native web feature; a pattern imports one and models only its delta. `shared/` holds vocabulary and pure defs only.

## Commands

Run in `packages/apg-specs`:

- `bun run generate:all [specs/apg/tabs.qnt ...]` — regenerate artifacts (`node scripts/generate-all.ts`). Each generated file carries the sha256 of its spec; edit a spec, then regenerate. The formatter skips the generated files (`.prettierignore`).
- `bun run typecheck:quint` — Quint's own typechecker over every spec (~90 s).
- `bun run test` — spec-only verification (`vp test run`). The exhaustive explorations (player, camera) take a minute each and can time out on a loaded machine; run them alone before calling a failure real.
- `bun run typecheck` — `tsc-rs` over `src`, `test` and `scripts`.
- `bun run check` — all of the above, in order.

Consumers import by deep path, e.g. `@cssints/apg-specs/src/apg/disclosure.bridge`, `@cssints/apg-specs/src/scenario`, `@cssints/apg-specs/scenarios/apg/tabs.base-ui.json`. The scenario format is specified in `scenarios/apg/README.md`.
