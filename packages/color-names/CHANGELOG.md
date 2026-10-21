# @cssints/color-names

## 0.4.0

### Minor Changes

- 719e50f: New package `@cssints/color-names`: the Color Name List (31,939 names) as typed colour values. `named("tangerine")` is its hex (`#ff9300`) as a `<color>` for `color()`, `bg()` and the rest; an unknown name is a type error and a build error with the nearest key. `colorNames.<sector>(name)` is the same name in one of ten sectors (`red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `brown`, `neutral`), so an editor's completion is a few thousand names and not 31,939: a colour word in the name decides the sector (`ferrari-red` is in `red`), else the oklch hue (a dark orange or yellow is `brown`, low chroma is `neutral`). `named()` resolves list names, so `named("green")` is `#00ff00`; a CSS keyword stays a string (`color("green")`). `@cssints/color-names/nearest` is the CIEDE2000 reverse lookup, build time only, in its own subpath. No runtime: the sheet holds the hex.

### Patch Changes

- de37818: The JSDoc of `named()` and `colorNames` and the README link the Color Name List's site, https://names.color.pizza/, where a colour has its own page at `/color/<name>/`.
- Updated dependencies [6687dc2]
- Updated dependencies [3d97232]
  - cssints@0.4.0
