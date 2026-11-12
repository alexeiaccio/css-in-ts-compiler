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
  const start = centreOf(from);
  const end = centreOf(to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return undefined;
  }
  const ux = dx / length;
  const uy = dy / length;
  const lineFrom = borderOf(from, ux, uy) + EDGE_GAP;
  const tip = length - borderOf(to, ux, uy) - EDGE_GAP;
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
  const fromCentre = centreOf(from);
  const toCentre = centreOf(to);
  const horizontal = Math.abs(toCentre.x - fromCentre.x) >= Math.abs(toCentre.y - fromCentre.y);
  // the border midpoint that faces the other card, on each side
  const start = horizontal
    ? {
        x: toCentre.x > fromCentre.x ? from.x + a.width : from.x,
        y: Math.min(Math.max(fromCentre.y, from.y), from.y + a.height),
      }
    : {
        x: Math.min(Math.max(fromCentre.x, from.x), from.x + a.width),
        y: toCentre.y > fromCentre.y ? from.y + a.height : from.y,
      };
  const end = horizontal
    ? {
        x: toCentre.x > fromCentre.x ? to.x : to.x + b.width,
        y: Math.min(Math.max(toCentre.y, to.y), to.y + b.height),
      }
    : {
        x: Math.min(Math.max(toCentre.x, to.x), to.x + b.width),
        y: toCentre.y > fromCentre.y ? to.y : to.y + b.height,
      };
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
