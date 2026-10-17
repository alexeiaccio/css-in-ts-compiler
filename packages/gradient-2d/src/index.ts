// @cssints/gradient-2d: mesh-gradient() and freeform-gradient() as styles of scope("gradient2d"). A call sets custom
// properties on its class: the native function, the fallback image and the points (JSON). The kernel prints the
// background-image once: the fallback, then, under @supports, the native function. Where the browser has no native
// function the runtime (src/runtime.ts) draws the points on a canvas and sets the fallback to that drawing.
import { arg, scope } from "cssints/plugin";
import { formatHex, formatHex8, parse, rgb } from "culori";

import { fromSpace, mean, toOklab, type Quad, type Space } from "./grid.ts";

// Splits at the separators outside brackets, so `var(--a, red)` keeps its comma.
const cut = (text: string, sep: (ch: string) => boolean) => {
  const { out, cur } = [...text].reduce(
    (acc, ch) => {
      const depth = acc.depth + Number(ch === "(") - Number(ch === ")");
      return depth === 0 && sep(ch)
        ? { out: [...acc.out, acc.cur.trim()], cur: "", depth }
        : { out: acc.out, cur: acc.cur + ch, depth };
    },
    { out: [] as string[], cur: "", depth: 0 },
  );
  return [...out, cur.trim()];
};

/** A stop: its sRGB colour, or the text of a colour the browser resolves (a `var()`). */
type Stop = Quad | string;

const colour = (text: string, call: string) => {
  if (text.includes("var(")) return text;
  const c = parse(text);
  if (!c) throw new Error(`${call}(): ${JSON.stringify(text)} is not a colour`);
  const { r, g, b, alpha = 1 } = rgb(c);
  return [r, g, b, alpha] satisfies Quad;
};

// The spec's syntax, as far as the grid goes: `[in <space>] [<colour>]?` then the rows of stops (`;`), the stops of a
// row (`,`). A position, `by` and `with` are not supported yet: the grid is regular, so each stop sits at its corner or
// edge of the box.
const parseMesh = (text: string) => {
  const rows = cut(text, (c) => c === ";").map((row) => cut(row, (c) => c === ","));
  const head = /^in\s+(\S+)(?:\s+(.*))?$/i.exec(rows[0]?.[0] ?? "");
  const [, method = "oklab", outside = ""] = head ?? [];
  if (method !== "oklab" && method !== "srgb")
    throw new Error(`meshGradient(): in ${method} is not supported yet (oklab and srgb)`);
  if (outside) colour(outside, "meshGradient");
  const space: Space = method === "srgb" ? "srgb" : "oklab";
  const body = head ? [rows[0]!.slice(1), ...rows.slice(1)] : rows;
  const stops = body.map((row) =>
    row.map((p) => {
      const words = cut(p, (c) => /\s/.test(c));
      if (words.length > 1)
        throw new Error(
          `meshGradient(): ${JSON.stringify(p)}: a stop is one colour, its position, by and with are not supported yet`,
        );
      return colour(p, "meshGradient");
    }),
  );
  const lengths = stops.map((r) => r.length);
  if (lengths.some((n) => n !== lengths[0]))
    throw new Error(
      `meshGradient(): the rows have ${lengths.join(", ")} stops: every row needs the same number`,
    );
  if (stops.length < 2 || lengths[0]! < 2)
    throw new Error(
      `meshGradient(): a mesh needs at least 2 rows of 2 stops, not ${stops.length} of ${lengths[0] ?? 0}`,
    );
  return { space, rows: stops };
};

const clamp = (x: number) => Math.min(1, Math.max(0, x));

// A colour of the working space as a hex the CSS can hold, opaque or not.
const hex = ([r, g, b, a]: Quad) => {
  const c = { mode: "rgb" as const, r: clamp(r), g: clamp(g), b: clamp(b), alpha: clamp(a) };
  return c.alpha < 1 ? formatHex8(c) : formatHex(c);
};

// The average colour of the stops, in oklab, as a background that the first paint shows.
const average = (stops: Stop[]) => {
  const known = stops.filter((s): s is Quad => typeof s !== "string");
  if (known.length < stops.length) return "none";
  const h = hex(fromSpace("oklab", mean(known.map((q) => toOklab(q)))));
  return `linear-gradient(${h}, ${h})`;
};

// A freeform point: its colour (or the text of a colour the browser resolves), its position in the box and its spread.
type Point = { q: Quad | string; u: number; v: number; spread: number };

