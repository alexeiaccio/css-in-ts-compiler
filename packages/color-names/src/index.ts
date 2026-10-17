// @cssints/color-names: a colour from the Color Name List (names.color.pizza) as a typed colour value. `named("tangerine")`
// is `#ff9300`, a `<color>`, so it goes in `color()`, `bg()`, `borderColor()` and the rest. `colorNames.red("ferrari red")`
// is the same name by sector, one member per hue (the sectors list), so an editor's completion is a few thousand names and
// not all 31,938. A name is a key of the list: lowercase, letters, digits and hyphens (`100-mph`, `rosé`, `pi²`). Build
// time only: the sheet holds the hex, and the data never reaches the client. `@cssints/color-names/nearest` is the
// reverse lookup (a colour to its nearest name), build-time only, in its own subpath.
import { CSSColorValue } from "cssints";
import { arg, fn, scope } from "cssints/plugin";

import { blue, type Blue } from "./blue.ts";
import { brown, type Brown } from "./brown.ts";
import { cyan, type Cyan } from "./cyan.ts";
import { green, type Green } from "./green.ts";
import { neutral, type Neutral } from "./neutral.ts";
import { orange, type Orange } from "./orange.ts";
import { pink, type Pink } from "./pink.ts";
import { purple, type Purple } from "./purple.ts";
import { red, type Red } from "./red.ts";
import { yellow, type Yellow } from "./yellow.ts";

/** Every key of the list, in one alias, so an error message says `Name` and not the 31,938 keys. */
export type Name = Red | Orange | Yellow | Green | Cyan | Blue | Purple | Pink | Brown | Neutral;

// The data per sector, and the two indexes built from it once when the module runs (the engine runs it once per content):
// the key of every name to its hex, and the sectors every key is in (a name with several colour words is in each).
const data = { red, orange, yellow, green, cyan, blue, purple, pink, brown, neutral };
const hexes = new Map<string, string>();
const sectors = new Map<string, string[]>();
for (const [sector, names] of Object.entries(data))
  for (const [name, hex] of Object.entries(names)) {
    hexes.set(name, hex);
    const where = sectors.get(name);
    if (where) where.push(sector);
    else sectors.set(name, [sector]);
  }

// The nearest key, within three edits, for the message of an unknown name. The Levenshtein table, one row per character
// of `a` (a key is short, so a Uint16Array); an error path, so a scan of the 31,939 keys is fine, as @cssints/icons does.
const distance = (a: string, b: string) =>
  [...a].reduce(
    (previous, char, i) => {
      const row = new Uint16Array(previous.length);
      row[0] = i + 1;
      [...b].forEach((against, j) => {
        row[j + 1] = Math.min(
          previous[j + 1]! + 1,
          row[j]! + 1,
          previous[j]! + (char === against ? 0 : 1),
        );
      });
      return row;
    },
    new Uint16Array(b.length + 1).map((_, j) => j),
  )[b.length]!;
const near = (name: string) => {
  const limit = Math.min(3, Math.max(2, name.length >> 1));
  // a key of a very different length cannot be within the limit, and the distance is not computed for it
  const [best] = [...hexes.keys()].reduce<[string | undefined, number]>(
    (found, key) => {
      if (Math.abs(key.length - name.length) > found[1]) return found;
      const d = distance(name, key);
      return d < found[1] ? [key, d] : found;
    },
    [undefined, limit + 1],
  );
  return best;
};

const unknown = (name: string) => {
  const did = near(name);
  return `no colour name ${JSON.stringify(name)}${did ? `, did you mean ${did}?` : ""}`;
};
const landed = (name: string) => {
  const where = sectors.get(name);
  return where ? `${JSON.stringify(name)} is in ${where.join(", ")}` : unknown(name);
};
const colour = (names: Record<string, string>, name: string) => {
  const hex = names[name];
  if (!hex) throw new Error(`cssints: colornames: ${landed(name)}`);
  return new CSSColorValue(hex);
};

const colornames = scope("colornames", {
  named: fn({
    args: arg<Name>(),
    value: ([name]) => {
      const hex = hexes.get(name);
      if (!hex) throw new Error(`cssints: colornames: ${unknown(name)}`);
      return new CSSColorValue(hex);
    },
  }),
  red: fn({ args: arg<Red>(), value: ([name]) => colour(red, name) }),
  orange: fn({ args: arg<Orange>(), value: ([name]) => colour(orange, name) }),
  yellow: fn({ args: arg<Yellow>(), value: ([name]) => colour(yellow, name) }),
  green: fn({ args: arg<Green>(), value: ([name]) => colour(green, name) }),
  cyan: fn({ args: arg<Cyan>(), value: ([name]) => colour(cyan, name) }),
  blue: fn({ args: arg<Blue>(), value: ([name]) => colour(blue, name) }),
  purple: fn({ args: arg<Purple>(), value: ([name]) => colour(purple, name) }),
  pink: fn({ args: arg<Pink>(), value: ([name]) => colour(pink, name) }),
  brown: fn({ args: arg<Brown>(), value: ([name]) => colour(brown, name) }),
  neutral: fn({ args: arg<Neutral>(), value: ([name]) => colour(neutral, name) }),
});

// named through the scope, as in @cssints/balance: the inferred type is too long to print (TS7056).
type Members = ReturnType<typeof colornames.export>;
const members: Members = colornames.export();

/**
 * `named(name)`: any name of the Color Name List as a `<color>`, its own hex: `color(named("tangerine"))` is
 * `color: #ff9300`. A name that is not in the list is an error in the types, and a build error with the nearest name.
 * The 63 CSS keywords whose list name has another hex (`green`: CSS `#008000`, the list's Green `#00ff00`) resolve to the
 * list's value; a CSS keyword stays reachable as a string, `color("green")`.
 */
export const named: Members["named"] = members.named;
/**
 * `colorNames.<sector>(name)`: the same name, restricted to one sector, so completion is short. The sector is the colour
 * word in the name when it has one (whole words: `ferrari red` is in `red`, `redwood` is not), else the oklch hue of the
 * colour: `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `brown` (a dark orange or yellow) and
 * `neutral` (grays, whites and blacks; low chroma). A name with several colour words is in each of its sectors. A name
 * that is not in the sector is an error that names the sectors it is in.
 */
export const colorNames = {
  red: members.red,
  orange: members.orange,
  yellow: members.yellow,
  green: members.green,
  cyan: members.cyan,
  blue: members.blue,
  purple: members.purple,
  pink: members.pink,
  brown: members.brown,
  neutral: members.neutral,
} as const;
