# @cssints/reactive

## 0.21.0

### Minor Changes

- ba2ad8f: CSS-first interactions: `state()` gives an owner element and one source per state, `toggle()`/`set()` write only inside `on()` (click, input, change, submit, key, pointer and focus events), `bind()` writes attributes from the nearest owner, and `when()`/`inside()` are plain CSS conditions on its `data-reactive-*` attributes. The DOM runtime ships to every target (1.75 kB minified, 0.87 kB gzipped).

### Patch Changes

- Updated dependencies [e69636e]
  - cssints@0.21.0
