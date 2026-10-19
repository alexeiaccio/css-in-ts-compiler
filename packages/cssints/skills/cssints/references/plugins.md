# The plugin packages

Each package is written on `scope()` of `cssints/plugin` and has a README with its rules and limits
(`node_modules/@cssints/<name>/README.md`). Import them with `with { type: "cssints" }`, except `@cssints/tokens`
and `@cssints/ramp`, which are plain data. What the others share:

- A chain member (`stack()`, `motion()`, `skeleton()`) is a kernel class plus one class per method; each method sets a
  custom property, so a method works under a condition: `media("(width >= 40rem)")(stack().gap(8))`.
- A member conflicts with what its kernel sets, in one `cn()`: use its methods, not the plain property.
- A member that is only a kernel class (`balance()`, `pretty()`, `skeleton()` with no method) cannot be inside a
  condition. Put it outside; put a method inside.
- Fallbacks for older browsers (CSS under `@supports not`, or a small script) are in the build only when a browserslist
  target needs them, and are delivered by the engine: nothing to import by hand.
- Files read at build time (icons, fonts, placeholder images) are not watched in dev: restart, or touch the module.

## Layout and type

**`@cssints/layout`**: `stack().gap(6)`, `cluster().gap(2).justify("space-between").align("center")`,
`sidebar().side("right").width("20rem").content("50%").gap(4)`, `switcher().threshold("30rem").gap(2)`,
`cover().minHeight("100vh")`, `autoGrid().min("16rem").gap(4)`. No media queries: they respond to their space.
`cn(stack(), display("grid"))` is a conflict; padding, sizes and colours are fine.

**`@cssints/masonry`**: `masonry().columns("12rem").gap(4)`. `display: grid-lanes` where the browser has it (Safari
26.4), CSS columns elsewhere (the order then runs down each column).

**`@cssints/fluid`**: `fontSize(fluid("1rem", "1.5rem", { from: "20rem", to: "80rem" }))`, a `clamp()` computed at
build time; `fluid.container(...)` against the container's width. px or rem only. A range that fails WCAG 1.4.4
(text resize) is a build error; `{ zoom: false }` for lengths that are not text.

**`@cssints/fonts`**: in a module of its own, `export const body = font("Inter", { provider: "fontsource", weights:
[400, 700] })` (or `provider: "fs", files: [...]`); then `body.family()` (the `@font-face` rules, a metric-matched
fallback face, `font-family`) and `body.trim({ lineHeight: 1.2 })` (cap-height trim: `text-box`, else capsize margins).

**`@cssints/balance`**: `balance()` (`text-wrap: balance`, with a 0.55 kB script for targets without it) and
`pretty()` (native only). Under a condition write `textWrap("balance")` instead.

## Base and tokens

**`@cssints/reset`**: `reset({ media: true, prose: true })` once, at the top level of a module the entry loads. In
`@layer reset` before the engine's layers: any style beats it. A layer of yours between:
`layers("reset", "base", { before: true })`.

**`@cssints/tokens`**: data, not a call. `createTokens({ radix: light })`, themes from `dark`;
`createTokens({ ...colors, size: sizes })` from `/open-props`. Pass only the scales you use (type cost).

**`@cssints/ramp`**: `ramp("#2563eb", { mode: "contrast", ratios: [1.2, 1.5, 3, 4.5, 7], background: "#fff" })` or
`{ mode: "lightness", steps: 9 }`, as a group of `createTokens`; `overrides(ramp(...))` for a theme. A contrast step
meets its ratio on that background only: make a second ramp for a dark background. Imported without the attribute
(plain data).

**`@cssints/mise-en-mode`**: `look(t, "dark", "app" | "author" | "viewer", overrides, { scope? })`: a theme on
`[data-mode="dark"]` (and `data-mode="dark/color"` for one aspect, a top-level token group) in the layers
`app < author < viewer`. Checked like `createGlobalTheme`, read by `check.contrast`.

**`@cssints/icons`**: in a module of its own, `export const mdi = icons<typeof import("@iconify-json/mdi/icons.json")>({
provider: "iconify-json", collection: "mdi" })` or `icons({ provider: "fs", dir: "src/icons" })`; then
`cn(mdi("close"), color("crimson"), width("1.5em"))`. One-colour icons take `color`; a wrong name is a build error with
a suggestion.

## Paint

**`@cssints/gradient`**: `backgroundImage(gradient("linear", "to bottom", "#000", "transparent", "ease-in-out", 5))`:
eased stops mixed in oklab. Each argument its own string; the direction is one string (`"to bottom"`).

**`@cssints/gradient-2d`**: `meshGradient("red, blue; green, yellow")` (rows from the top of the box down, separated by
`;`, stops by `,`) and `freeformGradient("red top left, gold 4 60% 40%, yellow bottom right")` (points, an optional
weight before the position). One string per call. Where the browser has `mesh-gradient()`, the declaration is native;
elsewhere a runtime the build adds draws the same points on a canvas, so it needs a script.

**`@cssints/color-names`**: `color(named("tangerine"))` is `#ff9300`. `colorNames.<sector>(name)` is the same name
restricted to one sector (`red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `brown`, `neutral`), so
completion stays short; the colour word in the name picks the sector. An unknown name is a build error with the nearest
one, and a name outside the sector is one that names the sectors it is in. The list's hex wins over the CSS keyword's
(`named("green")` is `#00ff00`; `color("green")` is the CSS one). `@cssints/color-names/nearest` maps a hex to the
closest name at build time.

**`@cssints/placeholder`**: `backgroundImage(placeholder("src/hero.jpg"))` (a gradient of the image's colours) or
`{ mode: "thumbhash" }` (a tiny PNG; pair it with `backgroundSize("cover")`). JPEG and PNG only; the path is relative
to the working directory.

**`@cssints/squircle`**: `squircle().radius("24px")`: `corner-shape: squircle`, else a mask of the same shape (which
clips shadows and outlines: put those on a wrapper). Set the radius with `radius()`, not `borderRadius`.

**`@cssints/skeleton`**: `cn(skeleton().radius("50%"), width("3rem"), height("3rem"))`: one clock on `:root`, so every
skeleton shimmers in phase; still under reduced motion. Do not set `background`, `background-image`, `-size`,
`-position`, `-attachment` or `border-radius` beside it (`backgroundColor` is fine and shows through).

**`cssints/frame`** (`frame().radius("1.5rem").padding(4).border("1px")`: a nested frame's radius is concentric) and
**`cssints/surface`** (`surface().color(canvas)`, `.lighten(0.06)`, `.darken()`, `.contrast()`, `.ink()`: a colour
relative to the parent surface). Both ship in `cssints`; a script fallback for browsers without style queries.

## Motion and scroll

**`@cssints/motion`**: `motion().preset("slide-in-up").duration("500ms").delay("100ms").easing("linear")`. Presets
`fade-*`, `slide-*-up|down|left|right`, `scale-*`, `blur-*` (in and out). Reduced motion turns movement into a fade.
No `animation*` property beside it.

**`@cssints/reveal`**: `reveal().preset("blur-in").range("entry 0% entry 100%")`: motion's entrance presets on
`animation-timeline: view()`; where a target lacks it, a 0.3 kB script plays the animation once on entry.

**`@cssints/stuck`**: `sticky().top("0")` on the sticky element, `stuck(color("red"))` or `stuck("bottom")(...)` on an
element inside it (a scroll-state query matches descendants only). An IntersectionObserver fallback where the targets
lack scroll-state queries.
