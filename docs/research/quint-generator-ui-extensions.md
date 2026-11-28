# Which generator extensions do the UI specs need?

> Carried over from `effects-of-atmosphere` on 2026-11-28, where it was read while extending the Quint generator for this
> repository's UI specs (`packages/apg-specs/shared/` cites it as item 6). The bean ids are that repository's tracker; a note
> it links to that is not copied here stays there and is named in the text.

Research for bean `effects-of-atmosphere-dx00` (map `effects-of-atmosphere-0lab`).
Compiled 2026-10-07. Read-only study: nothing in `packages/` was changed; every
"observed" claim below was reproduced by running the built generator
(`packages/quint-machine/dist`) and Quint 0.32.0 on throwaway specs (listed in
the appendix, kept outside the repo).

It builds on the service-spec backlog
([`quint-generator-service-extension-backlog.md`](./quint-generator-service-extension-backlog.md),
bean `dh5q`). That study ranked what _service_ specs need (unbounded sets and
maps of DIDs, guards, composition). This one ranks what the **43 UI specs**
(41 `specs/apg/*.qnt` + `specs/canvas/{camera,pointer}.qnt`) hit. The two lists
overlap on collections and nothing else.

## 0. Answer in one screen

Ranked by leverage (breadth x workaround cost / cost, risk-adjusted):

| #   | Extension                                            | Size | Why it ranks here                                                  |
| --- | ---------------------------------------------------- | ---- | ------------------------------------------------------------------ |
| P0  | Make today's failures early and legible (6 fixes)    | XS   | No subset change; each is a silent or late failure observed        |
| 1   | **Implicit frame, opt-in per spec, typechecked**     | S-M  | 43/43 specs, 2,423 lines; generator-only, zero runtime change      |
| 2   | `^` (`ipow`) in the evaluator                        | XS   | 10 specs hand-roll `pow2` ladders; Quint has no bitwise ops at all |
| 3   | More than one nondet per action (+ `lo.to(hi)` pool) | S-M  | 10 of the 20 spec beans; 15 pools of 8-40 literals                 |
| 4   | Derived defs callable from the reference model       | S    | 32 specs / 102 ARIA defs; bridges re-port them by hand             |
| 5   | `str`/`int` pools decode as literal unions           | S    | 41 `str` pools = the keyboard alphabet; typed scaffolding is a lie |
| 6   | Collections: `Set[int]` first, then `List[int]`      | M-L  | Largest capability unblock; ~25 of 43 specs; do it after 1-5       |
| 7   | `val`/`let` bindings inside defs                     | S-M  | 2 beans, but the two biggest specs; evaluator has no memoisation   |
| 8   | Nondet pools in `init`                               | M    | 6 beans; the workaround (config events) is semantically faithful   |
| -   | Bool helper `val`s misclassified                     | doc  | Zero-arg `def` already works; fix is one README sentence           |

