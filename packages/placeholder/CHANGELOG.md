# @cssints/placeholder

## 0.2.0

### Minor Changes

- 94d1f4f: `cx` is gone: `cn(...)` takes runtime values (`cn(base, on && p(4), props.class)`); the styles in them are class strings made at build time, and a style replaces the classes it overrides while it is active. Importing `cx` is a build error.

### Patch Changes

- Updated dependencies [94d1f4f]
- Updated dependencies
  - cssints@0.2.0
