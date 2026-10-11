# Changelog

All 23 packages share one version (`cssints` and every `@cssints/*`). cssints is in alpha: on 0.x a minor version can break, and each breaking change here says how to migrate. The entries come from the changesets of each release (`scripts/changelog.mjs`, run by `bun run version-packages`).

## 0.2.0 (2026-10-11)

### Breaking: `cx` is folded into `cn`

`cx` is no longer exported, and importing it is a build error. `cn(...)` takes runtime values now: the arguments known at build time merge into one class string as before, and the others (`on && p(4)`, `cond ? a : b`, `props.class`, a signal) go into a few lines of runtime the plugin adds. The styles inside them are still class strings made at build time, and a conditional style replaces the classes it overrides while it is active: `cn(p(2), on && p(4))` gives `p(4)` when `on`, `p(2)` otherwise (`cx` kept both and left it to the order of the sheet).

Migrate:

```ts skip
// 0.1
import { cx } from "cssints";
import { p, bg } from "cssints" with { type: "cssints" };
const box = (on: boolean) => cx(bg("white"), on && p(4));

// 0.2
import { cn, p, bg } from "cssints" with { type: "cssints" };
const box = (on: boolean) => cn(bg("white"), on && p(4));
```

The SVG property `cx` is written `css.cx(...)`.

### Added

- Export groups by Baseline: `cssints/widely-available`, `cssints/newly-available`, `cssints/not-discouraged` (`cssints/limited-availability` is `cssints`). A group exports the members whose CSS feature is in it, and a keyword, function, unit or media feature outside it is an error in the types and in the build.
- Export groups by spec, named by the W3C shortname: `cssints/mediaqueries-4`, `cssints/css-grid-2`, `cssints/css-color-5` and 89 more. A level includes the earlier levels of its series.
- Releases go to the npm dist-tag `latest`: `npm install cssints` (0.1.0 was published under `next`).

## 0.1.0 (2026-10-10)

The first release on npm: `cssints` (the Vite plugin, the build-time library, `cx` and the runtime of `cv`), `@cssints/css-grammar`, `@cssints/devtools`, `@cssints/mcp`, `@cssints/tokens`, `@cssints/tui` and the plugin packages (balance, fluid, fonts, gradient, icons, layout, masonry, mise-en-mode, motion, placeholder, ramp, reset, reveal, rybitten, skeleton, squircle, stuck).
