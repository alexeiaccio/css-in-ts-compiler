// The geometry of an edge: the straight line the diagram draws, and the curve the board draws (perfect-arrows).
import { getBoxToBoxArrow } from "perfect-arrows";

// The straight line between two boxes, trimmed to their borders, with its arrow head and the place of its label. The diagram
// and the board both draw edges with it, so a line that ends on a card is the same maths in both, and the geometry is in one
// file instead of two.

export interface RoutedPoint {
  readonly x: number;
  readonly y: number;
}

/** A box on the page: its corner, and its size when it has one (the default is a word or two). */
export interface RoutedBox {
  readonly x: number;
  readonly y: number;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  /** The y on the left or right border this edge uses; the border's centre when absent. */
  readonly port?: number | undefined;
}

export interface Route {
  /** Where the line starts and ends: both trimmed to the boxes' borders. */
  readonly from: RoutedPoint;
  readonly to: RoutedPoint;
  /** The arrow's three points, as `<polygon points>`. */
  readonly arrow: string;
  /** Where the label goes, and which way its text runs from there. */
  readonly label: RoutedPoint & { readonly along: boolean };
}

/** The box a node gets when the caller gives no size: enough for a word or two. */
const DEFAULT_BOX = { width: 120, height: 44 } as const;

/** A gap between a box's border and the line or the arrow's tip, so the arrow reads as pointing at it. */
const EDGE_GAP = 4;

/** The arrow head's length along the line, and half its width. */
const ARROW = 8;
const ARROW_HALF = 3.2;

/** How far an edge's label sits above (or beside) the line. */
const LABEL_OFFSET = 8;

const round = (value: number): number => Math.round(value * 100) / 100;

const point = (x: number, y: number): RoutedPoint => ({ x: round(x), y: round(y) });

const size = (box: RoutedBox): { readonly width: number; readonly height: number } => ({
  width: box.width ?? DEFAULT_BOX.width,
  height: box.height ?? DEFAULT_BOX.height,
});

/** The y on a box's left and right border an edge uses: its port, or the border's centre. */
const portOf = (box: RoutedBox): number => box.port ?? box.y + size(box).height / 2;

const centreOf = (box: RoutedBox): RoutedPoint => {
  const { width, height } = size(box);
  return { x: box.x + width / 2, y: box.y + height / 2 };
};

/**
 * How far from a box's centre its border lies along a unit direction: the first of the two axis crossings, which is what an
 * axis-aligned rectangle meets.
 */
const borderOf = (box: RoutedBox, ux: number, uy: number): number => {
  const { width, height } = size(box);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const alongX = ux === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(ux);
  const alongY = uy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(uy);
  return Math.min(alongX, alongY);
};

/** The line from one box's border to the other's, the arrow at the target's end, and the label at the middle. */
export const routeBetween = (from: RoutedBox, to: RoutedBox): Route | undefined => {
  const ported = from.port !== undefined || to.port !== undefined;
  const ports = ported ? facing(from, to) : undefined;
  const start = ports?.start ?? centreOf(from);
  const end = ports?.end ?? centreOf(to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return undefined;
  }
  const ux = dx / length;
  const uy = dy / length;
  const lineFrom = (ported ? 0 : borderOf(from, ux, uy)) + EDGE_GAP;
  const tip = length - (ported ? 0 : borderOf(to, ux, uy)) - EDGE_GAP;
  const lineTo = tip - ARROW;
  if (lineTo <= lineFrom) {
    return undefined;
  }
  const at = (distance: number): RoutedPoint =>
    point(start.x + ux * distance, start.y + uy * distance);
  const head = at(tip);
  const side = { x: -uy * ARROW_HALF, y: ux * ARROW_HALF };
  const arrow = [
    head,
    point(head.x - ux * ARROW + side.x, head.y - uy * ARROW + side.y),
    point(head.x - ux * ARROW - side.x, head.y - uy * ARROW - side.y),
  ]
    .map((corner) => `${corner.x},${corner.y}`)
    .join(" ");
  const middle = at((lineFrom + lineTo) / 2);
  // a line that runs across the page gets its label above it, one that runs down gets it beside: either way the text does not
  // sit on the line
  const along = Math.abs(ux) < Math.abs(uy);
  return {
    from: at(lineFrom),
    to: at(lineTo),
    arrow,
    label: along
      ? { x: round(middle.x + LABEL_OFFSET), y: round(middle.y + 4), along }
      : { x: middle.x, y: round(middle.y - LABEL_OFFSET), along },
  };
};

