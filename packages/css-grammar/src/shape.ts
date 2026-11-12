// `shape()` (css-shapes-1 §3.1.1): the drawing language of a CSS shape, the commands of an SVG path with words in place
// of letters. Two things live here, because they need the same parser: the check the twin runs (`shapeValid`, so a build
// rejects `curve` without `with`), and the fallback for every browser without `border-shape` — `shapePath` turns the
// same value into SVG path data. LightningCSS passes `border-shape` through untouched, so the fallback has to stand on
// its own; the shape is the single description, the CSS and the SVG are the two surfaces.
//
// Plain code on purpose: the twin calls it inside the recognizer (twin-core.ts, the hot path), and an app calls
// shapePath() where it draws. No Effect, no DOM.
//
// Supported: from, move, line, hline, vline, curve (one control point is quadratic, two cubic), smooth (quadratic
// without `with`, cubic with), arc and close, in the `to` and `by` forms, with px, %, cqw, cqh, calc() and the position
// keywords. A value with a var() is valid but cannot become a path: shapePath() needs the substituted value.

export interface ShapeBox {
  readonly width: number;
  readonly height: number;
}

export interface ShapePath {
  /** SVG `<path d>`: M, L, H, V, Q, C, A, Z, in the box's pixels. */
  readonly d: string;
  /** `0 0 100 100` when no box was given (percentages resolved against 100); else null, the caller's own size. */
  readonly viewBox: string | null;
}

interface Point {
  x: number;
  y: number;
}

const UNIT = /^(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(px|%|cqw|cqh)?$/i;
const NUMBER = /^-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;
const FILL = /^(nonzero|evenodd)\s+/i;
const MARKER = /^(of|cw|ccw|large|small|rotate)$/i;
const CALC = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?(?:px|%|cqw|cqh)?|[()*+/-]/gi;

const PERCENT = new Map<string, number>([
  ["left", 0],
  ["top", 0],
  ["x-start", 0],
  ["y-start", 0],
  ["start", 0],
  ["center", 50],
  ["right", 100],
  ["bottom", 100],
  ["x-end", 100],
  ["y-end", 100],
  ["end", 100],
]);

const fail = (message: string): never => {
  throw new Error(message);
};

const fmt = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000;
  return `${rounded === 0 ? 0 : rounded}`;
};

const axis = (name: "x" | "y", box: ShapeBox): number => (name === "x" ? box.width : box.height);

// A top-level split: `separator` outside parentheses and quotes.
const split = (text: string, separator: "," | " "): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let at = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) depth--;
    else if (!depth && (separator === " " ? /\s/.test(c) : c === separator)) {
      parts.push(text.slice(at, i));
      at = i + 1;
    }
  }
  parts.push(text.slice(at));
  const out: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
};

// `var(--x[, fallback])` stands for a value the build cannot see: valid in a shape, unusable in a path.
const withoutVar = (text: string): string => text.replace(/var\([^()]*\)/gi, "0");

// `calc()` inside a length: +, -, * and / (by a number, as CSS has it) and parentheses.
const evaluate = (text: string, name: "x" | "y", box: ShapeBox): number => {
  const tokens = text.match(CALC) ?? [];
  let i = 0;
  const expr = (): number => {
    let value = term();
    for (;;) {
      const token = tokens[i];
      if (token !== "+" && token !== "-") return value;
      i++;
      value = token === "+" ? value + term() : value - term();
    }
  };
  const term = (): number => {
    let value = unary();
    for (;;) {
      const token = tokens[i];
      if (token !== "*" && token !== "/") return value;
      i++;
      value = token === "*" ? value * unary() : value / unary();
    }
  };
  const unary = (): number => {
    const token = tokens[i++];
    if (token === undefined) return fail("calc(): a value is missing");
    if (token === "-") return -unary();
    if (token === "(") {
      const value = expr();
      if (tokens[i++] !== ")") return fail("calc(): a parenthesis is open");
      return value;
    }
    return length(token, name, box);
  };
  return expr();
};

const length = (token: string, name: "x" | "y", box: ShapeBox): number => {
  if (/^calc\(/i.test(token) && token.endsWith(")")) {
    return evaluate(token.slice(token.indexOf("(") + 1, -1), name, box);
  }
  const percent = PERCENT.get(token.toLowerCase());
  if (percent !== undefined) return (percent / 100) * axis(name, box);
  const match = UNIT.exec(token);
  if (!match) return fail(`"${token}" is not a length`);
  const value = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === "%") return (value / 100) * axis(name, box);
  if (unit === "cqw") return (value / 100) * box.width;
  if (unit === "cqh") return (value / 100) * box.height;
  if (!unit && value !== 0) return fail(`"${token}" needs a unit`);
  return value;
};

