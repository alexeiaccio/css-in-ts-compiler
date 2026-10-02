---
# cssints-lirm
title: 'keyframes() and positionTry(): local at-rules on the kernel seam'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-01T07:23:13Z
updated_at: 2026-10-02T08:10:33Z
parent: cssints-9js6
blocked_by:
    - cssints-su6o
---

## Question

`css.keyframes({ from: {...}, to: {...} })` and `css.positionTry({...})` in a build-time or client module return a typed name (a Token-like value usable in `animation`/`animationName` and `positionTryFallbacks`), and emit the at-rule as a kernel by key (hash of the content) into `_.k` of the modules that use it, so it is tree-shaken by construction. Steps inside keyframes are checked by the same grammar as members; a bad step is a build error at the call site. Decide the name (hash) and the dedupe of identical blocks. Fixture, type tests, bench, API.md, a use in the demo.

## Checklist

- [x] keyframes() and positionTry() return typed names (`<custom-ident>`, `<dashed-ident>`) and emit a kernel by content hash
- [x] steps checked by the member grammar; errors at the call site; positionTry limited to the @position-try properties
- [x] fixtures, type tests, bench rows, docs/API.md section, demo use

## Summary of Changes

- `keyframes(steps)` and `positionTry(style)` in macro.ts: a step is a style of member calls (the form `cn()`/`cv()` take), checked by the same grammar and support warnings as a class. The name (`kf-<hash>`, `--pt-<hash>`, sha1 of the content) is a `CSSStyleValue` (`CSSAtRuleValue`); a member call that holds it carries the rule as a kernel (key `@keyframes <name>`), so the rule is in the sheet of the modules that use it. Rules go in layer `_.k`; names are hashes, so layer order never decides.
- `positionTry` is also the `position-try` property: value parts are still that shorthand, one style is the rule. css-grammar: `⟨dashed-ident⟩` sentinel added to the recogniser.
- kernel.ts: a key starting with `@` declares no custom properties. plugin.ts: custom properties in a module's kernels pull in the `@property` of their tokens. firstThatWorks() rejects a name.
- Tests: fixtures/keyframes-*.ts, position-try-*.ts, test/keyframes.mjs, test/types/keyframes.ts; docs/API.md section; demo uses a helper-module keyframes; users.ts bench +6.8% (58 k), budget updated.
