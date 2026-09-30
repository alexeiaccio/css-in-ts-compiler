---
# cssints-xrzv
title: 'Pending substitution: var() and if() in any property value'
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
    - wayfinder:task
created_at: 2026-09-29T16:57:52Z
updated_at: 2026-09-30T10:16:52Z
parent: cssints-vy0o
---

## Question

After cssints-gcuz, `var()` and `if()` are accepted only in `<color>`. CSS allows them in any property value: the value is then "pending substitution" and valid at parse time. Should the twin and the types accept `var()`/`if()` anywhere, and still check the rest of the value (stricter than Chrome), or treat such a value as unchecked? This interacts with tokens, which are already checked by substituting a literal of their type.

## Resolution
Accept `var()` and `if()` in any property value (2026-09-30). Each `var()` and each `if()` branch value stands for any value (an "any" placeholder, like CSS pending substitution), while the rest of the value is still checked, which is stricter than Chrome. Tokens are unchanged: they are still checked by substituting a literal of their type. Implementation is this ticket.

## Todo

- [x] twin-core: placeholder (var, env, if) at leaves, closing after trailing calls, `#` commas, `||`/`&&` heads, documented rule and limits
- [x] css.ts: the same at type level; budgets measured and updated
- [x] cases.ts rows both ways, runtimeOnly; animation, background, rotate, text-indent
- [x] gen.ts emits `var(--x)` placeholders; diff.ts agrees with Chrome 154
- [x] cssints engine: a raw var() string part passes in any property (fixtures, type tests)
- [x] API.md, all checks, bench, demo build, diff numbers

## Summary of Changes

`var()`, `env()` and `if()` are accepted anywhere in any property value. Each stands for zero or more component values, commas included; the rest of the value is still checked (`padding: var(--a) red` and `border: 1px var(--x) solud` fail). The rule and its limits are documented in `twin-core.ts` ("Pending substitution").

- **Twin:** `Ctx.pend` is set only for a value that contains a call; a failing leaf at a call tries "stand for it and end / stay / be empty". Functions and values close after trailing calls; `#` lists let a call hold the comma; in `||` and `&&` a call at the head stands for any parts (`&&` still requires every part otherwise).
- **Types:** same rule with a `P` flag on `Consume` (`MatchesValue`), calls as balanced tokens, `var(--` only. Tokens unchanged.
- **Engine:** a raw `var(--user-thing)` passes (fixtures `pending.ts`, `pending-bad.ts`, type tests).
- **Budgets:** net +2 to +3% on the existing benches, fixed declaration cost +6k (`empty.ts`), `relative.ts` +16%, new `pending.ts` bench.
