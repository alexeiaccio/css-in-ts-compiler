# ai-automation

Agent-executable verification tooling, adopted from
[typeonce-dev/ai-automation](https://github.com/typeonce-dev/ai-automation) as an
Effect-relevant subset. The reference repo is a pattern source, not a template:
React, Next.js, Tailwind, and XState rules were intentionally not adopted.

## Contents

| Path                  | What it is                                                           |
| --------------------- | -------------------------------------------------------------------- |
| `src/plugin.ts`       | Oxlint JS plugin (`automation/*`) with the adopted rules             |
| `src/rules/`          | Rule implementations (copied from the reference, unchanged behavior) |
| `src/catalog.ts`      | Rule metadata: profile, severity, description                        |
| `src/profiles.ts`     | Profile helpers (`core`, `effect`, `anti-slop`) for wiring lint      |
| `scripts/diff-check/` | Added-lines-only review check (see its README)                       |
| `test/`               | Behavioral rule tests and registry parity test                       |
| `vendor/anti-slop/`   | Curated MIT subset of dmmulroy/anti-slop (see its `UPSTREAM.md`)     |

## Adopted rules

**Effect profile** — `no-cascading-layer-provide`, `no-effect-asvoid`,
`no-global-json`, `no-in-operator`, `no-nested-effect-array-methods`,
`no-nested-layer-provide`, `no-shadowed-standard-array-static`,
`no-silent-error-swallow`, `no-static-effect-service-forwarders`,
`no-try-catch`, `no-typeof-object`, `pipe-max-arguments`,
`prefer-effect-match`, `prefer-option-from-nullable`.

**Core profile** — `no-banned-type-assertions`, `no-multiple-function-params`,
`no-optional-function-parameters`, `no-type-assertion`.

**anti-slop profile** (vendored from
[dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), MIT — see
`vendor/anti-slop/UPSTREAM.md` for provenance and the intentionally unadopted
rules):

- Effect tagged values: `no-manual-effect-error-tag`,
  `no-manual-tag-comparison`, `no-manual-tagged-construction`,
  `no-service-constructor-imports`.
- Boundary hygiene: `no-unknown-parameters`, `no-unknown-returns`,
  `no-unknown-type-aliases`, `no-unsafe-dictionary-type`,
  `no-known-value-widening`, `no-widen-then-assert`.
- Perf and cheap wins: `no-array-filter-map`, `no-reduce-accumulator-copy`,
  `no-module-mocking`, `no-reflect-get`, `no-reflect-apply`,
  `no-object-parameters`.

The vendored rules are registered in the same `automation` plugin and catalog
(do not add a second plugin namespace). `prefer-effect-match` is intentionally
absent because the harness already ships it.

Severities are declared once in `src/catalog.ts`. Rules with pre-existing
violations roll out as warnings; the rest are errors.

## Wiring

- Custom rules run through `pnpm run lint` (vite-plus loads the plugin via
  `lint.jsPlugins` in `vite.config.ts`). The config spreads
  `profiles.effect`, `profiles.core`, and `profiles['anti-slop']`, and enables
  the native `oxc/no-accumulating-spread` rule alongside
  `no-reduce-accumulator-copy`.
- `tools/ai-automation/vendor/**` is excluded from lint and fmt; vendored code
  keeps its upstream style. The vendored rules import `@oxlint/plugins`, which
  is hoisted from the Vite+ toolchain; see `vendor/anti-slop/UPSTREAM.md` for
  the version-bridge details.
- Added-lines review check: `node --import tsx
tools/ai-automation/scripts/diff-check/src/main.ts --config
tools/ai-automation/scripts/diff-check/diff-check.config.json --base
origin/main` (also available as `pnpm run diff:check`).

  vite-plus replaces the `oxlint` binary with an LSP-only wrapper, so the
  diff-check drives the full CLI engine directly via
  `node_modules/oxlint/dist/cli.js`. Its rule set lives in
  `scripts/diff-check/diff-check.oxlintrc.json` and stays out of the
  repository-wide lint on purpose. It enables the `anti-slop` profile on added
  lines and excludes `tools/ai-automation/` so the harness is not flagged by
  its own rules; `scripts/diff-check/test/config-sync.test.ts` keeps the
  enabled list in sync with `src/profiles.ts`.

- Severity rollout: rules with pre-existing violations are enabled as
  `warn` (see `src/catalog.ts`). Promote a rule to `error` in `catalog.ts`
  once its violations are fixed, and mirror it in the root `vite.config.ts`
  (the root config spreads `profiles.effect` and `profiles.core`).

## Adding a rule

1. Copy or write the rule in `src/rules/` (syntax rules use the
   `oxlint/plugins-dev` `RuleTester` shape).
2. Register it in `src/plugin.ts` and `src/catalog.ts` (name, profile,
   severity, description).
3. Enable it in the root `vite.config.ts` lint rules under `automation/`.
4. Add positive and negative cases to `test/rules.test.ts`. The registry test
   fails if any registered rule lacks a behavioral test block.

### Declarative bans

For simple "ban this pattern" rules, use the factories in
`src/rules/ban.ts` instead of hand-writing a visitor:
`banMember`, `banCallOfMember`, `banCallOf`, `banNewExpr`, `banStatement`,
`banImport`, and `banMultiple`. They are dependency-free (no Effect runtime)
and cover the edges plain `obj.prop` matchers miss: chained object paths
(`globalThis.JSON.parse`) and computed string properties (`Reflect['get']`).

```ts
import { banStatement } from './ban.ts';

export default banStatement('TryStatement', {
  message: 'Do not use try/catch; use Effect error channels.',
  description: 'Avoid try/catch; use Effect error channels.',
});
```

See `test/ban.test.ts` for the supported shapes.
