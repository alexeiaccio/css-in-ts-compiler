# @cssints/skeleton

Loading placeholders for [cssints](../../README.md) whose shimmer is in phase across the page, whenever each one was
mounted: one chain member of `cssints/plugin` `scope()`, after [sync-skeleton](https://github.com/crutchcorn/sync-skeleton).
No runtime.

```ts
import { cn, height, hover, width } from "cssints" with { type: "cssints" };
import { skeleton } from "@cssints/skeleton" with { type: "cssints" };

export const line = cn(skeleton(), height("1em"), width("12rem"));
export const avatar = cn(skeleton().radius("50%"), width("3rem"), height("3rem"));
export const branded = cn(skeleton().color("#e4e4f0").highlight("#f4f4fa"), height("8rem"));
export const card = cn(skeleton(), hover(skeleton().highlight("white")));
```

```css
@property --skeleton-p {
  syntax: "<percentage>";
  inherits: true;
  initial-value: 100%;
}
@layer _.k {
  @keyframes kf-1a2b3c4d-skeleton {
    from {
      --skeleton-p: 100%;
    }
    to {
      --skeleton-p: 0%;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :root:has(._skeleton-clock) {
      animation: kf-1a2b3c4d-skeleton 1.5s ease-in-out infinite;
    }
  }
  ._skeleton-core {
    border-radius: var(--skeleton-r, 0.25rem);
    background-position: var(--skeleton-p) 0;
    background-image: linear-gradient(
      90deg,
      var(--skeleton-c, color-mix(in oklab, currentColor 12%, transparent)) 40%,
      var(--skeleton-h, color-mix(in oklab, currentColor 4%, transparent)) 50%,
      var(--skeleton-c, color-mix(in oklab, currentColor 12%, transparent)) 60%
    );
    background-size: 300% 100%;
    background-attachment: fixed;
  }
  /* only for targets without color-mix() (the defaults have Chrome 109) */
  @supports not (color: color-mix(in oklab, red, red)) {
    ._skeleton-core {
      background-image: linear-gradient(
        90deg,
        var(--skeleton-c, rgb(128 128 128 / 20%)) 40%,
        var(--skeleton-h, rgb(128 128 128 / 8%)) 50%,
        var(--skeleton-c, rgb(128 128 128 / 20%)) 60%
      );
    }
  }
}
@layer _.a {
  ._kkw3xj {
    --skeleton-r: 50%;
  }
  /* ... */
}
```

`skeleton()` is `"_skeleton-core _skeleton-clock"`; each method adds one class. Both kernels are written as styles, no raw
CSS: the clock is `media("(prefers-reduced-motion: no-preference)")(nest(":root:has(&)")(animation(keyframes({ from:
vars({ "--_p": "100%" }), to: vars({ "--_p": "0%" }) }), "1.5s ease-in-out infinite")))`, and only its `@property`
registration is a string (`atProperty`). The keyframes name is a hash of the steps with the scope's name after it.

## How it stays in sync

A CSS animation starts when its element gets its style, so a skeleton that mounts 700ms after another runs 700ms behind
it, and the page flickers out of step. No skeleton here runs an animation. One animation on `:root` moves a registered,
inherited percentage, `--skeleton-p`, and every skeleton reads it as its `background-position`: there is one clock, so
there is one phase, in every browser that has `@property`. The animation is on only while a skeleton is in the document
(`:root:has(._skeleton-clock)`), so a page with none runs nothing; when the last one goes and a new one comes, the clock
starts again, with nothing to be out of step with.

The gradient is three viewports wide and `fixed` to the viewport, so the band sweeps the page once, across every
skeleton, as one picture (the same pixel at the same viewport x, as the browser test reads it). Where `fixed` has no
effect (iOS Safari, which BCD marks as a partial implementation) each skeleton has a band of its own size, still on the
same clock: in phase in time, not in space.

The other ways were weighed and left: `background-attachment: fixed` with an animation on each skeleton lines up the
space but not the time (each animation still starts at its own mount); a negative `animation-delay` from
`document.timeline.currentTime` is script; CSS has no document timeline to name in `animation-timeline` (only scroll and
view timelines), and `animation-delay: calc()` cannot read the time.

## Rules

- **Methods**, each once, in any order, all optional: `radius(<length-percentage [0,∞]>)` (`0.25rem`), `color(<color>)`
  (the base, the text colour at 12%), `highlight(<color>)` (the band, the text colour at 4%). Each is one class that sets
  a custom property, so a method works under a condition (`hover(skeleton().highlight("white"))`).
- **Colours.** The defaults mix `currentColor` into transparent, so a skeleton is a darker box on a light page and a
  lighter one on a dark page, and its band is less of it (a light sweep on light, a dark one on dark). The kernel reads
  `--skeleton-c`, `--skeleton-h` and `--skeleton-r` with the defaults as fallbacks, so a value set on an ancestor themes
  every skeleton under it. A `background-color` of your own shows through a translucent colour.
- **Reduced motion.** Under `prefers-reduced-motion: reduce` the clock does not run: `--skeleton-p` stays at its initial
  `100%`, which puts the band off the page, and every skeleton is its base colour, still.
- **Conflicts.** `skeleton()` sets the background image, size, position and attachment and the corners: a `cn()` that
  holds it and the `background` shorthand, one of those or a `border-radius*` property is a build error, derived from the
  kernel: `cssints: skeleton: kernel core sets border-radius, background-image, background-size, background-position, background-attachment (this style also sets background)`.
  `hover(skeleton())` is a build error too (a kernel cannot be conditional); wrap a method instead.
- **Errors** are the grammar's, in the types and at build time: `skeleton.radius: unexpected "-4px" in "-4px", expected
<length-percentage [0,∞]>`, `skeleton.color: unexpected "4px" in "4px", expected <color>`.

## Browsers

`bun run test:browsers` mounts a 600px skeleton, then 700ms later a 300px one under it and a control that runs the same
keyframes on itself, pauses the animations and reads a row of each from a screenshot:

| Browser                         | Animations      | A and B (300 columns) | Control | Reduced motion        |
| ------------------------------- | --------------- | --------------------- | ------- | --------------------- |
| Chrome (installed channel)      | one, on `:root` | 0 columns differ      | 132     | none, the base colour |
| Firefox (Playwright build)      | one, on `:root` | 0 columns differ      | 132     | none, the base colour |
| WebKit (Playwright trunk build) | one, on `:root` | 0 columns differ      | 132     | none, the base colour |

`@property` (Chrome 85, Firefox 128, Safari 16.4) and `:has()` (Chrome 105, Firefox 121, Safari 15.4) are the kernel's
`requires`: a target that lacks one is a build warning. Without `@property` the percentage animates as a discrete value
and the band never shows (the base colour, still); without `:has()` nothing animates. For targets without `color-mix()`
the build adds the grey defaults under `@supports not`, and only then.

## Limits

- The clock animates an inherited custom property on `:root`, so while a skeleton is mounted the browser updates the
  style of the whole document on every frame. Fine for a loading page; keep skeletons out of a page that stays busy.
- One clock for the page: the duration (1.5s), the easing and the direction are the same for every skeleton, and there are
  no methods for them.
- Text inside a skeleton shows: write it empty, or hide its children. A transparent text colour on the skeleton makes
  the defaults transparent too (they mix `currentColor`); give it `skeleton().color(...).highlight(...)` then.
- The band is horizontal, left to right; there is no pulse variant.

```bash
cd packages/skeleton && bun run test           # fixtures through the engine (output, conflicts, errors); bun run typecheck for the type test
cd packages/skeleton && bun run test:browsers  # the phase and reduced motion in Chrome, Firefox and WebKit
```

## Credits

The shared clock follows [sync-skeleton](https://github.com/crutchcorn/sync-skeleton) (MIT, Corbin Crutchley). The
CSS is written here; no code is copied.
