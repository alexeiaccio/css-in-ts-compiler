# @cssints/mise-en-mode

The look layer of Mise en Mode for [cssints](../../README.md): a **look** is a theme set on a `data-mode` scope, and looks
from three sources are resolved by the Mode Contract. It is one call member of `cssints/plugin` `scope()` (positional
arguments `$tokens` and `$overrides`, returning themes), so a look is checked against your token set, and `check.contrast` sees it.
No runtime.

```ts
import { createTokens } from "cssints" with { type: "cssints" };
import { look } from "@cssints/mise-en-mode" with { type: "cssints" };

const t = createTokens({
  color: { $type: "color", bg: { $value: "#ffffff" }, fg: { $value: "#111111" } },
});

// look(tokens, expression, source, overrides, { scope? })
look(t, "dark", "app", { color: { bg: "#0b0b0f", fg: "#f3f4f6" } });
look(t, "dark", "viewer", { color: { bg: "#101018" } });
look(t, "hero", "author", { color: { bg: "#123456" } }, { scope: "article.post" });
```

```css
@layer app, author, viewer;
@layer app {
  :where([data-mode="dark"], [data-mode~="dark/color"]) {
    --color-bg: #0b0b0f;
    --color-fg: #f3f4f6;
  }
}
@layer viewer {
  :where([data-mode="dark"], [data-mode~="dark/color"]) {
    --color-bg: #101018;
  }
}
@layer author {
  @scope (article.post) {
    :where([data-mode="hero"], [data-mode~="hero/color"]) {
      --color-bg: #123456;
    }
  }
}
```

## The contract, as the package does it

- **Sources (Rule 5).** `source` is `"app"`, `"author"` or `"viewer"`: the layers `app < author < viewer`, declared once
  after the engine's own (`layers()` of cssints), so a look beats the engine's `:root` fallbacks and a viewer's look beats an
  author's over the app's. Each variable fills from the most preferred source that sets it: the viewer look above sets only
  `--color-bg`, and `--color-fg` still comes from the app look.
- **Aspects and fragments (Rule 4).** An aspect is a top-level group of the token set (`color`, `typography`). A look's
  `overrides` are split by it, one rule per aspect, and each rule matches the bare marker or its fragment:
  `data-mode="dark"` applies every aspect, `data-mode="dark/color"` only the color group.
- **Expressions.** `expression` is a `<custom-ident>` or a string; a dotted reverse-DNS key is quoted at the call,
  `look(t, '"com.alice.midnight"', "author", …)`, and matched exactly.
- **Containment (Rule 7).** `{ scope: "article.post" }` wraps the rule in `@scope (article.post) { … }`, so a foreign look
  cannot repaint the host's chrome. It is a selector, checked by the build.
- **Overrides** are `createGlobalTheme`'s: values by token path, each of the token's type, `{color.bg}` references allowed,
  checked in the types as you type and again at build time (`color.bg value "blu" is not a <color>`, located at the call).
  The aliases that depend on an overridden token are declared again on the scope.
- **Contrast.** The looks of one expression and aspect are one cascade to `check.contrast`: they are laid over each other in
  layer order, so a viewer look that sets only the text colour is checked on the _app_ look's background, and a poor
  combination fails the build.

A look prints no class: call it at a module's top level, like `createGlobalTheme`. Its types are inferred from the `scope()`
definition in `src/index.ts`: there is no types file.

Changed from `cssints/mise-en-mode`, which this package replaces: `look(expression, source, declarations, { scope })` took
raw custom-property declarations (`"--color-bg": "#000"`) that nothing checked; it is now `look(tokens, expression, source,
overrides, { scope })` with the token set first and the overrides by token path, so the declarations are checked, the
aliases are re-derived and contrast sees them. Aspects are the groups of the tokens, no longer a table of `--color-` and
`--typography-` prefixes, and a look emits themes, no longer globals.

```bash
cd packages/mise-en-mode && bun run test   # fixtures through the engine (output, errors, contrast), and the type test via bun run typecheck
```
