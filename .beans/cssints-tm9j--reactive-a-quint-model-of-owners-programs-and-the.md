---
# cssints-tm9j
title: 'reactive: a Quint model of owners, programs and the flush'
status: completed
type: task
priority: normal
created_at: 2026-10-31T08:33:55Z
updated_at: 2026-10-31T11:18:08Z
---

A Quint model of `@cssints/reactive` (cssints-zrt2): its rules are small enough to check by eye today, and the browser test (`packages/reactive/test/browsers.mjs`) is already scenario-shaped (action → frame). This task is where the model goes when the rules start to branch, so the invariants are not lost.

## What to model

- **The tree**: owners (each with a set of `(name, value)` states and the group marker), the elements inside each owner with programs (`(event, action, name, value?)`) and bindings (`(attribute, name)`), and nested owners.
- **A step** = one event: from the target up, every element with a program for that event applies its actions to the nearest owner; then, once, every binding of each touched owner is written (the flush). Setup is the initial step.
- **Actions**: `toggle` (boolean), `set` (a value); the ten events are data in the model.

## Invariants (the reason for the model)

- `nearest`: for every binding element, its attribute equals the value of the **nearest** owner — not an outer one, not a stale one.
- `isolated`: an event whose program sits in a subtree changes only the nearest owner (and no sibling owner).
- `setup`: after the first step, every owner has a `data-reactive-<name>` for each declared state, and no other.
- `atomic`: a step is one flush — there is no observable state between the actions of one event (in Quint, the step is the flush; the browser replay is what proves the implementation has no intermediate paint).
- `deep`: a condition of a descendant reads the nearest owner's attribute, not an inherited stale one.

## Where and how

- The spec in `packages/apg-specs/specs/patterns/reactive.qnt` (the house pattern group, as `resizable-panels.qnt`), generated and replayed by the existing pipeline: `bun run generate:all`, a bridge in `src/patterns/reactive.bridge.ts`, scenarios in `scenarios/patterns/`; never edit the generated files.
- The replay in `packages/reactive/test/browsers.mjs` (or a `test/scenarios.mjs` it calls): a tiny DOM harness — ids for owners, programs and bindings; actions as clicks/keys; expectations as attributes and computed styles — reusing the page the browser test already builds.
- The hand-written browser test stays as the fast oracle; the model's traces add the sequences nobody wrote (two owners, a nested owner, a program on an ancestor, a binding added late).

## When to pick it up (not now)

- when `@cssints/reactive` gains async (holds, loading/error boundaries — Solid's F-1…F-12 are the reference), derived values, `perform()` (a write outside an event), shared/global state, or a second consumer replaying the traces;
- or when a bug appears that a two-owner sequence would have caught.

## Cost

A spec (~150 lines), a bridge (~150), the scenario files and the replay harness (~100), plus `generate:all`/typecheck:quint time. For today's three protocol properties and one synchronous runtime, the browser test already covers the same ground; that is why this is a task and not part of cssints-zrt2.



## Summary of Changes

- `packages/apg-specs/specs/patterns/reactive.qnt`: two owners (the outer with an inner nested in it), each with `open` and `tab`, the four kinds of binding (a source, a comparison, a choice, a literal) per subtree, a `<select>` from `@value`, a checkbox from `@checked`, a keydown program on the outer owner element and one `inside(open)` condition per subtree. 14 actions, 30 vars. The generated model and scaffolding are from `bun run generate:all`.
- Invariants: `Nearest`, `Setup`, `Isolated` (snapshots of both owners at the step start), `Deep`, `ComparisonReadsNearest`, `Atomic`, `ScopeKnown`; a bounded exploration is 282 states at depth 4 / 319 at depth 5 with no violation. `test/patterns/reactive.test.ts` pins the list and gives each invariant a hand-built bad state.
- `src/patterns/reactive.bridge.ts` and `scenarios/patterns/reactive.spec.json` + `reactive.owners.spec.json` (12 scenarios, all replayed by the spec driver).
- The replay: `packages/reactive/test/scenarios.mjs` (the scenario engine plus two seeded differential walks) on `test/fixtures/model.ts` / `model.js`, in Chrome, Firefox and WebKit; each step is read immediately and again two frames later, so one event must paint once. `test:scenarios` script; `@cssints/apg-specs` and `@quint-machine/core` as devDependencies.
- **Found**: `inside()` is `within(attr(...), "reactive")`, a CSS ancestor match, so a nested owner that declares the same state as an outer owner is also matched by the outer one. The spec states the union (`insideDisplay`); `packages/reactive/README.md` Limits and the wayfinder entry say it. Bindings stay nearest (the runtime computes them off `closest()`).
- Docs: `packages/reactive/README.md` (the model, the replay command, the `inside()` limit), `packages/apg-specs/README.md`, `scenarios/patterns/README.md`, a wayfinder entry; one changeset (`@cssints/apg-specs` minor, `@cssints/reactive` patch).
- Not modelled: persistence and the reload, the MutationObserver (a late binding), a sibling owner, the ten events beyond those used, more than two values per state.
- Checks: `generate:all` twice byte-identical, `typecheck:quint` 45 clean, apg-specs 931 tests, reactive replay 14 traces in three browsers, `test/browsers.mjs` in three, `build:packages`, `test/docs.mjs` 49 blocks, lint and fmt on the touched files, `bun run typecheck` 43/43, `release:check` green.
