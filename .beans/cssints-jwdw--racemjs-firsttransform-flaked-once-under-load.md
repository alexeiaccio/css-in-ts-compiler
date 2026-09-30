---
# cssints-jwdw
title: race.mjs firstTransform flaked once under load
status: completed
type: bug
priority: high
tags:
    - wayfinder:task
created_at: 2026-09-30T08:50:32Z
updated_at: 2026-09-30T09:17:38Z
parent: cssints-vy0o
---

## Question

In cssints-gcho's run, `race.mjs` printed `firstTransform button served null STALE` once while other agents loaded the machine; four reruns passed. The Quint model says this race is fixed, so either the harness has a timing assumption, the model misses a step, or the fix has a gap.

- [x] Reproduce under load (race.mjs in a loop with CPU stress); record the frequency
- [x] Find the cause: harness timing (a hold released too early, a wait on the wrong event) or the plugin
- [x] If it is the plugin: add the missing step to runner.qnt first, show quint finds it, then fix. If the harness: fix the harness
- [x] 200 loop runs under load without a failure

## Summary of Changes

Cause: the harness, not the plugin. `settle()` in test/spec/harness.mjs declared the server idle after 45 ms without a counted step (a spy transform, a hotUpdate, a finished request). A request that is still in its last stretch (module body in the runner, import analysis) counts nothing, so on a loaded machine the wait ended before `transformRequest` resolved, and `served()` read a module with no transformResult: `served null`. Measured with the request's own timestamps: the final card and button requests had `done: null` when `settled` was taken (189 ms and 63 ms after the start), and a request that is not done is not cached.

Frequency before: 1 of 100 with no load, 3 of 50 under load (8 busy loops on 8 cores), plus 1 of 18 in an earlier run. After: 0 of 200 under load.

Fix: `settle()` also waits while a request is unresolved and no transform is held at a gate (`open` counter). Held requests still settle as before. The plugin and runner.qnt are unchanged; quint `fixed` still finds no violation (100000 samples, 60 steps), mbt replay passes.
