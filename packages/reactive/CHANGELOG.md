# @cssints/reactive

## 0.24.0

### Minor Changes

- 47473cb: `value()` and `checked()` read the field's value in `set()`, and calls of `on()`, `bind()` or `state()` on one element append their programs and lists instead of the later replacing the earlier.
- 1005657: `persist(value, key)` keeps a state in `localStorage` across a reload: the runtime restores it when the owner is initialised (a stored value wins over the declared one) and stores it on every write, with the keys in a new non-inheriting `--reactive-persist` protocol property.

### Patch Changes

- Updated dependencies [2bcbb9e]
  - cssints@0.24.0

## 0.23.0

### Patch Changes

- cssints@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [988df79]
  - cssints@0.22.0

## 0.21.0

### Minor Changes

- ba2ad8f: CSS-first interactions: `state()` gives an owner element and one source per state, `toggle()`/`set()` write only inside `on()` (click, input, change, submit, key, pointer and focus events), `bind()` writes attributes from the nearest owner, and `when()`/`inside()` are plain CSS conditions on its `data-reactive-*` attributes. The DOM runtime ships to every target (1.75 kB minified, 0.87 kB gzipped).

### Patch Changes

- Updated dependencies [e69636e]
  - cssints@0.21.0