/** A curved edge: the path a `<path d>` takes, and the arrow head's three points for a `<polygon points>`. */
export interface Curve {
  readonly path: string;
  readonly head: string;
}

/** The head's length along the curve and half its width, in plane px. */
const HEAD_LENGTH = 9;
const HEAD_HALF = 4.2;

/**
 * perfect-arrows' box-to-box options: a light bow, a short gap at both ends, and straight lines where the boxes line up —
 * a map of two columns reads as columns, not as a nest of arcs. `padEnd` clears the target's border so the head points at
 * the card instead of touching it.
 */
const ARROW_CURVE = {
  bow: 0,
  stretch: 0.25,
  stretchMin: 40,
  stretchMax: 420,
  padStart: 6,
  padEnd: 14,
  straights: true,
} as const;

/** An arrow between two boxes that curves out of the way, from perfect-arrows (Steve Ruiz, MIT). */
export const curveBetween = (from: RoutedBox, to: RoutedBox): Curve | undefined => {
  const a = size(from);
  const b = size(to);
  const points = getBoxToBoxArrow(
    from.x,
    from.y,
    a.width,
    a.height,
    to.x,
    to.y,
    b.width,
    b.height,
    ARROW_CURVE,
  );
  const [sx, sy, cx, cy, ex, ey, angle] = points;
  if (sx === undefined || sy === undefined || cx === undefined || cy === undefined) {
    return undefined;
  }
  if (ex === undefined || ey === undefined || angle === undefined) {
    return undefined;
  }
  // the head sits on the curve's end, pointing the way the curve arrives
  const back = { x: ex - Math.cos(angle) * HEAD_LENGTH, y: ey - Math.sin(angle) * HEAD_LENGTH };
  const side = { x: -Math.sin(angle) * HEAD_HALF, y: Math.cos(angle) * HEAD_HALF };
  const head = [
    point(ex, ey),
    point(back.x + side.x, back.y + side.y),
    point(back.x - side.x, back.y - side.y),
  ]
    .map((corner) => `${corner.x},${corner.y}`)
    .join(" ");
  return {
    path: `M ${round(sx)} ${round(sy)} Q ${round(cx)} ${round(cy)} ${round(ex)} ${round(ey)}`,
    head,
  };
};

/** The four ways an edge is drawn: xyflow's set, which is what a reader of node UIs expects. */
export type EdgeShape = "straight" | "bezier" | "step" | "smoothstep";

/** An edge as one SVG path, so a shape and a straight line are drawn by the same element. */
export interface PathRoute {
  /** The `d` of the visible line; its transparent hit twin carries the same one. */
  readonly d: string;
  /**
   * The path as a polyline — its vertices, each rounded corner sampled — which is what a crossing is computed against.
   * The `d` is drawn from the same vertices, so the two can never disagree.
   */
  readonly points: ReadonlyArray<RoutedPoint>;
  /** The arrow's three points, as `<polygon points>`. */
  readonly arrow: string;
  readonly label: RoutedPoint & { readonly along: boolean };
}

/** One side of a box, facing the other box: where an edge starts and ends, and which way it leaves each box. */
interface Facing {
  readonly start: RoutedPoint;
  readonly end: RoutedPoint;
  readonly horizontal: boolean;
  /** Out of the source's box, away from it. */
  readonly sourceDir: RoutedPoint;
  /** Out of the target's box, back towards the source (the arrow arrives against it). */
  readonly targetDir: RoutedPoint;
}

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), high);

/** The border midpoints that face the other box, and the outward normal of each side. */
const facing = (from: RoutedBox, to: RoutedBox): Facing => {
  const a = size(from);
  const b = size(to);
  const fromCentre = centreOf(from);
  const toCentre = centreOf(to);
  const horizontal = Math.abs(toCentre.x - fromCentre.x) >= Math.abs(toCentre.y - fromCentre.y);
  if (horizontal) {
    const right = toCentre.x > fromCentre.x;
    return {
      horizontal,
      start: {
        x: right ? from.x + a.width : from.x,
        y: clamp(portOf(from), from.y, from.y + a.height),
      },
      end: {
        x: right ? to.x : to.x + b.width,
        y: clamp(portOf(to), to.y, to.y + b.height),
      },
      sourceDir: { x: right ? 1 : -1, y: 0 },
      targetDir: { x: right ? -1 : 1, y: 0 },
    };
  }
  const down = toCentre.y > fromCentre.y;
  return {
    horizontal,
    start: {
      x: clamp(fromCentre.x, from.x, from.x + a.width),
      y: down ? from.y + a.height : from.y,
    },
    end: { x: clamp(toCentre.x, to.x, to.x + b.width), y: down ? to.y : to.y + b.height },
    sourceDir: { x: 0, y: down ? 1 : -1 },
    targetDir: { x: 0, y: down ? -1 : 1 },
  };
};

