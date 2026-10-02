---
# cssints-bogz
title: 'firstThatWorks(): ordered value fallbacks tied to the BCD warnings'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-01T07:23:13Z
updated_at: 2026-10-01T07:55:05Z
parent: cssints-9js6
---

## Question

A typed `css.firstThatWorks("100dvh", "100vh")` (name open: `fallback`, `first`) usable as a part of any property: the build emits both declarations in CSS order (fallback first, the wanted value last), each part grammar-checked for the property, and the BCD support warning for the first value is silenced when the fallback value is supported by every lacking target (support.ts already knows which targets lack a value). Decide the atomic-class shape (one class with two declarations, so cn() dedupes as one), the type (a Part that carries both values, checked by Valid<P>), and what happens with tokens and var(). Fixture, type tests, bench, API.md.

## Todo

- [x] firstThatWorks(...values): one atomic class, declarations in CSS order (wanted last)
- [x] types: Fallback part carrying the values, each checked by Valid per value, error on the part
- [x] build-time grammar check per value; tokens and var() allowed
- [x] BCD warning silenced when every lacking target supports a fallback, else names the still-lacking targets
- [x] limits decided: several parts duplicate the declaration, one per declaration, not a Typed OM value, not in style()
- [x] fixture, type tests, bench row, API.md, demo use
- [x] Vite's minify keeps the fallbacks only with build.cssTarget (cssTarget export, README, demo config)

## Summary of Changes

`firstThatWorks(wanted, ...fallbacks)` (primary name; no `fallback` alias, since the wanted value comes first) is a part of any property. A Decl got a 4th element, the fallbacks; the rule prints them reversed before the wanted value, and the class hash covers them, so one class holds all declarations. Types: `Fallback<V>` is a `Part`; `Check` checks the wanted value as before and each other value in the whole declaration (`Alts`/`Others`), the message lands on the `firstThatWorks(...)` argument and names the bad value. Support: targets lacking the wanted value that support a fallback are not warned about; the warning keeps only targets that lack every value. Limits: one per declaration (several parts repeat the declaration), strings and tokens only, not for `style()` or typed positions. Finding: Vite's CSS minify ignores `css.lightningcss.targets` and uses `build.cssTarget`, so with `cssTarget: false` LightningCSS merged the fallback away; `cssints/vite` now exports `cssTarget`. Tests: test/fallback.mjs, fixtures/fallback*.ts, test/types/fallback.ts, bench rows in bench/users.ts (budget users.ts 795192 to 851906 tsc).