const KEYWORD = /^(left|right|top|bottom|center)$/;
const PERCENT = /^(-?\d*\.?\d+)%$/;
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/;
const LENGTH = /^[+-]?(\d+\.?\d*|\.\d+)[a-z]+$/;
const A_LINE_OR_SHAPE = /^(line|shape|curve)\b/;
const ONE: Record<string, [number, number]> = {
  left: [0, 0.5],
  right: [1, 0.5],
  top: [0.5, 0],
  bottom: [0.5, 1],
  center: [0.5, 0.5],
};

const CALL = "freeformGradient";

// A `<position>` as `background-position` reads it, to (x, y) in 0..1: one or two keywords and percentages. An edge
// keyword with a percentage measures it from that edge (`right 30%` is 70%); `center` names its own axis.
const position = (words: string[]): [number, number] => {
  const pct = (w: string) => Number(PERCENT.exec(w)![1]) / 100;
  const axis = (w: string) =>
    w === "left" || w === "right" ? "x" : w === "top" || w === "bottom" ? "y" : "c";
  const edge = (w: string) => (w === "left" || w === "top" ? 0 : 1);
  const [a, b] = words;
  if (b === undefined) {
    if (!KEYWORD.test(a!)) return [pct(a!), 0.5];
    return ONE[a!]!;
  }
  const ka = KEYWORD.test(a!);
  const kb = KEYWORD.test(b);
  if (!ka && !kb) return [pct(a!), pct(b)];
  if (ka && kb) {
    const x = [a!, b].find((w) => axis(w) === "x");
    const y = [a!, b].find((w) => axis(w) === "y");
    return [x ? edge(x) : 0.5, y ? edge(y) : 0.5];
  }
  if (ka) {
    if (axis(a!) === "y") return [0.5, a === "top" ? pct(b) : 1 - pct(b)];
    if (axis(a!) === "x") return [a === "left" ? pct(b) : 1 - pct(b), 0.5];
    return [0.5, pct(b)];
  }
  return axis(b) === "y" ? [pct(a!), edge(b)] : [pct(a!), 0.5];
};

// `freeform-gradient( [<color-interpolation-method>? ,] <freeform-point># )`, points only: `<color> <number>? <position>`
// (the colour, the spread, the position). No lines, no shapes: the spec has none yet (its "future improvements").
const point = (text: string): Point => {
  const words = cut(text, (c) => /\s/.test(c));
  const c = words[0] ?? "";
  let rest = words.slice(1);
  const wants = () =>
    new Error(
      `${CALL}(): ${JSON.stringify(text)}: a point needs a position, \`<color> <number>? <position>\``,
    );
  if (rest.length === 0) throw wants();
  let spread = 1;
  if (NUMBER.test(rest[0]!)) {
    spread = Number(rest[0]);
    rest = rest.slice(1);
    if (rest.length === 0) throw wants();
  }
  const part = rest.find((w) => A_LINE_OR_SHAPE.test(w));
  if (part)
    throw new Error(`${CALL}(): ${JSON.stringify(part)}: a line or a shape is not supported yet`);
  const len = rest.find((w) => LENGTH.test(w));
  if (len)
    throw new Error(
      `${CALL}(): ${JSON.stringify(len)} is a length: a position is a percentage or a keyword`,
    );
  if (rest.length > 2) {
    const bad = rest.find((w) => !KEYWORD.test(w) && !PERCENT.test(w));
    throw new Error(
      bad
        ? `${CALL}(): ${JSON.stringify(bad)} is not a position: a keyword (top, left, ...) or a percentage`
        : `${CALL}(): ${JSON.stringify(text)}: a line (a point with more than one position) is not supported yet`,
    );
  }
  const [u, v] = position(rest);
  return { q: colour(c, CALL), u, v, spread };
};

const parseFreeform = (text: string) => {
  const items = cut(text, (c) => c === ",");
  const head = /^in\s+(\S+)(?:\s+(.*))?$/i.exec(items[0] ?? "");
  const [, method = "oklab", extra = ""] = head ?? [];
  if (method !== "oklab" && method !== "srgb")
    throw new Error(`${CALL}(): in ${method} is not supported yet (oklab and srgb)`);
  if (extra)
    throw new Error(
      `${CALL}(): ${JSON.stringify(items[0])}: the interpolation method takes no colour (freeform-gradient() has none)`,
    );
  const space: Space = method === "srgb" ? "srgb" : "oklab";
  const body = head ? items.slice(1) : items;
  if (body.length < 2)
    throw new Error(`${CALL}(): a gradient needs at least 2 points, not ${body.length}`);
  const points = body.map(point);
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      if (points[i]!.u === points[j]!.u && points[i]!.v === points[j]!.v)
        throw new Error(
          `${CALL}(): ${JSON.stringify(body[i])} and ${JSON.stringify(body[j])} are the same position: every point needs its own`,
        );
  return { space, points };
};