**Cheapest change with the biggest unblock: implicit frame (#1).** It touches
every spec, needs no evaluator, schema or lint change, and the CI regression
oracle (`generate:all && git diff --exit-code`) proves it is additive. The
catch the ticket did not anticipate: a _default-on_ implicit frame is not
valid Quint, so it must be **opt-in per spec** and typechecked on its expansion
(section 4.1).

**Biggest capability unblock, not cheap: collections (#6).** It is what lets
the specs stop being fixed-size fixtures, which is why bridges skip ported
scenarios as `Unsupported` today. It touches every layer, so design it in
parallel and land it after the cheap items.

Three of the ticket's candidates are **not generator limits at all**
(section 6): string concat, recursion and bitwise ops do not exist in Quint,
so adding them would mean leaving Quint.

## 1. Corpus and method

- 43 UI spec files, 13,026 lines, 366 vars, 483 actions, 137 nondet actions
  (41 `str`, 67 `int`, 29 `bool` pools), 378 `val: bool` invariants, 920
  helper defs. (Counted from `packages/specs/src/{apg,canvas}/*.model.generated.json`
  and the `.qnt` sources.)
- Evidence for "which specs want it": the "Generator gaps" section of every
  spec bean (`xa10` tabs, `pg1g` combobox, `dxmc` treeview, `mn03` listbox,
  `e9jm` canvas, `lgq8` accordion, `svrg` carousel, `jin4` dialog, `392a` feed,
  `l3tm` grid, `p8id` menu, `5r9m` radio, `cwsp` slider, `czsz` spinbutton,
  `nwgp` toggles, `bfuz` toolbar, `6kpe` tooltip, `xgs1` treegrid, `l1io`
  windowsplitter; `3wsk` static, `q7jj` timeline and `vmmr` player have none
  or only a header note), plus the `.qnt` headers and the bridges in
  `packages/specs/src/**/*.bridge.ts`.
- Bean counts below are "beans that name the limit", not "specs": one bean
  covers a family (`pg1g` = 5 combobox specs, `jin4` = 2 dialog specs).
- Sizes are estimates, not measurements: XS under half a day, S about a day,
  M two to four days, L a week or more.

### 1.1 Where each limit is enforced, and where it is only assumed

This is the part of the ticket that decides the loud-failure story. Observed
by running the generator (`gen.mjs` in the appendix), not inferred.

| Limit                             | Where                                                                       | What actually happens                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Operator allow-list               | `codegen.ts:115-132` **and** `runtime.ts:186-259` (two hand-kept copies)    | Loud at generation (`unsupported operator: ipow`). The two lists can drift: nothing asserts they match.                                         |
| Var types `str/int/bool`          | `codegen.ts:134-138`, `653-661`                                             | Loud (`var s has unsupported type set`).                                                                                                        |
| `const`/`assume`/`instance`/`run` | `codegen.ts:617-631`                                                        | Loud.                                                                                                                                           |
| One `nondet` per action           | `codegen.ts:337-349` (unwraps one `let`)                                    | Loud, but the message is misleading: `action two: expected all { ... } block`.                                                                  |
| Pools are `Set(literals)`         | `codegen.ts:260-323`                                                        | Loud.                                                                                                                                           |
| Assignment-only `all` bodies      | `codegen.ts:351-377`                                                        | Loud (`expected only field' = value assignments`): guards, action calls and `.then` all land here.                                              |
| `nondet` in `init`                | **not enforced**; `runtime.ts:361-367` evaluates `init` in an empty scope   | Generation succeeds; `makeReferenceModel` throws `EvaluationError unbound name: x` at load. Loud, but late and cryptic.                         |
| Every var assigned                | **not enforced**; `codegen.ts:743-767` only checks equal sets across `step` | A var assigned nowhere is accepted; `initial` lacks it and an invariant over it throws `unbound name: b`. `runtime.ts:395-398` silently frames. |
| QNT101 built-in names             | `codegen.ts:635-642` checks `var`/`def` names only                          | Nondet names and def params (`enabled`, `item`, `size`, `variant`) pass generation; only `typecheck:quint` (CI) rejects them.                   |
| `val: bool` is an invariant       | `codegen.ts:696-698`, undocumented in `README.md:13-24`                     | A helper `val isBig: bool = a > 2` is listed in `invariants` and reported as violated when false. A zero-arg `def` is not.                      |
| Pool membership                   | `runtime.ts:145-157`, `387-393` check the _kind_ only                       | `transition` accepts `{ key: "bogus" }` and any `bigint`; scaffolding types `str` payloads as `Schema.String` (`codegen.ts:886-890`).           |
| Division / modulo by zero         | `runtime.ts:234-237`                                                        | Raw JS `RangeError`, not an `EvaluationError`. Quint itself raises `QNT503` here, so throwing is faithful; the typing is not.                   |
| Error text                        | `codegen.ts:34-38` (`Data.TaggedError` with no `message`)                   | The CLI prints `UnsupportedSpecError:` and a stack, **never the `detail`**. Every loud failure is silent about its reason from the CLI.         |
| `step` element not a name         | `codegen.ts:730-737` `throw`s inside `.map`                                 | Becomes an Effect defect (`Die`), bypassing `catchTag`; the `miz5` hardening missed it.                                                         |

CI oracles that already backstop the generator
(`.github/workflows/ci.yml:25-37`): `generate:all` then
`git diff --exit-code -- packages/specs/src`, `typecheck:quint` (Quint's own
typechecker over every spec), and the freshness lint. The first one is the
regression test for every extension below: **an additive extension leaves the
regenerated output of the existing 93 specs byte-identical.**

## 2. Ranked table

"Unblocks" distinguishes capability (the spec could not say it before) from
toil (it could, at a cost).

| #   | Extension                     | Specs that need it                                                                                                                                 | What it unblocks                                                                                                            | Generator / evaluator / lint cost                                                                                                       | Loud-failure story                                                                                                     |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| P0  | Hardening (section 4.0)       | all                                                                                                                                                | Toil: reasons visible; two silent accepts closed; QNT101 caught at generation                                               | Generator XS each; evaluator: one error type; lint none                                                                                 | This _is_ the loud story                                                                                               |
| 1   | Implicit frame (opt-in)       | 43/43; 2,423 of 13,026 lines (player 50%, pointer 33%, carousel 32%); beans `pg1g mn03 dxmc e9jm xgs1 392a 6kpe p8id l3tm jin4`                    | Toil + a correctness class: a mistyped frame line is a silent semantic bug today; adding a var is O(actions)                | Generator S-M (expand before `toExprData`; emit expanded `.qnt` for the oracle); evaluator none; lint none (same file)                  | Opt-in pragma; default stays strict via P0 completeness; double assignment loud; expansion is what Quint typechecks    |
| 2   | `ipow` (`^`)                  | 10: `listbox-{single,multi,rearrangeable} radio tabs timeline toolbar treegrid treeview canvas/pointer`                                            | Toil: deletes every `pow2`/`weight` ladder (`tabs.qnt:53`, `treeview.qnt:105`, `pointer.qnt:138`)                           | Generator: add one name to the allow-list; evaluator: one case with Quint's `0^0`/`j<0` errors; lint none                               | Safe: one named opcode; assert both opcode lists equal                                                                 |
| 3   | Multi-nondet (+ ranges)       | `tabs camera pointer grid grid-selection treegrid combobox-grid slider radio accordion`; beans `xa10 pg1g mn03 e9jm lgq8 l3tm 5r9m cwsp nwgp xgs1` | Toil + typed events: selectors stop being packed ints (`tabs.qnt:179`, `pointer.qnt:283`, `canvas.bridge.ts:315`)           | Generator S (loop the `let` unwrap); document `nondet` -> `nondets` (additive); runtime M-sized API touch (`eventPayloads`, `eventsOf`) | Loud rejection stays for non-literal pools; duplicate nondet names loud; cartesian size reported, `explore` cap exists |
| 4   | Def-call API on the reference | 32 APG specs / 102 `aria*`/`tabIndex` defs; beans `dxmc svrg l3tm cwsp czsz nwgp e9jm`                                                             | Capability: spec -> bridge -> primitive chain checked end to end; deletes hand-ported attr logic (`grid.bridge.ts:290-335`) | Runtime S (export `evaluate` behind `reference.call`); generator none; lint none                                                        | Unknown def / wrong arity / lambda value -> typed `EvaluationError`; no new accepted syntax                            |
| 5   | Literal-union pools           | 22 specs with `str` pools (41 pools); `p8id`; `machine-spike` already hand-builds it                                                               | Capability: wrong key / wrong int fails `tsgo` and `decode`, as `AGENTS.md` promises                                        | Generator S (`Schema.Literals` in scaffolding, `codegen.ts:886-897`); runtime S (`runtime.ts:159-163`)                                  | Tightening only: more rejections, never fewer                                                                          |
| 6   | Collections                   | ~25 of 43 (10 bitmask + ~15 fixed-slot); beans `xa10 pg1g dxmc mn03 e9jm lgq8 l3tm p8id 5r9m cwsp nwgp bfuz xgs1 jin4 6kpe`                        | Capability: dynamic tabs/radios/thumbs/children, trees, scenario configs at real sizes, canvas `config.nodes`               | Generator M (var type + operators); evaluator M (value model, deep `eq`); touches `testing.ts`, `scxml.ts`, bridges; lint none          | Per-type, per-operator allow-list; `Map`/`Rec`/tuple stay loud; deep-equality test is mandatory                        |
| 7   | `let` in defs                 | `mn03 e9jm` (listbox family, camera, pointer)                                                                                                      | Toil + speed (no memoisation: ~1 ms/state at 24 invariants)                                                                 | Document: one new `let` expr kind (additive); evaluator S                                                                               | Only `val x = e; body` form; anything else stays loud                                                                  |
| 8   | Pools in `init`               | `pg1g mn03 5r9m 392a nwgp lgq8`                                                                                                                    | Toil: mount-time config without a `configure` event                                                                         | M: `initial` becomes a set of states; touches `testing.ts`, `scxml.ts`, MBT handshake, scaffolding `init`                               | Loud now (P0); later only literal pools                                                                                |
| -   | Bool helper `val`             | `lgq8 xgs1`                                                                                                                                        | Nothing: zero-arg `def` works (`czsz`, `l1io`, `jin4`)                                                                      | README only                                                                                                                             | Keep `val: bool` = invariant (Quint convention)                                                                        |

## 3. Cheapest change with the biggest unblock

Implicit frame. The argument, with the numbers:

- **Breadth.** 2,423 bare `v' = v` lines across 43 specs, 18.6% of all UI spec
  text; the three heaviest are `player.qnt` (325 of 653), `pointer.qnt` (250 of 759) and `carousel.qnt` (147 of 456). `alertdialog` and `dialog-modal` show 0
  only because `jin4` re-encoded every event as an int and routed each var
  through a `nextX(ev)` kernel def (`dialog-modal.qnt:147-189`), a second
  workaround for the same limit.
- **The workaround is not reproducible.** `pg1g`, `mn03` and `e9jm` each wrote
  a throwaway script and kept it out of the repo. The next spec author starts
  from zero, and a regenerated body cannot be reviewed against its source.
- **Zero runtime cost.** The evaluator already frames (`runtime.ts:395-398`
  merges `{ ...model, ...assignments }`), and the document already carries the
  expanded assignments. Only the generator's front half changes.
- **Provably additive.** Existing specs do not carry the opt-in, so their
  regenerated JSON/TS is byte-identical; CI's `git diff --exit-code` is the
  proof.

Collections are the larger unblock but cost an order of magnitude more and
touch every layer; they are #6 on leverage, #1 on capability.

## 4. Per extension

### 4.0 P0: make today's failures early and legible (no subset change)

Do these first. Each is a few lines, each has a reproducer in the appendix,
and #1, #3 and #6 are unsafe without them.

1. **Print `detail`.** Give `UnsupportedSpecError`/`SpecParseError` a `message`
   (`codegen.ts:29-38`). Today `node bin/quint-machine.js --spec multi.qnt ...`
   prints `UnsupportedSpecError:` and a stack trace with no reason, so the
   "fails loudly" contract fails at the one place a person reads it.
2. **Reject `nondet` in `init` at generation.** `initnd.qnt` generates fine and
   dies at load with `unbound name: x` (`runtime.ts:361-367`). Beans `pg1g`,
   `mn03`, `5r9m`, `392a`, `nwgp`, `lgq8` all learned this by being told, not by
   the tool.
3. **Completeness check.** Reject a spec where any var is not assigned in
   `init` or in a `step` action. Today `nonassignedall.qnt` generates and
   typechecks in Quint; `b` is simply missing from every state. A corpus scan of
   all 93 generated documents found **zero** incomplete actions, so the check is
   free to add and is the strictness that makes #1 safe to make opt-in.
4. **QNT101 for nondet names and def params** (`codegen.ts:635-642` covers only
   `var`/`def` names). Ten beans (`xa10 pg1g mn03 lgq8 e9jm 5r9m nwgp bfuz l3tm
svrg`) each lost a cycle renaming `variant`/`enabled`/`item`/`size`/`next`/
   `run`. `typecheck:quint` catches it in CI, so this is about the feedback
   loop, not safety. Also list the reserved names in the README.
5. **Type division by zero.** Wrap `idiv`/`imod` by zero as
   `EvaluationError` (`runtime.ts:234-237`). Decision recorded for `e9jm`
   item 7: **do not turn it into an invariant violation.** Quint raises
   `QNT503 Division by zero` (reproduced with `quint run divz.qnt`; Quint's own
   `idiv` returns an error value, `builtins.js:345-353`), so a typed error is
   parity and a "violation" would hide spec bugs. `camera.qnt` guards with
   `z > 0`; `and`/`or` short-circuit in the evaluator (`runtime.ts:256-259`), so
   that guard works.
6. **Typed failure for a non-name `step` element** (`codegen.ts:730-737`
   `throw` inside `.map` becomes a `Die`; reproduced with
   `step = any { init, go.then(go) }`).

Also worth one test: assert `SUPPORTED_OPCODES` (`codegen.ts:115-132`) equals
the set of opcodes `evaluate` handles (`runtime.ts:186-259`). The comment at
`codegen.ts:111-114` says the evaluator is the single source of truth, but the
two are separate literals. Every extension below adds an opcode; drift here is
a silent accept (codegen accepts, runtime throws `unknown operator`) or a silent
reject.

### 4.1 Implicit frame (`v' = v` for unassigned vars)

**Evidence.** Beans: `pg1g`, `mn03`, `dxmc`, `e9jm` ("would have cut ~500
lines"), `xgs1`, `392a`, `6kpe`, `p8id`, `l3tm`, `jin4`. Headers:
`player.qnt:19-20`, `camera.qnt:52-54`, `pointer.qnt:60-64`.

**Why the naive version is wrong.** Quint has no frame primitive. Its effect
checker rejects any `any { ... }` whose branches update different var sets
(`QNT000 Expected [a,b] and [a] to be the same`, reproduced with
`partial.qnt`), which is what the generator mirrors at `codegen.ts:743-767`.
So the frame lines are Quint syntax, not generator pedantry. The built-in
`orKeep` (`builtin.qnt:630-645`) is the temporal stuttering operator
`a or x' == x`, not a per-var frame. If the generator simply accepted partial
`all` blocks, those specs would fail `typecheck:quint`, which CI runs over every
spec, and they would mean something different to `quint run` than to us.

**Options considered.**

| Option                                                                     | Verdict                                                                                                                                                                                                        |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Generator accepts partial `all` by default                              | Rejected: fails the Quint oracle, silently widens what the 93 existing specs mean.                                                                                                                             |
| B. Frame groups: `action keepBC = all { b' = b, c' = c }` called in `all`  | Valid Quint (`callact.qnt` typechecks clean) and the generator rejects it loudly today. Rejected on value: each distinct touched-set needs its own group listing its kept vars, so lines do not shrink.        |
| C. Committed `frame --write/--check` tool that rewrites the `.qnt`         | Zero language risk and fixes _writing_ (the throwaway scripts), not _reading_ (the file stays 18% noise). Needs span-accurate source rewriting from Quint's IR, which is not free. Fallback if A' is declined. |
| **A'. Opt-in per spec; generator expands; Quint typechecks the expansion** | **Recommended.** Fixes both. The expansion is printed with Quint's own IR printer and fed to `typecheck:quint`, so Quint's semantics and ours agree by construction.                                           |

**Scope of A'.**

1. A file-level pragma (a comment such as `// quint-machine: frame=implicit`,
   hashed with the file so it cannot drift from the generated artifact). No
   pragma means today's strict behaviour plus the P0 completeness check.
2. In an opted-in spec, for each `step` action, append `v' = v` for every
   declared var the `all` does not assign. `init` is never filled (it must
   assign every var). A duplicate assignment of one var stays loud.
3. `typecheck-quint.ts` runs on the expansion for opted-in specs, so
   `QNT000` still guards the result.

**Cost.** Generator S-M (front half of `parseAction`, `codegen.ts:325-388`, plus
an IR-to-text print for the oracle); evaluator none; document none; lint none
(no new import form). The freshness hash covers the pragma because it covers
the whole file.

**Loud-failure story.** The widening is explicit and per file. The default is
strictly tighter than today. The risk to name: a typo'd var name in an opted-in
spec is a loud `QNT404` from the oracle, but an _intentionally forgotten_
assignment is now indistinguishable from an intended frame; the invariants are
the only net, which is exactly the Quint semantics anyway.

### 4.2 `^` (`ipow`), not "bitwise ops"

**Evidence.** Ten specs hand-roll a power-of-two ladder or one-hot weight:
`listbox-single.qnt:54`, `listbox-multi.qnt:58`, `listbox-rearrangeable.qnt:62`,
`radio.qnt:47`, `tabs.qnt:53`, `timeline.qnt:68`, `treeview.qnt:105`,
`toolbar.qnt:49`, `treegrid.qnt:68`, `pointer.qnt:138`. Beans `mn03` and `e9jm`
list "no bitwise ops".

**Reframe.** Quint has no bitwise operators (`powmod` is `QNT404 Name not
found`; there is no shift, and/or on ints in `builtin.qnt`). What it has is `^`.
`quint typecheck` accepts `2 ^ k` (`pow.qnt`); the generator rejects it loudly
(`unsupported operator: ipow`, `codegen.ts:115-132`). With `^`,
`bit(m, k) = (m / 2 ^ k) % 2 == 1` and the ladders disappear.

**Cost and safety.** Add `ipow` to both opcode lists; the evaluator case must
copy Quint's semantics (`0^0` and negative exponent are errors, not
`BigInt` `RangeError`s; `builtins.js:357-369`). XS. No document change.

### 4.3 More than one nondet per action (plus range pools)

**Evidence.** Packed selectors in the specs: `tabs.qnt:179-182` (a 40-value
`flavor` decoded into four fields), `camera.qnt:109,295` (anchor + 4 x limit,
goal 0..11), `pointer.qnt:283` (`touch = (pointer - 1) * 12 + palette`, a
24-value pool), `grid` cell = `row * COLS + col`. The packing leaks into the
bridge layer (`canvas.bridge.ts:315` `anchor + ANCHOR_COUNT * factor`,
`grid.bridge.ts:236` `row * GRID_COLS + col`) and into scenario step names
(`canvas.bridge.ts:30-33`: steps may only name a pool member). Also non-UI:
`oauth/dpop-nonce.qnt:9`, `backlink-index/target-index.qnt:9`. `radio` (`5r9m`)
split one config into three actions for the same reason.

Pool size evidence: 15 of 67 `int` pools have 8 or more members, and 11 of
those are contiguous ranges (`tabs.configure` 40, `camera.zoom_at` 28,
`treegrid.clickCell` 21). `nondet-range` (`lo.to(hi)`) is loud today.

**Cost.**

- Generator S: loop the `let` unwrap at `codegen.ts:337-349`; reject duplicate
  nondet names; expand `Set(lit...)` and, as a separate loud-by-default form,
  `int-lit.to(int-lit)` into explicit literals at generation (so ranges need no
  document change).
- Document: `nondet` -> `nondets: []`, **additive** (keep decoding the single
  form, so old documents still load).
- Runtime: `eventPayloads` is one `{name, kind}` per action
  (`runtime.ts:334-339, 405-428`) and `eventsOf` reads it
  (`testing.ts:98-110`); both become a list and `eventsOf` a cartesian product.
  `pools` is already keyed by nondet name (`runtime.ts:419`), so it is
  forward-compatible. Scaffolding emits N payload fields
  (`codegen.ts:990-999`).
- Size: the product equals the packed pool (pointer: 2 x 12 = 24), so no
  exploration blow-up versus today; independent pools could be larger, which
  `explore`'s `maxStates` cap (`testing.ts` default 5000) bounds.
- Lint: none.

**Loud-failure story.** Pool contents stay literal-only; the existing loud test
(`codegen-loud.test.ts:216`) flips from "rejects" to "accepts and decodes N
fields", and a new test rejects a duplicate nondet name. Ranges accept only
int-literal bounds.

**Pair with #5.** Both rewrite the same event-schema path
(`runtime.ts:409-428`). Do them in one change to avoid touching it twice.

### 4.4 Derived defs callable from the reference model

**Evidence.** Beans `dxmc`, `svrg` ("derived string defs are not evaluable"),
`l3tm`, `cwsp`, `czsz`, `nwgp`, `e9jm` item 8. 32 of the 41 APG specs declare
102 `def aria*`/`def tabIndex*` defs. The ARIA contract is the derived defs
(`grid.qnt:25` says so), yet `README.md:13-24` exposes only `val: bool`
invariants, so authors write near-tautological invariants just to reach a def
(`cwsp`: "several are tautological by construction"; `392a`: same).

**The real cost of not having it.** `grid.bridge.ts:290-335` re-implements
`cellTabindex`, `ariaRowindex`, `ariaColindex` and `cellReadonly` by hand in
TypeScript; they are already written in `grid.qnt:125-141`. Nothing ties the
two. The chain spec def -> bridge port -> Solid primitive has an unchecked
middle link, which is a hole in the spec-as-source guarantee, not a
convenience.

**The workaround exists and proves the shape.** `pointer.test.ts:78-105` and
`scenarios.test.ts:180` clone the document, add a `kind: 'invariant'` probe def
whose body calls the target def, and read `holds`.

**Cost.** Runtime S: expose `evaluate` as `reference.call(name, args, state)`
(`runtime.ts:176-300` already resolves def calls and zero-arg defs). Generator,
document, lint: none.

**Loud-failure story.** Unknown def, wrong arity, or a lambda result raises a
typed `EvaluationError`; no new syntax is accepted. This is the safest item on
the list.

### 4.5 `str`/`int` pools decode as literal unions

**Evidence.** Bean `p8id` ("`activate.key` accepts any string"). 22 UI specs
have `str` pools (41 pools); they are the keyboard alphabet
(`tabs.qnt:212` `key` = `ArrowLeft ... Delete`), the event the UI specs care
about most. The generated scaffolding types them as `Schema.String`
(`codegen.ts:886-890, 997`) and the runtime decodes them as `Schema.String`
(`runtime.ts:159-163`), and `transition` checks only the kind
(`runtime.ts:145-157, 387-393`), so `{ _tag: 'activate', key: 'bogus' }` is
accepted by the reference model. `AGENTS.md` promises "wrong payload types and
unknown tags fail `tsgo`"; that is false for the payload value on exactly
these events. Consumers already compensate by hand:
`machine-spike/test/spec-as-source.test.ts:250-258` builds
`Schema.Literals(fromSpec.pools['setDid']['d'])` itself.

**Cost.** Generator S (emit `Schema.Literals([...])`; `Schema.Literals` accepts
`bigint`, `SchemaAST.ts:1662`). Runtime S (`NONDET_SCHEMAS` becomes per-pool).
Lint none.

**Loud-failure story.** Tightening only. One design decision to record: real
DOM keys outside the pool (`"a"`) become decode failures, so the bridge must
map unmodelled keys to a no-op _before_ the machine, as it already does. Check
that every bridge does before landing.

### 4.6 Collections

**Evidence (capability, not just toil).**

- Bitmask encodings, grep-verified (`pow2`/`weight`/`bit` defs): 10 specs, 6
  bridges decode them again in TypeScript (`treeview.bridge.ts:94-112`,
  `treegrid.bridge.ts:116`, `timeline.bridge.ts:31`, `listbox-*.bridge.ts`,
  `canvas.bridge.ts:601-605`).
- Fixed-slot / unrolled encodings, from the beans: accordion 3 panels (`lgq8`),
  checkbox-group 3 bools, dialog stack `l1..l3/r1..r3` (`jin4`),
  slider-multithumb 2 thumbs (`cwsp`), grid 4x3 (`l3tm`), grid-selection
  rectangle, combobox option `if` chains (`pg1g`), the menu fixture (`p8id`).
- Deferred features that need a variable-size collection, all named in beans:
  tabs dynamic disable/insert and empty tablist (`xa10`), dynamic radio count
  (`5r9m`), variable group size (`nwgp`), N>2 thumbs (`cwsp`), toolbar item
  count/kinds (`bfuz`), configurable grid page size (`l3tm`).
- It limits conformance coverage today: bridges throw `Unsupported` on any
  scenario that changes the fixture (`treegrid.bridge.ts:34-35`: "the spec
  models a fixed tree only"; `treeview.bridge.ts:22`; `grid.bridge.ts:30`: "the
  spec is fixed at 4x3"; `combobox-*.bridge.ts` fixed corpus). `e9jm`: scenarios
  carry their own `config.nodes` and "the spec's fixed 3 nodes cannot replay
  them". I did not measure how many of the ~70 ported scenario files are skipped this
  way; that count is the cheapest way to size the benefit and should be taken
  before committing.

**What UI specs actually need (scope).** Bounded, small, integer-indexed.
Stage 1: `Set[int]` (selection, expanded, disabled, present): `Set(..)`,
`contains`, `union`, `exclude`, `size`, `isEmpty`, `lo.to(hi)`. Stage 2:
`List[int]` (order: rearrangeable listbox, tab insertion, layer stack) and the
quantifiers/fold that replace recursion (`dxmc`, `xgs1` unrolled trees; Quint
forbids recursion, section 6). **`Map`, records, tuples, variants: not for UI
yet**; the only evidence is service specs.

**Cost: every layer.**

- Runtime value model: `QuintValue = string | boolean | bigint`
  (`runtime.ts:126`) needs a collection member; `eq`/`neq` are `===`
  (`runtime.ts:189-192`) and would silently return false for equal sets, so
  **deep equality is a precondition, not a follow-up**.
- Document schema (`runtime.ts:68-115`, var `type`), generator var allow-list
  (`codegen.ts:134-138, 653-661`), scaffolding `schemaIdent`
  (`codegen.ts:886-897`).
- Consumers that stringify state: `testing.ts:117-125` `stateKey` uses
  `String(state[field])` (an array stringifies order-dependently; sets need a
  canonical sort), `scxml.ts:208, 355, 402-405, 449`.
- Bridges and the 15 specs that would adopt it (adoption is optional; nothing
  forces a rewrite of finished specs).
- Existing loud tests flip: `codegen-loud.test.ts:51-110` (Set/List/record/Map/
  tuple state) and `133` (collection operators). Keep Map/record/tuple tests
  as-is.
- Lint: none; the hash covers the spec.

**Loud-failure story.** Per-type and per-operator allow-list; anything else
(`Map`, `Rec`, `Tup`, `fold` until stage 2) keeps rejecting. Land the
deep-equality test in the same change.

### 4.7 `val`/`let` bindings inside defs

**Evidence.** `mn03` ("no `let` inside defs: defs recompute `posOf(...)`
inline"), `e9jm` item 3 ("long argument lists and repeated subexpressions; the
evaluator has no memoisation, ~1 ms/state for 24 invariants"). The generator
rejects it with `unsupported expression kind: let` (`letdef.qnt`).

**Cost.** One additive `let` expression kind in the document
(`runtime.ts:33-66`), one evaluator case, one generator case
(`codegen.ts:153-206`). S-M. Loud story: accept only `val x = e` followed by
a body; everything else in the same `kind: 'let'` family (`def` inside `let`,
`nondet`) stays rejected.

### 4.8 Nondet pools in `init`

**Evidence.** `pg1g`, `mn03`, `5r9m`, `392a`, `nwgp`, `lgq8`. Every one solved
it with a config event (`set_*`, or tabs' remounting `configure`), and none
reported a modelling loss; the cost is exploration depth (config must be
reached by steps).

**Cost.** M and an API change: `initial` is one state
(`runtime.ts:361-367, 320`), would become a set of states, touching `explore`,
`simulate`, `scxml.ts`, the MBT init handshake and the scaffolding's `init`
event. Not worth it while the workaround is faithful. Do the P0 fix (loud at
generation) and revisit when a spec needs a _mount-time-only_ choice that
cannot be an event.

### 4.9 Bool helper `val`s misclassified as invariants

**Evidence.** `lgq8`, `xgs1` ("helper bools are parameterised defs").
Reproduced (`helperval.qnt`): `val isBig: bool = a > 2` appears in
`invariants`; `def isBig0: bool = a > 2` does not. Zero-arg defs already work as
helpers (`czsz`, `l1io`, `jin4`), so the two beans paid for a cost that did
not exist.

**Decision.** Do not change the classification: `val` = invariant is Quint's
convention (it is what `quint run --invariant` consumes). Add one sentence to
`README.md:13-24` stating it. A generator change could not tell a helper from
an invariant anyway.

## 5. Canvas-specific findings (`e9jm`)

1. **A spec cannot import another machine.** Verified in
   `codegen.ts:532-562`: an imported module declaring a `var`, action or
   `const` is rejected ("shared modules must be pure defs only"), and
   `player.qnt:5-6` hits the same wall. `pointer.qnt` copies ~15 camera defs
   (`pointer.qnt:12-13, 99-122`), and `pointer.test.ts` asserts they stay
   structurally identical.
   **This is not a generator extension.** The copied defs are pure functions of
   their arguments (`absI`, `clampI`, `fdiv`, `rdiv`, the camera maths), and
   pure-def imports already work (`ivbd`, `_shared-proof/*.qnt`). The blocker
   was only that `shared/` was frozen for the APG wave (`0lab` Notes: "No edits
   to `shared/` during the parallel wave"). Extract them to
   `shared/camera-math.qnt` and import from both. True machine composition
   (`instance`, a module with vars) is XL and on the do-not-do list.
2. **Division by zero throws.** See P0 item 5: `RangeError` today, typed
   `EvaluationError` after, and deliberately not a violation.

## 6. Do not do this yet

| Item                                                                             | Why not                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| String concat / string ops (`cwsp`, `dxmc`)                                      | **Not in Quint.** `s.concat("b")` is `QNT000 Couldn't unify list and str` (`strcat.qnt`); `s.length()` the same (`strops.qnt`). Strings are opaque. Derived strings stay literal-returning defs; `aria-valuetext` formatting belongs to the adapter. Adding it would make specs that Quint rejects.                                                                                                    |
| Recursion (`dxmc`, `xgs1`)                                                       | **Not in Quint.** `QNT099 Found cyclic declarations. Use fold and foldl instead of recursion` (`rec.qnt`). The Quint answer is collections + `fold`/`forall`/`exists` (stage 2 of #6), not a generator feature.                                                                                                                                                                                        |
| Bitwise operators (`mn03`, `e9jm`)                                               | **Not in Quint.** The missing primitive is `^` (#2).                                                                                                                                                                                                                                                                                                                                                   |
| Action preconditions / guards (`pg1g svrg jin4 392a nwgp 6kpe`, `player.qnt:19`) | Loud today (`guard.qnt`). A guard makes an event _disabled_, which needs a new concept in `transition`, `eventsOf`, `explore`, and the MBT handshake. UI events are total: the browser delivers `keydown` in any state and the correct behaviour is a no-op, which is exactly the guard-in-RHS encoding the specs use. Keep the encoding; revisit only for a spec where disabled-ness is the property. |
| `const` (`xa10 pg1g dxmc l3tm e9jm xgs1 lgq8`)                                   | A zero-arg `def`/`val: int` is the same thing and already works (`e9jm`: "constants are zero-arg defs"). A real `const` needs `instance` binding, which is rejected loudly and rightly (`codegen.ts:617-631`).                                                                                                                                                                                         |
| Machine import / `instance` / composition                                        | XL (product construction, var namespacing, hash closure, `step` semantics). The payoff the beans want is pure-def sharing, which already works (section 5).                                                                                                                                                                                                                                            |
| Division by zero as a violation                                                  | Hides spec bugs; Quint raises `QNT503`. Type the error instead.                                                                                                                                                                                                                                                                                                                                        |
| `Map` / records / tuples / variants                                              | No UI spec asked for them; evidence is service specs only. Keep loud.                                                                                                                                                                                                                                                                                                                                  |
| Frame groups (option B in 4.1)                                                   | Valid Quint but no net line saving.                                                                                                                                                                                                                                                                                                                                                                    |
| Default-on implicit frame                                                        | Fails the Quint oracle and silently changes what existing specs mean. Opt-in only.                                                                                                                                                                                                                                                                                                                     |

## 7. Recommended order of work

1. **P0 hardening** (one change, XS each). Unblocks everything: nothing below
   is safe while `init` nondets and unassigned vars are silently accepted, and
   no reviewer can act on a loud failure whose reason is not printed.
   Include the opcode-list equality test.
2. **`ipow`** (XS). Ship with P0; it is the first use of the opcode test.
3. **Implicit frame, opt-in** (S-M). Adopt on the next new spec first, then
   convert the heaviest existing ones (`player`, `pointer`, `carousel`) only if
   the diff review says it is worth it; conversion is optional and the CI diff
   stays empty for specs that do not opt in. If the language-contract change
   (a spec is "Quint plus a pragma") is declined, fall back to option C.
4. **Multi-nondet + range pools + literal-union pools** (S-M, one change). Same
   code path (`runtime.ts:409-428`, `codegen.ts:990-999`); both change the event
   schema, and both tighten or are additive.
5. **Def-call API** (S). Then replace one hand-ported bridge `attr`
   (`grid.bridge.ts:290-335`) as the proof, and delete the probe-def
   workaround in `pointer.test.ts`/`scenarios.test.ts`.
6. **Collections stage 1: `Set[int]`** (M), with deep `eq`, canonical
   `stateKey`/SCXML. Before starting, measure how many of the ~70 ported
   scenarios are skipped as `Unsupported` today, to size the win. Design stage
   2 (`List`, `forall`/`exists`/`fold`) while stage 1 lands. Prove it on one
   bitmask spec (`timeline`, the smallest) and one deferred feature (dynamic
   tabs).
7. **`let` in defs** (S-M) once collections land, since `fold` bodies want it.
8. **Extract `shared/camera-math.qnt`** (no generator work), and the shared ARIA
   vocabulary the APG beans already plan.
9. **Nondet pools in `init`** only when a spec needs a mount-time-only choice.

## 8. Cross-cutting rules for any of the above

- **Additive means a byte-identical `generate:all`.** CI's
  `git diff --exit-code -- packages/specs/src` is the regression test. The
  freshness lint cannot catch generator-semantics drift: it hashes the spec
  source only (`quint-generated-model-fresh.ts:55`), not the generator version.
- **Document changes stay additive and decode both shapes**, or the same
  change regenerates all 93 specs (CI forces it either way).
- **One opcode list.** Add opcodes in both places and keep the equality test.
- **A new import form must update two places**: `loadSpecClosure`
  (`codegen.ts:464-604`) and the lint's hand-copied `importPattern`
  (`quint-generated-model-fresh.ts:84-85`). Forgetting the second is a silent
  stale pass. Nothing proposed here needs a new import form.
- **Each extension flips exactly its own loud test** in
  `codegen-loud.test.ts` from "rejects" to "accepts", and adds one test that
  its next-narrower neighbour still rejects.
- **Quint's own typechecker stays the oracle**
  (`scripts/typecheck-quint.ts`): the generator is deliberately more permissive
  than Quint, so an extension must never be justified by "the generator
  accepts it".

## Appendix: reproducers

All in `$TMPDIR/opencode/dx00/`, outside the repo. `gen.mjs` calls
`generateModelDefinition` from `packages/quint-machine/dist`, prints the typed
error's `detail`, then loads the document with `makeReferenceModel`.

| Spec                 | Construct                               | Generator                                                             | `quint typecheck`     |
| -------------------- | --------------------------------------- | --------------------------------------------------------------------- | --------------------- |
| `partial.qnt`        | `inc` omits `b`, `init` assigns it      | loud: `step action inc updates a different variable set ... (QNT000)` | QNT000                |
| `nonassignedall.qnt` | `b` assigned nowhere                    | **accepted**; `initial = { a }`, invariant over `b` is `unbound name` | clean                 |
| `multi.qnt`          | two `nondet`s                           | loud: `expected all { ... } block` (misleading)                       | clean                 |
| `initnd.qnt`         | `nondet` in `init`                      | **accepted**; load fails `EvaluationError unbound name: x`            | clean                 |
| `helperval.qnt`      | `val isBig: bool` vs `def isBig0: bool` | `isBig` listed as invariant, `isBig0` not                             | clean                 |
| `nondetname.qnt`     | `nondet enabled`                        | **accepted**                                                          | QNT101                |
| `letdef.qnt`         | `val` inside a def                      | loud: `unsupported expression kind: let`                              | clean                 |
| `guard.qnt`          | `all { a < 3, a' = a + 1 }`             | loud: `expected only field' = value assignments`                      | clean                 |
| `callact.qnt`        | action called inside `all`              | loud: same message                                                    | clean                 |
| `setvar.qnt`         | `var s: Set[int]`                       | loud: `unsupported type set`                                          | clean                 |
| `constd.qnt`         | `const N`                               | loud: `const declarations are not supported (N)`                      | clean                 |
| `divz.qnt`           | `10 / a` at `a = 0`                     | accepted; evaluator throws raw `RangeError`                           | `quint run`: `QNT503` |
| `pow.qnt`            | `2 ^ k`                                 | loud: `unsupported operator: ipow`                                    | clean                 |
| `bitwise.qnt`        | `powmod`                                | loud: `unsupported operator: powmod`                                  | QNT404 (no such name) |
| `strcat.qnt`         | `s.concat("b")`                         | loud: `unsupported operator: concat`                                  | QNT000 (list vs str)  |
| `strops.qnt`         | `s.length()`                            | not run                                                               | QNT000                |
| `rec.qnt`            | recursive def                           | not run                                                               | QNT099 (use fold)     |
| `stepbad.qnt`        | `step = any { init, go.then(go) }`      | loud, but as a `Die` defect                                           | clean                 |
| `lam.qnt`            | `Set[int]` + `forall`                   | not run                                                               | clean                 |

Corpus scan (`corpus.mjs`, over the 93 generated documents): 0 actions that
omit a var; 2,423 frame assignments in the 43 UI documents; 67 `int` pools of
which 15 have 8 or more members.
