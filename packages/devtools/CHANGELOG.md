# @cssints/devtools

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
