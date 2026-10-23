# Changelog

All 25 packages share one version (`cssints` and every `@cssints/*`). cssints is in alpha: on 0.x a minor version can break, and each breaking change here says how to migrate. The entries come from the changesets of each release (`scripts/changelog.mjs`, run by `bun run version-packages`).

## 0.5.2 (2026-10-23)

### Patch changes

- `@cssints/apg-specs`, first release: the 43 APG and canvas Quint specs, their generated models, the scenario bridges and replay runner, and the ported scenario sets, the test oracle of `@cssints/headless`, as subpath exports (`/scenario`, `/apg/<pattern>.bridge`, `/apg/<pattern>.model.json`, `/scenarios/apg/*.json`, `/specs/apg/*.qnt`).

## 0.5.1 (2026-10-23)

### Patch changes

- `@cssints/headless`, first release: headless APG widgets on Solid 2 (state and DOM attribute objects, no styling), each conformance-checked in Chromium against its Quint spec and the ported scenarios.

## 0.5.0 (2026-10-22)

### Minor changes

- `cssints/clay`: `image(src, { width, height, fit })` fills Clay's `image` — the path in `imageData` for the renderer to load, the image's size as the element's box, and `fit: "contain"` as Clay's `aspectRatio`.

### Patch changes

- Deprecated in favour of the `terminal/` target of [cssints-native](https://github.com/alexeiaccio/cssints-native): `cssints/clay` styles laid out by Clay and drawn into character cells on termbox2, with the focus layer in C. The package keeps working; importing it warns once, and the README says what carries over (`packages/tui/README.md`).

## 0.4.0 (2026-10-21)

### Minor changes

- New subpath `cssints/clay`: styles for a [Clay](https://github.com/nicbarker/clay) layout, compiled to object literals shaped as `Clay_ElementDeclaration` and `Clay_TextElementConfig`, and `header()` to print a module of them as C initializers for a firmware that runs no JS. Pixels for lengths, `stretch` for Clay's GROW, colours by the web's `color` grammar; a property Clay cannot draw is no member. States (`hover`, `focus`, `active`) print as declarations of their own, colour tokens and named themes as a declaration per theme, `fonts()` sets `fontId` from the app's font list, and `float({ attach, parent, root, offset, expand, zIndex, capture, clip })` fills Clay's `floating` for menus, popovers and dialogs.
- New package `@cssints/color-names`: the Color Name List (31,939 names) as typed colour values. `named("tangerine")` is its hex (`#ff9300`) as a `<color>` for `color()`, `bg()` and the rest; an unknown name is a type error and a build error with the nearest key. `colorNames.<sector>(name)` is the same name in one of ten sectors (`red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `brown`, `neutral`), so an editor's completion is a few thousand names and not 31,939: a colour word in the name decides the sector (`ferrari-red` is in `red`), else the oklch hue (a dark orange or yellow is `brown`, low chroma is `neutral`). `named()` resolves list names, so `named("green")` is `#00ff00`; a CSS keyword stays a string (`color("green")`). `@cssints/color-names/nearest` is the CIEDE2000 reverse lookup, build time only, in its own subpath. No runtime: the sheet holds the hex.
- `freeformGradient("red top left, gold 4 60% 40%, yellow bottom right")`: the spec's `freeform-gradient()` where the
  browser has it, else a stack of radial gradients for the first paint (a layer per point, so freeform has a fallback without
  JS where mesh has only its average colour) and a canvas the runtime redraws (inverse-distance weighting, the weight of a
  point `spread / d²`, in oklab or srgb — this package's rule, not the spec's, which is not public and may be named
  `diffusion-gradient()`). Points only: a point is `<color> <number>? <position>`; a line, a shape, a length and a second
  point at one position are build errors. Mesh is unchanged; the runtime now carries both rules (3.9 kB minified, 1.9 kB
  gzipped, against 2.9/1.6 for mesh alone).
- New package `@cssints/gradient-2d`: `meshGradient("red, blue; green, yellow")` is the spec's `mesh-gradient()` where the browser has it (the `@supports` switch), else a canvas that a runtime draws, bicubic in oklab, as the background. No browser has the function yet. Positions and the `by`/`with` control points are build errors for now. css-grammar gives `css.types.gradient.mesh-gradient` and `freeform-gradient` own BCD entries (`version_added: false` for the tracked browsers), read only where BCD has no key, so the runtime ships to the builds whose targets lack them.
- `@cssints/tokens/madoromi`: the eight madoromi flavours (the-moonwitch/madoromi, MPL-2.0 in that one file) as DTCG data: neutrals, inks, roles and ANSI, one flavour a theme of another.

### Patch changes

- The JSDoc of `named()` and `colorNames` and the README link the Color Name List's site, https://names.color.pizza/, where a colour has its own page at `/color/<name>/`.
- The types of `createGlobalTheme` take a DTCG override with digit keys (`"500"` for the token `_500`), as the run time does, and check its values.

## 0.3.1 (2026-10-12)

### Patch changes

- The OpenCode plugin of the devtools is the main entry of the package, so OpenCode loads it by the package name: `"plugins": ["@cssints/devtools"]` in opencode.jsonc (checked on OpenCode 2.0.27, which said "Plugin entrypoint not found" for a package with no `.` export). The `@cssints/devtools/opencode` subpath stays.
- An evaluation that hits the 30 second limit now stops at the next module it would load, so it no longer registers tokens and styles during the evaluations that follow. `CSSINTS_EVAL_TIMEOUT` (milliseconds) changes the limit for tests.

## 0.3.0 (2026-10-12)

### Minor changes

- In dev with `devtools`, each `cn(...)` and `cv(...)` gets a readable class such as `cs-Landing-logo` (the enclosing component or file, and the variable, property or JSX attribute it is assigned to), shown first in the panel; a build is unchanged.
- The devtools OpenCode box sends its prompts to the session that the new OpenCode command `/cssints-devtools` (plugin `@cssints/devtools/opencode`) attached to a dev server, instead of starting a session each time; files in `node_modules/.cache/cssints-devtools/` are the rendezvous (new export `cssints/devtools-link`), and the link probe tells the attached session.
- Export groups for downstream browsers and Baseline years: `cssints/widely-available/with-downstream` and `cssints/newly-available/with-downstream` (also checked against Opera, Opera Mobile, Samsung Internet, Android WebView, UC and QQ at the minimum versions of baseline-browser-mapping), `cssints/baseline-2015` to `cssints/baseline-2026` (what was Baseline by the end of the year) and `cssints/baseline-YYYY/with-downstream`.
- `inGroup(group, property, value)` in `cssints/plugin`: whether a declaration is in an export group (`widely-available`, `baseline-2022/with-downstream`, ...), by the same scan `cssints/<group>` runs on a call. A plugin with a variant per group emits only what passes.
- Baseline variants: `@cssints/reset/widely-available`, `/newly-available`, `/baseline-2015` to `/baseline-2026` and each `/with-downstream` (and `/limited-availability`, the whole reset). A variant keeps only the declarations whose property and value are in the group, and drops a rule left with none; `@cssints/reset` stays the full reset.
- The base takes the border off buttons (`button` and `input` of type `button`, `submit` and `reset`) in a `:where()` rule of the `reset` layer, so a button no longer shows the bevel of the browser; text fields, text areas and selects keep their borders.

### Patch changes

- The devtools OpenCode box (`opencode` option) is always shown and pinned to the panel's edge (bottom in a left or right dock, right in a top or bottom dock), with a title, whether a service is found (a new `cssints:devtools:link` probe, no session created), and the last session; with no element picked the prompt is the instruction and the page.
- The prompt of the devtools OpenCode box says where it is: `App:` (the Vite root in the repository, added by the dev server), `Page:`, `Title:` and `Display:` (viewport, `<html>` attributes, colour scheme, the element's box and state) in both variants, and for an element its `id`, `role`, `aria-label`, `href`, `src`, `alt`, `type`, `name`, `placeholder`, `title` and `data-*` (never a value).
- `list_plugins` reads the plugin table of docs/API.md also when the formatter pads its cells.
- Dev server: a file with a named token that is renamed or deleted frees its names. `forget` drops the `@property` and the value of the tokens of a file, and a deleted file is forgotten and leaves the sheet, so the name can be declared in another file (it failed with "is already declared with another @property").

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
