---
# cssints-isr2
title: The starter kit cannot import a cssints-typed dependency, and 0.37.0 made every PR red
status: in-progress
type: bug
priority: critical
created_at: 2026-11-15T09:35:19Z
updated_at: 2026-11-15T11:20:25Z
---

Every PR's `check` job has been failing since **0.37.0** published, in the *starter kit, end to end* step — the one that copies the registry items into a fresh project and runs their tests. PR #187's run `43694945534` (job `132753366612`) failed with:

```
FAIL src/components/ui/progress.browser.test.tsx
[vite] Internal server error: Import attribute "type" with value "cssints" is not supported
       in file:///tmp/cssints-starter-mSAeVh/node_modules/cssints/dist/index.mjs
AssertionError: these copied tests failed: src/components/ui/progress.browser.test.tsx
```

**Cause.** `apps/ui/src/registry/progress/progress.tsx:7` does `import { progress } from "@cssints/reveal" with { type: "cssints" }`. That is correct in this monorepo: `@cssints/reveal`'s `exports` carries a `development` condition that resolves to `src/index.ts`, so the attribute lands on source and the plugin compiles it. The starter installs **from npm**, where no `development` condition is set: the same import resolves to `dist/index.mjs`, and the attribute then reaches Vite/Node, which reject it. The `progress-bar` changeset (0.37.0) is when the registry first imported a cssints-typed *dependency*, so the hole had never been exercised.

**Blast radius.** The starter test is the gate that says 'a copied item actually works for a consumer'. It is red for every PR until this is fixed, so nobody can land a green check — including the 0.37.0 skin work.

**Fix direction** (pick one, both are small):
1. the cssints Vite plugin should resolve `type: "cssints"` imports to the dependency's **source** itself (the `development` condition is a hint, not the contract), so the attribute never reaches a runtime module;
2. or the starter harness sets `resolve.conditions` to include `development` — correct for the test, but it hides the same failure from every real consumer, so it is the weaker option.

**Reproduce**: `node apps/ui/scripts/...`/ the CI step `The starter kit, end to end`; locally, `bun run test:starters` if that is the script name. The failure is deterministic, not flaky.

## Diagnosis (2026-11-15, worktree cssint-attr, branch fix/cssints-attribute)

The published dist keeping the attribute is **correct and load-bearing** (see cssints-0l3f: a package
written on cssints ships its JS with `with { type: "cssints" }` kept, so the consumer's engine
recognizes it as a site module — plugin.ts `marked()`). The hole is elsewhere:

- The starter app imports `@cssints/reveal` (attributed). In the plugin's evaluation server reveal is
  inlined (it is a direct dependency, so `packagesOnCssints` puts it in `ssr.noExternal`), and the
  plugin strips its attributed imports.
- reveal imports `@cssints/motion` **without** an attribute. motion is a *transitive* dependency, so
  `packagesOnCssints` (direct dependencies only) never listed it.
- Vite externalizes a bare import that resolves inside node_modules (vite, `isExternalizable`:
  `if (!configuredAsExternal && !isInNodeModules(resolved.id)) return false`), so Node loads
  `node_modules/@cssints/motion/dist/index.mjs` itself, meets `with { type: "cssints" }` in it, and
  refuses the attribute: `ERR_IMPORT_ATTRIBUTE_UNSUPPORTED`, named after the *target* (cssints/dist/index.mjs).
  The monorepo hides it because a workspace package resolves outside node_modules and is never externalized.

Fix: the walk in `packagesOnCssints` follows the installed graph (dependencies + peers, from each
package's own manifest) instead of the app's direct dependencies only.

## Todos

- [x] Reproduce in a kept starter dir (progress.browser.test.tsx alone) and name the importer with a loader hook
- [x] Fix `packagesOnCssints` to walk transitively
- [x] Regression test: pkg/behind, a fixture package reached behind pkg/ui, in packages/cssints/test/packages.mjs
- [x] typecheck, lint, packages/cssints tests, starter smoke
- [ ] PR (base master), unmerged for the parent's review

## Summary of Changes

PR https://github.com/alexeiaccio/css-in-ts-compiler/pull/190 (base master, not merged).

- `packages/cssints/src/plugin.ts`: `packagesOnCssints` follows the installed graph (dependencies +
  peers, from each package's own manifest) instead of the app's direct dependencies only, so
  `@cssints/motion` is inlined in the evaluation server rather than handed to Node.
- `packages/cssints/test/pkg/behind` + `test/packages.mjs`: a fixture package reached behind
  `pkg/ui` (the shape of motion behind reveal). Without the fix the test dies with
  `Import attribute "type" with value "cssints" is not supported`.
- `.github/workflows/ui.yml`: the ui check also runs when `packages/cssints/src` changes — the one
  check that catches this did not run for a plugin change.
- `.changeset/starter-transitive-package.md`: patch.

Evidence: `bun scripts/starter-smoke.mjs --keep` → `starter smoke: ok — 64 items, 63 conformance
tests, type-checked`, exit 0, progress 3/3 passing; `packages/cssints` suite exit 0 (including
`packages.mjs`); `bun run typecheck` 190 files, 0 diagnostics; `bun run lint` clean on the changed
files. The published dist keeping the attribute was NOT the bug: it is the marker `marked()` reads,
and `packages.mjs` asserts it survives the build.

## Follow-up on the same branch (b18cc6be)

The walk's dedupe was keyed by package *name*, which defeats its own reason: two copies of one name,
and only the copy reached first was walked, so a cssints-typed dependency nested under the other was
missed — the same failure one level deeper. Keyed by the manifest file now: every distinct installed
copy is walked once, whatever its name.

Proved on a hand-built tree (app listing `lib-b` before `lib-a`, whose own `lib-b` is nested under
it and on cssints): name-keyed finds 0, file-keyed finds 1, and `cssints()` returns `['lib-b']`.

`packages/cssints` suite re-run: exit 0. Config cost is ~50 ms per call over the apps here (147
manifests in apps/docs), two calls per dev server.