// A `<position>`: one value (the other axis is centered), two, or the four-value edge form.
const position = (text: string, box: ShapeBox): [number, number] => {
  const parts = split(text, " ");
  const [first, second] = parts;
  if (parts.length === 1 && first) return [length(first, "x", box), 0.5 * box.height];
  if (parts.length === 2 && first && second) {
    return [length(first, "x", box), length(second, "y", box)];
  }
  if (parts.length === 4 && first && second) {
    const [a, av, b, bv] = parts as [string, string, string, string];
    const vertical = /^(top|bottom|y-start|y-end)$/i.test(a);
    const edge = (keyword: string, value: string, name: "x" | "y"): number => {
      const base = (PERCENT.get(keyword.toLowerCase()) ?? 0) / 100;
      const offset = length(value, name, box);
      return base === 1 ? axis(name, box) - offset : base * axis(name, box) + offset;
    };
    return vertical ? [edge(b, bv, "x"), edge(a, av, "y")] : [edge(a, av, "x"), edge(b, bv, "y")];
  }
  return fail(`"${text}" is not a position`);
};

// `<coordinate-pair>`: two lengths, right then down.
const pair = (text: string, box: ShapeBox): Point => {
  const parts = split(text, " ");
  const [a, b] = parts;
  if (parts.length !== 2 || !a || !b) return fail(`"${text}" is not a coordinate pair`);
  return { x: length(a, "x", box), y: length(b, "y", box) };
};

// `<command-end-point>`: `to <position>` (against the box) or `by <coordinate-pair>` (against `from`).
const endpoint = (text: string, box: ShapeBox, from: Point): Point => {
  const match = /^(to|by)\s+(.+)$/is.exec(text.trim());
  if (!match?.[1] || !match[2]) return fail(`expected "to" or "by", got "${text.trim()}"`);
  if (match[1].toLowerCase() === "to") {
    const [x, y] = position(match[2], box);
    return { x, y };
  }
  const { x, y } = pair(match[2], box);
  return { x: from.x + x, y: from.y + y };
};

// `<control-point>`: a position in a `to` command, a coordinate pair in a `by` one (against the segment's start), and
// `from end|origin` moves the reference point.
const controlPoint = (
  text: string,
  mode: "to" | "by",
  box: ShapeBox,
  start: Point,
  end: Point,
): Point => {
  const from = /\s+from\s+(start|end|origin)\s*$/i.exec(text);
  if (mode === "to" && !from) {
    const [x, y] = position(text, box);
    return { x, y };
  }
  const offset = pair(from ? text.slice(0, from.index) : text, box);
  const base = from?.[1]?.toLowerCase();
  if (base === "origin") return offset;
  if (base === "end") return { x: end.x + offset.x, y: end.y + offset.y };
  return { x: start.x + offset.x, y: start.y + offset.y };
};