const distance = (a: RoutedPoint, b: RoutedPoint): number => Math.hypot(b.x - a.x, b.y - a.y);

/** The unit vector from `a` to `b`; `undefined` when they are the same point. */
const unit = (a: RoutedPoint, b: RoutedPoint): RoutedPoint | undefined => {
  const length = distance(a, b);
  return length === 0 ? undefined : { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
};

/** The arrow head whose tip is `tip` and whose axis is `dir` (a unit vector). */
const headAt = (tip: RoutedPoint, dir: RoutedPoint): string => {
  const side = { x: -dir.y * ARROW_HALF, y: dir.x * ARROW_HALF };
  return [
    tip,
    point(tip.x - dir.x * ARROW + side.x, tip.y - dir.y * ARROW + side.y),
    point(tip.x - dir.x * ARROW - side.x, tip.y - dir.y * ARROW - side.y),
  ]
    .map((corner) => `${corner.x},${corner.y}`)
    .join(" ");
};

/** Where a label sits: above a line that runs across the page, beside one that runs down it. */
const labelAt = (at: RoutedPoint, along: boolean): PathRoute["label"] =>
  along
    ? { x: round(at.x + LABEL_OFFSET), y: round(at.y + 4), along }
    : { x: at.x, y: round(at.y - LABEL_OFFSET), along };

/** The point at half the polyline's length: where a label sits. */
const middleOf = (points: ReadonlyArray<RoutedPoint>): RoutedPoint => {
  const lengths = points.slice(1).map((p, index) => distance(points[index]!, p));
  let left = lengths.reduce((sum, length) => sum + length, 0) / 2;
  for (const [index, length] of lengths.entries()) {
    if (left <= length) {
      const a = points[index]!;
      const b = points[index + 1]!;
      const t = length === 0 ? 0 : left / length;
      return point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }
    left -= length;
  }
  return points[0]!;
};

/**
 * The polyline as the `d` of a path: straight segments, or — for a smooth step — a quadratic round at every corner, the
 * radius cut to half the shorter neighbouring segment so a short step does not loop. `points` is the same line flattened
 * (each corner arc sampled), which is what a crossing is computed against.
 */
const polyline = (
  vertices: ReadonlyArray<RoutedPoint>,
  rounded: boolean,
): { readonly d: string; readonly points: ReadonlyArray<RoutedPoint> } | undefined => {
  const last = vertices[vertices.length - 1]!;
  const before = vertices[vertices.length - 2]!;
  const dir = unit(before, last);
  if (dir === undefined || distance(before, last) <= ARROW) {
    return undefined;
  }
  // the line stops short of the tip so the head, not the stroke, is what touches the box
  const end = point(last.x - dir.x * ARROW, last.y - dir.y * ARROW);
  const flat: RoutedPoint[] = [vertices[0]!];
  let d = `M ${vertices[0]!.x} ${vertices[0]!.y}`;
  if (!rounded) {
    for (const p of vertices.slice(1, -1)) {
      d += ` L ${p.x} ${p.y}`;
      flat.push(p);
    }
    return { d: `${d} L ${end.x} ${end.y}`, points: [...flat, end] };
  }
  const corners = vertices.slice(1, -1);
  corners.forEach((corner, index) => {
    const previous = index === 0 ? vertices[0]! : corners[index - 1]!;
    const next = index === corners.length - 1 ? end : corners[index + 1]!;
    const inDir = unit(previous, corner);
    const outDir = unit(corner, next);
    if (inDir === undefined || outDir === undefined) {
      return;
    }
    const radius = Math.min(CORNER, distance(previous, corner) / 2, distance(corner, next) / 2);
    const a = point(corner.x - inDir.x * radius, corner.y - inDir.y * radius);
    const b = point(corner.x + outDir.x * radius, corner.y + outDir.y * radius);
    d += ` L ${a.x} ${a.y} Q ${corner.x} ${corner.y} ${b.x} ${b.y}`;
    flat.push(a);
    for (const t of [0.25, 0.5, 0.75]) {
      const lift = 2 * (1 - t) * t;
      const ends = (1 - t) * (1 - t);
      const tail = t * t;
      flat.push(
        point(a.x * ends + corner.x * lift + b.x * tail, a.y * ends + corner.y * lift + b.y * tail),
      );
    }
    flat.push(b);
  });
  return { d: `${d} L ${end.x} ${end.y}`, points: [...flat, end] };
};

/** The radius of a smooth step's corner, and how far a step leaves a box before it turns. */
const CORNER = 12;
const STEP_OFFSET = 20;

/** A loop's bracket: how far out of the box it reaches, and how far its two ends sit either side of the border's centre. */
const LOOP_OUT = 20;
const LOOP_HALF = 8;

/** Where a loop's cubic puts its controls, so its own bulge is `LOOP_OUT` and no wider than the bracket's. */
const LOOP_CONTROL = LOOP_OUT + ARROW / 2;

/** Whether two boxes are one box: an edge between them is a loop, and there is no line to draw between them. */
const sameBox = (a: RoutedBox, b: RoutedBox): boolean => {
  const one = size(a);
  const two = size(b);
  return a.x === b.x && a.y === b.y && one.width === two.width && one.height === two.height;
};

/**
 * The path of an edge in one of the four shapes, with its arrow and the place of its label.
 *
 * All four start and end on the border midpoints that face each other (`facing`), so adding a shape is a `d` and not a
 * re-derivation of the geometry: `step` goes out of each box, turns on a shared center line and comes back in; `smoothstep`
 * is the same polyline with rounded corners; `bezier` is one cubic whose controls sit halfway between the boxes. An edge
 * whose ends are the same box is a loop (`loopBetween`) instead of a line between two points.
 */
export const shapeBetween = (
  shape: EdgeShape,
  from: RoutedBox,
  to: RoutedBox,
): PathRoute | undefined => {
  if (sameBox(from, to)) {
    return loopBetween(shape, from);
  }
  if (shape === "straight") {
    const straight = routeBetween(from, to);
    return straight === undefined
      ? undefined
      : {
          d: `M ${straight.from.x} ${straight.from.y} L ${straight.to.x} ${straight.to.y}`,
          points: [straight.from, straight.to],
          arrow: straight.arrow,
          label: straight.label,
        };
  }
  const side = facing(from, to);
  if (distance(side.start, side.end) === 0) {
    return undefined;
  }
  const along = Math.abs(side.end.x - side.start.x) < Math.abs(side.end.y - side.start.y);
  if (shape === "bezier") {
    const midX = (side.start.x + side.end.x) / 2;
    const midY = (side.start.y + side.end.y) / 2;
    const c1 = side.horizontal ? { x: midX, y: side.start.y } : { x: side.start.x, y: midY };
    const c2 = side.horizontal ? { x: midX, y: side.end.y } : { x: side.end.x, y: midY };
    const travel = unit(c2, side.end);
    if (travel === undefined) {
      return undefined;
    }
    const end = point(side.end.x - travel.x * ARROW, side.end.y - travel.y * ARROW);
    // the curve flattened for a crossing: a cubic is sampled, since two curves have no closed-form meeting point
    const points = Array.from({ length: BEZIER_STEPS + 1 }, (_, index) => {
      const t = index / BEZIER_STEPS;
      const rest = 1 - t;
      return point(
        side.start.x * rest ** 3 +
          3 * c1.x * rest * rest * t +
          3 * c2.x * rest * t * t +
          end.x * t ** 3,
        side.start.y * rest ** 3 +
          3 * c1.y * rest * rest * t +
          3 * c2.y * rest * t * t +
          end.y * t ** 3,
      );
    });
    // the cubic at t = 0.5: the weights of a de Casteljau split, which is the point of the curve, not of the chord
    const at = point(
      side.start.x * 0.125 + c1.x * 0.375 + c2.x * 0.375 + end.x * 0.125,
      side.start.y * 0.125 + c1.y * 0.375 + c2.y * 0.375 + end.y * 0.125,
    );
    return {
      d: `M ${side.start.x} ${side.start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`,
      points,
      arrow: headAt(point(side.end.x, side.end.y), travel),
      label: labelAt(at, along),
    };
  }
  const out = {
    x: side.start.x + side.sourceDir.x * STEP_OFFSET,
    y: side.start.y + side.sourceDir.y * STEP_OFFSET,
  };
  const back = {
    x: side.end.x + side.targetDir.x * STEP_OFFSET,
    y: side.end.y + side.targetDir.y * STEP_OFFSET,
  };
  const vertices = side.horizontal
    ? [
        side.start,
        out,
        { x: (out.x + back.x) / 2, y: out.y },
        { x: (out.x + back.x) / 2, y: back.y },
        back,
        side.end,
      ]
    : [
        side.start,
        out,
        { x: out.x, y: (out.y + back.y) / 2 },
        { x: back.x, y: (out.y + back.y) / 2 },
        back,
        side.end,
      ];
  const trimmed = vertices.filter(
    (p, index) => index === 0 || distance(vertices[index - 1]!, p) > 0,
  );
  const line = polyline(trimmed, shape === "smoothstep");
  const dir = unit(trimmed[trimmed.length - 2]!, side.end);
  if (line === undefined || dir === undefined) {
    return undefined;
  }
  return {
    d: line.d,
    points: line.points,
    arrow: headAt(point(side.end.x, side.end.y), dir),
    label: labelAt(middleOf(trimmed), along),
  };
};

/** How finely a cubic is sampled for crossings: 1/24 of its length is far below a stroke's width. */
const BEZIER_STEPS = 24;

/**
 * A loop: an edge whose two ends are the same box, drawn as a bracket off its right border — out `LOOP_OUT`, between
 * `centre - LOOP_HALF` and `centre + LOOP_HALF`, and back — with the arrow head on the end that returns.
 *
 * The bracket is the polyline the engine routes a loop with, so a diagram and its layout agree; `step` keeps its sharp
 * corners, `smoothstep` rounds them, and `bezier` bulges to the same `LOOP_OUT`, its controls a little further out than
 * that so the curve's own extent matches the bracket's. The label sits beside the bracket's far side, two label offsets
 * below its mouth's lower arm — clear of the box, of the line, and of an edge leaving the same border — and runs away
 * from the loop.
 */
const loopBetween = (shape: EdgeShape, box: RoutedBox): PathRoute | undefined => {
  const { width } = size(box);
  const right = box.x + width;
  const centre = portOf(box);
  const start = point(right, centre - LOOP_HALF);
  const end = point(right, centre + LOOP_HALF);
  const label = labelAt(point(right + LOOP_OUT, centre + LOOP_HALF + LABEL_OFFSET * 2), true);
  if (shape === "bezier") {
    const c1 = point(right + LOOP_CONTROL, centre - LOOP_HALF);
    const c2 = point(right + LOOP_CONTROL, centre + LOOP_HALF);
    const travel = unit(c2, end);
    if (travel === undefined) {
      return undefined;
    }
    const tail = point(end.x - travel.x * ARROW, end.y - travel.y * ARROW);
    const points = Array.from({ length: BEZIER_STEPS + 1 }, (_, index) => {
      const t = index / BEZIER_STEPS;
      const rest = 1 - t;
      return point(
        start.x * rest ** 3 +
          3 * c1.x * rest * rest * t +
          3 * c2.x * rest * t * t +
          tail.x * t ** 3,
        start.y * rest ** 3 +
          3 * c1.y * rest * rest * t +
          3 * c2.y * rest * t * t +
          tail.y * t ** 3,
      );
    });
    return {
      d: `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${tail.x} ${tail.y}`,
      points,
      arrow: headAt(end, travel),
      label,
    };
  }
  const out = point(right + LOOP_OUT, centre - LOOP_HALF);
  const back = point(right + LOOP_OUT, centre + LOOP_HALF);
  const line = polyline([start, out, back, end], shape === "smoothstep");
  const travel = unit(back, end);
  if (line === undefined || travel === undefined) {
    return undefined;
  }
  return { d: line.d, points: line.points, arrow: headAt(end, travel), label };
};

/** A crossing: where one edge's path meets another's, and which of the two is drawn over the other. */
export interface Crossing {
  readonly at: RoutedPoint;
  /** The edge drawn later: its line is broken at `at`, so the one underneath reads as continuous. */
  readonly over: string;
  readonly under: string;
}

/** Two segments' meeting point, or `undefined` for parallel, collinear and endpoint-only touches. */
const meeting = (
  a1: RoutedPoint,
  a2: RoutedPoint,
  b1: RoutedPoint,
  b2: RoutedPoint,
): RoutedPoint | undefined => {
  const rx = a2.x - a1.x;
  const ry = a2.y - a1.y;
  const sx = b2.x - b1.x;
  const sy = b2.y - b1.y;
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) < 1e-9) {
    return undefined;
  }
  const qx = b1.x - a1.x;
  const qy = b1.y - a1.y;
  const t = (qx * sy - qy * sx) / denominator;
  const u = (qx * ry - qy * rx) / denominator;
  // a touch at either end is two edges sharing a node, not a crossing; the epsilon keeps a sampled curve from
  // reporting its own bend
  if (t < EDGE_EPS || t > 1 - EDGE_EPS || u < EDGE_EPS || u > 1 - EDGE_EPS) {
    return undefined;
  }
  return point(a1.x + rx * t, a1.y + ry * t);
};

