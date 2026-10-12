# Engine cost at scale (cssints-grrd)

Question: since cssints-hdui, the plugin evaluates one module at a time from a cleared Module Runner. What does
that cost on a real-sized app, and what is the cheapest change that keeps `servedFresh` (and `readsOwnSites`,
`depsOfKnown`) true?

Answer: evaluation is about 90% of the plugin's time, and it scales linearly (it is serialized). Before the
change, about 60% of each evaluation was spent re-running the cssints library: css-grammar module bodies, and
grammar tokenizing again because twin.ts's parse memo and V8's JIT feedback were thrown away on every clear.
**Keep the library in the runner; clear only app modules.** This makes builds and cold starts 2 to 3 times
faster, gives byte-identical output, and does not change the model. The change is on `research/perf` in
`packages/cssints/src/plugin.mjs` (`clearApp`, 10 lines).

## Setup

- `packages/cssints/test/perf.mjs gen <n> <dir>` writes a React app: `n` components and 3 shared token modules
  (colors, space, type). Each component has 9 sites: named imports, `css.*` chains, `css.flex(...)`,
  `CSS.rem`, one `cv()`, and one site inside the component function (hoisted). Each component imports its
  parent in a 4-ary tree, so one evaluation runs 1–6 components plus the 3 token modules.
- `perf.mjs dev|seq|build <dir>` times dev cold start (server up, `main.tsx` plus every component requested
  concurrently, with pre-transform on), sequential dev requests (the clean per-transform split), and
  `vite build`. It splits evaluation time by patching `ModuleRunner` (self time per bucket):
  - **library**: cssints and css-grammar module bodies.
  - **user**: app module bodies, including the `__site` → `valid`/`checkRules`/`support` calls they make.
  - **fetch**: the `fetchModule` RPCs.
- `PLUGIN=<path>` selects another plugin build, so before and after run interleaved in one session. The
  machine was an M2 with 8 cores, busy with other work, so the numbers are noisy. Tables show the median of
  3 runs (seq: 1 run). Node 24.21, Vite 8.3.1.

## Numbers

Wall clock, ms. "CLI" is `vite build` through the generated `vite.config.ts`: 3 runs each, before/after
interleaved, median.

| modules | CLI build before | CLI build after | build() before | build() after | dev cold start before | dev cold start after |
| ------: | ---------------: | --------------: | -------------: | ------------: | --------------------: | -------------------: |
|      50 |             1814 |             982 |           2046 |           691 |                  1159 |                  728 |
|     200 |             4384 |            1979 |           3358 |          1348 |                  3053 |               2606\* |
|     500 |             9728 |            4691 |           9337 |          4648 |                  9101 |                 5211 |

\* Noise: the other two runs of that case were 1410 and 2832 ms.

Per evaluation, ms (build, medians of the per-run means; the first evaluation is shown on its own):

| modules | first eval | eval median before → after | library self | user self | fetch (user + lib) |
| ------: | ---------: | -------------------------: | -----------: | --------: | -----------------: |
|     200 |  426 → 248 |                 13.4 → 4.6 |    4.0 → 0.7 | 6.9 → 2.5 |          4.3 → 2.7 |
|     500 |  517 → 412 |                 14.4 → 6.4 |    3.9 → 0.3 | 8.0 → 4.1 |          4.6 → 3.8 |

Per transform, warm (seq, 500 modules), ms:

| step                                                          |  before |   after |
| ------------------------------------------------------------- | ------: | ------: |
| instrument (oxc parse + MagicString; runs twice: ssr, client) | 0.15 ×2 | 0.15 ×2 |
| evaluate (lock → `runner.import`)                             |    12.6 |     4.7 |
| replace (sites, imports, CSS, source map)                     |    ~0.4 |    ~0.4 |
| whole client transform                                        |    13.1 |     5.1 |

Dev cold start and build cost roughly `n × (eval + 1 ms)`. Before the change that was about 18 ms per
module; after, about 9 ms. The lock allows no parallelism.

## Where the re-evaluation went (before)

Library module self time per evaluation (seq, 200 modules): twin.ts 0.88 ms, support.ts 0.87 ms (module
body, including the browserslist `targets()` call), mdn.ts 0.35 ms, macro.mjs 0.29 ms, rules.ts 0.20 ms,
lib/index/values/runtime 0.57 ms. The total is about 3.2 ms.

