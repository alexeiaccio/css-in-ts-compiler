---
# cssints-jkdk
title: 'mise-en-mode: data-mode fragments + @scope containment'
status: completed
type: task
created_at: 2026-10-04T10:02:20Z
updated_at: 2026-10-04T10:02:20Z
---

The remaining Mode Contract scope of the look plugin (cssints-l1qf), on the `globals` seam.

- **Fragments (Rule 4)**: `look()` splits its declarations by aspect (`--color-*`, `--typography-*`) and emits one rule per aspect whose selector matches the bare marker or the fragment: `:where([data-mode="dark"], [data-mode~="dark/color"])`. So `data-mode="dark"` applies every aspect while `data-mode="dark/color"` applies only color and lets the rest inherit.
- **Containment (Rule 7)**: an optional `{ scope }` on `look()` wraps the rule in `@scope (<scope>) { … }`, confining a foreign look to its content subtree.

Verified: `node mise-en-mode.mjs` (fragments + containment), plus `plugins.mjs`, `frame.mjs`, `surface.mjs`, `docs.mjs`, `packages.mjs` all pass; `bun run typecheck` 0/0; `vp lint` 0 errors.

Open (not this bean): whether `check.contrast` should read a look's sources — it reads themes one at a time today, and a look's sources are not themes.