const pct = (x: number) => `${Math.round(x * 1e6) / 1e4}%`;

// The first paint without JS (docs/research/2d-gradients.md, strategy 5): one radial layer per point, its colour at the
// centre fading to transparent at the farthest corner. An approximation: the layers blend by alpha in the browser's
// space, not by `spread / d²` in oklab, and the spread is not in it. It holds a `var()` stop, which the mesh's average
// colour cannot.
const radials = (points: Point[]) =>
  points
    .map((p) => {
      const c = typeof p.q === "string" ? p.q : hex(p.q);
      return `radial-gradient(circle at ${pct(p.u)} ${pct(p.v)}, ${c}, transparent)`;
    })
    .join(", ");

const mesh = scope("gradient2d", {
  // the kernel: the fallback, then the native function where @supports has it (it is checked there, not in the value)
  "#core": {
    css: "&{background-image:var(--_fallback);background-repeat:no-repeat;background-size:100% 100%}@supports (background-image:mesh-gradient(red,blue;green,yellow)){&{background-image:var(--_native)}}",
  },
  // the runtime that draws the mesh where the function is missing: no browser has it yet, so every target lacks it
  "#script": {
    polyfills: ["css.types.gradient.mesh-gradient"],
    script: "@cssints/gradient-2d/runtime",
  },
  // freeform's own kernel and runtime: a browser with mesh-gradient() and no freeform-gradient() must not take the
  // branch above, so the marker and the custom properties are freeform's own
  "#ff": {
    css: "&{background-image:var(--_ff-fallback);background-repeat:no-repeat;background-size:100% 100%}@supports (background-image:freeform-gradient(red top left, blue bottom right)){&{background-image:var(--_ff-native)}}",
  },
  "#ffScript": {
    polyfills: ["css.types.gradient.freeform-gradient"],
    script: "@cssints/gradient-2d/runtime",
  },
  meshGradient: { args: arg<string>(), uses: ["core", "script"] },
  freeformGradient: { args: arg<string>(), uses: ["ff", "ffScript"] },
}).build({
  meshGradient: (text) => {
    const { space, rows } = parseMesh(text);
    const data = {
      space,
      rows: rows.map((row) =>
        row.map((s) => (typeof s === "string" ? s : s.map((n) => Math.round(n * 1e4) / 1e4))),
      ),
    };
    return {
      decls: [
        ["--_native", `mesh-gradient(${text})`],
        ["--_fallback", average(rows.flat())],
        ["--_data", JSON.stringify(JSON.stringify(data))],
      ],
    };
  },
  freeformGradient: (text) => {
    const { space, points } = parseFreeform(text);
    const data = {
      space,
      points: points.map((p) => [
        Math.round(p.u * 1e4) / 1e4,
        Math.round(p.v * 1e4) / 1e4,
        p.spread,
        typeof p.q === "string" ? p.q : p.q.map((n) => Math.round(n * 1e4) / 1e4),
      ]),
    };
    return {
      decls: [
        ["--_ff-native", `freeform-gradient(${text})`],
        ["--_ff-fallback", radials(points)],
        ["--_ff-data", JSON.stringify(JSON.stringify(data))],
      ],
    };
  },
});

type Members = ReturnType<typeof mesh.export>;
const members: Members = mesh.export();
/**
 * `meshGradient("red, blue; green, yellow")`: a mesh gradient of a grid of colour stops (rows `;`, stops `,`), with the
 * spec's `in oklab` first if wanted. The native `mesh-gradient()` where the browser has it, else drawn by the runtime.
 * A build error for ragged rows, fewer than 2 by 2, a colour it cannot read, and a position, `by` or `with`.
 */
export const meshGradient: Members["meshGradient"] = members.meshGradient;
/**
 * `freeformGradient("red top left, gold 4 60% 40%, yellow bottom right")`: a freeform (diffusion) gradient of points,
 * each `<color> <number>? <position>` (the number is the spread), with the spec's `in oklab` first if wanted. The native
 * `freeform-gradient()` where the browser has it; where it does not, a stack of radial gradients paints the first one
 * and the runtime redraws it. A build error for a point without a position, two points at one position, fewer than 2
 * points, a colour it cannot read, a length, a line and a shape.
 */
export const freeformGradient: Members["freeformGradient"] = members.freeformGradient;
