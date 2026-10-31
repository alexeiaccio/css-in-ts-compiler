# @cssints/color-names

## 0.22.0

### Patch Changes

- Updated dependencies [988df79]
  - cssints@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [e69636e]
  - cssints@0.21.0

## 0.20.0

### Patch Changes

- cssints@0.20.0

## 0.19.0

### Patch Changes

- cssints@0.19.0

## 0.18.0

### Patch Changes

- cssints@0.18.0

## 0.17.0

### Patch Changes

- cssints@0.17.0

## 0.16.0

### Patch Changes

- cssints@0.16.0

## 0.15.0

### Patch Changes

- cssints@0.15.0

## 0.14.0

### Patch Changes

- cssints@0.14.0

## 0.13.1

No changes in this release.

## 0.13.0

### Patch Changes

- cssints@0.13.0

## 0.12.1

No changes in this release.

## 0.12.0

### Patch Changes

- Updated dependencies [a694911]
- Updated dependencies [ee3e52b]
  - cssints@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [02a4ef7]
  - cssints@0.11.0

## 0.10.0

### Patch Changes

- cssints@0.10.0

## 0.9.0

### Patch Changes

- cssints@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [60502ee]
  - cssints@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [135e011]
- Updated dependencies [561fc47]
- Updated dependencies [a269a19]
- Updated dependencies [91616c0]
  - cssints@0.7.0

## 0.6.1

No changes in this release.

## 0.6.0

### Patch Changes

- cssints@0.6.0

## 0.5.2

No changes in this release.

## 0.5.1

No changes in this release.

## 0.5.0

### Patch Changes

- Updated dependencies [c23f8ea]
  - cssints@0.5.0

## 0.4.0

### Minor Changes

- 719e50f: New package `@cssints/color-names`: the Color Name List (31,939 names) as typed colour values. `named("tangerine")` is its hex (`#ff9300`) as a `<color>` for `color()`, `bg()` and the rest; an unknown name is a type error and a build error with the nearest key. `colorNames.<sector>(name)` is the same name in one of ten sectors (`red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `brown`, `neutral`), so an editor's completion is a few thousand names and not 31,939: a colour word in the name decides the sector (`ferrari-red` is in `red`), else the oklch hue (a dark orange or yellow is `brown`, low chroma is `neutral`). `named()` resolves list names, so `named("green")` is `#00ff00`; a CSS keyword stays a string (`color("green")`). `@cssints/color-names/nearest` is the CIEDE2000 reverse lookup, build time only, in its own subpath. No runtime: the sheet holds the hex.

### Patch Changes

- de37818: The JSDoc of `named()` and `colorNames` and the README link the Color Name List's site, https://names.color.pizza/, where a colour has its own page at `/color/<name>/`.
- Updated dependencies [6687dc2]
- Updated dependencies [3d97232]
  - cssints@0.4.0
