// Writes src/<sector>.ts, the names of the Color Name List in one sector each, from the `color-name-list` dependency: a
// colour word in the name (whole words) decides its sector, else the oklch hue of its colour; low chroma is neutral, and a
// dark orange or yellow is brown. The output is committed (the members' types are read from it, and a build imports one
// sector, not the list). Run: bun run generate.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";

import { converter } from "culori";

const require = createRequire(import.meta.url);
const out = process.argv[2] ?? `${import.meta.dirname}/../src`;
const pkg = require.resolve("color-name-list/package.json");
const version = (JSON.parse(readFileSync(pkg, "utf8")) as { version: string }).version;
const list = JSON.parse(readFileSync(`${dirname(pkg)}/dist/colornames.json`, "utf8")) as {
  name: string;
  hex: string;
}[];

const toOklch = converter("oklch");

/** The members, in the order the package exports them. */
const SECTORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
  "brown",
  "neutral",
] as const;
type Sector = (typeof SECTORS)[number];

/** The colour words: a whole word of the name (not a substring: `redwood` and `bored` do not count). `gray`, `grey`,
 * `white` and `black` are the neutral sector. */
const WORD = {
  red: "red",
  orange: "orange",
  yellow: "yellow",
  green: "green",
  cyan: "cyan",
  blue: "blue",
  purple: "purple",
  pink: "pink",
  brown: "brown",
  gray: "neutral",
  grey: "neutral",
  white: "neutral",
  black: "neutral",
} as const;
const isWord = (word: string): word is keyof typeof WORD => Object.hasOwn(WORD, word);

// The hue cuts, in degrees of oklch, tuned on color-name-list 14.61.0 (the coordinator's cuts, measured: yellow was 6,657
// names and neutral 7,677, both too big for cheap completion). red < 30, orange 30-70, yellow 70-105, green 105-165,
// cyan 165-215, blue 215-265, purple 265-330, pink 330-360. Below `CHROMA` a colour is a neutral; a hue in the orange and
// yellow band below `BROWN.lightness` is a brown (brown is a dark orange or yellow), which keeps every sector under 5,000
// names. The word rule wins over all of this: `ferrari-red` is in red though its hue is orange.
const HUES = [
  [30, "red"],
  [70, "orange"],
  [105, "yellow"],
  [165, "green"],
  [215, "cyan"],
  [265, "blue"],
  [330, "purple"],
  [360, "pink"],
] as const satisfies readonly (readonly [number, Sector])[];
const CHROMA = 0.02;
const BROWN = { from: 40, to: 105, lightness: 0.7 };

const hueSector = (hue: number) => HUES.find(([cut]) => hue < cut)?.[1] ?? "red";

const wordsOf = (name: string) => [
  ...new Set(
    name
      .toLowerCase()
      .split(/[^\p{L}]+/u)
      .flatMap((word) => (isWord(word) ? [WORD[word]] : [])),
  ),
];

// NFC, lowercase, `&` to "and", apostrophes removed, every run of characters that is not a letter or a digit to "-",
// trimmed. So a key is letters (accents, `²`), digits and hyphens: `100-mph`, `rosé`, `pi²`, `pepper-and-spice`. The one
// collision of the list ("World’s Away" and "Worlds Away" both give `worlds-away`) keeps a hyphen for the apostrophe.
const key = (name: string) =>
  name
    .normalize("NFC")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['\u2019]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
const COLLISION = { name: "World’s Away", key: "world-s-away" };
const keyOf = (name: string) => (name === COLLISION.name ? COLLISION.key : key(name));

const bySector = new Map<Sector, Map<string, string>>(SECTORS.map((sector) => [sector, new Map()]));
const counts = { word: 0, several: 0, hue: 0, disagree: 0 };
for (const { name, hex } of list) {
  const colour = toOklch(hex);
  const hue = (((colour?.h ?? 0) % 360) + 360) % 360;
  const chroma = colour?.c ?? 0;
  const lightness = colour?.l ?? 0;
  const byHue: Sector =
    chroma < CHROMA
      ? "neutral"
      : hue >= BROWN.from && hue < BROWN.to && lightness < BROWN.lightness
        ? "brown"
        : hueSector(hue);
  const words = wordsOf(name);
  if (words.length) {
    counts.word += 1;
    if (words.length > 1) counts.several += 1;
    if (!words.includes(byHue)) counts.disagree += 1;
  } else counts.hue += 1;
  for (const sector of words.length ? words : [byHue]) bySector.get(sector)?.set(keyOf(name), hex);
}

// One sector, one file: a record of key to hex (`as const`, so `keyof typeof` is the union the member's `arg<>()` takes)
// and the union as one alias, so an error message says `Red`, not 3,073 keys. A key that is a JavaScript identifier is
// printed without quotes (`ablaze`), as the formatter would; the rest keep them (`100-mph`, `pi²`).
const IDENTIFIER = /^[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*$/u;
for (const sector of SECTORS) {
  const entries = [...bySector.get(sector)!.entries()].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const type = sector.charAt(0).toUpperCase() + sector.slice(1);
  writeFileSync(
    `${out}/${sector}.ts`,
    `// Generated by scripts/generate.ts from color-name-list ${version}: do not edit.\n` +
      `export const ${sector} = {\n` +
      entries
        .map(
          ([name, hex]) =>
            `  ${IDENTIFIER.test(name) ? name : JSON.stringify(name)}: ${JSON.stringify(hex)},`,
        )
        .join("\n") +
      `\n} as const;\n` +
      // The union written out, not `keyof typeof <sector>`: the declarations a build emits then hold the union (~540 kB)
      // and not the record of every name to its hex (2.2 MB), which is not part of what the package exports.
      `export type ${type} =\n${entries
        .map(([name]) => `  | ${JSON.stringify(name)}`)
        .join("\n")};\n`,
  );
}

const sum = SECTORS.reduce((n, sector) => n + bySector.get(sector)!.size, 0);
console.log(
  `color-name-list ${version}: ${list.length} names, ${sum} key-sectors, ` +
    `by word ${counts.word} (${counts.several} with several), by hue ${counts.hue}, ` +
    `word and hue disagree ${counts.disagree}\n` +
    SECTORS.map((sector) => `${sector} ${bySector.get(sector)!.size}`).join(", "),
);
