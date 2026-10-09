// @cssints/fonts: a web font as a style (cssints/plugin `scope()`). `font()` reads the font files while the module runs,
// takes their metrics with fontkitten, and gives two members: `family()` (the @font-face rules as globals, a fallback face
// whose metrics match the font's, and `font-family`) and `trim()` (native `text-box` trimming, or capsize's negative
// margins from the same metrics where a target lacks it). Build time only; no runtime.
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";

import { create } from "fontkitten";
import { dependsOn, scope } from "cssints/plugin";

/** What the fallback face and `trim()` are computed from, in font units (capsize's names). */
export interface Metrics {
  ascent: number;
  descent: number;
  lineGap: number;
  unitsPerEm: number;
  capHeight: number;
  /** The advance width of the latin letters, weighted by their frequency in English text (capsize's `xWidthAvg`). */
  xWidthAvg: number;
}
/** A generic family: its local fonts (metric-compatible clones of one font) stand in until the web font loads. */
export type Fallback = "sans-serif" | "serif" | "monospace";
/**
 * Where the files come from: the `@fontsource/<family>` package installed in the project (its `files/*.woff2`, every
 * subset with its `unicode-range`), or font files (paths relative to the working directory; weight and style are read
 * from each file).
 */
export type Options = { fallback?: Fallback } & (
  | { provider: "fontsource"; weights?: number[]; styles?: ("normal" | "italic")[] }
  | { provider: "fs"; files: string[] }
);

interface Face {
  file: string;
  weight: number;
  style: string;
  unicodeRange?: string;
}

// The metrics of Arial, Times New Roman and Courier New (@capsizecss/metrics); Arimo, Tinos, Cousine and the Liberation
// fonts are metric-compatible with them.
const FALLBACKS: Record<Fallback, { locals: string[]; metrics: Metrics }> = {
  "sans-serif": {
    locals: ["Arial", "Arimo", "Liberation Sans"],
    metrics: {
      ascent: 1854,
      descent: -434,
      lineGap: 67,
      unitsPerEm: 2048,
      capHeight: 1467,
      xWidthAvg: 913,
    },
  },
  serif: {
    locals: ["Times New Roman", "Tinos", "Liberation Serif"],
    metrics: {
      ascent: 1825,
      descent: -443,
      lineGap: 87,
      unitsPerEm: 2048,
      capHeight: 1356,
      xWidthAvg: 832,
    },
  },
  monospace: {
    locals: ["Courier New", "Cousine", "Liberation Mono"],
    metrics: {
      ascent: 1705,
      descent: -615,
      lineGap: 0,
      unitsPerEm: 2048,
      capHeight: 1170,
      xWidthAvg: 1229,
    },
  },
};

// capsize's latin weighting (@capsizecss/unpack): each character of SAMPLE and its frequency.
const SAMPLE = "0123456789, theofPpl'sRubicCnadywBrzGjT.Lkm]JFvgAN-HDMIE\"S()xWQYqVáKU=[Oé$:|/%Z;X";
const WEIGHTS = [
  0.0053, 0.0023, 0.0026, 0.001, 0.0008, 0.0015, 0.0007, 0.0005, 0.0007, 0.0006, 0.0083, 0.154,
  0.0672, 0.0351, 0.0922, 0.0571, 0.017, 0.0023, 0.0163, 0.0304, 0.0014, 0.0469, 0.0015, 0.0207,
  0.0114, 0.0588, 0.0232, 0.0031, 0.0578, 0.0668, 0.0298, 0.0123, 0.011, 0.002, 0.0526, 0.0011,
  0.0011, 0.0009, 0.0041, 0.0079, 0.0012, 0.0046, 0.0181, 0.0007, 0.0009, 0.0015, 0.0076, 0.0155,
  0.004, 0.0014, 0.0018, 0.0013, 0.0013, 0.0025, 0.0022, 0.0011, 0.0012, 0.0041, 0.001, 0.001,
  0.0025, 0.0012, 0.0001, 0.0003, 0.0008, 0.0005, 0.0001, 0.0007, 0.0016, 0.0007, 0.0021, 0.0009,
  0.0001, 0.0002, 0.0008, 0.0038, 0.0001, 0.0001, 0.0002, 0.0001, 0.0001,
];

const FORMATS = new Map([
  [".woff2", "woff2"],
  [".woff", "woff"],
  [".ttf", "truetype"],
  [".otf", "opentype"],
]);

const fail = (message: string, cause?: unknown) => {
  throw new Error(`cssints: fonts: ${message}`, { cause });
};
// What `f` gives, or the error `message` with what it threw as the cause.
const attempt = <T>(f: () => T, message: string) => {
  try {
    return f();
  } catch (e) {
    return fail(message, e);
  }
};

