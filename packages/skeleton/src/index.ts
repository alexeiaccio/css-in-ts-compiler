// @cssints/skeleton: loading placeholders whose shimmer is in phase across the page, in the way of crutchcorn's
// sync-skeleton. A CSS animation starts when its element gets its style, so a skeleton mounted later would run behind
// the others; here no skeleton runs an animation of its own. One animation on `:root`, on while a skeleton is in the
// document (`:has()`), moves a registered, inherited percentage (`--skeleton-p`), and every skeleton reads it as its
// `background-position`: one clock, one phase. The gradient is fixed to the viewport, so the band sweeps the page as
// one; where `fixed` has no effect (iOS Safari) each skeleton has its own band, still in phase. Build time only.
import { scope } from "cssints/plugin";

// The defaults mix the text colour into transparent: a darker box on a light page, a lighter one on a dark page, and the
// band is less of it (a light sweep on light, a dark one on dark, as sync-skeleton's dark mode).
const BASE = "color-mix(in oklab, currentColor 12%, transparent)";
const HIGHLIGHT = "color-mix(in oklab, currentColor 4%, transparent)";
const GREY = "rgb(128 128 128 / 20%)";
const GREY_HIGHLIGHT = "rgb(128 128 128 / 8%)";
const gradient = (base: string, highlight: string) =>
  `linear-gradient(90deg, var(--_c, ${base}) 40%, var(--_h, ${highlight}) 50%, var(--_c, ${base}) 60%)`;

/**
 * `skeleton().radius("8px").color("#ddd").highlight("#eee")`: a loading placeholder, each method once and optional
 * (`0.25rem`, the text colour at 12% and 4%). The shimmer of every skeleton on the page is one animation on `:root`, so
 * they are in phase whenever each was mounted; under `prefers-reduced-motion: reduce` it is the base colour, still. It
 * sets the background and the corners, so a `background*` or `border-radius*` property in the same `cn()` is a build
 * error.
 */
export const { skeleton } = scope("skeleton", {
  // the box: a gradient of the base colour with the band in the middle, three viewports wide, fixed to the viewport and
  // placed by the clock (100% puts the band off the left edge, 0% off the right one; it repeats, so the box is covered
  // wherever it is). With the clock off (reduced motion, or no skeleton yet) it stays at 100%: the base colour, still.
  // The colours and the radius fall back to the defaults, so an ancestor's `--skeleton-c` themes every skeleton under it.
  core: {
    css: (css) => [
      css.borderRadius("var(--_r, 0.25rem)"),
      css.backgroundImage(gradient(BASE, HIGHLIGHT)),
      css.backgroundSize("300% 100%"),
      css.backgroundPosition("var(--_p) 0"),
      css.backgroundAttachment("fixed"),
    ],
  },
  // the clock: one animation of `--_p` on `:root` while a skeleton is in the document; every skeleton inherits its value
  // (it styles `:root`, not the skeleton, so it adds no conflicts)
  clock: {
    css: (css) =>
      css.media("(prefers-reduced-motion: no-preference)")(
        css.nest(":root:has(&)")(
          css.animation(
            css.keyframes({ from: css.vars({ "--_p": "100%" }), to: css.vars({ "--_p": "0%" }) }),
            "1.5s ease-in-out infinite",
          ),
        ),
      ),
    atProperty: '@property --_p{syntax:"<percentage>";inherits:true;initial-value:100%}',
    requires: ["css.at-rules.property", "css.selectors.has"],
  },
  // for targets without color-mix() (Chrome 109): the defaults as a grey at 20% and 8%, which reads on light and dark
  "#grey": {
    polyfills: ["css.types.color.color-mix", "css.types.color.oklab"],
    css: `@supports not (color:color-mix(in oklab,red,red)){&{background-image:${gradient(GREY, GREY_HIGHLIGHT)}}}`,
  },
  skeleton: {
    uses: ["core", "clock", "grey"],
    chain: {
      radius: { args: "<length-percentage [0,∞]>", emit: (v) => [["--_r", v]] },
      color: { args: "<color>", emit: (v) => [["--_c", v]] },
      highlight: { args: "<color>", emit: (v) => [["--_h", v]] },
    },
  },
}).export();
