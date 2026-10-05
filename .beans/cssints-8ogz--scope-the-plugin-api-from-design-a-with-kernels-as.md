---
# cssints-8ogz
title: 'scope(): the plugin API from design A with kernels as css.* styles'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-05T09:25:14Z
updated_at: 2026-10-05T09:59:50Z
parent: cssints-easl
blocked_by:
    - cssints-0v30
---

Step 3 of docs/research/plugin-api.md "Decision"; drafts in docs/research/plugin-api-proto/a (and c for kernels as styles, b for positional structured args).
- [ ] cssints/plugin exports scope(name, table).build(impl).export() typed from the one definition (no author-types.ts duplication, no package types.ts, no as never at the author's side): local syntax aliases, #private entries, embedded scopes and token sets, kernels (& and --_x namespacing; raw css or css.* styles), globals, runtime, conflicts, chain members, call members (structured args; positional if they type-check, else one named record) returning decls/kernels/themes.
- [ ] Identity: scope name unique per process, content-hashed; same name + other content = build error while an old user remains; HMR replace otherwise. Reserve cssints and derived.
- [ ] Migrate frame, surface, @cssints/icons (delete icons/src/types.ts) and @cssints/mise-en-mode; context/style/fn/property become thin shims or go if nothing uses them (say which).
- [ ] Budgets: per-call cost within 1.1x; re-baseline the import floor of bench/plugins.ts with a reason; TS2589 lessons from the drafts (no alias wrapping CheckIn with the chain as argument).
- [ ] API.md Plugins rewritten; docs.mjs green.