/** How much of a segment counts as its end. */
const EDGE_EPS = 0.02;

/**
 * Where the edges cross each other, in drawing order.
 *
 * Each path is a polyline (`PathRoute.points`), so the question is segment against segment: the standard parametric
 * test, once per pair of segments, skipping the ends. Two edges that share a node touch at a node and are not a crossing,
 * and two segments on one line overlap rather than cross, so both are skipped. Crossings closer than 2 px are one
 * crossing: a flattened curve meets a line twice when it bends across it.
 */
export const crossingsOf = (
  routes: ReadonlyArray<{ readonly id: string; readonly route: PathRoute }>,
): ReadonlyArray<Crossing> => {
  const found: Crossing[] = [];
  routes.forEach((later, index) => {
    for (const earlier of routes.slice(0, index)) {
      for (let i = 1; i < earlier.route.points.length; i += 1) {
        for (let j = 1; j < later.route.points.length; j += 1) {
          const at = meeting(
            earlier.route.points[i - 1]!,
            earlier.route.points[i]!,
            later.route.points[j - 1]!,
            later.route.points[j]!,
          );
          if (at === undefined) {
            continue;
          }
          const seen = found.some(
            (crossing) =>
              crossing.over === later.id &&
              crossing.under === earlier.id &&
              distance(crossing.at, at) < 2,
          );
          if (!seen) {
            found.push({ at, over: later.id, under: earlier.id });
          }
        }
      }
    }
  });
  return found;
};

