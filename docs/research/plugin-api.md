# A better plugin API, and mise-en-mode as its own package (2026-10-05)

Asked by the user: a more convenient plugin API, something like ArkType's scopes, so that mise-en-mode can live outside the core.
Three designs were drafted in parallel (type drafts only, nothing ran); the drafts are in `plugin-api-proto/{a,b,c}` (scratch
tsconfigs with absolute paths; throwaway, not linted or formatted). The user chose the synthesis of A and C below.

## Today's pain points (code map, 2026-10-05)

1. Types are written twice: `author.ts` (runtime proxies) and `author-types.ts` (declarations), every helper result `as never`,
   and a package needs a hand-written `types.ts` (@cssints/icons). Drift: `createGlobalTheme`'s runtime takes `{ layer }`,
   its type (`theme-types.ts`) does not.
2. Arguments are joined into one string (`valueOf`), so a member cannot take an object or a token set. mise-en-mode's `look()` is a
   hand-typed wrapper around `style()`; its declarations (`Record<string, string>`) are never checked against tokens.
3. Capabilities differ by helper: only `context()` has `runtime`/`conflicts`; only `style()` has `globals` and several kernels.
4. Flat global namespaces: kernel custom properties and markers collide across plugins (authors hand-pick `--fr-*`), global keys are
   first-wins silently (a look's key omits its values, so a dev edit keeps the old CSS), runtime names collide (`derived` reserved),
   two `property()` may claim one name.
5. No local syntax names in grammars.
6. A plugin cannot use tokens, themes or `check.contrast` through the plugin API (a parsed module importing `createGlobalTheme`
   from bare `"cssints"` is an ImportError); looks are invisible to `check.contrast`.
7. Globals are never forgotten on HMR and print into every module's sheet (kernels are per module).

What mise-en-mode added to the core is all generic: `Built.globals` (style() only), top-level named layers above `_.*`, verbatim
top-level rules (`layer: null`), `createGlobalTheme(..., { layer })`. Its logic lives in `src/mise-en-mode.ts`.

## The three designs

- **A, scopes** (`proto/a`): `scope("name", table).build(impl).export()`. The table holds local syntax aliases (`width: "<length
  [0,∞]> | thin"`, used as `<width>`), kernels (`&` is the minted class, `--_x` prints `--<scope>-x`), globals, runtime, conflicts,
  chain and call members; `#private` keys; scopes and token sets embed as modules (`<key.alias>`). Types from the one definition.
  `build()` is a second step because TS cannot type a sibling function from `args` inside one table (18 shapes tried); structured
  args only as one named record (positional widened). Cost: plugins.ts +29% (import floor), frame +6%, surface +4%, look ~+8% over
  plain themes. A member's `build` can return `themes` (createGlobalTheme + layer + @scope).
- **B, one function** (`proto/b`, cancelled before its report; draft only): `member({ name, args, emit })` with an argument
  spec language (`"<grammar>"`, tuples positional, objects structured, `"@tokens"` / `"@overrides"` leaves), `&` and `--_x`
  namespacing, every member with every capability. Looks stay globals (no contrast); no local syntax names.
- **C, the user's vocabulary** (`proto/c`): `plugin(name)` gives `p.tokens` (createTokens namespaced; leaves become typed setters,
  `@property` and conflicts derived), `p.kernel(marker, (css) => css.outline(...))` (kernels as grammar-checked styles, or raw
  `{ css }`), and `p.member((css, ...args) => ...)` whose signature less `css` is the public one (generics kept). A look is
  `css.createGlobalTheme(tokens, selector, overrides, { layer, scope })` inside the member; `css.layers("app", "author",
  "viewer")` declares top-level layers; `check.contrast` merges layered themes by selector. mise-en-mode is almost user-level.
  Weak for frame/surface (raw kernels stay), token setters lose ranges, author-side types 2–5x.

## Decision: A + C in three steps

1. **Engine seams, no new API.** Globals keyed by content and forgotten with their files (HMR bug); the types of
   `createGlobalTheme(t, cond, overrides, { layer?, scope? })` (`@scope` new); declared top-level layers (`css.layers()`,
   replacing `GlobalRule.layer: null`); `check.contrast` sees layered themes (merged by selector in layer order); a plugin member
   can emit a theme (A's `Built.themes`), the one seam a plugin needs to reach themes.
2. **`packages/mise-en-mode`** (`@cssints/mise-en-mode`, peerDependency on cssints, like @cssints/icons) on the public API only:
   `look(tokens, expression, source, overrides, { scope? })`, looks are themes (aspects = top-level token groups), checked against
   the token set and seen by `check.contrast`. `cssints/mise-en-mode` and its export leave the core.
3. **`scope()`** from A as the plugin API: local syntax aliases, `&` / `--_x` namespacing, content-hashed identity, kernels also as
   `css.*` styles (from C), call members returning themes; frame, surface and icons migrate; `context`/`style`/`fn`/`property`
   stay as thin shims until nothing uses them. Positional structured args (B) if they type-check; else A's named record.
   Budgets re-baselined with a reason (the import floor), per-call cost held.
