---
# cssints-im52
title: '@cssints/machine: a minimal state machine for UI protocols'
status: completed
type: task
priority: normal
created_at: 2026-11-01T12:24:47Z
updated_at: 2026-11-01T12:33:21Z
---

## Goal

A new package, packages/machine -> @cssints/machine: a minimal, dependency-free, type-safe state machine for UI, with effects as data (handles, stale completions), debounce with flush/cancel, an injectable clock, an external store with selector subscriptions, a Solid store bridge and a harness that proves five properties in plain node.

## Notes

- No dependencies; plain code, added to plainCode in vite.config.ts with a reason.
- New package in the fixed release group (29).
- docs/API.md section, docs/wayfinder.md entry, README, changeset.
- Tests: test/machine.mjs (five properties + definition validation + selectors), test/store.mjs (Solid store, projection, optimistic, atomicity), test/types/machine.ts (@ts-expect-error).
- Solid 2 rc.13: createStore mutates fields; createProjection reads the committed frame (not an optimistic override); createOptimisticStore's derived form follows the committed store and reverts an action's write at settle.



## Summary of Changes

- packages/machine: src/index.ts (defineMachine/createMachine, effects as handles, debounce with flush/cancel, injected clock, subscribe/selector), src/harness.ts (fake clock, queue, race/interleave, flushEffects, log), src/solid.ts (createMachineStore: createStore, createProjection, derived createOptimisticStore).
- Tests: test/machine.mjs (the five properties, definition validation, after, selectors, context replacement), test/store.mjs (field granularity, projection, optimistic lead/settle/rollback, atomicity), test/types/machine.ts (@ts-expect-error).
- Wiring: .changeset/config.json fixed group (29), .changeset/machine.md, plainCode + lint override in vite.config.ts, diff-check exclude, AGENTS.md layout and counts, RELEASING.md, docs/API.md section, docs/wayfinder.md entry.
- Gates: package test/typecheck, root typecheck 44/44, build:packages 29/29, release:check, diff:check (only pre-existing cssints/reactive findings from the stale master ref), vp fmt --check.
- Solid finding: a createProjection reads the committed frame, not an optimistic override; the visual phase is read off optimistic directly.
