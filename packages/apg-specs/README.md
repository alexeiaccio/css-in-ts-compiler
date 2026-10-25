# @cssints/apg-specs — APG widget specs

The Quint specs behind [`@cssints/headless`](../headless/README.md): one spec per WAI-ARIA APG pattern, one per non-APG pattern composed of them (resizable panels), plus the canvas camera/pointer contract; the generated models and typed scaffolding, the `SpecBridge` for each pattern, the scenario sets (ported upstream ones and our own), and the spec-only verification. It is the test oracle of the widgets and of `native/headless`, and it is published so that widget libraries outside this repository can replay the same specs and scenarios against their own code.

The generated files (`*.model.generated.json`, `*.scaffolding.generated.ts`) are written by the code generation of [`@quint-machine/core`](https://www.npmjs.com/package/@quint-machine/core) and are never edited by hand. Ticket ids like `effects-of-atmosphere-dx00` in the comments of the specs and tests are tickets of the repository these files came from.

## Layout

```
specs/apg/<pattern>.qnt                           # APG pattern specs (one behavior-machine each)
specs/canvas/<machine>.qnt                        # canvas camera + pointer specs
specs/patterns/<machine>.qnt                      # non-APG patterns composed of APG widgets (resizable-panels)
shared/<module>.qnt                               # vocabulary + pure defs: aria, focusgroup, popover, invokers, details-group
src/<service>/<machine>.model.generated.json      # generated model document
src/<service>/<machine>.scaffolding.generated.ts  # generated typed scaffolding
src/apg/<pattern>.bridge.ts                       # scenario vocabulary <-> spec events/state
src/patterns/<machine>.bridge.ts                  # the same, for a non-APG pattern
src/scenario.ts                                   # scenario decoder + replay/differential-walk runtime
scenarios/apg/*.json, scenarios/canvas/*.json     # ported upstream scenario sets
scenarios/patterns/*.json                         # scenarios written from our own pattern specs
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
- `bun run typecheck` — `effect-tsrs` over `src`, `test` and `scripts`.
- `bun run check` — all of the above, in order.
- `bun run build` — `vp pack`: `dist/` (the runner and the bridges as ESM with `.d.mts`, the generated models as `.json`).

## Install and use

```sh
npm install @cssints/apg-specs effect @quint-machine/core
```

`effect` (`^4.0.0`) is a peer, `@quint-machine/core` a dependency. The package has subpath exports only:

| Specifier                                                                        | What                                                                                                             |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `@cssints/apg-specs/scenario`                                                    | the scenario decoder, `replayScenario`, `differentialWalk`, `specDriver`, `Unsupported`, driver and bridge types |
| `@cssints/apg-specs/apg/<pattern>.bridge`                                        | the `SpecBridge`, `<pattern>Config`, `<pattern>Steps` and `<pattern>Probe` of a pattern                          |
| `@cssints/apg-specs/apg/<pattern>.model.json`                                    | the generated model document (`src/apg/<pattern>.model.generated.json` in the repository)                        |
| `@cssints/apg-specs/patterns/<machine>.bridge`                                   | the same for a non-APG pattern composed of APG widgets (`resizable-panels`)                                      |
| `@cssints/apg-specs/patterns/<machine>.model.json`                               | its generated model document (`src/patterns/<machine>.model.generated.json`)                                     |
| `@cssints/apg-specs/canvas/{canvas.bridge,camera.model.json,pointer.model.json}` | the canvas bridge and models                                                                                     |
| `@cssints/apg-specs/scenarios/apg/<pattern>.<set>.json`                          | a ported scenario set (also `scenarios/canvas/*.json`, `scenarios/parts.json`)                                   |
| `@cssints/apg-specs/scenarios/patterns/<machine>.spec.json`                      | a scenario set written from our own pattern spec                                                                 |
| `@cssints/apg-specs/specs/apg/<pattern>.qnt`                                     | the raw Quint spec (also `specs/canvas/*.qnt`, `specs/patterns/*.qnt`, `shared/*.qnt`, which the specs import)   |

```ts
import {
  Unsupported,
  differentialWalk,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { buttonBridge, buttonConfig } from "@cssints/apg-specs/apg/button.bridge";
import buttonModel from "@cssints/apg-specs/apg/button.model.json" with { type: "json" };
import baseUi from "@cssints/apg-specs/scenarios/apg/button.base-ui.json" with { type: "json" };
```

In this repository the `development` (vite, tsc) and `bun` export conditions point at `src/`. The scenario format is specified in `scenarios/apg/README.md`; `scenarios/patterns/` holds the scenarios of our own non-APG patterns (same format, no upstream).
