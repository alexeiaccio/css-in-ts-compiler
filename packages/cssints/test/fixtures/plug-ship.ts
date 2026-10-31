// A member whose site is more than a class string: `ship()` ships the owner style as its class string and the data beside
// it as JSON (@cssints/reactive's state(), cssints-zrt2).
import { cn, color } from "cssints" with { type: "cssints" };
import { arg, scope, ship } from "cssints/plugin";

export const kit = scope("pship", {
  "#k": { css: "&{color:red}" },
  m: { args: [arg<{ n: string }>()], uses: ["k"] },
})
  .build({ m: ({ n }) => ({ decls: [["--pship-n", n]] }) })
  .export();

/** The owner style, a string, a list and a nested object: four kinds of entry. */
export const make = (n: string) =>
  ship({ owner: cn(kit.m({ n }), color("blue")), name: n, list: [n], nested: { n } });
