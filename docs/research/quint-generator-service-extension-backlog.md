# Closing the generator gap: what service specs need beyond today's subset

> Carried over from `effects-of-atmosphere` on 2026-11-28, where it was read while extending the Quint generator for this
> repository's UI specs (`packages/apg-specs/shared/` cites it as item 6). The bean ids are that repository's tracker; a note
> it links to that is not copied here stays there and is named in the text.

> **Status (2026-09-27).** Since this research, the loud-gap hardening
> (`effects-of-atmosphere-miz5`), shared-layer imports (`-ivbd`) and the
> spec-only harness (`-qjw3`) landed, and `quint typecheck` is now a CI gate
> (`-28hk`, `-ktkj`). The silent-accept gaps described here are now loud at
> generation time; the reproducers below are promoted into
> `packages/quint-machine/test/codegen-loud.test.ts` and `test/imports.test.ts`.
> Still unimplemented: collection state/operators, richer nondeterminism,
> temporal, constructor unions, action guards/composition, cross-spec refinement.

Research for bean `effects-of-atmosphere-dh5q` ("Close the generator gap: what
the service specs need beyond today's subset"), part of the wayfinder map.
Compiled 2026-09-26 on branch `research/quint-generator-gap`.

**Question.** Which Quint constructs will real atproto service specs need that
[`@eoa/quint-machine`](../../packages/quint-machine/) does not yet
support?

**Method.** Read the generator (`packages/quint-machine/src/codegen.ts`), the
runtime interpreter and Effect Schema (`.../runtime.ts`), the specs that existed
when this was written (`apps/machine-spike/specs/*.qnt`, `apps/learning/specs/*.qnt`
— the learning workspace was removed on 2026-11-07, so only the first is still
there), the
freshness rule, and
`quint-authorization-pattern.md` (in effects-of-atmosphere's `docs/research/`) — the
concrete service spec we most want to write next (`grants.qnt`). Every claim
about behaviour was reproduced by running the built codegen and runtime against
minimal specs; those specs are committed next to this note in
[`quint-generator-gap/`](./quint-generator-gap/) with a table of observed
results. Commands and outputs are quoted inline.

## 0. How to read "today's behaviour"

The generator is a **two-stage** pipeline, and that split is the root cause of
most surprises:

1. `analyzeSpec` (codegen.ts:354) parses via
   `quint.parsePhase1fromText` (codegen.ts:365) and does a **purely syntactic**
   prune to `ExprData` (`toExprData`, codegen.ts:106-146). `toExprData` accepts
   _any_ `app` node — there is **no opcode allow-list here** (codegen.ts:127-135).
   The allow-list lives only in the runtime evaluator (`evaluate`,
   runtime.ts:176-294). Result: constructs the generator "supports" are often
   _accepted silently_ and only blow up when the reference model is exercised.
2. The generated document is validated by `QuintModelDefinition`
   (runtime.ts:68-115) with `decodeDefinition` (runtime.ts:119). `vars[].type`
   is `Schema.Literal('str'|'int'|'bool')` (runtime.ts:75-79), so anything else
   is rejected **at decode**, after a document was already generated.

So a construct can fail in any of four ways, and tests only cover the first:

- **loud** — tagged `UnsupportedSpecError` / `SpecParseError` (the documented
  contract, README "Unsupported specs fail loudly").
- **untyped defect** — a raw JS `TypeError` escaping as a defect (scaffolding
  codegen, see §2).
- **silent accept → runtime/decode failure** — codegen writes a document, then
  `decodeDefinition` or `makeReferenceModel` throws.
- **silent ignore** — the declaration is dropped and the model is simply wrong
  (temporal properties, `assume`, imports).

`codegen.test.ts:151-195` asserts the loud cases for two constructs
(mixed-kind pools, missing `step`) and parse errors. Nothing asserts that a
construct is _rejected_ before a document is written, which is where the silent
gaps live.

Today's genuinely supported subset (verified against source): `str/int/bool`
vars; `def`/`val` lambdas over `ite/eq/neq/and/or/not`, int arithmetic and
comparisons, names, literals, and def-calls; actions that are exactly
`all { field' = expr }`, optionally preceded by **one** `nondet x = Set(<literals>).oneOf()`;
`step = any { names }`. Int pools serialise as decimal strings (codegen.ts:170-176,
runtime.ts:104-107).

## 1. Ranked extension backlog

Difficulty is a rough T-shirt size for the generator+runtime+scaffolding+lint
work combined, assuming the runtime gains a real value model.

### Rank 1 — collection state: `Set`, `List`, `Map`, `Record`, tuple

- **What.** `var members: Set[str]`, `var pending: List[int]`,
  `var roles: str -> int`, `var world: { members: int }`, `var t: (int, str)`.
- **Why a service spec needs it.** Every authz/secret-membership/service spec is
  sets and maps: members, admins, bans, `RoleId -> Role`, `GrantId -> Grant`,
  `Set[(space, user)]`, per-space collection universes, outboxes, cursors. The
  adaptation in `quint-authorization-pattern.md §4.1` is _entirely_ these types;
  the Roomy reference puts the whole world in one `AuthState` record.
- **Today.** _Silent accept._ `analyzeSpec` maps the raw annotation kind
  (codegen.ts:379-381) → the document records `"type":"set"|"list"|"rec"|"fun"`
  (reproduced; see `list-state.model.generated.json` in the repro log). Then:
  - `decodeDefinition` throws `SchemaError: Expected "str" | "int" | "bool" at
["vars"][0]["type"]` (runtime.ts:75-79).
  - `generateModelArtifacts` (the CLI path) instead throws an **untyped
    TypeError** first, inside the TS AST factory, because `schemaIdent` looks up
    `SCHEMA_IDENTIFIER[v.type]` (codegen.ts:548-558, used at codegen.ts:638) and
    gets `undefined` for `"set"`/`"list"`/… — `createPropertyAccessExpression`
    then calls `isIdentifier(undefined)`.
- **Reproducer.** `quint-generator-gap/{list,set,record,map}-state.qnt`.
- **Difficulty.** L. Needs a recursive `QuintValue` (today
  `string | boolean | bigint`, runtime.ts:126), a schema per collection type,
  scaffolding `Schema.Array`/`Schema.Record`/tuples, and serialization in the
  document. Large but well-bounded and mechanical.

### Rank 2 — collection operators in the evaluator

- **What.** `Set(...)`, `Map(...)`, `Rec(...)`, `Tup(...)`, `List(...)`, plus
  `union`, `intersect`, `exclude`, `contains`, `size`, `isEmpty`, `indices`,
  `append`, `concat`, `slice`, `select`, `fold`, `field`, `with`, `set`/`get`.
- **Why.** Rank 1 is useless without them: `members' = members.union(Set(u))`,
  `world' = { ...world, members: world.members + 1 }`, `roles' = roles.set(r, 1)`.
- **Today.** _Silent accept → runtime `EvaluationError`._ `toExprData` keeps any
  opcode; `evaluate`'s default branch treats the opcode as a def name and,
  finding none, throws `EvaluationError: unknown operator: <opcode>`
  (runtime.ts:260-266). Reproduced: `set-state.qnt` (opcodes `Set`, `union`),
  `record-state.qnt` (`Rec`, `with`, `field`).
- **Reproducer.** same four specs as Rank 1.
- **Difficulty.** L, but mechanical — one evaluator case per opcode plus the
  value model from Rank 1. Biggest sink is `select`/`fold` (higher-order
  arguments → Rank 3).

### Rank 3 — quantification and higher-order `def`s

- **What.** `forall(s, x => ...)`, `exists(s, x => ...)`, and passing a pure
  `def` to another `def` (`apply(f, y) = f(y)`).
- **Why.** The authz oracle is built from these — `specCanRead` is
  "exists a grant / forall users…", `keyLess`/`isPrefix` in `dagcbor.qnt` are
  quantifiers over `indices`, and the Roomy oracle is a family of folds.
  `apps/learning/specs/dagcbor.qnt` used `forall`, `exists`, `select`, `indices`,
  `slice`, `size`, `concat` — none of which the generator handles, so the learning
  specs deliberately bypassed codegen. (That workspace was removed on 2026-11-07;
  the constructs still matter, the example does not exist any more.)
- **Today.** _Silent accept → runtime `EvaluationError`._ `forall`/`exists`
  become app opcodes; `evaluate` has no case for them and no closure support
  (runtime.ts:260-266). For `apply(inc, x)`, codegen emits the call opcode
  `apply`, the evaluator resolves the _def_ `apply`, then evaluating the passed
  name `inc` fails (`name` is looked up only in `locals`/`model`, never in
  `defs` — runtime.ts:276-282), and a lambda _value_ explicitly throws
  `lambda values are not first-class in the evaluator` (runtime.ts:289-292).
  Reproduced: `higher-order.qnt`, `quantifier.qnt` both generate + decode, then
  throw on `transition`.
- **Reproducer.** `quint-generator-gap/higher-order.qnt`,
  `quantifier.qnt`.
- **Difficulty.** M. Quantifiers need a closure call in `evaluate`; `select`/
  `fold`/`apply` need first-class def references. The scaffolding/state side is
  unaffected.

### Rank 4 — nondeterminism over richer domains

- **What.** Pools that are _named defs_ or _state-derived_
  (`nondet u = users.oneOf()`, `nondet s = state.admins.oneOf()`), _ranges_
  (`Set(1.to(1000)).oneOf()`), and _constructor unions_
  (`Set(Channel, Thread(1)).oneOf()`).
- **Why.** This is exactly the `auth.qnt` `*Any` pattern
  (`quint-authorization-pattern.md §1.3`): `sender = (if admins.size()==0 users
else admins).oneOf()`, `joinSpaceAny` draws from `users.exclude(members)`,
  scope args from `state.collections`. Without it the simulator wastes steps on
  infeasible events and the pool cannot depend on state.
- **Today.** _Loud_ `UnsupportedSpecError` — the best-behaved gap.
  `extractPool`/`toPoolLiterals` require exactly `Set(<literals>).oneOf()`
  (codegen.ts:172-262); the document's pool is a flat literal array
  (runtime.ts:104-107). Reproduced: both `nondet-range.qnt` and
  `nondet-named.qnt` fail at generation.
- **Reproducer.** `quint-generator-gap/nondet-range.qnt`,
  `nondet-named.qnt`.
- **Difficulty.** M-L. Requires the document to carry _expression-typed_ pools
  (evaluated against the current state) instead of literal arrays, and the
  runtime `pools`/`eventSchemas` to sample them. Interacts with Ranks 1-2
  (state-derived pools need set ops).

### Rank 5 — module imports and multi-module specs

- **What.** `import shared_lib.*`, `import lib.f as g`, and files containing
  several modules (`auth_types`, `events`, `auth` — the Roomy layout).
- **Why.** Service specs share DID/key/record/grant types and predicate helpers
  across specs, and the Roomy pattern deliberately splits types / pure event
  functions / the runnable module.
- **Today.** _Silent ignore_ for imports; _loud but wrong_ for multi-module.
  `parsePhase1fromText` only parses one text and does **not** load imported
  files; `analyzeSpec` filters declarations and never looks at `kind === 'import'`
  (verified: the import declaration is dropped; `import-spec.qnt` generates +
  decodes, then `transition` throws `EvaluationError` on the imported name).
  For a two-module file the generator hard-codes `parsed.modules[0]`
  (codegen.ts:374-377), so a `lib` first throws
  `UnsupportedSpecError: spec has no step = any { ... }` even though a valid
  main module exists. Reproduced: `multi-module.qnt`.
- **Reproducer.** `quint-generator-gap/import-spec.qnt` (+ `shared-lib.qnt`),
  `multi-module.qnt`.
- **Difficulty.** M-L. Needs a real phase-2/module resolver (or shelling to the
  `quint` loader) and a `--main` selection, mirroring how the freshness rule and
  CLI already resolve paths (`quint-generated-model-fresh.ts:64-78`).

### Rank 6 — temporal properties (`temporal`, `always`, `eventually`)

- **What.** `temporal XStaysNonNegative = always(x >= 0)`.
- **Why.** Monotonic cursor / "never revoke twice" / liveness are the properties
  service specs most want; `quint run --invariant` is the checking story.
- **Today.** _Silent ignore._ `temporal` parses as `kind:'def',
qualifier:'temporal'` (verified). `analyzeSpec` includes it in `pureDefs`
  (codegen.ts:385-387) and classifies it as `function` because
  `isInvariant` only matches `qualifier === 'val'` (codegen.ts:392-395); the
  generated document carries `always` as an unknown function body. The runtime
  only surfaces defs whose kind is `'invariant'` (runtime.ts:395-401), so the
  property is **never checked and never reported** — a silently weaker model.
- **Reproducer.** `quint-generator-gap/temporal.qnt`.
- **Difficulty.** S to _refuse_ (classify `qualifier:'temporal'` and fail
  loudly); L to actually _check_ (needs a temporal checker; `temporal` is out of
  scope for a step simulator — likely delegate to `quint verify`/Apalache,
  exactly as `quint-authorization-pattern.md §4.5` proposes).

### Rank 7 — constructor unions / sum types

- **What.** `type Room = Channel | Thread(int)`, `Permission = None | Read |
ReadWrite`, `Subject = UserSubject(...) | RoleSubject(...)`, and pools of
  constructors.
- **Why.** Permission, room and subject taxonomies in the grants model
  (`quint-authorization-pattern.md §4.1`) are sum types; the Roomy spec uses
  them pervasively.
- **Today.** _Loud for pools, silent accept for the var._ `Set(Channel,
Thread(1))` fails pool validation (non-literal args, codegen.ts:244-250).
  `var room: Room` records `"type":"const"` (the annotation kind), so decode
  rejects it; `room' = Channel` is a bare `name` accepted by `toExprData`
  (codegen.ts:113-120) that the evaluator would then fail with
  `unbound name: Channel` (runtime.ts:276-282) once the type gate is lifted.
  Reproduced: `variants.qnt`.
- **Reproducer.** `quint-generator-gap/variants.qnt`.
- **Difficulty.** L. Needs typed sum values, constructor application
  (`variant`/`Tup` opcodes), pattern `match` in the evaluator, and schema
  codegen.

### Rank 8 — action guards and composition

- **What.** `when(cond)`, `a.then(b)`, and `all { ... }`/`any { ... }` nested as
  action combinators.
- **Why.** Feasibility gates (`when(role != "none")`) and "apply then
  refresh snapshot" composition (`applyEvent = update.then(snapshot)`) keep
  frame conditions from being repeated.
- **Today.** `.then` parses to opcode `then`; `parseAction` requires the body to
  be `actionAll` (codegen.ts:289-293) → **loud** `UnsupportedSpecError`
  (reproduced `guard-then.qnt`). `when(...) all { ... }` is a **parse error** in
  the vendored Quint 0.32 grammar (see Surprises).
- **Reproducer.** `quint-generator-gap/guard-then.qnt`.
- **Difficulty.** M. `then` is sequential composition of transitions — the
  document/evaluator currently model a single `all` block.

### Rank 9 — multiple `nondet` bindings per action

- **What.** `{ nondet a = ...; nondet b = ...; all { ... } }`.
- **Why.** An event with two arguments: `grant(subject, scope)`, `ingest(seq,
payload)`, `setRoleRoomPermission(role, room, perm)`.
- **Today.** _Loud_ `UnsupportedSpecError`. `parseAction` unwraps at most **one**
  `let` (codegen.ts:275-287); with two, the body is still a `let`, so the
  `all { ... }` check fails. Reproduced: `nondet-two.qnt`.
- **Reproducer.** `quint-generator-gap/nondet-two.qnt`.
- **Difficulty.** S. Loop over nested `let`s; the document already models one
  `nondet` (runtime.ts:96-108) — trivial to extend to a list, then
  `eventSchemas` gains a field per binding.

### Rank 10 — refinement / composition between specs

- **What.** `instance`, module parameters, `import … from … as`, shared
  refinement with `export`/`from`.
- **Why.** "Which actions are reachable", composing a `grants` module with a
  `repos` module, and reusing the oracle across specs.
- **Today.** Not handled at all; `import` is silently dropped (Rank 5),
  `instance`/module-params are not inspected, and only `parsed.modules[0]` is
  read.
- **Difficulty.** L/XL, and probably only worth attacking after Ranks 1-6.

### Minor / silently ignored declarations

- `assume`, `const`, `pure def`, and `run` declarations are filtered out by the
  `kind` checks in `analyzeSpec` (codegen.ts:379-419) with no error. An `assume`
  that should constrain `init` is silently lost; a `const` is silently unbound.
  Difficulty S: detect and refuse (or model `const` as a compile-time value).

## 2. Top 3 by leverage

1. **Collection state types (Rank 1) + collection operators (Rank 2) — one
   workstream.** Without them _no_ real service spec (`grants.qnt`, the Roomy
   adaptation) can even be loaded; with them the supported subset jumps from
   scalar counters to the state shape every authz spec actually has. It is also
   the worst-behaved gap today: the CLI emits an untyped `TypeError`, so
   "unsupported specs fail loudly" is currently false.
2. **Named / state-derived nondeterministic pools (Rank 4).** This is the
   `auth.qnt` `*Any` pattern and the difference between a simulator that
   explores feasible events and one that mostly no-ops. It is already _loud_, so
   it is cheap to extend incrementally; it depends on Rank 1-2 for state-derived
   sets.
3. **Module imports + main-module selection (Rank 5).** Required before specs
   get big enough to factor shared types; the Roomy layout is multi-module and
   the current `modules[0]` assumption makes those specs load the wrong module.

Quantifiers/higher-order (Rank 3) are close behind and pair naturally with
Rank 2 (`select`/`fold`), but they are not needed to get _a_ grants spec loaded.

## 3. Surprises about the generator

1. **The opcode allow-list is only in the runtime.** `toExprData` accepts any
   `app` node (codegen.ts:127-135), so most unsupported _expressions_ are
   silently baked into documents and only fail at `transition`. The README's
   "anything else fails the generator loudly" is true for _shape_ (action body,
   pool form) but not for _operators_.
2. **The CLI path can crash with an untyped `TypeError`.** `schemaIdent` +
   `SCHEMA_IDENTIFIER[kind]` (codegen.ts:548-558) yields `Schema.undefined` →
   `isIdentifier(undefined)` throws inside typescript — a defect, not an
   `UnsupportedSpecError`. Any non-scalar var triggers it, so the loud-failure
   contract is violated by the very first realistic spec.
3. **`temporal` is silently downgraded to a plain function** and thus never
   checked (runtime only collects `kind:'invariant'`, runtime.ts:395-401). A
   spec author can believe a liveness/monotonicity property is being verified
   when it is not.
4. **Imports are invisible to the generator.** `parsePhase1fromText` never loads
   referenced files, and `kind:'import'` is dropped; the generated model can be
   structurally valid but reference names that resolve nowhere.
5. **Multi-module files load the wrong module.** `parsed.modules[0]` is used
   without a `--main` option, so `auth_types`-first layouts fail with a
   misleading "no step" error.
6. **When `generateModelArtifacts` is given an output path that does not end in
   `.model.generated.json`,** `scaffoldingPath === outAbsolute`
   (codegen.ts:528-531) and the TS scaffolding overwrites the JSON document.
   Minor CLI footgun, but worth a guard.

## 4. Sources

Primary (this repo):

- [`packages/quint-machine/src/codegen.ts`](../../packages/quint-machine/src/codegen.ts) — `toExprData` 106-146, pools 172-262, `parseAction` 264-326, `analyzeSpec` 354-443, scaffolding 608-759.
- [`packages/quint-machine/src/runtime.ts`](../../packages/quint-machine/src/runtime.ts) — definition schema 68-120, evaluator 176-294, reference model 326-412.
- [`packages/quint-machine/README.md`](../../packages/quint-machine/README.md) — the claimed subset.
- [`packages/quint-machine/test/codegen.test.ts`](../../packages/quint-machine/test/codegen.test.ts) — loud-failure coverage.
- [`apps/machine-spike/README.md`](../../apps/machine-spike/README.md) — supported subset statement (L70-84).
- [`apps/machine-spike/specs/`](../../apps/machine-spike/specs/) — `head.qnt` (int/bool pools), `firehose.qnt` (invariants).
- `apps/learning/specs/dagcbor.qnt` — removed with the learning workspace (2026-11-07); it was the real use of `List`, `forall`, `exists`, `select`, `indices`, `slice` not routed through codegen.
- `quint-authorization-pattern.md` in effects-of-atmosphere's `docs/research/` — the intended `grants.qnt` service spec.
- [`tools/ai-automation/src/rules/quint-generated-model-fresh.ts`](../../tools/ai-automation/src/rules/quint-generated-model-fresh.ts).
- Reproducers: [`quint-generator-gap/`](./quint-generator-gap/) (table + `.qnt` files).

External:

- Quint 0.32 (`@informalsystems/quint@0.32.0`, `node_modules/@informalsystems/quint`), `parsePhase1fromText` AST shapes.
