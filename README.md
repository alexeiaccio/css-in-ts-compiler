# CSS-in-TS

cssints is compile-time CSS-in-TypeScript. You write calls such as `css.flex().alignItems("center")`. A Vite plugin runs them at build time and replaces each one with atomic, content-hashed class names in `@layer`s. Nothing of the styling code ships to the browser except `cx` and the few lines behind `cv`, which join class names.

- Values are checked against the spec grammars (mdn-data) in the types and again at build time. A typo is an error in the editor and in the build.
- Conditions (`media`, `container`, `supports`, `hover`), variants (`cv`), design tokens and themes (`createTokens`, `createGlobalTheme`, `check.contrast`) are all build-time, and all typed.
- LightningCSS optimizes the output. Browser support (`@mdn/browser-compat-data` against your browserslist) is reported as warnings, except for what LightningCSS lowers for those targets.

Status: 0.1 is not published yet. Decisions and findings are in [docs/wayfinder.md](docs/wayfinder.md); the API reference is [docs/API.md](docs/API.md). Both are also a site with search and type hovers: [apps/docs](apps/docs) (`cd apps/docs && bun run dev`); deployed to Cloudflare with Alchemy: <https://cssints.accio.blue>.

## Install

Not on npm yet. In this repo `cssints` is a workspace package (`apps/demo` depends on `"cssints": "workspace:*"`). It needs Vite 8 (Vite+ works too) and, for the plugin, Node with type stripping (22.18 or later).

```ts
// vite.config.ts
import cssints, { cssTarget, targets } from "cssints/vite";

export default {
	plugins: [cssints()],
	css: { transformer: "lightningcss", lightningcss: { targets } },
	build: { cssMinify: "lightningcss", cssTarget },
};
```

```ts
// the entry, once
import "virtual:cssints.css";
```

`targets` and `cssTarget` come from the browserslist query of the support warnings: the `BROWSERSLIST` variable, else the standard config (`"browserslist"` in `package.json` or `.browserslistrc`, with the `BROWSERSLIST_ENV`, `NODE_ENV` or `production` section), else `defaults`. The config is looked up from `process.cwd()` and upward, once per process: the exports are computed when `vite.config.ts` is imported, before Vite's root is known, and the warnings read the same place. Run Vite from the app's directory (`vite <dir>` from elsewhere reads the config of the working directory). Vite's CSS minify reads `cssTarget`, not `targets`: without it the minifier merges the declarations of a `firstThatWorks` into the last one. Add `"types": ["vite/client"]` to `tsconfig.json` for the `virtual:` import.

### Frameworks

Any framework that builds JSX through a Vite plugin works; the engine evaluates your modules itself, so it does not care what the plugin makes of JSX, nor in which order the plugins are listed. `apps/sky` is the Solid 2 app (`solid-js` and `@solidjs/web` 2.0.0-rc.13, `@solidjs/vite-plugin` 3.0.0-next.47):

```ts skip
// vite.config.ts
import solid from "@solidjs/vite-plugin";
import cssints, { cssTarget, targets } from "cssints/vite";

export default {
	plugins: [cssints(), solid()],
	css: { transformer: "lightningcss", lightningcss: { targets } },
	build: { cssMinify: "lightningcss", cssTarget },
};
```

`tsconfig.json` is Solid's: `"jsx": "preserve"`, `"jsxImportSource": "@solidjs/web"`, `"types": ["vite/client"]`. Solid's `class` takes a string, an object or an array, so `cx` is not needed: `class={[card, on() && p(4)]}` and `class={badge({ tone: tone() })}` work as in React. A site's arguments are still build-time values, so a signal goes in the condition or in a `cv` variant, not in `p(n())`. Under `vite dev` an edit of a component replaces it and resets its state below it (Solid's refresh); an edit of a style changes the class strings and the sheet with no reload.

```tsx
import { cx } from "cssints";
import { bg, color, cn, cv, flex, hover, media, p, style, token } from "cssints" with { type: "cssints" };

const md = media("(width >= 40rem)");
const accent = token.color("#2563eb", "accent");

const button = cv({
	base: cn(p(2), color("white"), bg(accent), hover(bg("#1d4ed8"))),
	variants: { wide: { true: md(p(4)) } },
});

export const Row = ({ wide, on }: { wide?: boolean; on?: boolean }) => (
	<div className={cx(flex().alignItems("center").gap(2), on && p(1))} style={style(token.set(accent, "#dc2626"))}>
		<button className={button({ wide })}>Save</button>
	</div>
);
```

