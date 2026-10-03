/// <reference lib="dom" />
// The browser half of the derived tokens (cssints-i9xo): where a target cannot parse `oklch(0.6 0.2 var(--hue))` or a
// relative colour, the sheet holds the default theme as literals, and this module computes the live values. The build
// leaves the templates of the tokens the app uses in the sheet, as one custom property on :root (`KEY`: JSON in a
// string: the templates, and per theme the ones it sets). Here: read it, work out which theme applies to <html>,
// evaluate the templates over the inputs' computed values, and write the results as inline custom properties on
// <html>; again when <html> changes (class, style) or a theme's media query does. A browser that parses every probe
// literal of the data gets nothing from us. Imported only through `virtual:cssints/runtime/derived`, and by the build,
// which asks `evaluate` whether a template is one it can stand in for. No imports, no Effect.
//
// The colours: hex, rgb()/rgba(), oklch(), oklab(), lab(), color(srgb | srgb-linear), color-mix() in srgb, srgb-linear,
// oklab or lab, the named black, white and transparent; relative colour (`from`) with the channel keywords, numbers,
// percentages and `deg`, + - * /, parentheses, calc(), clamp(), min(), max() and var(). A colour outside sRGB is clipped
// to it, the result is `rgb()`.
type Space = "srgb" | "srgb-linear" | "oklab" | "oklch" | "lab";
export interface Color {
  s: Space;
  c: number[];
  a: number;
}

/** The custom property of :root that carries the data (derived-data.ts writes it). */
export const KEY = "--_derived";

const mul = (m: readonly number[], v: number[]) =>
  [0, 3, 6].map((r) => v.reduce((s, x, k) => s + m[r + k]! * x, 0));
const lin = (c: number) => {
  const a = Math.abs(c);
  return (a <= 0.04045 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4) * Math.sign(c);
};
const gam = (c: number) => {
  const a = Math.abs(c);
  return (a <= 0.0031308 ? a * 12.92 : 1.055 * a ** (1 / 2.4) - 0.055) * Math.sign(c);
};
const rad = Math.PI / 180;
const rect = ([l, c, h]: number[]) => [l!, c! * Math.cos(h! * rad), c! * Math.sin(h! * rad)];
const polar = ([l, a, b]: number[]) => {
  const h = Math.atan2(b!, a!) / rad;
  return [l!, Math.hypot(a!, b!), h < 0 ? h + 360 : h];
};
// OKLab (Ottosson) and CIE Lab (D50, Bradford) to and from linear sRGB, which is the hub
const LMS = [
  0.4122214708, 0.5363325363, 0.0514459929, 0.2119034982, 0.6806995451, 0.1073969566, 0.0883024619,
  0.2817188376, 0.6299787005,
];
const OK = [
  0.2104542553, 0.793617785, -0.0040720468, 1.9779984951, -2.428592205, 0.4505937099, 0.0259040371,
  0.7827717662, -0.808675766,
];
const LMS_I = [
  4.0767416621, -3.3077115913, 0.2309699292, -1.2684380046, 2.6097574011, -0.3413193965,
  -0.0041960863, -0.7034186147, 1.707614701,
];
const OK_I = [
  1, 0.3963377774, 0.2158037573, 1, -0.1055613458, -0.0638541728, 1, -0.0894841775, -1.291485548,
];
const XYZ = [
  0.436065743, 0.385151469, 0.143078454, 0.222493192, 0.716887054, 0.0606197905, 0.0139239045,
  0.0970812857, 0.714099358,
];
const XYZ_I = [
  3.13413576, -1.61738568, -0.49066242, -0.978795456, 1.91625419, 0.0334429841, 0.071955413,
  -0.228976675, 1.40538601,
];
const D50 = [0.9642956764295677, 1, 0.8251046025104602];
const E = 216 / 24389;
const K = 24389 / 27;
const to: Record<Space, (c: number[]) => number[]> = {
  "srgb-linear": (c) => c,
  srgb: (c) => c.map(lin),
  oklab: (c) =>
    mul(
      LMS_I,
      mul(OK_I, c).map((v) => v ** 3),
    ),
  oklch: (c) => to.oklab(rect(c)),
  lab: ([l, a, b]) => {
    const y = (l! + 16) / 116;
    const f = [a! / 500 + y, y, y - b! / 200];
    return mul(
      XYZ_I,
      f.map((v, i) => D50[i]! * (v ** 3 > E ? v ** 3 : (116 * v - 16) / K)),
    );
  },
};
const from: Record<Space, (c: number[]) => number[]> = {
  "srgb-linear": (c) => c,
  srgb: (c) => c.map(gam),
  oklab: (c) => mul(OK, mul(LMS, c).map(Math.cbrt)),
  oklch: (c) => polar(from.oklab(c)),
  lab: (c) => {
    const f = mul(XYZ, c).map((v, i) => {
      const x = v / D50[i]!;
      return x > E ? Math.cbrt(x) : (K * x + 16) / 116;
    });
    return [116 * f[1]! - 16, 500 * (f[0]! - f[1]!), 200 * (f[1]! - f[2]!)];
  },
};
const conv = (c: Color, s: Space): Color =>
  c.s === s ? c : { s, c: from[s](to[c.s](c.c)), a: c.a };

