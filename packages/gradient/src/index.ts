// @cssints/gradient: an eased gradient. The easing curve is expanded into colour stops at build time, as
// postcss-easing-gradients does: the curve's parameter t is sampled evenly, x(t) places the stop and y(t) is the share of the
// second colour, mixed in oklab with premultiplied alpha (as CSS mixes). An endpoint that cannot be read at build time (a
// token is `var(--name)`, `currentColor`) makes every stop a `color-mix(in oklab, …)` for the browser to compute.
import { CSSImageValue } from "cssints";
import { scope } from "cssints/plugin";
import { formatHex, formatHex8, interpolateWithPremultipliedAlpha, parse } from "culori";

import { fixed, samples } from "./stops.ts";

const eased = scope("gradient", {
  // local syntax names: the direction of each kind (as the CSS function takes it), then the parts every kind shares
  linear: "linear [ <angle> | to <side-or-corner> ]",
  radial: "radial [ [ <radial-shape> || <radial-size> ] [ at <position> ]? | at <position> ]",
  conic: "conic [ from <angle> [ at <position> ]? | at <position> ]",
  ends: "<color> <color> [ linear | <cubic-bezier-easing-function> ]? <integer [2,64]>?",
  gradient: {
    args: "[ <linear> | <radial> | <conic> ] <ends>",
    value: ([kind, direction, from = "", to = "", easing = "ease-in-out", stops = "13"]) => {
      const points = samples(easing, Number(stops));
      const a = parse(from);
      const b = parse(to);
      const mix = a && b ? interpolateWithPremultipliedAlpha([a, b], "oklab") : undefined;
      const color = (y: number) => {
        if (!mix) return `color-mix(in oklab, ${from}, ${to} ${fixed(y * 100)}%)`;
        const c = mix(y);
        return c.alpha === undefined || c.alpha >= 1 ? formatHex(c) : formatHex8(c);
      };
      const list = points.map(({ x, y }, i) =>
        i === 0 ? from : i === points.length - 1 ? to : `${color(y)} ${fixed(x * 100)}%`,
      );
      return new CSSImageValue(`${kind}-gradient(${direction}, ${list.join(", ")})`);
    },
  },
});

/**
 * `gradient(kind, direction, from, to, easing?, stops?)`: a `linear`, `radial` or `conic` gradient from one colour to
 * another along an easing (`ease-in-out` by default; `linear`, `ease*` or `cubic-bezier()`), as `stops` colour stops (13 by
 * default, 2 to 64). The direction is the gradient's own (`"to bottom"`, `"45deg"`, `"circle at top"`, `"from 90deg"`). The
 * stops are computed at build time in oklab; a token or `currentColor` endpoint gives `color-mix()` stops instead. An `<image>`.
 */
// The annotation is for the declaration file: the inferred type names a module of cssints that is not exported.
export const gradient: ReturnType<typeof eased.export>["gradient"] = eased.export().gradient;
