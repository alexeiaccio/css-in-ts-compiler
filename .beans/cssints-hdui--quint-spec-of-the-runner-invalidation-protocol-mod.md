---
# cssints-hdui
title: Quint spec of the runner invalidation protocol + model-based tests
status: completed
type: task
priority: normal
created_at: 2026-09-26T08:20:01Z
updated_at: 2026-09-26T11:43:05Z
parent: cssints-tmv8
blocked_by:
    - cssints-y3r3
---

The bugs so far were ordering bugs, not logic bugs: wyw bug 3 only showed with button-first, and `app/hmr.mjs` checks two orders with one token file. The Module Runner plugin has shared state that tests barely touch: the process-global `globalThis.__cssints` registry, the runner cache invalidated before `import`, `depsOf` for `hotUpdate`, parallel transforms in build, and (depending on the y3r3 fix) DOM globals installed around `runner.import`. A model turns "HMR is correct by construction" into a checked claim.

Model (~60-80 lines of Quint):
- State: file sources, import graph, runner cache, registry, what each client module last received.
- Actions: `edit(f)`, `transform(f)`, `hotUpdate(f)`, two `transform`s interleaved.
- Main invariant: the classes every client module sees match the current sources.

- [x] Write `spikes/runner/spec/runner.qnt` for the plugin as it is after y3r3
- [x] `quint run` with invariants, no driver; record any counterexample it finds
- [x] Model-based test: the driver runs a real Vite dev server with plugin.mjs; compare state after each step. Not with `@effect4`: its `@firfi/itf-trace-parser` peer-binds to this package's effect 4.0.0-beta.107 while quint-connect uses its own 4.0.0-rc.112, and pick decoding fails. `latest` (Effect 3, nested) with Zod works.
- [x] Use `any { ... }` for the step action (the TS backend loses action names otherwise); remember that Quint `int` arrives as `bigint`
- [x] Record results in docs/wayfinder.md: not edited in this worktree (instruction); the paragraph went to the parent session

Out of scope: the grammar and the twins. Those are pure functions over strings, covered by the differential-testing bean.

## Summary of Changes

- `spikes/runner/spec/runner.qnt` models plugin.mjs in a dev server (card and button import tokens), one step per stretch of JS between awaits: file versions, ssr module graph, runner fetches in flight and node cache, the registry, `depsOf`, Vite's client cache with its two kinds of invalidation, and the runner's own HMR re-import. `FIX` selects the plugin now (`fixed`) or before (`original`). Invariants: `servedFresh` (once nothing is in flight, every cached module matches its sources and tokens), `readsOwnSites` (a transform reads the sites its own evaluation wrote), `depsOfKnown` (wyw's bug: every served module is in `depsOf`).
- `quint run` on `original` broke `servedFresh` and `readsOwnSites`. Two real bugs, reproduced by `spec/race.mjs` (holds an ssr transform after it read the file):
  - firstTransform: tokens.ts saved while card.ts is transformed for the first time: `depsOf` does not know card yet, so hotUpdate skips it and Vite caches the old classes.
  - doubleSave: tokens.ts saved twice in a row: the runner's HMR re-import (after save 1) fetches tokens; transforms after save 2 join that fetch of the older source and are cached stale. Both card and button.
  - `depsOfKnown` holds in both: the wyw bug is not here.
- plugin.mjs fix: evaluations run one at a time (`Semaphore`), each from a cleared runner; runner HMR off; `hotUpdate` also returns in-flight transforms and invalidates the affected modules with `invalidateModule` so Vite does not cache a result that is being computed. Taking out any part except the clear breaks an invariant (the clear replaces the runner-HMR clear for chains deeper than the model has).
- `fixed`: no violation in 1,000,000 traces x 60 steps (rust backend, 2.5 min); the witness `settledAfterEdits` held in 67% of them. `quint verify` (Apalache) found the original's counterexample at depth 12 in 14 min, too slow for the fixed model.
- `spec/mbt.mjs` + `spec/harness.mjs`: model-based test with `@firfi/quint-connect` (latest + Zod), a fresh dev server on a temp app per trace, every ssr transform gated so the trace decides when fetches finish; compares what each client module serves after every step. 10 x 8 in 6 s, 100 x 12 in 65 s, passes; on the original plugin it fails with a state mismatch.
- `spec/trace.mjs` prints an ITF trace one step per line.
