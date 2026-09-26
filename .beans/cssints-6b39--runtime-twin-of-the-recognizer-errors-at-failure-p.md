---
# cssints-6b39
title: Runtime twin of the recognizer, errors at failure point, runner wiring
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

## Summary of Changes
- `spikes/typelevel/twin.ts`: the same lexer, parser and recognizer as functions (`next`/`parse`/`consume`/`valid`). It is stricter than the types: ranges, CSS numbers, hex digits, fixpoint repetition.
- Errors: the runtime reports the furthest failing leaf with the expected labels, and the types report the shortest remainder. `border("1px solud")` names `"solud"` in both.
- The type message is deferred with `S extends string`: 200 calls went from 198 k to 209 k instantiations, with nothing added per call.
- `cases.ts` is one table checked by `probe.ts` (types) and `check.ts` (runtime).
- The lexer range bug (`{3} , <x>? )`) is fixed in both twins.
- `macro.mjs` validates every declaration. `mdn.ts` covers all 48 runner properties. `fixtures/invalid.ts` fails at build time, and `app-react` builds clean.