// The body of one `shape()` (what stands between the parentheses) as SVG path data.
const build = (body: string, box: ShapeBox): string => {
  const parts = split(withoutVar(body), ",");
  const head = parts.shift();
  if (!head) return fail("a shape needs from <position>");
  const fill = FILL.exec(head);
  const from = fill ? head.slice(fill[0].length) : head;
  const start = /^from\s+/i.exec(from);
  if (!start) return fail(`expected "from", got "${head}"`);
  const [sx, sy] = position(from.slice(start[0].length), box);
  const d: string[] = [`M ${fmt(sx)} ${fmt(sy)}`];
  let point: Point = { x: sx, y: sy };
  let opened: Point = point;
  let control: Point | undefined;
  for (const part of parts) {
    const [verb = "", ...words] = split(part, " ");
    const rest = words.join(" ");
    switch (verb.toLowerCase()) {
      case "move":
      case "line": {
        point = endpoint(rest, box, point);
        const letter = verb.toLowerCase() === "move" ? "M" : "L";
        d.push(`${letter} ${fmt(point.x)} ${fmt(point.y)}`);
        if (letter === "M") opened = point;
        control = undefined;
        break;
      }
      case "hline": {
        const x = /^by\s/i.test(rest)
          ? point.x + length(/^by\s+(.+)$/i.exec(rest)?.[1] ?? fail(`expected "by"`), "x", box)
          : length(/^to\s+(.+)$/i.exec(rest)?.[1] ?? fail(`expected "to"`), "x", box);
        point = { x, y: point.y };
        d.push(`H ${fmt(x)}`);
        control = undefined;
        break;
      }
      case "vline": {
        const y = /^by\s/i.test(rest)
          ? point.y + length(/^by\s+(.+)$/i.exec(rest)?.[1] ?? fail(`expected "by"`), "y", box)
          : length(/^to\s+(.+)$/i.exec(rest)?.[1] ?? fail(`expected "to"`), "y", box);
        point = { x: point.x, y };
        d.push(`V ${fmt(y)}`);
        control = undefined;
        break;
      }
      case "curve": {
        const at = rest.toLowerCase().indexOf(" with ");
        if (at < 0) return fail("curve needs with <control-point>");
        const end = endpoint(rest.slice(0, at), box, point);
        const mode = /^by\s/i.test(rest.slice(0, at)) ? "by" : "to";
        const controls = rest
          .slice(at + " with ".length)
          .split("/")
          .map((text) => controlPoint(text.trim(), mode, box, point, end));
        if (controls.length === 1) {
          const one = controls[0]!;
          d.push(`Q ${fmt(one.x)} ${fmt(one.y)} ${fmt(end.x)} ${fmt(end.y)}`);
          control = one;
        } else if (controls.length === 2) {
          const [c1, c2] = controls as [Point, Point];
          d.push(
            `C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(end.x)} ${fmt(end.y)}`,
          );
          control = c2;
        } else return fail("curve takes one or two control points");
        point = end;
        break;
      }
      case "smooth": {
        const at = rest.toLowerCase().indexOf(" with ");
        const end = endpoint(at < 0 ? rest : rest.slice(0, at), box, point);
        const first = control ? { x: 2 * point.x - control.x, y: 2 * point.y - control.y } : point;
        if (at < 0) {
          // a smooth quadratic: the reflected point is the curve's one control point
          d.push(`Q ${fmt(first.x)} ${fmt(first.y)} ${fmt(end.x)} ${fmt(end.y)}`);
          control = first;
        } else {
          const mode = /^by\s/i.test(rest.slice(0, at)) ? "by" : "to";
          const second = controlPoint(rest.slice(at + " with ".length), mode, box, point, end);
          d.push(
            `C ${fmt(first.x)} ${fmt(first.y)} ${fmt(second.x)} ${fmt(second.y)} ${fmt(end.x)} ${fmt(end.y)}`,
          );
          control = second;
        }
        point = end;
        break;
      }
      case "arc": {
        const at = rest.search(/\s+(of|cw|ccw|large|small|rotate)\b/i);
        const end = endpoint(at < 0 ? rest : rest.slice(0, at), box, point);
        const tail = at < 0 ? [] : split(rest.slice(at), " ");
        let radii: [number, number] = [0, 0];
        // the spec's defaults: ccw and small
        let sweep = 0;
        let large = 0;
        let rotate = 0;
        for (let i = 0; i < tail.length; i++) {
          const word = tail[i]!.toLowerCase();
          if (word === "of") {
            const a = tail[++i];
            const b = tail[i + 1];
            if (!a) return fail("arc: of needs a radius");
            const two = b !== undefined && !MARKER.test(b);
            if (two) {
              radii = [Math.abs(length(a, "x", box)), Math.abs(length(tail[++i]!, "y", box))];
            } else {
              // one radius is a circle: a percentage of it is against the direction-agnostic size
              const match = UNIT.exec(a);
              const radius =
                match?.[2] === "%"
                  ? (Math.abs(Number(match[1])) / 100) *
                    (Math.hypot(box.width, box.height) / Math.SQRT2)
                  : Math.abs(length(a, "x", box));
              radii = [radius, radius];
            }
          } else if (word === "cw") sweep = 1;
          else if (word === "ccw") sweep = 0;
          else if (word === "large") large = 1;
          else if (word === "small") large = 0;
          else if (word === "rotate") {
            const angle = tail[++i]?.replace(/deg$/i, "") ?? "";
            if (!NUMBER.test(angle)) return fail(`arc: "${angle}" is not an angle`);
            rotate = Number(angle);
          } else return fail(`arc: unexpected "${tail[i]}"`);
        }
        d.push(
          `A ${fmt(radii[0])} ${fmt(radii[1])} ${fmt(rotate)} ${large} ${sweep} ${fmt(end.x)} ${fmt(end.y)}`,
        );
        point = end;
        control = undefined;
        break;
      }
      case "close":
        d.push("Z");
        point = opened;
        control = undefined;
        break;
      default:
        return fail(`"${verb}" is not a shape command`);
    }
  }
  return d.join(" ");
};

const inner = (value: string): string => {
  const text = value.trim();
  const open = text.indexOf("(");
  if (!/^shape\s*\(/i.test(text) || !text.endsWith(")")) return fail("expected shape(...)");
  return text.slice(open + 1, -1);
};

// Throws when `body` (what stands between the parentheses of a `shape()`) is not a shape. A var() is valid: its value is
// what the browser sees, and the check resolves it to 0. Percentages resolve against 100 — a value is valid or not
// whatever the box is.
export const shapeValid = (body: string): void => {
  build(body, { width: 100, height: 100 });
};

// SVG path data of a `shape()` value: the fallback for a browser without `border-shape`. Without `box`, percentages
// resolve against 100 and `viewBox` is `0 0 100 100`; with it, the path is in the box's pixels and `viewBox` is null.
export const shapePath = (value: string, box?: ShapeBox): ShapePath => {
  const text = inner(value);
  if (/var\(/i.test(text))
    return fail("shapePath: var() cannot be resolved; pass the shape's value");
  if (!box) {
    for (const match of text.matchAll(/(-?(?:\d+\.?\d*|\.\d+))px/gi)) {
      if (Number(match[1]) !== 0)
        return fail(`shapePath: "${match[0]}" is in px; give the box's size`);
    }
  }
  return {
    d: build(text, box ?? { width: 100, height: 100 }),
    viewBox: box ? null : "0 0 100 100",
  };
};
