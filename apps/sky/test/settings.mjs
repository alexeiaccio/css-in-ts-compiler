// The settings store (parse, defaults, invalid values, apply) and the inline script of index.html that runs before the
// first paint: for every stored value both must leave <html> the same.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import { apply, BASE_HUE, defaults, hueOf, KEY, load, parse, save } from "../src/settings.ts";
import tokens from "../src/tokens.json" with { type: "json" };

assert.equal(BASE_HUE, tokens.hue.accent.$value, "BASE_HUE is the hue of tokens.json");
assert.equal(KEY, "sky.settings");

// parse: defaults, valid values, each invalid field falls back alone
assert.deepEqual(parse(null), defaults);
assert.deepEqual(parse(""), defaults);
assert.deepEqual(parse("{"), defaults);
for (const v of ["0", "null", "[]", '"dark"', "true", "42"])
  assert.deepEqual(parse(v), defaults, v);
const all = { hue: -180, mode: "dim", squareButtons: true, squareAvatars: true };
assert.deepEqual(parse(JSON.stringify(all)), all);
assert.deepEqual(parse(JSON.stringify({ hue: 180, mode: "light" })), {
  ...defaults,
  hue: 180,
  mode: "light",
});
const bad = { hue: 181, mode: "blue", squareButtons: "yes", squareAvatars: 1 };
assert.deepEqual(parse(JSON.stringify(bad)), defaults);
for (const hue of [-181, 1.5, "90", null, NaN, Infinity])
  assert.equal(parse(JSON.stringify({ hue, mode: "dark" })).hue, 0, String(hue));
assert.equal(parse(JSON.stringify({ hue: 7, mode: "nope", squareButtons: true })).hue, 7);
assert.equal(
  parse(JSON.stringify({ hue: 7, mode: "nope", squareButtons: true })).squareButtons,
  true,
);
assert.deepEqual(defaults, { hue: 0, mode: "system", squareButtons: false, squareAvatars: false });

assert.equal(hueOf(0), 345);
assert.equal(hueOf(15), 0);
assert.equal(hueOf(-180), 165);
assert.equal(hueOf(180), 165);

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

// <html> as a test double: a class set and the custom properties
const html = () => {
  const classes = new Set();
  const props = {};
  return {
    classes,
    props,
    classList: {
      add: (c) => classes.add(c),
      toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)),
    },
    style: { setProperty: (k, v) => (props[k] = String(v)) },
  };
};
const state = (el) => ({ classes: [...el.classes].sort(), props: el.props });

const root = html();
apply(all, root);
assert.deepEqual(state(root), {
  classes: ["dim", "square-avatars", "square-buttons"],
  props: { "--hue-accent": "165" },
});
apply({ ...defaults, mode: "dark" }, root); // a mode replaces the one before it, flags go off
assert.deepEqual(state(root), { classes: ["dark"], props: { "--hue-accent": "345" } });
apply(defaults, root);
assert.deepEqual(state(root), { classes: [], props: { "--hue-accent": "345" } });

// the inline script of index.html, run on the same stored text
const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const inline = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(inline.length, 1, "one inline script");
assert.ok(inline[0][1].includes(`"${KEY}"`) && inline[0][1].includes(String(BASE_HUE)));
assert.ok(
  page.indexOf("<script>") < page.indexOf('type="module"'),
  "it runs before the app's module",
);
const prepaint = (raw) => {
  const el = html();
  vm.runInNewContext(inline[0][1], {
    document: { documentElement: el },
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
  JSON.stringify({ hue: 0 }),
  JSON.stringify({ hue: 90, mode: "system" }),
  ...["light", "dim", "dark", "system", "other"].map((mode) => JSON.stringify({ mode })),
  ...[-181, -180, -1, 1.5, "90", 180, 181].map((hue) => JSON.stringify({ hue })),
  JSON.stringify({ squareButtons: true }),
  JSON.stringify({ squareAvatars: true, squareButtons: "yes" }),
];
for (const raw of inputs) {
  const stored = raw === "throw" ? defaults : parse(raw);
  const expected = html();
  apply(stored, expected);
  const got = prepaint(raw);
  // the page starts with no classes; apply() also removes classes that are not there, so the sets are comparable
  assert.deepEqual(got.classes, state(expected).classes, `classes for ${raw}`);
  // the script leaves the property unset for a default, which means the token's own 345
  assert.equal(
    got.props["--hue-accent"] ?? "345",
    expected.props["--hue-accent"],
    `hue for ${raw}`,
  );
}
console.log(`sky settings: parse, store and the pre-paint script agree on ${inputs.length} inputs`);
