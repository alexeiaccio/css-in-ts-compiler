---
# cssints-8ogz
title: 'scope(): the plugin API from design A with kernels as css.* styles'
status: completed
type: feature
priority: normal
created_at: 2026-10-05T09:25:14Z
updated_at: 2026-10-05T10:41:34Z
parent: cssints-easl
blocked_by:
    - cssints-0v30
---

Step 3 of docs/research/plugin-api.md "Decision"; drafts in docs/research/plugin-api-proto/a (and c for kernels as styles, b for positional structured args).
- [x] cssints/plugin exports scope(name, table).build(impl).export() typed from the one definition (no author-types.ts duplication, no package types.ts, no as never at the author's side): local syntax aliases, #private entries, embedded scopes and token sets, kernels (& and --_x namespacing; raw css or css.* styles), globals, runtime, conflicts, chain members, call members (structured args; positional if they type-check, else one named record) returning decls/kernels/themes.
- [x] Identity: scope name unique per process, content-hashed; same name + other content = build error while an old user remains; HMR replace otherwise. Reserve cssints and derived.
- [x] Migrate frame, surface, @cssints/icons (delete icons/src/types.ts); context/style/fn/property stay as shims (style: mise-en-mode, fn: functions.ts, all four: the old tests). @cssints/mise-en-mode moves in the follow-up cssints-rmws, after both branches merged.
- [x] Budgets: per-call cost within 1.1x; re-baseline the import floor of bench/plugins.ts with a reason; TS2589 lessons from the drafts (no alias wrapping CheckIn with the chain as argument).
- [x] API.md Plugins rewritten; docs.mjs green.

## Summary of Changes

`scope(name, table).build(impl).export()` in `cssints/plugin`, typed from the table; frame, surface and `@cssints/icons` are written on it.

- **API.** Table entries by shape: syntax aliases (`<width>`, expanded by the same rule in the types and the build), `-prop` typed properties, kernels (raw CSS, or `css: (css) => styles` checked like a user's), globals, layers, runtime, conflicts, `{ tokens }`, embedded scopes (`<mod.alias>`, `&(mod.key)`), chain, call and value members, `#private` keys. `&` is the minted class `_<scope>-<entry>`, `--_x` is `--<scope>-x`. Call members take a grammar, `arg<T>()` or **positional arguments** (`["<color>", "$tokens", "$overrides", { "size?": "<width>" }]`), which type-check within budget (the error lands on the call with the position in the message, not on the argument); `build` returns decls, uses, globals, themes, layers.
- **Identity.** Name unique per process, content hash of the table and the source of its functions; same content is nothing, other content replaces it unless a file that was not affected still uses the old one (build error). `hotUpdate` forgets the modules an edit affects. `cssints` and `derived` are reserved.
- **One definition.** The types are the signatures in `scope.ts` and `author.ts` (the front: types and one-line bodies); the engine is `scope-engine.ts`, registered by `macro.ts`. The front imports nothing that runs, so a program that imports `cssints/plugin` needs no Node types and no newer `lib`: the benches (tsc 5.9, no config) failed when the types pointed at the implementation. `node.ts` is the Node-free part of `lib.ts`. `author-types.ts` keeps interfaces only; `icons/src/types.ts` is deleted; no `as never` at a plugin author's side.
- **Shims** `context`, `method`, `style`, `fn`, `property` stay (mise-en-mode needs `style`, `functions.ts` needs `fn`); follow-up cssints-rmws.
- **CSS differences.** Names are the scope's own: `--frame-*`, `--surface-*`, `--icons-svg`; markers `_frame-core`, `_surface-core`, `_icons-mask`, `_icons-image`; kernels `frame.core`, `surface.core`, `icons.mask`; runtimes `virtual:cssints/runtime/frame.fallback`. Same rules otherwise.
- **Budgets.** plugins.ts 51124/55394 (tsc/tsgo) -> 76647/86987; plugins-defs.ts (the same without calls) 56562/65901 is the new floor; the 30 calls cost 20085/21086 against 20596 for the same calls on the old helpers (1.02x). frame.ts +8%, surface.ts +6% (the bench imports only the plugin, so it now loads the types of cssints; user programs have them anyway).
- **Tests.** test/scope.mjs, fixtures scope-kit/scope-use, test/types/scope.ts, API.md Plugins; perf.mjs A/B on 300 modules in one worktree: median 4.24-4.29 ms per evaluation against 4.23-4.27 ms (fork point of master).
