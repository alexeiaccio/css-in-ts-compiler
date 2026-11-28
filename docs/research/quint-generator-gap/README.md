# Reproducers: Quint constructs the generator does not support

> Carried over from `effects-of-atmosphere` on 2026-11-28 with the two generator notes beside it. The build command below is
> that repository's; here the generator is `@quint-machine/core` and the reproducers are only evidence, not a suite.

Run the built codegen against any file here (from the repo root, after
`pnpm --filter @eoa/quint-machine build`):

```sh
node packages/quint-machine/bin/quint-machine.js \
  --spec docs/research/quint-generator-gap/list-state.qnt \
  --out /tmp/list-state.model.generated.json
```

| file                                 | construct                            | observed behaviour                                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `list-state.qnt`                     | `var : List[int]`                    | `generateModelDefinition` succeeds with `type:"list"`; `generateModelArtifacts` throws an **untyped TypeError** in the TS AST factory; `decodeDefinition` rejects the doc (`SchemaError` on `vars[0].type`). |
| `set-state.qnt`                      | `var : Set[str]`                     | same as above (`"set"`), plus `union`/`Set(...)` opcodes unknown to the evaluator.                                                                                                                           |
| `record-state.qnt`                   | `var : {members:int, admins:int}`    | same (`"rec"`); `Rec`/`with`/`field` opcodes unknown to the evaluator.                                                                                                                                       |
| `map-state.qnt`                      | `var : str -> int`                   | same (`"fun"`); `Map`/`set`/`get` opcodes unknown.                                                                                                                                                           |
| `higher-order.qnt`                   | `apply(f:(int)=>int, y:int) = f(y)`  | codegen + decode succeed; `transition` throws `EvaluationError` (`f` resolves as an opcode, then the passed def name is unbound).                                                                            |
| `quantifier.qnt`                     | `exists` / `forall` / `contains`     | codegen + decode succeed; `transition` throws `EvaluationError: unknown operator`.                                                                                                                           |
| `nondet-range.qnt`                   | `nondet x = Set(1.to(1000)).oneOf()` | **loud** `UnsupportedSpecError` (pool must be literal-only).                                                                                                                                                 |
| `nondet-named.qnt`                   | `nondet u = users.oneOf()`           | **loud** `UnsupportedSpecError` (pool must be `Set(...).oneOf()`).                                                                                                                                           |
| `nondet-two.qnt`                     | two `nondet` bindings in one action  | **loud** `UnsupportedSpecError` (only one `let` is unwrapped).                                                                                                                                               |
| `temporal.qnt`                       | `temporal X = always(...)`           | generated as a `function` def, **silently never checked** as an invariant.                                                                                                                                   |
| `variants.qnt`                       | `type Room = Channel \| Thread(int)` | constructor pool **loud** `UnsupportedSpecError`; the var records `"type":"const"` and is rejected at decode; the evaluator has no constructor values.                                                       |
| `guard-then.qnt`                     | `a.then(b)` composition              | **loud** `UnsupportedSpecError` (action body is not `all { ... }`).                                                                                                                                          |
| `import-spec.qnt` + `shared-lib.qnt` | `import shared_lib.*`                | import is **silently ignored**; codegen + decode succeed, `transition` throws `EvaluationError` on the imported name. Note: `parsePhase1fromText` does not load other files at all.                          |
| `multi-module.qnt`                   | two modules in one file              | **loud** `UnsupportedSpecError` — the generator reads `parsed.modules[0]` (`lib`, no `step`) instead of the main module.                                                                                     |
