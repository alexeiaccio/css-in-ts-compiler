# cssints

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
