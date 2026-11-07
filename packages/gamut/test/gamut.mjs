// @cssints/gamut: the maths of fit (in the gamut, hue held, a no-op inside it), readable (the ratio reached on light and
// dark backgrounds, both directions) and tones (count, order, lightness, sRGB), then the errors.
// Run: node test/gamut.mjs
import assert from "node:assert/strict";

import { converter, inGamut, parse, wcagLuminance } from "culori";
import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

import { fit, readable, tones } from "../src/index.ts";

const toOklch = converter("oklch");
const oklch = (text) => toOklch(parse(text));
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
// the hue difference around the circle
const dh = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const steps = (t) =>
  Object.entries(t)
    .filter(([k]) => k !== "$type")
    .map(([, v]) => v.$value);

// fit: sRGB by default, in the gamut, and the hue held within a degree
const wide = [
  "oklch(0.7 0.4 150)",
  "color(display-p3 1 0 0)",
  "oklch(0.5 0.35 20)",
  "oklch(0.9 0.3 300)",
  "oklch(0.2 0.3 250)",
  "color(rec2020 0 1 0)",
  "oklch(0.546 0.3 264)",
];
for (const color of wide) {
  const hex = fit(color);
  assert.match(hex, /^#[0-9a-f]{6}$/);
  assert.ok(inGamut("rgb")(parse(hex)), `${color}: ${hex} is not in sRGB`);
  assert.ok(dh(oklch(hex).h ?? 0, oklch(color).h ?? 0) < 1, `${color}: ${hex} drifts in hue`);
  assert.ok(
    Math.abs(oklch(hex).l - oklch(color).l) < 0.005,
    `${color}: ${hex} drifts in lightness`,
  );
  // the same colour, fitted twice
  assert.equal(fit(color), hex);
}

// fit is a no-op for a colour already in the target gamut: the same colour, in the target's syntax
const noop = converter("rgb");
for (const color of ["#2563eb", "oklch(0.7 0.1 150)", "rgb(10 20 30 / 1)"]) {
  const hex = fit(color);
  const c = noop(parse(color));
  assert.equal(
    hex,
    `#${[c.r, c.g, c.b]
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`,
  );
}
assert.equal(
  fit("color(display-p3 0.1 0.5 0.2)", { target: "display-p3" }),
  "color(display-p3 0.1 0.5 0.2)",
);
assert.equal(fit("#2563eb", { target: "display-p3" }), "color(display-p3 0.2132 0.383 0.889)");

// fit into display-p3: the p3 syntax (a hex cannot hold it), in the p3 gamut, the hue held
for (const color of ["oklch(0.7 0.4 150)", "color(rec2020 0 1 0)", "oklch(0.5 0.35 20)"]) {
  const p3 = fit(color, { target: "display-p3" });
  assert.match(p3, /^color\(display-p3 (0|1|\d?\.\d+) (0|1|\d?\.\d+) (0|1|\d?\.\d+)\)$/);
  assert.ok(inGamut("p3")(parse(p3)), `${color}: ${p3} is not in Display P3`);
  assert.ok(dh(oklch(p3).h ?? 0, oklch(color).h ?? 0) < 1, `${color}: ${p3} drifts in hue`);
}
// the clip method clips the channels instead, and stays inside the gamut too
for (const color of wide)
  for (const target of ["srgb", "display-p3"]) {
    const out = fit(color, { target, method: "clip" });
    assert.ok(
      inGamut(target === "srgb" ? "rgb" : "p3")(parse(out)),
      `${color} clipped to ${target}`,
    );
  }

// readable: at least the ratio, by little, on a light and a dark background
for (const bg of [
  "#ffffff",
  "#f5f5f4",
  "#fafafa",
  "#111111",
  "#1e293b",
  "#0f172a",
  "#2563eb",
  "#808080",
])
  for (const want of [1.2, 2, 3, 4.5]) {
    const text = readable(bg, { ratio: want });
    const got = ratio(wcagLuminance(parse(text)), wcagLuminance(parse(bg)));
    assert.ok(got >= want, `${bg} at ${want}: ${text} reaches ${got}`);
    assert.ok(got < want * 1.02, `${bg} at ${want}: ${text} overshoots ${got}`);
  }

// both directions: "black" on a light background, "white" on a dark one, and either on a mid grey
for (const [bg, toward, want] of [
  ["#ffffff", "black", 4.5],
  ["#f5f5f4", "black", 4.5],
  ["#111111", "white", 4.5],
  ["#1e293b", "white", 4.5],
  ["#808080", "black", 3.9],
  ["#808080", "white", 3.9],
]) {
  const text = readable(bg, { ratio: want, toward });
  const got = ratio(wcagLuminance(parse(text)), wcagLuminance(parse(bg)));
  assert.ok(got >= want && got < want * 1.02, `${bg} toward ${toward}: ${text} ${got}`);
  const darker = oklch(text).l < oklch(bg).l;
  assert.equal(darker, toward === "black", `${bg} toward ${toward}: ${text} went the wrong way`);
}
// "auto" picks the side with more room
assert.equal(
  readable("#ffffff", { ratio: 4.5 }),
  readable("#ffffff", { ratio: 4.5, toward: "black" }),
);
assert.equal(
  readable("#111111", { ratio: 4.5 }),
  readable("#111111", { ratio: 4.5, toward: "white" }),
);
assert.equal(readable("#ffffff", { ratio: 21 }), "#000000");
// the hue of the background is held (white and grey have none)
assert.ok(dh(oklch(readable("#2563eb")).h ?? 0, oklch("#2563eb").h ?? 0) < 5);

// tones: count, keys, hex, lightest first, evenly from 0.95 to 0.10, in sRGB
const bases = ["#2563eb", "#eab308", "#16a34a", "#dc2626", "#9333ea", "#6b7280"];
for (const base of bases)
  for (const count of [1, 2, 3, 5, 9, 12]) {
    const t = tones(base, count);
    assert.equal(t.$type, "color");
    const hex = steps(t);
    assert.equal(hex.length, count);
    assert.deepEqual(
      Object.keys(t).filter((k) => k !== "$type"),
      Array.from({ length: count }, (_, i) => String(i + 1)),
    );
    for (const h of hex) {
      assert.match(h, /^#[0-9a-f]{6}$/);
      assert.ok(inGamut("rgb")(parse(h)), `${base} ${count}: ${h} is not in sRGB`);
    }
    const ls = hex.map((h) => oklch(h).l);
    for (let i = 1; i < ls.length; i++)
      assert.ok(ls[i] < ls[i - 1], `${base} ${count}: ${hex.join(" ")} is not lightest first`);
    assert.ok(Math.abs(ls[0] - 0.95) < 0.01, `${base} ${count}: ${ls[0]} at the light end`);
    if (count > 1)
      assert.ok(
        Math.abs(ls[count - 1] - 0.1) < 0.01,
        `${base} ${count}: ${ls[count - 1]} at the dark end`,
      );
    if (count > 2) {
      const gaps = ls.slice(1).map((l, i) => ls[i] - l);
      for (const gap of gaps)
        assert.ok(Math.abs(gap - 0.85 / (count - 1)) < 0.01, `${base} ${count}: ${gaps.join(" ")}`);
    }
    // the hue is held: at a meaningful chroma the hex holds it within a degree (an 8-bit colour under about 0.05 chroma
    // cannot: at 0.02 the hue of a hex is noise, so the maths holds the hue and the hex rounds it there)
    for (const h of hex) {
      const c = oklch(h);
      if (c.c >= 0.1)
        assert.ok(dh(c.h ?? 0, oklch(base).h ?? 0) < 1, `${base} ${count}: ${h} drifts in hue`);
    }
    assert.deepEqual(tones(base, count), t);
  }
assert.deepEqual(steps(tones("#2563eb", 1)), [steps(tones("#2563eb", 2))[0]]);

// a grey base gives a neutral scale
for (const h of steps(tones("#808080", 5))) assert.ok(oklch(h).c < 0.001, h);

// errors: a colour culori cannot read, a translucent one, a count, a ratio
assert.throws(() => fit("banana"), {
  message: '@cssints/gamut: the colour "banana" is not a colour',
});
assert.throws(() => fit("#0000"), { message: '@cssints/gamut: the colour "#0000" is translucent' });
assert.throws(() => readable("#0000"), {
  message: '@cssints/gamut: the background "#0000" is translucent',
});
assert.throws(() => readable("banana"), {
  message: '@cssints/gamut: the background "banana" is not a colour',
});
assert.throws(() => readable("#ffffff", { ratio: 0 }), /a ratio is from 1 to 21, got 0/);
assert.throws(() => readable("#808080", { ratio: 21 }), {
  message: "@cssints/gamut: ratio 21 is out of reach on #808080: at most 5.32 (black)",
});
assert.throws(() => readable("#ffffff", { ratio: 4.5, toward: "white" }), {
  message: "@cssints/gamut: ratio 4.5 is out of reach on #ffffff: at most 1.00 (white)",
});
assert.throws(() => tones("#2563eb", 0), /count is a whole number from 1, got 0/);
assert.throws(() => tones("#2563eb", 1.5), /count is a whole number from 1, got 1.5/);
assert.throws(() => tones("#0000", 3), {
  message: '@cssints/gamut: the colour "#0000" is translucent',
});
assert.throws(() => tones("banana", 3), {
  message: '@cssints/gamut: the colour "banana" is not a colour',
});

// through the engine: the tones are a DTCG colour group of createTokens, `readable` passes check.contrast, and the p3
// string of `fit` is a colour token
const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("warn"),
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
await client.transformRequest("/tokens.ts");
const css = plugins[0].api.sheet([`${root}/tokens.ts`]);
for (const rule of [
  '@property --ink{syntax:"<color>";inherits:true;initial-value:#767676}',
  '@property --blue-1{syntax:"<color>";inherits:true;initial-value:#e7effd}',
  '@property --blue-9{syntax:"<color>";inherits:true;initial-value:#000211}',
  '@property --vivid{syntax:"<color>";inherits:true;initial-value:#00be58}',
  "{color:var(--ink)}",
  "{background-color:var(--bg)}",
])
  assert.ok(css.includes(rule), `${rule}\n${css}`);
await server.close();

console.log("gamut: ok");
