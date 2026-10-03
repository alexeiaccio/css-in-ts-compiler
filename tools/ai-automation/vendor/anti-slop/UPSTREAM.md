# Vendored: dmmulroy/anti-slop

This directory is a curated subset of
[dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) (MIT, see `LICENSE`).

- Upstream revision: `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b` (`main`)
- Upstream licence: MIT (reproduced in `LICENSE`)
- Vendored path: `tools/ai-automation/vendor/anti-slop/`

anti-slop is intended to be vendored and edited locally, not consumed as a
fixed dependency. We copy only the rule implementations we enable (and the
shared helpers they require), and wire them through the single `automation`
Oxlint plugin/catalog in `src/plugin.ts` and `src/catalog.ts`. Do not add a
second plugin namespace for these rules.

## Adopted rules

`rules/` (generic): `no-array-filter-map`, `no-reduce-accumulator-copy`,
`no-module-mocking`, `no-object-parameters`, `no-reflect-apply`,
`no-reflect-get`, `no-unknown-parameters`, `no-unknown-returns`,
`no-unknown-type-aliases`, `no-unsafe-dictionary-type`,
`no-known-value-widening`, `no-widen-then-assert`.

`effect/rules/`: `no-manual-tag-comparison`, `no-manual-tagged-construction`,
`no-manual-effect-error-tag`, `no-service-constructor-imports`.

## Intentionally not adopted

- `prefer-effect-match` — already provided by `automation/prefer-effect-match`.
- `no-runtime-typeof` — overlaps `automation/no-typeof-object`.
- `no-chained-type-assertions`, `require-safety-comment-for-type-assertion` —
  redundant with the repository-wide `automation/no-type-assertion`.
- `no-conditional-empty-object-spread`, `no-shape-in-symbol-names` — not a
  match for this repository's policy.
- `require-readable-spacing` — layout is owned by `oxfmt`/`vp fmt`.

## Updating

Prefer a three-way merge from the upstream revision above, preserving local
edits. Keep the adopted/non-adopted split in sync with this file and with
`src/catalog.ts`.

## Local edits

- `shared/dictionary-types.ts` — `unsafeDirectValue` uses `unsafeMembers[0] ?? null`
  to satisfy this repository's `noUncheckedIndexedAccess` setting (upstream does
  not enable it). Behavior is unchanged.

## Version note

The vendored rules import `@oxlint/plugins`, which this workspace does not
declare directly: it is hoisted from the Vite+ toolchain (currently `1.73.0`).
The test harness uses `oxlint/plugins-dev` from Oxlint 1.77.0, whose `Rule`
declaration is not mutually assignable with `@oxlint/plugins@1.73.0`'s.
`src/oxlint-rule-bridge.ts` holds the single deliberate boundary cast for tests.
Runtime rule shapes are identical, and `pnpm test` exercises every adopted rule.

If `@oxlint/plugins` ever becomes a direct dependency, pin it to the exact
version Vite+ provides so the plugin and harness stay in step.

