# @cssints/devtools

## 0.20.0

### Patch Changes

- @cssints/css-grammar@0.20.0
  - cssints@0.20.0

## 0.19.0

### Patch Changes

- @cssints/css-grammar@0.19.0
  - cssints@0.19.0

## 0.18.0

### Patch Changes

- @cssints/css-grammar@0.18.0
  - cssints@0.18.0

## 0.17.0

### Patch Changes

- @cssints/css-grammar@0.17.0
  - cssints@0.17.0

## 0.16.0

### Patch Changes

- @cssints/css-grammar@0.16.0
  - cssints@0.16.0

## 0.15.0

### Patch Changes

- @cssints/css-grammar@0.15.0
  - cssints@0.15.0

## 0.14.0

### Patch Changes

- @cssints/css-grammar@0.14.0
  - cssints@0.14.0

## 0.13.1

### Patch Changes

- @cssints/css-grammar@0.13.1

## 0.13.0

### Patch Changes

- @cssints/css-grammar@0.13.0
  - cssints@0.13.0

## 0.12.1

### Patch Changes

- @cssints/css-grammar@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [a694911]
- Updated dependencies [ee3e52b]
  - cssints@0.12.0
  - @cssints/css-grammar@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [02a4ef7]
  - cssints@0.11.0
  - @cssints/css-grammar@0.11.0

## 0.10.0

### Patch Changes

- @cssints/css-grammar@0.10.0
  - cssints@0.10.0

## 0.9.0

### Patch Changes

- @cssints/css-grammar@0.9.0
  - cssints@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [60502ee]
  - cssints@0.8.0
  - @cssints/css-grammar@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [135e011]
- Updated dependencies [561fc47]
- Updated dependencies [a269a19]
- Updated dependencies [91616c0]
  - cssints@0.7.0
  - @cssints/css-grammar@0.7.0

## 0.6.1

### Patch Changes

- 337af7e: effect 4.0.6 (from 4.0.0) in the packages that depend on it, and every package rebuilt with vite-plus 1.4.0 (tsdown 0.23.1): the bundles change shape, the API does not. `dist/` is no longer tracked in the repository, the release builds it.
- Updated dependencies [337af7e]
  - @cssints/css-grammar@0.6.1

## 0.6.0

### Patch Changes

- @cssints/css-grammar@0.6.0
  - cssints@0.6.0

## 0.5.2

### Patch Changes

- @cssints/css-grammar@0.5.2

## 0.5.1

### Patch Changes

- @cssints/css-grammar@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [c23f8ea]
  - cssints@0.5.0
  - @cssints/css-grammar@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [6687dc2]
- Updated dependencies [a9b28e5]
- Updated dependencies [3d97232]
  - cssints@0.4.0
  - @cssints/css-grammar@0.4.0

## 0.3.1

### Patch Changes

- 4efa9ea: The OpenCode plugin of the devtools is the main entry of the package, so OpenCode loads it by the package name: `"plugins": ["@cssints/devtools"]` in opencode.jsonc (checked on OpenCode 2.0.27, which said "Plugin entrypoint not found" for a package with no `.` export). The `@cssints/devtools/opencode` subpath stays.
- @cssints/css-grammar@0.3.1

## 0.3.0

### Minor Changes

- 50227e4: In dev with `devtools`, each `cn(...)` and `cv(...)` gets a readable class such as `cs-Landing-logo` (the enclosing component or file, and the variable, property or JSX attribute it is assigned to), shown first in the panel; a build is unchanged.
- e859042: The devtools OpenCode box sends its prompts to the session that the new OpenCode command `/cssints-devtools` (plugin `@cssints/devtools/opencode`) attached to a dev server, instead of starting a session each time; files in `node_modules/.cache/cssints-devtools/` are the rendezvous (new export `cssints/devtools-link`), and the link probe tells the attached session.

### Patch Changes

- 7fd459b: The devtools OpenCode box (`opencode` option) is always shown and pinned to the panel's edge (bottom in a left or right dock, right in a top or bottom dock), with a title, whether a service is found (a new `cssints:devtools:link` probe, no session created), and the last session; with no element picked the prompt is the instruction and the page.
- 79cbfd2: The prompt of the devtools OpenCode box says where it is: `App:` (the Vite root in the repository, added by the dev server), `Page:`, `Title:` and `Display:` (viewport, `<html>` attributes, colour scheme, the element's box and state) in both variants, and for an element its `id`, `role`, `aria-label`, `href`, `src`, `alt`, `type`, `name`, `placeholder`, `title` and `data-*` (never a value).
- Updated dependencies [50227e4]
- Updated dependencies [7fd459b]
- Updated dependencies [e859042]
- Updated dependencies [79cbfd2]
- Updated dependencies [10789c5]
- Updated dependencies [6c1e8a3]
- Updated dependencies [987a382]
  - cssints@0.3.0
  - @cssints/css-grammar@0.3.0

## 0.2.0

### Minor Changes

- 94d1f4f: `cx` is gone: `cn(...)` takes runtime values (`cn(base, on && p(4), props.class)`); the styles in them are class strings made at build time, and a style replaces the classes it overrides while it is active. Importing `cx` is a build error.

### Patch Changes

- Updated dependencies [94d1f4f]
- Updated dependencies
  - cssints@0.2.0
  - @cssints/css-grammar@0.2.0