/**
 * A connector the CSS draws itself: the box the two cards live in, and one `shape()` in percentages of it. The same
 * string is a `border-shape` in a browser that has it and, through `shapePath`, the `d` of an SVG path everywhere else —
 * one description, two surfaces. The curve is a single cubic with both control points on the middle of the gap, so it
 * leaves and arrives square to a side and bows where the two cards do not line up.
 */
export interface Connector {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  /** `shape(from …)`; percentages, so it needs no size of its own. */
  readonly shape: string;
}

const percent = (value: number, of: number): string =>
  `${Math.round((of === 0 ? 0 : (value / of) * 100) * 1000) / 1000}%`;

/** The connector between two boxes, as the union box its percentages are against. */
export const connectorBetween = (from: RoutedBox, to: RoutedBox): Connector | undefined => {
  const a = size(from);
  const b = size(to);
  const left = Math.min(from.x, to.x);
  const top = Math.min(from.y, to.y);
  const width = Math.max(from.x + a.width, to.x + b.width) - left;
  const height = Math.max(from.y + a.height, to.y + b.height) - top;
  if (width <= 0 || height <= 0) {
    return undefined;
  }
  const { start, end, horizontal } = facing(from, to);
  const middle = horizontal ? (start.x + end.x) / 2 : (start.y + end.y) / 2;
  const at = (p: RoutedPoint): string =>
    `${percent(p.x - left, width)} ${percent(p.y - top, height)}`;
  const c1 = horizontal ? { x: middle, y: start.y } : { x: start.x, y: middle };
  const c2 = horizontal ? { x: middle, y: end.y } : { x: end.x, y: middle };
  return {
    left,
    top,
    width,
    height,
    shape: `shape(from ${at(start)}, curve to ${at(end)} with ${at(c1)} / ${at(c2)})`,
  };
};