// per colour space: the channel keywords of a relative colour, and what 100% is in each channel
const SPEC: Record<Space, [names: string, base: number[]]> = {
  srgb: ["rgb", [1, 1, 1]],
  "srgb-linear": ["rgb", [1, 1, 1]],
  oklab: ["lab", [1, 0.4, 0.4]],
  oklch: ["lch", [1, 0.4, 360]],
  lab: ["lab", [100, 125, 125]],
};
const NAMED: Record<string, string> = { black: "#000", white: "#fff", transparent: "#0000" };
const TOKEN = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:%|deg)?|#\w+|(?:--|-?)[a-z_][\w-]*|[^\s]/gi;

const fail = (x?: string): never => {
  throw new Error(x);
};

const hex = (x: string): Color => {
  const h = x.slice(1);
  if (![3, 4, 6, 8].includes(h.length) || /[^\da-f]/i.test(h)) return fail(x);
  const n = h.length < 5 ? h.replace(/./g, "$&$&") : h;
  const byte = (i: number) => parseInt(n.slice(i, i + 2), 16) / 255;
  return { s: "srgb", c: [byte(0), byte(2), byte(4)], a: n.length > 6 ? byte(6) : 1 };
};

// The colour a template (`oklch(0.6 0.2 var(--hue))`) is worth, with `get` giving each `var()` (the text of a number or a
// colour, or a Color). Throws, naming the token it stopped at, for anything outside the subset above.
export const evaluate = (
  text: string,
  get: (name: string) => string | Color = (n) => fail(n),
): Color => {
  const t = text.match(TOKEN) ?? [];
  let i = 0;
  let pct = 1; // what 100% is in the channel being read
  let env: Record<string, number> = {};
  const next = () => t[i++] ?? fail(t[i - 2]);
  const want = (s: string) => {
    if (next() !== s) fail(t[i - 1]);
  };
  const input = (): string | Color => {
    want("(");
    const v = get(next());
    want(")");
    return v;
  };
  const list = () => {
    want("(");
    const out = [sum()];
    while (t[i] === ",") {
      i++;
      out.push(sum());
    }
    want(")");
    return out;
  };
  const atom = (): number => {
    const x = next();
    if (/^[+-]?[\d.]/.test(x)) return parseFloat(x) * (x.endsWith("%") ? pct / 100 : 1);
    if (x === "(") {
      const v = sum();
      want(")");
      return v;
    }
    if (x === "calc") return atom();
    if (x === "-") return -atom();
    if (x === "clamp") {
      const [lo, v, hi] = list();
      return Math.max(lo!, Math.min(v!, hi!));
    }
    if (x === "min") return Math.min(...list());
    if (x === "max") return Math.max(...list());
    if (x === "var") {
      const v = input();
      return typeof v === "string" && v ? Number(v) : fail(x);
    }
    if (x === "none") return 0;
    return Object.hasOwn(env, x) ? env[x]! : fail(x);
  };
  const prod = (): number => {
    let v = atom();
    for (let o = t[i]; o === "*" || o === "/"; o = t[i]) {
      i++;
      v = o === "*" ? v * atom() : v / atom();
    }
    return v;
  };
  const sum = (): number => {
    let v = prod();
    for (let o = t[i]; o === "+" || o === "-"; o = t[i]) {
      i++;
      v += o === "+" ? prod() : -prod();
    }
    return v;
  };
  const fn = (f: string): Color => {
    want("(");
    const origin = t[i] === "from" ? (i++, col()) : undefined;
    const space = (f === "color" ? next() : f === "rgb" || f === "rgba" ? "srgb" : f) as Space;
    if (!Object.hasOwn(SPEC, space)) return fail(f === "color" ? space : f);
    const [names, base] = SPEC[space];
    const k = f[0] === "r" ? 255 : 1; // rgb() has channels of 0 to 255
    const src = origin && conv(origin, space);
    env = src
      ? { alpha: src.a, ...Object.fromEntries([...names].map((n, j) => [n, src.c[j]! * k])) }
      : {};
    const c = base.map((b, j) => {
      if (j && t[i] === ",") i++;
      pct = b * k;
      return atom() / k;
    });
    let a = 1;
    if (t[i] === "/" || t[i] === ",") {
      i++;
      pct = 1;
      a = Math.min(1, Math.max(0, atom()));
    }
    want(")");
    return { s: space, c, a };
  };
  const mix = (): Color => {
    want("(");
    want("in");
    const s = next() as Space;
    if (s === "oklch" || !Object.hasOwn(SPEC, s)) return fail(s);
    want(",");
    const one = (): [Color, number | undefined] => {
      const c = conv(col(), s);
      return [c, t[i]?.endsWith("%") ? parseFloat(next()) : undefined];
    };
    const [a, p] = one();
    want(",");
    const [b, q] = one();
    want(")");
    const x = p ?? 100 - (q ?? 50);
    const y = q ?? 100 - x;
    if (x + y !== 100) return fail("color-mix");
    const al = (a.a * x + b.a * y) / 100;
    return {
      s,
      c: a.c.map((v, j) => (al ? (v * a.a * x + b.c[j]! * b.a * y) / 100 / al : 0)),
      a: al,
    };
  };
  const col = (): Color => {
    const x = next();
    if (x.startsWith("#")) return hex(x);
    if (NAMED[x]) return hex(NAMED[x]);
    if (x === "var") {
      const v = input();
      return typeof v === "string" ? evaluate(v, get) : v;
    }
    return x === "color-mix" ? mix() : fn(x);
  };
  const out = col();
  if (i < t.length) fail(t[i]);
  return out;
};

