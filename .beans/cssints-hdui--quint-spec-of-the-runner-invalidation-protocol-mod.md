---
# cssints-hdui
title: Quint spec of the runner invalidation protocol + model-based tests
status: todo
type: task
created_at: 2026-09-26T08:20:01Z
updated_at: 2026-09-26T08:20:01Z
parent: cssints-tmv8
blocked_by:
    - cssints-y3r3
---

The bugs so far were ordering bugs, not logic bugs: wyw bug 3 only showed with button-first, and `app/hmr.mjs` checks two orders with one token file. The Module Runner plugin has shared state that tests barely touch: the process-global `globalThis.__cssints` registry, the runner cache invalidated before `import`, `depsOf` for `hotUpdate`, parallel transforms in build, and (depending on the y3r3 fix) DOM globals installed around `runner.import`. A model turns "HMR is correct by construction" into a checked claim.

Model (~60-80 lines of Quint):
- State: file sources, import graph, runner cache, registry, what each client module last received.
- Actions: `edit(f)`, `transform(f)`, `hotUpdate(f)`, two `transform`s interleaved.
- Main invariant: the classes every client module sees match the current sources.

- [ ] Write `spikes/runner/spec/runner.qnt` for the plugin as it is after y3r3
- [ ] `quint run` with invariants, no driver; record any counterexample it finds
- [ ] Model-based test with `@firfi/quint-connect@effect4`: the driver runs a real Vite dev server with plugin.mjs; compare state after each step
- [ ] Use `any { ... }` for the step action (the TS backend loses action names otherwise); remember that Quint `int` arrives as `bigint`
- [ ] Record results in docs/wayfinder.md

Out of scope: the grammar and the twins. Those are pure functions over strings, covered by the differential-testing bean.
