---
# cssints-674d
title: 'reactive: the field''s value and several programs on one element'
status: completed
type: feature
priority: normal
created_at: 2026-10-31T08:57:02Z
updated_at: 2026-10-31T09:12:41Z
---

Round two of `@cssints/reactive` (cssints-zrt2): (1) the value of the field sets the state, (2) several programs on one element merge instead of overwriting.

**1. Payloads.** `set(source, value())` / `set(source, checked())` take the value from the element the event fired on, so a `<select>`, a checkbox or a text field drives a panel with no JS. Protocol: the value token is `@value` / `@checked` (`change set tab @value`), read as `target.value` / `target.checked ? "true" : "false"`; a literal stays as it is. Types: `Payload<T>` branded, only `set()` takes it (`set(open, value())` and `set(tab, checked())` are type errors).

**2. Lists that append.** Two `on()` calls in one `cn()` today silently overwrite: both set `--reactive-on`, and `merged()` keeps the last. Engine: a declaration may be a list (a fifth element of `Decl`, `join: ","`), and `merged()` appends two lists of the same property under the same conditions instead of replacing; a list and a plain value of the same property is a build error. Author surface: a helper from `cssints/plugin` (`append(prop, value)`). The runtime dedupes repeated segments (the same program twice would otherwise toggle twice).

## Todo
- [x] Engine: `join` in `Decl`, append in `merged()`, the helper, one fixture (two lists → one atom with the joined value; list + value → error), docs/API.md
- [x] Reactive: `value()`/`checked()` and the runtime tokens, lists in `state()`/`on()`/`bind()`, dedupe, build errors
- [x] Type tests, package tests, browser tests (a select drives tabs, a checkbox a disclosure, two `on()` on one element)
- [x] README/API.md/wayfinder, changesets, verified: cssints suite + perf, typecheck, lint/fmt, browsers, build:packages, release:check


## Engine gaps
- `cn()` kept the later declaration of a property, so two `on()`s (both set `--reactive-on`) dropped the first program with no error. Closed by the list declaration (`join` in `Decl`, `append()` in `cssints/plugin`) and `merged()` joining two lists under one condition.
- `set()` was a plain library function, so its own build errors are MacroErrors (located at the call), not a member's MemberError; a literal value with `@` is one.