`@mdn/browser-compat-data` and `browserslist` go through Node's `require`, so they load once per process and
are **not** re-loaded. They show up only in the first evaluation (~250–500 ms, together with the first ssr
transforms).

The bigger cost is hidden in "user". `node --cpu-prof` (seq, 200 modules) shows:

| css-grammar twin (`next`, `consume`) | before | after |
| ------------------------------------ | -----: | ----: |
| self time, ms                        |    935 |    92 |

Every clear threw away twin.ts's `parsed` grammar memo and V8's type feedback for all library functions. So
every css site re-tokenized its grammar in cold code. The same profile shows `runInlinedModule`
(`new Function` compile of module bodies) going from 354 to 159 ms, and source-map line indexing from 152 to
57 ms.

## The change

`evaluate()` used to call `runner.evaluatedModules.clear()`. Now it calls `clearApp()`, which:

1. finds the import closure of `src/index.mjs` in the runner's graph (cssints, css-grammar);
2. deletes every other node from `idToModuleMap`, `urlToIdModuleMap` and `fileToModulesMap`.

For app modules this is exactly the old clear: new nodes, a fresh fetch, a fresh evaluation. Library nodes
keep their exports. A kept node still sends `fetchModule(url, { cached: true })`. The server answers
`{ cache: true }` unless its ssr graph invalidated the file; if it did, the runner gets new code and
re-evaluates it.

### Against the invariants (test/spec/runner.qnt)

- The model's `FILES` are `card`, `button` and `tokens`, and `clear(s)` resets `code`/`evaluated` for those
  only. The library is not in the model: it is treated as an immutable, stateless dependency. `clearApp` is
  that `clear`, so modelled behaviour does not change. **runner.qnt is unchanged, and quint was not re-run.**
- The library imports no app module, so its exports cannot depend on app sources. Its module-level state is
  pure: the twin `parsed` memo is keyed by grammar text, and support's `DEFAULT` targets depend on env and
  config, not on app files. The registry (`globalThis.__cssints`: sites, rules, warned) was already global
  and survived every clear before, and `sites.delete(id)` still runs first. So `readsOwnSites` has the same
  argument as before.
- `servedFresh` and `depsOfKnown` depend only on app nodes being refetched and re-evaluated after the lock is
  taken. That is unchanged.
- Assumption, same as before: editing the library during a dev session is not supported beyond what the ssr
  graph invalidates. The old code refetched too, but it got the server's cached transform result, so it
  would not have seen an unwatched library edit either.

### Proof

- `cd packages/cssints && bun run test` passes. This covers the fixtures, source maps, `spec/race.mjs`
  (firstTransform and doubleSave: all fresh), and both `hmr.mjs` orders.
- `node spec/mbt.mjs` passes 10 traces × 8 steps, and 40 traces × 12 steps (runner.qnt `fixed` replayed
  against a real server).
- The 200-module app builds byte-identical `dist/` before and after.
- Negative control: with no clearing at all, race.mjs **still passes**, but the fixtures fail
  (`site 0 in tokens-typed.ts was not evaluated`). A module already evaluated as another module's dependency
  is not run again for its own transform. So clearing app modules is required, while clearing the library
  never was. race.mjs alone is not a sufficient oracle for this code; the fixtures and mbt are.

## Other options (not taken)

- **Evaluate the library outside the runner** (native `import()` from the evaluator, or `ssr.external`). This
  would save only the ~0.2–0.5 ms `cached: true` RPC left per evaluation. In exchange it would change the
  user's ssr config or bypass Vite for the library, and risk two copies of `CSSStyleValue` (so `instanceof` fails)
  if any path still loads it through the runner. Not worth it.
- **Keep unchanged app modules too.** The remaining time is about 2.5–4 ms of app bodies plus 2.5–4 ms of
  RPCs, because every ancestor in the import tree is re-evaluated. Removing that means tracking app
  invalidation in the runner, which is exactly the race surface cssints-hdui removed. Revisit only if
  ~9 ms/module is too slow.
- **Parallel evaluation.** This is blocked by the process-global registry and `readsOwnSites`.
