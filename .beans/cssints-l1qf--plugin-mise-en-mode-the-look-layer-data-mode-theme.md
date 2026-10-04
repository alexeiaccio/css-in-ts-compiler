---
# cssints-l1qf
title: 'Plugin: mise-en-mode — the look layer (data-mode themes, source layers, containment)'
status: completed
type: feature
priority: normal
created_at: 2026-10-03T11:43:27Z
updated_at: 2026-10-04T10:07:11Z
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

## Spike findings (2026-10-03, effects-of-atmosphere session)

A working spike of `cssints/mise-en-mode` was written and run against `test/` (Vite + the real plugin), then reverted. What holds, and the one blocker:

**Holds**
- A plugin **member can be a plain wrapper** around `style()`: `export const look = (expression, source, declarations) => style(grammar, () => ({ decls: [], kernels: [...] }))(expression)`. The engine recognized the export as a member and evaluated the call (verified: the macro ran it and raised its errors).
- `style()` checks the grammar against the **joined args**, so structured arguments must close over the wrapper — only the grammar-checked value goes to the member. Verified.
- The expression grammar: `<custom-ident>` rejects a dotted reverse-DNS key (`com.alice.midnight`); `"<custom-ident> | <string>"` accepts both, with dotted keys quoted at the call site (`look('"com.alice.midnight"', …)`) and the quotes stripped when building the selector. Verified.
- Kernels are emitted **verbatim inside `@layer _.k { … }`**, so a kernel css can carry the layering itself: `@layer app, author, viewer;` plus `@layer app { [data-mode="dark"] { --color-…: … } }` (nested layers under `_.k`). The layering is expressible.

**Blocker**
- `addKernel` (`src/kernel.ts`) rejects two kernels that declare the same custom property: `kernels mise-en-mode:app:dark and mise-en-mode:viewer:dark both declare --color-bg: a plugin picks its own short custom-property names`. A look **must** share `--color-*` across sources and expressions — that is the whole point of per-variable fill-through — so one-kernel-per-look cannot work.
- `addGlobal(key, css)` (`src/sheet.ts`) adds global rules to `_.k` **without** that check and is documented "for the engine and plugins", but it is an `Effect.fn` over the Registry and is **not exposed** to `cssints/plugin`.

**Recommended seam (small)**
- Let a style node contribute global rules alongside kernels: extend `Built` / `CssNode` with `globals?: { key: string; css: string }[]`, registered with `addGlobal` (no variable-uniqueness check), or expose a `global(key, css)` helper on `cssints/plugin`.
- Then `cssints/mise-en-mode` is a wrapper over `style()` returning `globals`: the order statement (`@layer app, author, viewer;`) and one rule per look (`@layer <source> { [data-mode="<expression>"] { … } }`). Fragments (`expression/aspect`) and containment (`@scope`) are then the plugin's own global css.

**Still open after the seam**: fragments, `@scope` containment, and whether `check.contrast` should read a look's sources (it reads themes one at a time today).

## Done (2026-10-03)

**Engine seam**: a style node can carry **globals** — `Built.globals` / `CssNode.globals` (`{ key, css }[]`), merged by `carried`, registered with `addGlobal` in `macro.classesOf`. Unlike a kernel, two globals may share a custom property: that is the fill-through case a look needs.

**Plugin** `cssints/mise-en-mode`: `look(expression, source, declarations)` — a wrapper over `style()` returning globals: `@layer app, author, viewer;` and `@layer <source> { [data-mode="<expression>"] { … } }`. A dotted reverse-DNS expression is quoted at the call (`look('"com.alice.midnight"', …)`) since `<custom-ident>` rejects dots. Subpath export added (dev + `publishConfig`), `vite pack` entry, and a `globals` bullet in docs/API.md (Plugins). Fixture + `test/mise-en-mode.mjs`, wired into the `test` script after `surface.mjs`.

Output:

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@layer _.k {
  @layer app, author, viewer;
  @layer app { [data-mode="dark"] { --color-bg: #0b0b0f; --color-fg: #f3f4f6 } }
  @layer viewer { [data-mode="dark"] { --color-bg: #101018 } }
  @layer author { [data-mode="com.alice.midnight"] { --color-bg: #0a0a12 } }
  @layer app { [data-mode="critical"] { --color-action-primary-background: #e5484d } }
}
```

**Verified**: `node mise-en-mode.mjs`, `plugins.mjs`, `frame.mjs`, `surface.mjs`, `docs.mjs`, `packages.mjs` all pass; `bun run typecheck` 0 errors / 0 warnings; `vp lint` 0 errors.

**Follow-up**: `data-mode` fragments (`expression/aspect`) and `@scope` containment landed in `cssints-jkdk`. **Decided**: `check.contrast` reads registered themes one at a time; a look's fill-through is not a theme, so the plugin does not register looks as themes and core does not read them — the emitter checks each source it emits (ADR 0003).
