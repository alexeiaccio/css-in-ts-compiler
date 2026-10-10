// The settings store (parse, defaults, invalid values, apply) and the inline script of index.html that runs before the
// first paint: for every stored value both must leave <html> the same.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import { CUBES, DEFAULT_HUE, HUES, IDS } from "../src/palettes.ts";
import {
  apply,
  BASE_HUE,
  defaults,
  HUES as WHEEL_HUES,
  KEY,
  load,
  OPTIONS,
  parse,
  save,
  WHEEL,
} from "../src/settings.ts";

// the browser does not load palettes.ts, so the two lists are kept in step here
assert.equal(BASE_HUE, DEFAULT_HUE, "BASE_HUE is the default hue of the palettes");
assert.equal(WHEEL_HUES, HUES);
assert.deepEqual(OPTIONS.palette, IDS);
assert.deepEqual(WHEEL, CUBES);
assert.equal(KEY, "cssints-docs.settings");
for (const k of Object.keys(OPTIONS))
  assert.ok(OPTIONS[k].includes(defaults[k]), `${k}: the default is an option`);

// parse: defaults, valid values, each invalid field falls back alone
assert.deepEqual(parse(null), defaults);
assert.deepEqual(parse(""), defaults);
assert.deepEqual(parse("{"), defaults);
for (const v of ["0", "null", "[]", '"dark"', "true", "42"])
  assert.deepEqual(parse(v), defaults, v);
const all = {
  hue: 0,
  palette: "flexoki",
  mode: "dim",
  text: "large",
  density: "compact",
  font: "serif",
  radius: "sharp",
};
assert.deepEqual(parse(JSON.stringify(all)), all);
assert.deepEqual(parse(JSON.stringify({ hue: 11, mode: "light" })), {
  ...defaults,
  hue: 11,
  mode: "light",
});
const bad = {
  hue: 12,
  palette: "neon",
  mode: "blue",
  text: "huge",
  density: 1,
  font: null,
  radius: "square",
};
assert.deepEqual(parse(JSON.stringify(bad)), defaults);
for (const hue of [-1, 12, 360, 1.5, "9", null, NaN, Infinity])
  assert.equal(parse(JSON.stringify({ hue, mode: "dark" })).hue, BASE_HUE, String(hue));
assert.deepEqual(parse(JSON.stringify({ hue: 7, mode: "nope", text: "small" })), {
  ...defaults,
  hue: 7,
  text: "small",
});

// load and save over a storage, and over one that throws (blocked cookies)
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => void storage.set(k, v),
};
assert.deepEqual(load(), defaults);
save(all);
assert.deepEqual(JSON.parse(storage.get(KEY)), all);
assert.deepEqual(load(), all);
globalThis.localStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};
assert.deepEqual(load(), defaults);
save(all);

// <html> as a test double: a class set and the data attributes
const html = () => {
  const classes = new Set();
  return {
    classes,
    dataset: {},
    classList: {
      add: (c) => classes.add(c),
      toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)),
    },
  };
};
// the page starts with no attribute, which the themes read as "normal", the first palette and its default hue
const state = (el) => ({
  classes: [...el.classes].sort(),
  data: Object.fromEntries(
    ["palette", "text", "density", "font", "radius"].map((k) => [k, el.dataset[k] ?? defaults[k]]),
  ),
  hue: el.dataset.hue ?? String(BASE_HUE),
});

const root = html();
apply(all, root);
assert.deepEqual(state(root), {
  classes: ["dark", "dim"],
  data: { palette: "flexoki", text: "large", density: "compact", font: "serif", radius: "sharp" },
  hue: "0",
});
apply({ ...defaults, mode: "light" }, root); // a mode replaces the one before it
assert.deepEqual(state(root).classes, ["light"]);
apply({ ...defaults, mode: "dark" }, root);
assert.deepEqual(state(root).classes, ["dark"]);
apply(defaults, root);
assert.deepEqual(state(root), state(html()));

// the inline script of index.html, run on the same stored text
const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const inline = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(inline.length, 1, "one inline script");
assert.ok(inline[0][1].includes(`"${KEY}"`));
assert.ok(
  page.indexOf("<script>") < page.indexOf('type="module"'),
  "it runs before the app's module",
);
const prepaint = (raw) => {
  const el = html();
  vm.runInNewContext(inline[0][1], {
    document: { documentElement: el },
    Number,
    localStorage: {
      getItem: (k) => {
        assert.equal(k, KEY);
        if (raw === "throw") throw new Error("blocked");
        return raw;
      },
    },
  });
  return state(el);
};
const inputs = [
  null,
  "",
  "{",
  "null",
  "0",
  "[]",
  '"dark"',
  "throw",
  JSON.stringify(all),
  JSON.stringify(bad),
  ...OPTIONS.mode.map((mode) => JSON.stringify({ mode })),
  ...["other", 1, null].map((mode) => JSON.stringify({ mode })),
  ...[-1, 0, 1.5, "9", 9, 11, 12, 269].map((hue) => JSON.stringify({ hue })),
  ...["palette", "text", "density", "font", "radius"].flatMap((k) =>
    [...OPTIONS[k], "other", 1].map((v) => JSON.stringify({ [k]: v })),
  ),
];
for (const raw of inputs) {
  const expected = state(
    (() => {
      const el = html();
      apply(raw === "throw" ? defaults : parse(raw), el);
      return el;
    })(),
  );
  assert.deepEqual(prepaint(raw), expected, `pre-paint for ${raw}`);
}
console.log(
  `docs settings: parse, store and the pre-paint script agree on ${inputs.length} inputs`,
);
