# @cssints/squircle

Squircle corners for [cssints](../../README.md), as one chain member of `cssints/plugin` `scope()`: native
`corner-shape: squircle` where the targets have it (Chrome 139), and a CSS mask that cuts the same curve where one lacks
it. No script.

```ts
import { bg, cn, hover } from "cssints" with { type: "cssints" };
import { squircle } from "@cssints/squircle" with { type: "cssints" };

export const icon = cn(squircle().radius("24px"), bg("tomato"));
export const card = cn(squircle(), hover(squircle().radius("2rem")));
```

```css
@layer _.k {
  ._squircle-core {
    border-radius: var(--squircle-r);
    corner-shape: squircle;
    --squircle-r: 1rem;
  }
  /* only when a browserslist target lacks corner-shape (Firefox, Safari today) */
  @supports not (corner-shape: squircle) {
    ._squircle-core {
      --squircle-m: url("data:image/svg+xml,%3Csvg … viewBox='-1 -1 2 2' preserveAspectRatio='none'%3E%3Cpath d='M1 0C1 .92 .92 1 0 1…Z'/%3E%3C/svg%3E");
      border-radius: 0;
      mask:
        var(--squircle-m) 0 0 / min(2 * var(--squircle-r), 100%) min(2 * var(--squircle-r), 100%)
          no-repeat,
        var(--squircle-m) 100% 0 / … no-repeat,
        var(--squircle-m) 0 100% / … no-repeat,
        var(--squircle-m) 100% 100% / … no-repeat,
        linear-gradient(#000 0 0) 50% / 100% max(0px, 100% - 2 * var(--squircle-r)) no-repeat,
        linear-gradient(#000 0 0) 50% / max(0px, 100% - 2 * var(--squircle-r)) 100% no-repeat;
    }
  }
}
@layer _.a {
  ._c2r73i {
    --squircle-r: 24px;
  }
}
@layer _.b {
  ._1xgz4ts:hover {
    --squircle-r: 2rem;
  }
}
```

## Browsers

- **Native** (`css.properties.corner-shape.squircle`): Chrome 139. Firefox and Safari have it in preview only;
  Playwright's WebKit build already has it.
- **The fallback** is a runtime of CSS only (`polyfills: ["css.properties.corner-shape", "css.properties.corner-shape.squircle"]`),
  so it is in the sheet only when a browserslist target lacks the feature, and `@supports not` keeps it off in a browser
  that has it. The kernel's `requires` and the support warnings of its declarations are covered by it: no build warning. It needs `mask` with `var()` and `min()`/`max()` in its sizes:
  Firefox 75, Safari 15.4 (LightningCSS does not prefix a value with `var()`).
- **Checked** in Chrome, Firefox and WebKit (`bun run test:browsers`): the corners and edges of a box read from a
  screenshot, from a build for Chrome 139 only, one for Firefox and Safari too, and that build with `corner-shape` cut out
  (the mask alone). Where both run, the mask's 40px corner is the native one to 2 pixels in 1 600 (Chrome) and 0 (WebKit).

### Why a mask

- A **paint worklet** ([css-houdini-squircle](https://github.com/PavelLaptev/css-houdini-squircle),
  [extra.css](https://github.com/una/extra.css)) runs in Chromium only, which has `corner-shape` now: it would cover no
  browser that lacks the feature, and it ships a script.
- **Plain `border-radius`** costs nothing (a browser drops `corner-shape` and keeps the radius), but the corner is a
  circle: at the same radius it cuts almost twice as deep along the diagonal (0.29 of the radius against 0.16), and it
  reads as another shape.
- **The mask** is the shape itself, at any size, with no script: one SVG of the superellipse `|x|⁴ + |y|⁴ = 1`
  (`corner-shape: squircle` is `superellipse(2)`), four cubics within 0.5% of the curve, put at the four corners at twice
  the radius, and two bands of `linear-gradient` between them. Each corner layer is a squircle of a smaller box, so their
  union with the bands is the element's squircle; the sizes follow the element through percentages, with no measuring.

## Rules

- **`radius(<length-percentage [0,∞]>)`**, once, optional (`1rem`). It sets `--squircle-r`, so it works under a
  condition (`hover(squircle().radius("2rem"))`). A percentage is of each side, as in `border-radius` (elliptical corners);
  a radius over half the box is clamped by the browser natively, and by `min(…, 100%)` in the mask.
- **No inheritance.** The kernel sets `--squircle-r` on its class, so a squircle inside another one has its own radius.
- **Conflicts.** `squircle()` sets the corners: a `cn()` that holds it and a `border-*radius` or `corner-*` property is a
  build error, derived from the kernel (written as styles):
  `cssints: squircle: kernel core sets border-radius, corner-shape (this style also sets border-top-left-radius)`. Set
  the radius with `radius()`.
- **Errors** are the grammar's, in the types and at build time:
  `squircle.radius: unexpected "-4px" in "-4px", expected <length-percentage [0,∞]>`.

## Limits

- **The mask clips what is drawn outside the shape.** In the fallback a `box-shadow`, an `outline` (a focus ring) and the
  corners of a `border` are cut: the border is drawn square and the mask trims it, so it thins at the corners. Put the
  shadow on a wrapper (`filter: drop-shadow()` follows the mask), or a ring inside. The native path draws them along the
  curve.
- One shape: no `superellipse(k)` smoothing, no per-corner radii or shapes. The mask is one SVG; another exponent would
  be another SVG per value (a build-time `url()` on a custom property), which waits for a use.
- `mask` belongs to the fallback: a `mask` of your own on a squircle replaces it where the fallback runs.

```bash
cd packages/squircle && bun run test            # fixtures through the engine (output for both kinds of targets, conflicts, errors)
cd packages/squircle && bun run typecheck       # and the type test (test/types)
cd packages/squircle && bun run test:browsers   # Chrome, Firefox and WebKit through playwright-core
```

## Credits

The curve is the superellipse of CSS Borders and Box Decorations Level 4 (`corner-shape: squircle`). The mask is drawn
here; nothing is copied.
