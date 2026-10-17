// @cssints/color-names/nearest: the nearest name of the Color Name List to a colour, by CIEDE2000 on Lab, as the list's
// own API (api.color.pizza/v1) matches. Build time only, in its own subpath: it imports the whole list (an 865 kB chunk)
// and culori's colour maths, so a plain export from the package root would put that chunk in the client bundle of any
// module that merely imported the package. Use it where the build runs (a plugin's `build`, a generator, the docs site);
// never import it from a file that reaches the browser. The engine has no marker for such a module: the subpath and this
// line are the marker, as for `@cssints/tokens`' sets and the `lacking`/`inGroup` helpers of `cssints/plugin`.
import { converter, differenceCiede2000 } from "culori";

import { blue } from "./blue.ts";
import { brown } from "./brown.ts";
import { cyan } from "./cyan.ts";
import { green } from "./green.ts";
import { neutral } from "./neutral.ts";
import { orange } from "./orange.ts";
import { pink } from "./pink.ts";
import { purple } from "./purple.ts";
import { red } from "./red.ts";
import type { Name } from "./index.ts";
import { yellow } from "./yellow.ts";

/** The nearest name to a colour. */
export interface Nearest {
  /** The key of the nearest name (a name of `named()`). */
  name: Name;
  /** Its hex, as the list holds it. */
  hex: string;
  /** The CIEDE2000 distance from the colour asked for; 0 is the same colour. */
  distance: number;
}

const list = new Map<Name, string>();
for (const names of [red, orange, yellow, green, cyan, blue, purple, pink, brown, neutral])
  for (const [name, hex] of Object.entries(names)) list.set(name as Name, hex);
const toLab = converter("lab");
const difference = differenceCiede2000();

/**
 * `nearest(color)`: the name of the Color Name List nearest to a colour, by CIEDE2000 on Lab, as the list's own API
 * matches. `color` is any colour culori can read (a hex, `rgb()`, a named CSS colour); `undefined` when it cannot read
 * it. Build time only (see the header).
 *
 * @param {string} color the colour to match
 * @returns {Nearest | undefined} the nearest name, its hex and the distance, or `undefined` for a colour culori cannot read
 */
export const nearest = (color: string) => {
  const lab = toLab(color);
  if (!lab) return undefined;
  return [...list].reduce<Nearest | undefined>((best, [name, hex]) => {
    const value = toLab(hex);
    if (!value) return best;
    const distanceTo = difference(lab, value);
    return best === undefined || distanceTo < best.distance
      ? { name, hex, distance: distanceTo }
      : best;
  }, undefined);
};
