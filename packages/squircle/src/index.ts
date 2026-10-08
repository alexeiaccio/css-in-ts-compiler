// @cssints/squircle: squircle corners. The kernel is native `corner-shape: squircle` over `border-radius` (Chrome 139).
// Where a target lacks it, a runtime of CSS only adds a mask under `@supports not`: the same superellipse drawn as one
// SVG, put at the four corners at twice the radius, and two bands between them. It follows the element's size with no
// script. Build time only; nothing ships but CSS.
import { scope } from "cssints/plugin";

// The superellipse |x|^4 + |y|^4 = 1 (`corner-shape: squircle` is `superellipse(2)`), one cubic per quadrant: the
// control points at 0.92 keep it within 0.5% of the radius.
const SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-1 -1 2 2' preserveAspectRatio='none'>" +
  "<path d='M1 0C1 .92 .92 1 0 1C-.92 1-1 .92-1 0C-1-.92-.92-1 0-1C.92-1 1-.92 1 0Z'/></svg>";
const url = `url("data:image/svg+xml,${SVG.replace(/[<>]/g, encodeURIComponent)}")`;
// a corner twice the radius, no more than the box; the bands fill what the corners leave
const size = "min(2*var(--_r),100%)";
const band = "max(0px,100% - 2*var(--_r))";
const corner = (at: string) => `var(--_m) ${at}/${size} ${size} no-repeat`;
const fill = (w: string, h: string) => `linear-gradient(#000 0 0) 50%/${w} ${h} no-repeat`;
const MASK = [
  corner("0 0"),
  corner("100% 0"),
  corner("0 100%"),
  corner("100% 100%"),
  fill("100%", band),
  fill(band, "100%"),
].join(",");

/**
 * `squircle().radius("24px")`: squircle corners, of `1rem` by default. Native `corner-shape: squircle` where the
 * targets have it; where one lacks it the build adds a mask that cuts the same shape (it clips the element's shadow and
 * outline there). It sets the corners, so a `border-radius*` or `corner-*` property in the same `cn()` is a build error.
 */
export const { squircle } = scope("squircle", {
  // written as styles: its conflicts are derived (border-radius, corner-shape and their longhands), and the runtime
  // covers its support warnings
  core: {
    css: (css) => [
      css.vars({ "--_r": "1rem" }),
      css.borderRadius("var(--_r)"),
      css.cornerShape("squircle"),
    ],
    requires: ["css.properties.corner-shape.squircle"],
  },
  mask: {
    polyfills: ["css.properties.corner-shape", "css.properties.corner-shape.squircle"],
    css: `@supports not (corner-shape:squircle){&{--_m:${url};border-radius:0;mask:${MASK}}}`,
  },
  squircle: {
    uses: ["core", "mask"],
    chain: { radius: { args: "<length-percentage [0,∞]>", emit: (v) => [["--_r", v]] } },
  },
}).export();
