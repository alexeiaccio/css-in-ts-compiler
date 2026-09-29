# CSS-in-TS

Compile-time CSS-in-TypeScript: composable utility calls (`css.flex().alignItems("center")`) become atomic, content-hashed classes in `@layer`s. CSS values are checked against the spec grammars (mdn-data) both in the types and at build time. LightningCSS optimizes the output.

Status: research restart. Decisions and findings are in [docs/wayfinder.md](docs/wayfinder.md), the target API is in [docs/API.md](docs/API.md).

## Layout

| Path | What |
|---|---|
| `packages/cssints` | Vite plugin (`cssints/vite`) on the Vite Module Runner, and the `cssints` library |
| `packages/css-grammar` | Type-level recognizer and its runtime twin over mdn-data grammars, Typed OM values, browser support and prose rules |
| `packages/plugin-icon` | Icon plugin, not yet ported to the new engine |
| `apps/demo` | React demo |
| `docs/research`, `docs/archive` | Comparisons with other libraries; outdated plans |

## Usage

```ts
// vite.config.ts
import cssints, { targets } from "cssints/vite";

export default { plugins: [cssints()], css: { transformer: "lightningcss", lightningcss: { targets } } };
```

```ts
// the entry, once
import "virtual:cssints.css";
```

```ts
import * as css from "cssints" with { type: "cssints" };

export const pad = css.p(4); // → "_lwugp7"
export const row = css.flex().alignItems("center"); // → "_1s47490 _1ob5z5m"
```

`virtual:cssints.css` is one sheet with every rule once, sorted by layer, then condition, then shorthand before longhand, then class name:

```css
@layer _.a, _.b, _.c, _.d, _.e;
@layer _.a {
  ._lwugp7{padding:1rem}
  ._1ob5z5m{align-items:center}
  ._1s47490{display:flex}
}
```

`targets` comes from the browserslist query of the support warnings (`BROWSERSLIST`, default `defaults`).

## Development

```bash
bun install
bun run test    # all packages
bun run bench   # type instantiation budgets (tsc and tsgo)
cd apps/demo && bun run dev
```

## License

MIT