`with { type: "cssints" }` marks what runs at build time. The plugin replaces each call with a class string, so the browser gets `cx("_1s47490 _1ob5z5m _g2iyum", on && "_lqk467")` and `button` is a call of the runtime with `{ base: "_1t8gqy5 ...", ... }`, so it never sees `flex()`. `virtual:cssints.css` is one sheet with every rule once, sorted by layer, then condition, then shorthand before longhand, then class name:

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@property --accent{syntax:"<color>";inherits:true;initial-value:#2563eb}
@layer _.a {
  ._1t8gqy5{padding:0.5rem}
  ._lqk467{padding:0.25rem}
  ._g2iyum{gap:0.5rem}
  ._17xzvrh{background-color:var(--accent)}
  ._1binn6n{color:white}
  ._1ob5z5m{align-items:center}
  ._1s47490{display:flex}
}
@layer _.b {
  ._1tsjws2:hover{background-color:#1d4ed8}
  @media (width >= 40rem) {
    ._tdcza3{padding:1rem}
  }
}
```

More in [docs/API.md](docs/API.md): property names and short names, `flex()` and `grid()` chains, conditions and layers, tokens and themes, `cx`, `cn` and `cv`, and the errors you can get.

## Debugging

`CSSINTS_TRACE=otlp bun run build` (or `dev`) sends a trace of every Vite hook, with the file of each module, to a local OpenTelemetry backend; unset, it costs nothing. How to start the backend in one `docker run`, and the spans: [docs/API.md](docs/API.md#debugging-traces-of-the-engine-cssints_trace-cssints-r2qq).

## For agents

`cssints` ships two [agent skills](https://agentskills.io) in its package, `skills/cssints` (writing styles: setup,
`cn`/`cx`/`cv`, conditions, tokens and themes, the plugin packages, build errors) and `skills/cssints-plugin` (writing
a plugin on `scope()`, with its tests). Install them into your agent's skills folder:

```bash
npx skills-npm                                # links the skills of every installed package that ships some
npx skills add ./node_modules/cssints/skills  # or the skills CLI, for opencode, Claude Code, Codex, Cursor, ...
```

Until 0.1 is on npm, point `npx skills add` at `packages/cssints/skills` of this repository. Agents working on this
repository get `.agents/skills/cssints-contributor` (also `.claude/skills`) with no install.

`@cssints/mcp` is an MCP server with the build's own checks (`check_declaration`, `check_support`, `check_contrast`,
`compile`, `search_docs`, `list_plugins`), in [packages/mcp](packages/mcp) with the config for opencode, Claude Code
and Cursor. The skills use it when it is configured and work without it.

## Layout

| Path | What |
|---|---|
| `packages/cssints` | Vite plugin (`cssints/vite`) on the Vite Module Runner, and the `cssints` library |
| `packages/css-grammar` | Type-level recognizer and its runtime twin over mdn-data grammars, Typed OM values, browser support and prose rules |
| `packages/icons` | `@cssints/icons`: icons from iconify JSON collections or SVG folders, a mask style with no runtime |
| `packages/mise-en-mode` | `@cssints/mise-en-mode`: looks as themes in the layers app < author < viewer, on `data-mode` scopes, checked against the tokens and by `check.contrast` |
| `apps/demo` | React demo of every 0.1 feature |
| `apps/docs` | The documentation site: this file and `docs/API.md` as pages, with search and type hovers (`cd apps/docs && bun run dev`) |
| `docs/research`, `docs/archive` | Comparisons with other libraries; outdated plans |

## Development

```bash
bun install
bun run test    # all packages (vp run -r test, cached where possible); includes the type-check of the code in docs/API.md and this file
bun run bench   # type instantiation budgets (tsc and tsgo)
bun run check   # format, lint, type-check (vp check), then the Effect diagnostics (bun run typecheck)
bun run diff:check   # the added lines against master: anti-slop rules, key-file changes (tools/ai-automation)
cd apps/demo && bun run dev
cd apps/docs && bun run dev   # the documentation site, on the pages of README.md and docs/API.md
```

See [AGENTS.md](AGENTS.md) for the layout, commands and code style.

## License

MIT
