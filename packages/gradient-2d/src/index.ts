// @cssints/gradient-2d: mesh-gradient() as a style of scope("gradient2d"). The call sets three custom properties on its
// class: the native function, the fallback image and the points (JSON). The kernel prints the background-image once: the
// fallback, then, under @supports, the native function. Where the browser has no mesh-gradient() the runtime
// (src/runtime.ts) draws the mesh on a canvas and sets the fallback to that drawing; until then, and without JS, the
// fallback is the average colour of the stops (oklab), or none when a stop is a colour the browser resolves (`var()`).
import { arg, scope } from "cssints/plugin";
import { formatHex, formatHex8, parse, rgb } from "culori";

import { fromSpace, mean, toOklab, type Quad, type Space } from "./grid.ts";

// Splits at the separators outside brackets, so `var(--a, red)` keeps its comma.
const cut = (text: string, sep: (ch: string) => boolean): string[] => {
  const out: string[] = [];
  let cur = "";
  let depth = 0;
  for (const ch of text) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0 && sep(ch)) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
};

/** A stop: its sRGB colour, or the text of a colour the browser resolves (a `var()`). */
type Stop = Quad | string;

const colour = (text: string): Stop => {
  if (text.includes("var(")) return text;
  const c = parse(text);
  if (!c) throw new Error(`meshGradient(): ${JSON.stringify(text)} is not a colour`);
  const { r, g, b, alpha = 1 } = rgb(c);
  return [r, g, b, alpha];
};

// The spec's syntax, as far as the grid goes: `[in <space>] [<colour>]?` then the rows of stops (`;`), the stops of a
// row (`,`). A position, `by` and `with` are not supported yet: the grid is regular, so each stop sits at its corner or
// edge of the box.
const parseMesh = (text: string): { space: Space; rows: Stop[][] } => {
  const rows = cut(text, (c) => c === ";").map((row) => cut(row, (c) => c === ","));
  let space: Space = "oklab";
  const [, method = "", outside = ""] = /^in\s+(\S+)(?:\s+(.*))?$/i.exec(rows[0]?.[0] ?? "") ?? [];
  if (method) {
    if (method !== "oklab" && method !== "srgb")
      throw new Error(`meshGradient(): in ${method} is not supported yet (oklab and srgb)`);
    space = method;
    if (outside) colour(outside);
    rows[0]!.shift();
  }
  const stops = rows.map((row) =>
    row.map((p) => {
      const words = cut(p, (c) => /\s/.test(c));
      if (words.length > 1)
        throw new Error(
          `meshGradient(): ${JSON.stringify(p)}: a stop is one colour, its position, by and with are not supported yet`,
        );
      return colour(p);
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

// The average colour of the stops, in oklab, as a background that the first paint shows.
const fallback = (stops: Stop[]): string => {
  const known = stops.filter((s): s is Quad => typeof s !== "string");
  if (known.length < stops.length) return "none";
  const [r, g, b, a] = fromSpace("oklab", mean(known.map((q) => toOklab(q))));
  const c = { mode: "rgb" as const, r: clamp(r), g: clamp(g), b: clamp(b), alpha: clamp(a) };
  const hex = c.alpha < 1 ? formatHex8(c) : formatHex(c);
  return `linear-gradient(${hex}, ${hex})`;
};

const mesh = scope("gradient2d", {
  // the kernel: the fallback, then the native function where @supports has it (it is checked there, not in the value)
  "#core": {
    css: "&{background-image:var(--gradient2d-fallback);background-repeat:no-repeat;background-size:100% 100%}@supports (background-image:mesh-gradient(red,blue;green,yellow)){&{background-image:var(--gradient2d-native)}}",
  },
  // the runtime that draws the mesh where the function is missing: no browser has it yet, so every target lacks it
  "#script": {
    polyfills: ["css.types.gradient.mesh-gradient"],
    script: "@cssints/gradient-2d/runtime",
  },
  meshGradient: { args: arg<string>(), uses: ["core", "script"] },
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
        ["--_fallback", fallback(rows.flat())],
        ["--_data", JSON.stringify(JSON.stringify(data))],
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
