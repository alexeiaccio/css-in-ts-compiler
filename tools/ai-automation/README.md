# ai-automation

Agent-executable verification tooling, adopted from
[typeonce-dev/ai-automation](https://github.com/typeonce-dev/ai-automation) (through
effects-of-atmosphere) as an Effect-relevant subset. The reference repo is a pattern source, not a template:
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

- Custom rules run through `bun run lint` (vite-plus loads the plugin via
  `lint.jsPlugins` in the root `vite.config.ts`, beside eslint-plugin-playwright).
  The config spreads `profiles.effect` and names the anti-slop rules it enables;
  the table below says which rule is on, and why the others are off. The native
  `oxc/no-accumulating-spread` is on with them.
- Tests: `bun run test` (here, `vp test run`: Vite+ ships vitest, imported from
  `vite-plus/test`). Typecheck: `bun run typecheck` (tsgo).
- `tools/ai-automation/vendor/**` is excluded from lint and fmt; vendored code
  keeps its upstream style. The vendored rules import `@oxlint/plugins`, which
  is hoisted from the Vite+ toolchain; see `vendor/anti-slop/UPSTREAM.md` for
  the version-bridge details.
- Added-lines review check: `bun run diff:check` at the root (node type
  stripping, base `master`; `--base <ref>` overrides it). Its config,
  `scripts/diff-check/diff-check.config.json`, excludes the plain code of the
  root lint (apps, tests, browser runtimes, hot paths, generated files) and warns
  on a change of `bun.lock`, `vite.config.ts`, `tsconfig.effect.json` and the
  Chrome-judged `webref-properties.json`. A warning exits 1: the key-file ones
  are for a human to read.

  vite-plus replaces the `oxlint` binary with an LSP-only wrapper, so the
  diff-check drives the full CLI engine directly via
  `node_modules/oxlint/dist/cli.js`. Its rule set lives in
  `scripts/diff-check/diff-check.oxlintrc.json` and stays out of the
  repository-wide lint on purpose. It enables the `anti-slop` profile on added
  lines and excludes `tools/ai-automation/` so the harness is not flagged by
  its own rules; `scripts/diff-check/test/config-sync.test.ts` keeps the
  enabled list in sync with `src/profiles.ts`.

- Severity: `src/catalog.ts` gives every effect and anti-slop rule `error` (the
  core ones `warn`, they are not enabled). The root config decides what is on.
  To roll out a rule with violations, turn it on as `warn` in `vite.config.ts`
  and promote it once they are fixed.
- Plain code by design is exempt through `overrides` in the root config (the
  `plainCode` list, with a reason each): browser runtimes, the Typed OM values,
  the twin's recognizer, `@cssints/icons`, the apps, tests and `.mjs` scripts.
  Violations in `macro.ts`, `lib.ts`, `registry.ts`, `author.ts` and
  `author-types.ts` are warnings until cssints-6nqy.

## Rules in this repository

Counts are violations before the cleanup, over packages (src, scripts, tests),
apps and this tool. "Effect code" is what is left once plain code and the five
files are set aside; the effect-code violations were fixed.

| Rule                                                                                                                                                 | Profile   | All | Effect code | Five files | State | Why                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --: | ----------: | ---------: | ----- | --------------------------------------------------------------------------------------------------- |
| no-global-json                                                                                                                                       | effect    | 183 |          25 |         18 | error | `JSON.stringify` became `Formatter.formatJson`, `JSON.parse` a `Schema.fromJsonString` decoder      |
| no-in-operator                                                                                                                                       | effect    |  58 |          16 |          6 | error | `Predicate.hasProperty`, `Object.hasOwn`, `Reflect.has`; the AST walk of instrument.ts is plain     |
| no-try-catch                                                                                                                                         | effect    |  61 |           3 |          5 | error | `Result.try`                                                                                        |
| no-typeof-object                                                                                                                                     | effect    |  34 |           2 |          7 | error | `Predicate.isObject`, `Predicate.hasProperty`                                                       |
| prefer-effect-match                                                                                                                                  | effect    |  12 |           1 |          0 | error | the one in effect code is `rootIdent` of the AST walk (plain)                                       |
| the other nine of the effect profile                                                                                                                 | effect    |   0 |           0 |          0 | error | no violation                                                                                        |
| no-manual-tag-comparison, no-manual-tagged-construction                                                                                              | anti-slop |   4 |           0 |          0 | error | only in this tool (exempt)                                                                          |
| no-manual-effect-error-tag, no-service-constructor-imports                                                                                           | anti-slop |   0 |           0 |          0 | error | no violation                                                                                        |
| no-array-filter-map                                                                                                                                  | anti-slop |  19 |           9 |          0 | error | `flatMap`; `supportOf` runs per declaration (plain)                                                 |
| no-module-mocking, no-object-parameters, no-reduce-accumulator-copy, no-reflect-apply, no-reflect-get, no-unknown-type-aliases, no-widen-then-assert | anti-slop |   0 |           0 |          0 | error | no violation                                                                                        |
| no-banned-type-assertions                                                                                                                            | core      |  14 |           5 |          6 | off   | the casts type the Vite evaluator, the oxc AST and the mdn-data JSON; the rule has no way to say so |
| no-multiple-function-params                                                                                                                          | core      | 261 |          46 |         28 | off   | positional parameters are this code base's style                                                    |
| no-optional-function-parameters                                                                                                                      | core      |  40 |          10 |         10 | off   | defaults and `?` are used on purpose                                                                |
| no-type-assertion                                                                                                                                    | core      | 119 |          39 |         15 | off   | the same casts at the boundaries; nothing in AGENTS.md bans them                                    |
| no-known-value-widening                                                                                                                              | anti-slop |  31 |          13 |          5 | off   | `unknown` is the honest type of what user code hands the macros                                     |
| no-unknown-parameters, no-unknown-returns                                                                                                            | anti-slop |  47 |          15 |         16 | off   | same: the trust boundary is the macro, not a schema                                                 |
| no-unsafe-dictionary-type                                                                                                                            | anti-slop |  23 |           9 |          3 | off   | same                                                                                                |
| oxc/no-accumulating-spread                                                                                                                           | oxc       |   0 |           0 |          0 | error | no violation                                                                                        |

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
import { banStatement } from "./ban.ts";

export default banStatement("TryStatement", {
  message: "Do not use try/catch; use Effect error channels.",
  description: "Avoid try/catch; use Effect error channels.",
});
```

See `test/ban.test.ts` for the supported shapes.