// The engine evaluates this module again for every module that imports the one that calls font(): a file is parsed once
// per version, kept on globalThis, which the engine's runner shares.
const g = globalThis as typeof globalThis & {
  __cssintsFonts?: Map<string, { mtime: number; read: Read }>;
};
interface Read {
  metrics: Metrics;
  weight: number;
  style: string;
}

const read = (file: string) => {
  const mtime = attempt(() => statSync(file).mtimeMs, `cannot read ${file}`);
  const cache = (g.__cssintsFonts ??= new Map<string, { mtime: number; read: Read }>());
  const hit = cache.get(file);
  if (hit?.mtime === mtime) return hit.read;
  const font = create(readFileSync(file));
  if (font.isCollection) return fail(`${file} is a font collection: give one font file`);
  const xWidthAvg = Math.round(
    font
      .glyphsForString(SAMPLE)
      .reduce((sum, glyph, i) => (glyph.isMark ? sum : sum + glyph.advanceWidth * WEIGHTS[i]!), 0),
  );
  const { ascent, descent, lineGap, unitsPerEm, capHeight } = font;
  const out: Read = {
    metrics: { ascent, descent, lineGap, unitsPerEm, capHeight, xWidthAvg },
    weight: font["OS/2"].usWeightClass,
    style: font["OS/2"].fsSelection.italic || font.italicAngle !== 0 ? "italic" : "normal",
  };
  cache.set(file, { mtime, read: out });
  return out;
};

interface Source {
  faces: Face[];
  /** The face the metrics come from: 400 normal, else the first. */
  metrics: Metrics;
  category: Fallback;
}

const fontsource = (
  family: string,
  weights: number[] | undefined,
  styles: string[] = ["normal"],
) => {
  const pkg = `@fontsource/${family.toLowerCase().replace(/\s+/g, "-")}`;
  const dir = attempt(
    () => dirname(createRequire(join(process.cwd(), "_")).resolve(pkg)),
    `cannot read ${pkg} from ${process.cwd()}: install ${pkg}`,
  );
  const meta = JSON.parse(readFileSync(join(dir, "metadata.json"), "utf8")) as {
    id: string;
    weights: number[];
    styles: string[];
    subsets: string[];
    defSubset: string;
    category: string;
  };
  const ranges = JSON.parse(readFileSync(join(dir, "unicode.json"), "utf8")) as Record<
    string,
    string
  >;
  const ws = weights ?? [meta.weights.includes(400) ? 400 : meta.weights[0]!];
  for (const w of ws)
    if (!meta.weights.includes(w))
      fail(`${pkg} has no weight ${w} (it has ${meta.weights.join(", ")})`);
  for (const s of styles)
    if (!meta.styles.includes(s))
      fail(`${pkg} has no style ${s} (it has ${meta.styles.join(", ")})`);
  const file = (subset: string, w: number, s: string) =>
    join(dir, "files", `${meta.id}-${subset.replace(/^\[(\d+)\]$/, "$1")}-${w}-${s}.woff2`);
  const faces = ws.flatMap((weight) =>
    styles.flatMap((style) =>
      Object.entries(ranges).map(([subset, unicodeRange]) => ({
        file: file(subset, weight, style),
        weight,
        style,
        unicodeRange,
      })),
    ),
  );
  const main = file(meta.defSubset, ws.includes(400) ? 400 : ws[0]!, styles[0]!);
  return {
    faces,
    metrics: read(main).metrics,
    category:
      meta.category === "serif" || meta.category === "monospace" ? meta.category : "sans-serif",
  } satisfies Source;
};

const files = (list: string[]) => {
  if (!list.length) fail("fs takes at least one file");
  const faces = list.map((f) => {
    const file = resolve(f);
    if (!FORMATS.has(extname(file))) fail(`${f}: not a .woff2, .woff, .ttf or .otf file`);
    dependsOn(file);
    const { weight, style } = read(file);
    return { file, weight, style };
  });
  const main = faces.find((f) => f.weight === 400 && f.style === "normal") ?? faces[0]!;
  return { faces, metrics: read(main.file).metrics, category: "sans-serif" } satisfies Source;
};

const quote = (s: string) => `"${s.replace(/["\\]/g, "\\$&")}"`;
// capsize's rounding: 4 digits, about a layout unit (1/60 to 1/64 px).
const round = (n: number) => Number.parseFloat(n.toFixed(4));
const percent = (n: number) => `${round(n * 100)}%`;

