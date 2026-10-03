---
# cssints-l1qf
title: 'Plugin: mise-en-mode — the look layer (data-mode themes, source layers, containment)'
status: todo
type: feature
created_at: 2026-10-03T11:43:27Z
updated_at: 2026-10-03T11:43:27Z
---

Make **Mise en Mode** a cssints plugin: a look is a theme applied at a `data-mode` scope, resolved by the Mode Contract (`@layer app, author, viewer`, per-variable fill-through, exact record-key matching, viewer override as the a11y valve). This resolves the layer seam for the Atmosphere design system (effects-of-atmosphere ADR 0003, option 2) without changing the core.

## What already fits
- **Theme under an attribute selector**: `createGlobalTheme(t, '[data-mode="dark"]', overrides)` works today (a selector theme). `attr("data-mode", "dark")` is already a **condition** for class-based / component-level look declarations.
- **Tokens**: `createTokens(<DTCG>)`; the variable name is the kebab path (`color.action.primary.background` → `--color-action-primary-background`) — the contract's Rule 1.
- **A11y**: `check.contrast` per theme is the contract's "author owns accessibility".

## Gaps vs the Mode Contract (what the plugin must add)
1. **Source layers.** Contract Rule 5 requires the look sources ranked `@layer app, author, viewer` so each variable fills from the most-preferred source that sets it. Today token/theme rules all land in `_.k`; the three sources have no order. The plugin needs to **declare layers and emit a theme into a named one** — either a `layers` contribution on the plugin API, or a kernel form that emits `@layer app, author, viewer { … }` verbatim (kernels today go into `_.k`; confirm whether a leading layer statement + `@layer` blocks survive).
2. **Fragments.** `data-mode` may be `expression` (whole look) or `expression/aspect` fragments (at most one per aspect). The plugin parses the marker and applies only the named aspect's variables.
3. **Containment.** A foreign (author/viewer) look must be confined to its content subtree (`@scope`), so it cannot repaint host chrome. cssints has no `@scope` form; the plugin needs one (a kernel/global, or core support).
4. **`@property` + attribute scope.** A theme rule set on a `[data-mode]` element must still work with `@property`-registered tokens; confirm no `@property` limitation bites (initial values are on `:root`).

## Shape (sketch)
```ts
import { mode, look } from "cssints/mise-en-mode" with { type: "cssints" };
// a whole look, into the viewer layer, matched by attribute
look({ expression: "dark", source: "viewer", tokens: t, overrides: { color: { bg: "#0b0b0f" } } });
// a scoped fragment
mode("critical/color");   // the color aspect of the `critical` expression
```

## Open
- Layer contribution: plugin API extension vs kernel escape (settle first).
- Whether the plugin ships as `cssints/mise-en-mode` or a package (`@cssints/mise-en-mode`).
- `@scope` containment: plugin-emitted or core.
- Checking: a look that mixes sources value-by-value cannot be `check.contrast`-ed as one combination — check each theme, measure combinations outside the build (as `apps/sky/test/contrast.mjs` does).
