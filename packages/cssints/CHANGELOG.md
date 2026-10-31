# cssints

## 0.22.0

### Patch Changes

- 988df79: The evaluation server compiles a dependency's `.jsx` inertly too.
  
  A package that ships `.jsx` sources (`@solidjs/router` does, behind its `solid` condition) reached the private Vite server of a build and the app server's `ssr` environment untransformed, where Vite's generic transform asked for `react/jsx-runtime` — which an app on another framework does not install, so the build failed on the first module importing it. A `.jsx` the runner follows into has the same job as the app's own components: its top level must run, its elements are irrelevant.
- @cssints/css-grammar@0.22.0

## 0.21.0

### Minor Changes

- e69636e: A plugin runtime with a `script` (or `css`) and no `polyfills` is delivered for every target, not only where a target lacks a feature: a plugin whose own script is the feature (`@cssints/reactive`) ships it in every build. `ship({ owner, open })` (from `cssints/plugin`) is a site that returns more than a class string: each style becomes its class string and the rest its JSON, so `state()`'s owner and its sources reach the browser as an object.

### Patch Changes

- @cssints/css-grammar@0.21.0

## 0.20.0

### Patch Changes

- @cssints/css-grammar@0.20.0

## 0.19.0

### Patch Changes

- @cssints/css-grammar@0.19.0

## 0.18.0

### Patch Changes

- @cssints/css-grammar@0.18.0

## 0.17.0

### Patch Changes

- @cssints/css-grammar@0.17.0

## 0.16.0

### Patch Changes

- @cssints/css-grammar@0.16.0

## 0.15.0

### Patch Changes

- @cssints/css-grammar@0.15.0

## 0.14.0

### Patch Changes

- @cssints/css-grammar@0.14.0

## 0.13.1

### Patch Changes

- @cssints/css-grammar@0.13.1

## 0.13.0

### Patch Changes

- @cssints/css-grammar@0.13.0

## 0.12.1

### Patch Changes

- 4dd65f4: `cssints/eval` is in the published manifest: `publishConfig.exports` shadows the top-level one at publish time, and the subpath
  was only in the latter (a consumer resolved it through the `./*` wildcard, without its own types).
- @cssints/css-grammar@0.12.1

## 0.12.0

### Minor Changes

