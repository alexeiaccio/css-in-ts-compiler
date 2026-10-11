# cssints

## 0.2.0

### Minor Changes

- 94d1f4f: `cx` is gone: `cn(...)` takes runtime values (`cn(base, on && p(4), props.class)`); the styles in them are class strings made at build time, and a style replaces the classes it overrides while it is active. Importing `cx` is a build error.
- Export groups by Baseline (`cssints/widely-available`, `cssints/newly-available`, `cssints/not-discouraged`) and by spec shortname (`cssints/mediaqueries-4`, `cssints/css-grid-2`, ...): a subset of the members, and a value outside the group is an error in the types and in the build.

### Patch Changes

- @cssints/css-grammar@0.2.0
