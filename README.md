# CSS-in-TS

<img src="https://cssints.dev/logo.svg" alt="" width="96" height="96">

cssints is compile-time CSS-in-TypeScript. You write calls such as `css.flex().alignItems("center")`. A Vite plugin runs them at build time and replaces each one with atomic, content-hashed class names in `@layer`s. Nothing of the styling code ships to the browser except `cx` and the few lines behind `cv`, which join class names.

- Values are checked against the spec grammars (mdn-data) in the types and again at build time. A typo is an error in the editor and in the build.
- Conditions (`media`, `container`, `supports`, `hover`), variants (`cv`), design tokens and themes (`createTokens`, `createGlobalTheme`, `check.contrast`) are all build-time, and all typed.
- LightningCSS optimizes the output. Browser support (`@mdn/browser-compat-data` against your browserslist) is reported as warnings, except for what LightningCSS lowers for those targets.

> **Alpha.** 0.1 is on npm under the `next` tag. The API can still change between minor versions, the plugin packages
> may move, and some browsers and frameworks are checked less than others (docs/API.md, "Browser support and what 0.1
> does not have"). Pin the version, and report what breaks.

Decisions and findings are in [docs/wayfinder.md](docs/wayfinder.md); the API reference is [docs/API.md](docs/API.md). Both are also a site with search and type hovers: [apps/docs](apps/docs) (`cd apps/docs && bun run dev`); deployed to Cloudflare with Alchemy: <https://cssints.dev>.

## Install

```bash
npm install --save-dev cssints@next vite@8   # or: bun add -d cssints@next vite@8, pnpm add -D cssints@next vite@8
```

cssints needs Vite 8 (Vite+ works too) and Node 22.18 or later (the plugin runs your modules with type stripping). It is a
dev dependency: nothing of it ships except `cx` and the few lines behind `cv`. The plugin packages are installed the same
way, each beside `cssints` (`npm install --save-dev @cssints/fluid@next`); the list is on the
[plugin packages](docs/API.md#plugin-packages-cssints-dk1q) page. In this repository `cssints` is a workspace package
(`"cssints": "workspace:*"`).

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

`targets` and `cssTarget` come from the browserslist query of the support warnings: the `BROWSERSLIST` variable, else the standard config (`"browserslist"` in `package.json` or `.browserslistrc`, with the `BROWSERSLIST_ENV`, `NODE_ENV` or `production` section), else `defaults`. The exports are computed when `vite.config.ts` is imported, before Vite's root is known, so they look the config up from `process.cwd()` and upward; the support warnings look it up from Vite's `root` (2026-10-09, cssints-p3d2). They are the same when Vite runs from the app's directory; with `vite <dir>` from elsewhere, give `targets` and `cssTarget` the app's config yourself. Vite's CSS minify reads `cssTarget`, not `targets`: without it the minifier merges the declarations of a `firstThatWorks` into the last one. Add `"types": ["vite/client"]` to `tsconfig.json` for the `virtual:` import.

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

### In a terminal

`import * as css from "cssints/tui" with { type: "cssints" }` gives the members a terminal has (cells, colours, borders, flex, states, `cursor`), and the plugin compiles them to prop objects for [OpenTUI](https://opentui.com) renderables instead of classes; `@cssints/tui` applies their states and themes: [packages/tui](packages/tui/README.md), docs/API.md "TUI".

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

Agents working on this repository get `.agents/skills/cssints-contributor` (also `.claude/skills`) with no install.

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

## Credits

cssints is MIT. It stands on other people's work; this is what we took, from whom, and under which license. A package that copies data or code carries the upstream notice (a Credits or Licenses section of its README, or `THIRD_PARTY_NOTICES.md`).

### Data and code that ships

| Where | What | From | License |
|---|---|---|---|
| [@cssints/tokens](packages/tokens/README.md) | the Open Props, Radix Colors, Flexoki and Reasonable Colors sets | [Open Props](https://github.com/argyleink/open-props) (Adam Argyle), [Radix Colors](https://github.com/radix-ui/colors), [Flexoki](https://github.com/kepano/flexoki) (Steph Ango), [Reasonable Colors](https://github.com/matthewhowell/reasonable-colors) (Matthew Howell) | MIT, notices in its README |
| [@cssints/css-grammar](packages/css-grammar/THIRD_PARTY_NOTICES.md) | the CSS syntax strings (`src/mdn.ts`, `keywords.ts`, `functions.ts`), also in the types of `cssints` | [mdn-data](https://github.com/mdn/data); the numeric ranges it omits from [@webref/css](https://github.com/w3c/webref) | CC0-1.0; MIT (W3C) |
| @cssints/css-grammar | browser support warnings, read from the package (not copied) | [@mdn/browser-compat-data](https://github.com/mdn/browser-compat-data) | CC0-1.0 |
| [@cssints/fonts](packages/fonts/README.md) | the latin character weights and the metrics of Arial, Times New Roman and Courier New | [Capsize](https://github.com/seek-oss/capsize) (SEEK) | MIT, notice in its README |
| [@cssints/icons](packages/icons/README.md) | nothing: the collections are your dependency | [Iconify](https://iconify.design) `@iconify-json/*` | each collection's own |
| `tools/ai-automation/vendor` | lint rules, not published | [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) (Dillon Mulroy) | MIT, `LICENSE` and `UPSTREAM.md` |
| [apps/sky](apps/sky/NOTICE.md) | layout and token values; Inter; Phosphor icons | Mu and `@bsky.app/alf` (Bluesky Social PBC), [Inter](https://github.com/rsms/inter), [Phosphor](https://phosphoricons.com) | MIT; OFL-1.1; MIT |
| apps/demo | Material Design Icons (`@iconify-json/mdi`) | Pictogrammers | Apache-2.0 |

### Ideas and designs

No code is copied from these; each package README says which part follows which.

- **Plugin packages.** [Every Layout](https://every-layout.dev) and [smolcss](https://smolcss.dev) (layout), [nytimes/text-balancer](https://github.com/nytimes/text-balancer) and [react-wrap-balancer](https://github.com/shuding/react-wrap-balancer) (balance), [fluid-tailwind](https://github.com/barvian/fluid-tailwind) (fluid), [postcss-easing-gradients](https://github.com/larsenwork/postcss-easing-gradients) (gradient), [tailwindcss-motion](https://github.com/romboHQ/tailwindcss-motion) and [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) (motion), [the supersonic plugin](https://github.com/the-illarionov/the-supersonic-plugin-for-scroll-based-animation) and [lax.js](https://github.com/alexfoxy/lax.js) (reveal), [sync-skeleton](https://github.com/crutchcorn/sync-skeleton) (skeleton), [bramus/sticky-observer](https://github.com/bramus/sticky-observer) (stuck), [unpic-placeholder](https://github.com/ascorbic/unpic-placeholder) and [ThumbHash](https://github.com/evanw/thumbhash) (placeholder), [nutelch](https://github.com/meodai/nutelch) and [Leonardo](https://github.com/adobe/leonardo) (ramp), the resets of Josh Comeau, Jake Lazaroff, Vale and Andy Bell (reset), [Mise en Mode](https://standard.mode.place) and its Mode Contract (mise-en-mode), [brendonovich/vite-plugin-opencode](https://github.com/Brendonovich/vite-plugin-opencode) (the prompt box of devtools).
- **The engine.** The comparisons in [docs/research](docs/research) record what we took from [StyleX](https://stylexjs.com), [vanilla-extract](https://vanilla-extract.style), [Tailwind CSS](https://tailwindcss.com), [Tokenami](https://tokenami.com), [SugarCube](https://sugarcube.sh) and the [React Spectrum](https://react-spectrum.adobe.com) style macros; the first spark was [Haz's post](https://bsky.app/profile/haz.dev/post/3mebm2mx6jk27) on a CSS framework in TypeScript. Tokens follow the [Design Tokens Community Group](https://www.designtokens.org) format.
- **apps/sky** follows the look of Mu and the hue slider of Witchsky.

### Built on

[Effect](https://effect.website), [Vite](https://vite.dev) and Vite+, [OXC](https://oxc.rs), [LightningCSS](https://lightningcss.dev) (MPL-2.0; its wasm build runs in the playground), [culori](https://culorijs.org), [TypeScript](https://www.typescriptlang.org) and TypeScript Go, [Bun](https://bun.sh), [Solid](https://www.solidjs.com), [OpenTUI](https://opentui.com), [Shiki](https://shiki.style), [Monaco Editor](https://microsoft.github.io/monaco-editor/), [Playwright](https://playwright.dev), [fast-check](https://fast-check.dev), [Quint](https://quint-lang.org), [atcute](https://github.com/mary-ext/atcute), and [Beans](https://github.com/hmans/beans) for the tickets. Phosphor icons (MIT) are on this site through `@iconify-json/ph`. Every dependency keeps its own license; none is copied into the repository.

## License

MIT
