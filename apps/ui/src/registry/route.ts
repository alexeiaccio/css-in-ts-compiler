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
