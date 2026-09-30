---
# cssints-jwdw
title: race.mjs firstTransform flaked once under load
status: todo
type: bug
priority: high
tags:
    - wayfinder:task
created_at: 2026-09-30T08:50:32Z
updated_at: 2026-09-30T08:50:32Z
parent: cssints-vy0o
---

## Question

In cssints-gcho's run, `race.mjs` printed `firstTransform button served null STALE` once while other agents loaded the machine; four reruns passed. The Quint model says this race is fixed, so either the harness has a timing assumption, the model misses a step, or the fix has a gap.

- [ ] Reproduce under load (race.mjs in a loop with CPU stress); record the frequency
- [ ] Find the cause: harness timing (a hold released too early, a wait on the wrong event) or the plugin
- [ ] If it is the plugin: add the missing step to runner.qnt first, show quint finds it, then fix. If the harness: fix the harness
- [ ] 200 loop runs under load without a failure