// A colour as CSS `rgb()`, clipped to sRGB: an inline custom property of <html> takes it.
export const css = (c: Color): string => {
  const [r, g, b] = conv(c, "srgb").c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255));
  return `rgb(${r} ${g} ${b}${c.a < 1 ? ` / ${+c.a.toFixed(3)}` : ""})`;
};

/** What the build leaves in the sheet: `p` probe literals, `b` the templates of the default theme, `t` each theme's. */
interface Data {
  p: string[];
  b: Record<string, string>;
  t: [condition: string, templates: Record<string, string | 0>][];
}

// Starts the runtime: it does nothing without a document, and nothing in a browser that parses every probe literal.
export default (): void => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const written = new Map<string, string>();
  let observer: MutationObserver;
  let raw = "";
  let data: Data;
  let names: string[];

  // the data again when the sheet changed under us (a dev reload)
  const read = () => {
    const v = cs.getPropertyValue(KEY).trim();
    if (!v || v === raw) return !!v;
    raw = v;
    data = JSON.parse(v.slice(1, -1).replace(/\\(.)/g, "$1")) as Data;
    names = [...new Set([...Object.keys(data.b), ...data.t.flatMap(([, x]) => Object.keys(x))])];
    return true;
  };

  const update = () => {
    read();
    const tpl = new Map(Object.entries(data.b));
    for (const [cond, v] of data.t)
      if (cond.startsWith("@") ? matchMedia(cond.slice(6)).matches : root.matches(cond))
        for (const n in v) {
          if (v[n]) tpl.set(n, v[n]);
          else tpl.delete(n);
        }
    for (const n of names) if (!tpl.has(n) && written.delete(n)) root.style.removeProperty(n);
    // every input is read before the first write: a read after a write recalculates the style of the page
    const done = new Map<string, string | Color>();
    const get = (n: string): string | Color => {
      let v = done.get(n);
      if (v === undefined) {
        const t = tpl.get(n);
        done.set(
          n,
          (v = t === undefined ? cs.getPropertyValue(n).trim() || fail(n) : evaluate(t, get)),
        );
      }
      return v;
    };
    const next = [...tpl.keys()].map((n): [string, string | undefined] => {
      try {
        return [n, css(get(n) as Color)];
      } catch {
        return [n, undefined]; // an input is missing or unreadable: the static default stays
      }
    });
    for (const [n, v] of next)
      if (v === undefined) {
        if (written.delete(n)) root.style.removeProperty(n);
      } else if (written.get(n) !== v) {
        written.set(n, v);
        root.style.setProperty(n, v);
      }
    observer.takeRecords();
  };

  const go = () => {
    if (!read()) return false;
    if (data.p.every((p) => CSS.supports("color", p))) return true;
    observer = new MutationObserver(update);
    observer.observe(root, { attributes: true });
    for (const [cond] of data.t)
      if (cond.startsWith("@")) matchMedia(cond.slice(6)).addEventListener("change", update);
    update();
    return true;
  };
  // the stylesheet may not be here yet
  if (!go()) addEventListener("load", go, { once: true });
};