- a694911: The library is imported by a subpath that cannot resolve to a browser build (`cssints/eval`), and a runner whose ssr
  environment is not one (vitest's browser mode puts `browser` in its conditions) gets an evaluation server of the plugin's own,
  with the app's aliases, dedupe, conditions and `noExternal`; `cssints({ evaluation: { inline: [...] } })` names what a framework
  needs inlined when that environment inlines everything. A styled component — `cv()`, tokens, `attr()`/`within()` and `render` —
  now runs its browser test in vitest, which it could not before.
- ee3e52b: Kernels: a scope may declare a custom property another scope owns (motion's `--motion-*` in reveal's kernel), so `motion()` and `reveal()` can sit in one app; two kernels of one scope still may not share one of its names, nor may two scopes share a name neither of them owns

### Patch Changes

- @cssints/css-grammar@0.12.0

## 0.11.0

### Minor Changes

- 02a4ef7: `createTokens` takes a leaf as its value when the group's `$type` is in scope: `color: { $type: "color", bg: "#fff", link: "{color.accent}" }`, the form a theme's overrides already take. A string is a value of the group's type and a number one for `number` and `fontWeight`; a DTCG object value, or a token with its own `$type`, `$description` or `$extensions`, keeps `{ $value }`. A value with no `$type` in scope is an error in the types and at build time.

### Patch Changes

- @cssints/css-grammar@0.11.0

## 0.10.0

### Patch Changes

- @cssints/css-grammar@0.10.0

## 0.9.0

### Patch Changes

- @cssints/css-grammar@0.9.0

## 0.8.0

### Minor Changes

- 60502ee: `scv()`: slot variants. `scv({ slots: { base, label, icon }, variants, defaultVariants, compoundVariants })` is one
  function whose result is the class string of every slot (`{ base, label, icon }`). A variant value that is a style styles
  the `base` slot, a record by slot styles the slots it names; in a `compoundVariants` entry, `class` is the `base` slot and
  a slot's own name styles that slot. The rules are `cv()`'s, computed per slot (a variant wins over the slot's base, a
  compound over both, and an overlap without containment is a build error that names the slot). Props are typed from
  `variants`, and the result is `{ [K in keyof slots]: string }`.

### Patch Changes

- @cssints/css-grammar@0.8.0

## 0.7.0

### Minor Changes

- 135e011: `sx()`: one style built by chaining properties, with no `cn()`. Every property is a method, `.flex()` and `.grid()` with no argument set `display`, and a chain sets each property once — a second `bg` is a type error (a shorthand and its longhand stay legal, as in `cn()`). `cn()` is still the tool for runtime values and `cv()` variants.
- 561fc47: `cssints/clay`: `backdrop({ blur })` is glass over our own content — a renderer effect beside the declaration, since Clay 1.0 has no such field: the literal carries it as a sibling `backdrop` key, `header()` prints nothing for it, and the desktop renderer draws everything before the element, blurs the element's box in its own buffer, then draws the element over the blurred pixels, so a translucent fill shows the page behind it and the element's own text and border stay crisp. It is the frame's content, not the window behind the window, and the element needs an `id`.
- a269a19: `cssints/clay`: `backgroundImage("linear-gradient(...)")` fills an element's box with a linear gradient — CSS's own grammar as one string: an optional direction (`<number>deg`, or `to top | to right | to bottom | to left`, 180deg by default) and two or more colour stops with an optional `<number>%`. A renderer effect beside the declaration, since Clay 1.0 has no gradient field: the literal carries it as a sibling `backgroundImage` key (`{ kind: "linear", angle, stops: [{ offset, color }] }`), `header()` prints nothing for it, the C targets keep their solid fill, and the desktop renderer fills the element's box instead of `backgroundColor`. A state may override the whole gradient, so `css.hover(css.backgroundImage(...))` lightens a card. Only linear gradients are drawn; radial, conic, repeating and `url()` are build errors.
- 91616c0: `cssints/clay`: `shadow({ x, y, blur, color })` is a shadow for an element — a renderer effect beside the declaration, since Clay 1.0 has no shadow field: the literal carries it as a sibling `shadow` key, `header()` prints nothing for it, and the desktop renderer draws it before the element's own command, keyed by Clay's element id. A state's overlay merges the fields it names, so `css.hover(css.shadow({ blur: 20 }))` keeps the base's offset and colour.

### Patch Changes

- @cssints/css-grammar@0.7.0

## 0.6.1

### Patch Changes

- 337af7e: effect 4.0.6 (from 4.0.0) in the packages that depend on it, and every package rebuilt with vite-plus 1.4.0 (tsdown 0.23.1): the bundles change shape, the API does not. `dist/` is no longer tracked in the repository, the release builds it.
- Updated dependencies [337af7e]
  - @cssints/css-grammar@0.6.1

## 0.6.0

### Patch Changes

- @cssints/css-grammar@0.6.0

## 0.5.2

### Patch Changes

- @cssints/css-grammar@0.5.2

## 0.5.1

### Patch Changes

- @cssints/css-grammar@0.5.1

## 0.5.0

### Minor Changes

- c23f8ea: `cssints/clay`: `image(src, { width, height, fit })` fills Clay's `image` — the path in `imageData` for the renderer to load, the image's size as the element's box, and `fit: "contain"` as Clay's `aspectRatio`.

### Patch Changes

- @cssints/css-grammar@0.5.0

## 0.4.0

### Minor Changes

- 6687dc2: New subpath `cssints/clay`: styles for a [Clay](https://github.com/nicbarker/clay) layout, compiled to object literals shaped as `Clay_ElementDeclaration` and `Clay_TextElementConfig`, and `header()` to print a module of them as C initializers for a firmware that runs no JS. Pixels for lengths, `stretch` for Clay's GROW, colours by the web's `color` grammar; a property Clay cannot draw is no member. States (`hover`, `focus`, `active`) print as declarations of their own, colour tokens and named themes as a declaration per theme, `fonts()` sets `fontId` from the app's font list, and `float({ attach, parent, root, offset, expand, zIndex, capture, clip })` fills Clay's `floating` for menus, popovers and dialogs.

### Patch Changes

- 3d97232: The types of `createGlobalTheme` take a DTCG override with digit keys (`"500"` for the token `_500`), as the run time does, and check its values.
- Updated dependencies [a9b28e5]
  - @cssints/css-grammar@0.4.0

## 0.3.1

### Patch Changes

- 059ad6a: An evaluation that hits the 30 second limit now stops at the next module it would load, so it no longer registers tokens and styles during the evaluations that follow. `CSSINTS_EVAL_TIMEOUT` (milliseconds) changes the limit for tests.
- @cssints/css-grammar@0.3.1

## 0.3.0

### Minor Changes

- 50227e4: In dev with `devtools`, each `cn(...)` and `cv(...)` gets a readable class such as `cs-Landing-logo` (the enclosing component or file, and the variable, property or JSX attribute it is assigned to), shown first in the panel; a build is unchanged.
- e859042: The devtools OpenCode box sends its prompts to the session that the new OpenCode command `/cssints-devtools` (plugin `@cssints/devtools/opencode`) attached to a dev server, instead of starting a session each time; files in `node_modules/.cache/cssints-devtools/` are the rendezvous (new export `cssints/devtools-link`), and the link probe tells the attached session.
- 10789c5: Export groups for downstream browsers and Baseline years: `cssints/widely-available/with-downstream` and `cssints/newly-available/with-downstream` (also checked against Opera, Opera Mobile, Samsung Internet, Android WebView, UC and QQ at the minimum versions of baseline-browser-mapping), `cssints/baseline-2015` to `cssints/baseline-2026` (what was Baseline by the end of the year) and `cssints/baseline-YYYY/with-downstream`.
- 6c1e8a3: `inGroup(group, property, value)` in `cssints/plugin`: whether a declaration is in an export group (`widely-available`, `baseline-2022/with-downstream`, ...), by the same scan `cssints/<group>` runs on a call. A plugin with a variant per group emits only what passes.

### Patch Changes

- 7fd459b: The devtools OpenCode box (`opencode` option) is always shown and pinned to the panel's edge (bottom in a left or right dock, right in a top or bottom dock), with a title, whether a service is found (a new `cssints:devtools:link` probe, no session created), and the last session; with no element picked the prompt is the instruction and the page.
- 79cbfd2: The prompt of the devtools OpenCode box says where it is: `App:` (the Vite root in the repository, added by the dev server), `Page:`, `Title:` and `Display:` (viewport, `<html>` attributes, colour scheme, the element's box and state) in both variants, and for an element its `id`, `role`, `aria-label`, `href`, `src`, `alt`, `type`, `name`, `placeholder`, `title` and `data-*` (never a value).
- 987a382: Dev server: a file with a named token that is renamed or deleted frees its names. `forget` drops the `@property` and the value of the tokens of a file, and a deleted file is forgotten and leaves the sheet, so the name can be declared in another file (it failed with "is already declared with another @property").
- @cssints/css-grammar@0.3.0

## 0.2.0

### Minor Changes

- 94d1f4f: `cx` is gone: `cn(...)` takes runtime values (`cn(base, on && p(4), props.class)`); the styles in them are class strings made at build time, and a style replaces the classes it overrides while it is active. Importing `cx` is a build error.
- Export groups by Baseline (`cssints/widely-available`, `cssints/newly-available`, `cssints/not-discouraged`) and by spec shortname (`cssints/mediaqueries-4`, `cssints/css-grid-2`, ...): a subset of the members, and a value outside the group is an error in the types and in the build.

### Patch Changes

- @cssints/css-grammar@0.2.0
