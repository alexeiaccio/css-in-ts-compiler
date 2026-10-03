---
# cssints-mbky
title: 'cv(): base and variants that overlap without containment'
status: completed
type: task
priority: normal
created_at: 2026-10-02T16:38:32Z
updated_at: 2026-10-03T10:44:04Z
parent: cssints-co8y
---

## Question

Found in cssints-5d42: a `borderColor` in a `cv()` variant lost to a `borderBottom` in the base; they overlap without containment (both set border-bottom-color), and the sheet orders them by leaf count, not by intent. `cn()` refuses such pairs (cssints-33ah), but `cv()` joins base and variant classes at runtime through `_cv`, so the build never compares them. cv() knows its base and every variant at build time: check base against each variant (and compound variants) with the same `relation()`, and raise the same overlap error at the cv() call. Decide whether same-property-in-base-and-variant should be allowed (the variant is meant to win: today it wins only if the sort puts it later, which for the same property is the class hash): probably the variant's declaration must win, which needs it later in the sheet or a dropped base declaration when that variant is active.

## Decision

cv() has no compound variants (config: base, variants, defaultVariants), so the check covers base against each variant value and variants of different keys against each other. Values of one key are never compared.

- Overlap without containment, base against a variant value or between two keys that can be active together: build error at the cv() call, in the style of cn().
- The same property (or an alias, or a shorthand over a base longhand) in two different keys: build error, nothing says which wins.
- The same property in base and variant, under one condition: the variant wins. The base class is dropped while that value is active (`drops` entry in the shipped config, read by _cv). A variant longhand inside a base shorthand needs nothing: the sheet puts the longhand after.
- Measured on apps/sky and apps/demo: dropping the base declaration only when every value of a key overrides it (option 1) fixes 0 of the 2 real cases in sky (Shell navItem: gap(3) vs gap(1) in place.bar, color(textHigh) vs color(text) in active.yes, today decided by the class hash); a variant layer or own class per variant use (option 2) duplicates 20 of 40 variant rules in sky (+692 B CSS) and 6 of 16 in demo (+182 B); the drops (option 3) cost 0 classes, 0 sheet bytes, +63 B of JS in sky and +69 B gzip in runtime.ts (387 to 495 B minified).
- sky's profile tab cannot go back to borderColor: it overlaps the base's borderBottom, which is now the build error; borderBottomColor stays.

## Summary of Changes

settled() in lib.ts compares base and variants with relation() and returns the classes a variant value replaces; cvOf in macro.ts raises its errors at the cv() call and ships `drops` only where there is one; _cv in runtime.ts drops those base classes while the value is active. Tests: fixtures cv-cascade.ts, cv-overlap.ts, cv-overlap-keys.ts, cv-same-keys.ts, test/cascade.mjs (config, runtime result, sheet order, error text and line), test/cv-chrome.mjs (Chrome computed styles, not in test). docs/API.md: two cv() bullets.