const faceRule = (family: string, f: Face) =>
  `@font-face{font-family:${quote(family)};font-style:${f.style};font-weight:${f.weight};font-display:swap;` +
  `src:url(${quote(f.file)}) format(${quote(FORMATS.get(extname(f.file))!)})` +
  `${f.unicodeRange ? `;unicode-range:${f.unicodeRange}` : ""}}`;

// fontaine's fallback face: the local font scaled to the web font's average width, its vertical metrics overridden to
// the web font's.
const fallbackFace = (name: string, metrics: Metrics, fallback: Fallback) => {
  const { locals, metrics: local } = FALLBACKS[fallback];
  const sizeAdjust = metrics.xWidthAvg / metrics.unitsPerEm / (local.xWidthAvg / local.unitsPerEm);
  const em = metrics.unitsPerEm * sizeAdjust;
  return (
    `@font-face{font-family:${quote(name)};src:${locals.map((l) => `local(${quote(l)})`).join(",")};` +
    `size-adjust:${percent(sizeAdjust)};ascent-override:${percent(metrics.ascent / em)};` +
    `descent-override:${percent(Math.abs(metrics.descent) / em)};line-gap-override:${percent(metrics.lineGap / em)}}`
  );
};

// capsize's trims, in em: negative margins that remove the space above the cap height and below the baseline.
const trims = (m: Metrics, lineHeight?: number) => {
  const scale = (n: number) => n / m.unitsPerEm;
  // with a line height, the half-leading it adds or removes against `normal`
  const offset = lineHeight
    ? (scale(m.ascent + m.lineGap + Math.abs(m.descent)) - lineHeight) / 2
    : 0;
  const top = scale(m.ascent) - scale(m.capHeight) + scale(m.lineGap) / 2 - offset;
  const bottom = scale(Math.abs(m.descent)) + scale(m.lineGap) / 2 - offset;
  return { top: `${round(-top)}em`, bottom: `${round(-bottom)}em` };
};

// One scope, "fonts", whatever the font: the table and the code are the same, the font is the closure of `build`.
// `trim` is native where the targets have `text-box`; the capsize margins are a runtime's fallback CSS, added to the
// sheet only when a target lacks it, and kept from browsers that have it by `@supports not`.
const NATIVE = "text-box:trim-both cap alphabetic";
const fonts = (family: string, fallback: string, source: Source, globals: { css: string }[]) =>
  scope("fonts", {
    "#native": { css: `&{${NATIVE}}`, requires: ["css.properties.text-box"] },
    "#capsize": {
      polyfills: ["css.properties.text-box"],
      css:
        `@supports not (${NATIVE}){&::before,&::after{content:"";display:table}` +
        `&::before{margin-bottom:var(--_t)}&::after{margin-top:var(--_b)}}`,
    },
    family: { args: [] },
    trim: { args: [{ "lineHeight?": "<number [0,∞]>" }], uses: ["native", "capsize"] },
  })
    .build({
      family: () => ({
        decls: [["font-family", `${quote(family)}, ${quote(`${family} Fallback`)}, ${fallback}`]],
        globals,
      }),
      trim: (o) => {
        const { top, bottom } = trims(
          source.metrics,
          o.lineHeight ? Number(o.lineHeight) : undefined,
        );
        return {
          decls: [
            ["line-height", o.lineHeight ?? "normal"],
            ["--_t", top],
            ["--_b", bottom],
          ],
        };
      },
    })
    .export();

/**
 * What `font()` gives: call its members where the style is used. `family()` is `font-family` with the fallback face and
 * carries the @font-face rules; `trim({ lineHeight? })` trims the space above the cap height and below the baseline.
 */
export type Font = ReturnType<typeof fonts>;

/**
 * A web font from the `@fontsource/<family>` package installed in the project (`provider: "fontsource"`, `weights`
 * and `styles` among those it has, 400 normal by default), or from font files (`provider: "fs"`, paths relative to the
 * working directory). The files are read when the module runs. Call `font()` in a module of its own, imported with the
 * attribute, and its members where the style is used.
 *
 * @param {string} family the CSS family name (for fontsource, also the package: "Atkinson Hyperlegible" is `@fontsource/atkinson-hyperlegible`)
 * @param {Options} options where the files come from, and the generic family of the fallback face (by default the font's category)
 * @returns {Font} the members `family()` and `trim()`
 */
export const font = (family: string, options: Options) => {
  const source =
    options.provider === "fs"
      ? files(options.files)
      : fontsource(family, options.weights, options.styles);
  const fallback = options.fallback ?? source.category;
  return fonts(family, fallback, source, [
    ...source.faces.map((f) => ({ css: faceRule(family, f) })),
    { css: fallbackFace(`${family} Fallback`, source.metrics, fallback) },
  ]);
};
