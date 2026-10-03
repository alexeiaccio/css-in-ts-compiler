// The colour evaluator of the derived-token runtime (src/derived.ts, cssints-i9xo) against culori, the maths the build
// uses (color.ts): the sky templates at every hue, relative colour, color-mix and the other functions on random inputs,
// within one step of an 8-bit channel (the matrices are written with fewer digits). What is outside the subset throws,
// naming the token it stopped at.
// Run: node derived-runtime.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { clampRgb, converter, interpolate, parse } from "culori";

import { css, evaluate } from "../src/derived.ts";

const toRgb = converter("rgb");
const bytes = (c) => {
  const { r, g, b } = toRgb(clampRgb(c));
  return [r, g, b].map((v) => Math.round(v * 255) + 0);
};
const mine = (text, get) => {
  const [, r, g, b] = /^rgb\((\d+) (\d+) (\d+)/.exec(css(evaluate(text, get)));
  return [+r, +g, +b];
};
const near = (a, b, label) => {
  assert.ok(
    a.every((v, i) => Math.abs(v - b[i]) <= 1),
    `${label}: ${a} vs culori ${b}`,
  );
};
const vsCulori = (text, label = text) => {
  const c = parse(text);
  assert.ok(c, `culori cannot read ${text}`);
  near(mine(text), bytes(c), label);
};

let seed = 7;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (lo, hi) => lo + random() * (hi - lo);
const pick = (...xs) => xs[Math.floor(random() * xs.length)];
const colour = () =>
  pick(
    () =>
      `oklch(${between(0.2, 0.95).toFixed(3)} ${between(0, 0.3).toFixed(3)} ${between(0, 360).toFixed(1)})`,
    () =>
      `oklab(${between(0.2, 0.95).toFixed(3)} ${between(-0.25, 0.25).toFixed(3)} ${between(-0.25, 0.25).toFixed(3)})`,
    () =>
      `lab(${between(10, 95).toFixed(2)} ${between(-80, 80).toFixed(2)} ${between(-80, 80).toFixed(2)})`,
    () =>
      `rgb(${Math.floor(between(0, 256))} ${Math.floor(between(0, 256))} ${Math.floor(between(0, 256))})`,
    () =>
      `color(srgb-linear ${between(0, 1).toFixed(3)} ${between(0, 1).toFixed(3)} ${between(0, 1).toFixed(3)})`,
    () => `#${Math.floor(between(0, 16777215)).toString(16).padStart(6, "0")}`,
  )();

// ---------- the templates of sky, at every hue
const tokens = JSON.parse(
  readFileSync(new URL("../../../apps/sky/src/tokens.json", import.meta.url), "utf8"),
);
const accent = tokens.color.accent.$value; // oklch(0.637 0.203 {hue.accent})
const onAccent = tokens.color.onAccent.$value;
const T = Number(/\(([\d.]+) - l\)/.exec(onAccent)[1]);
for (let hue = 0; hue < 360; hue += 5) {
  const text = accent.replace("{hue.accent}", "var(--hue-accent)");
  const get = (n) => (n === "--hue-accent" ? String(hue) : assert.fail(n));
  near(mine(text, get), bytes(parse(accent.replace("{hue.accent}", hue))), `accent at ${hue}`);
  // onAccent: read from the accent (a Color of the runtime, or its computed text), black or white by CIE L* against T
  const onText = onAccent.replace("{color.accent}", "var(--color-accent)");
  const origin = evaluate(text, get);
  const white = bytes(parse(accent.replace("{hue.accent}", hue))).map((v) => v / 255);
  const [r, g, b] = white.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const L = y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y;
  const expected = L < T ? [255, 255, 255] : [0, 0, 0];
  assert.deepEqual(
    mine(onText, (n) => (n === "--color-accent" ? origin : assert.fail(n))),
    expected,
    `onAccent at ${hue}`,
  );
  // the same from the computed text of the accent, as the runtime reads an input it did not compute
  assert.deepEqual(
    mine(onText, (n) =>
      n === "--color-accent" ? css(origin).replace(/(\d) (?=\d)/g, "$1, ") : assert.fail(n),
    ),
    expected,
    `onAccent from text at ${hue}`,
  );
}

// the cost of one slider input in the runtime's own maths: the five colours of the default theme
{
  const templates = [
    ...["0.637 0.203", "0.58 0.182", "0.47 0.164", "0.926 0.056"].map(
      (c) => `oklch(${c} var(--hue-accent))`,
    ),
    onAccent.replace("{color.accent}", "var(--color-accent)"),
  ];
  const run = (hue) => {
    const done = new Map();
    const get = (n) => {
      if (n === "--hue-accent") return String(hue);
      if (!done.has(n)) done.set(n, evaluate(templates[0], get));
      return done.get(n);
    };
    return templates.map((t) => css(evaluate(t, get)));
  };
  const t0 = performance.now();
  for (let i = 0; i < 20000; i++) run(i % 360);
  console.log(
    `derived-runtime: the five colours of the default theme: ${(((performance.now() - t0) / 20000) * 1000).toFixed(1)} us`,
  );
}

// ---------- random inputs against culori
for (let n = 0; n < 300; n++) {
  const c = colour();
  vsCulori(c);
  // relative colour: the identity, then channel maths
  const l = between(0.3, 0.9);
  near(mine(`oklch(from ${c} l c h)`), bytes(parse(c)), `identity ${c}`);
  near(mine(`oklab(from ${c} l a b)`), bytes(parse(c)), `identity oklab ${c}`);
  near(mine(`lab(from ${c} l a b)`), bytes(parse(c)), `identity lab ${c}`);
  near(mine(`color(from ${c} srgb-linear r g b)`), bytes(parse(c)), `identity linear ${c}`);
  near(mine(`color(from ${c} srgb r g b)`), bytes(parse(c)), `identity srgb ${c}`);
  near(mine(`rgb(from ${c} r g b)`), bytes(parse(c)), `identity rgb ${c}`);
  const o = converter("oklch")(parse(c));
  const dh = Math.floor(between(-90, 90));
  near(
    mine(`oklch(from ${c} calc(l * ${l.toFixed(2)}) min(c, 0.1) calc(h + ${dh}))`),
    bytes({
      mode: "oklch",
      l: o.l * Number(l.toFixed(2)),
      c: Math.min(o.c, 0.1),
      h: ((o.h ?? 0) + dh + 360) % 360,
    }),
    `oklch maths of ${c}`,
  );
  near(
    mine(`oklch(from ${c} clamp(0.4, l, 0.6) c h)`),
    bytes({ mode: "oklch", l: Math.max(0.4, Math.min(o.l, 0.6)), c: o.c, h: o.h ?? 0 }),
    `clamp of ${c}`,
  );
  const k = converter("lab")(parse(c));
  near(
    mine(`lab(from ${c} clamp(0, (50 - l) * 1e6, 100) 0 0)`),
    bytes({ mode: "lab", l: Math.max(0, Math.min((50 - k.l) * 1e6, 100)), a: 0, b: 0 }),
    `lab step of ${c}`,
  );
  // color-mix
  const d = colour();
  const share = Math.floor(between(1, 99));
  for (const [space, mode] of [
    ["oklab", "oklab"],
    ["srgb", "rgb"],
    ["srgb-linear", "lrgb"],
    ["lab", "lab"],
  ]) {
    const mixed = interpolate([parse(c), parse(d)], mode)(share / 100);
    near(
      mine(`color-mix(in ${space}, ${c} ${100 - share}%, ${d})`),
      bytes(mixed),
      `${space} mix ${c} ${d} ${share}`,
    );
    near(
      mine(`color-mix(in ${space}, ${c}, ${d} ${share}%)`),
      bytes(mixed),
      `${space} mix ${c} ${d} ${share}, second`,
    );
  }
}

// ---------- the rest of the subset
assert.deepEqual(mine("#fff"), [255, 255, 255]);
assert.deepEqual(mine("#80808080"), [128, 128, 128]);
assert.equal(css(evaluate("rgba(0, 0, 0, 0.1)")), "rgb(0 0 0 / 0.1)");
assert.equal(css(evaluate("oklch(0 0 0 / 10%)")), "rgb(0 0 0 / 0.1)");
assert.equal(
  css(evaluate("rgb(from rgb(10 20 30 / 0.5) r g b / calc(alpha * 0.5))")),
  "rgb(10 20 30 / 0.25)",
);
assert.equal(css(evaluate("color-mix(in oklab, transparent, black)")), "rgb(0 0 0 / 0.5)");
assert.deepEqual(mine("oklch(62% 0.19 259)"), bytes(parse("oklch(62% 0.19 259)")));
assert.deepEqual(mine("oklch(0.5 50% 120deg)"), bytes(parse("oklch(0.5 50% 120deg)")));
assert.deepEqual(
  mine("color-mix(in oklab, var(--a), black 15%)", (n) => (n === "--a" ? "rgb(219, 74, 167)" : "")),
  bytes(interpolate([parse("rgb(219 74 167)"), parse("black")], "oklab")(0.15)),
);
assert.deepEqual(
  mine("oklch(0.5 0.1 calc(var(--h) + 10))", () => "200"),
  bytes(parse("oklch(0.5 0.1 210)")),
);

// ---------- outside the subset: it throws, naming the token
for (const [text, token] of [
  ["light-dark(black, white)", "light-dark"],
  ["hsl(120 50% 50%)", "hsl"],
  ["color(display-p3 1 0 0)", "display-p3"],
  ["color-mix(in oklch, black, white)", "oklch"],
  ["color-mix(in srgb, black 30%, white 30%)", "color-mix"],
  ["red", "red"],
  ["oklch(0.5 0.1 1rem)", "rem"],
  ["oklch(0.5 0.1 var(--x))", "--x"],
  ["oklch(from black l c h / z)", "z"],
  ["oklch(0.5 0.1", ""],
  ["#12", "#12"],
]) {
  assert.throws(
    () => evaluate(text),
    (e) => e instanceof Error && (e.message === token || token === ""),
    text,
  );
}
console.log(
  "derived-runtime: sky templates at 72 hues, 300 random colours (relative colour, color-mix, five spaces) within 1/255 of culori",
);
