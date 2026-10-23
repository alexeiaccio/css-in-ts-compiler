// oxlint-disable automation/no-multiple-function-params -- these functions are the spec's defs
// (specs/canvas/{camera,pointer}.qnt) one for one; keeping the positional argument lists makes the
// two files diff-able line against line.

/**
 * The fixed-point math of the canvas, copied from the Quint specs. Integers only, power-of-two
 * denominators, every intermediate below 2^53, so doubles are exact and the DOM implementation can
 * be compared with the generated model bit for bit.
 *
 *   zoom   z  = zoom * ZONE          (ZMIN 1/16 .. ZMAX 8)
 *   camera t  = world units * TONE   (sub-unit offsets keep zoom smooth)
 *   screen = (world + t) * zoom      (world-offset form)
 *   every division is round half up (`rdiv`); `fdiv` is floor.
 */

export const ZONE = 4096;
export const TONE = 256;
export const ZMIN = 256;
export const ZMAX = 32_768;
/** Viewport origin bound, world units. */
export const WORLD_BOUND = 1_000_000;
/** Screen px a press must travel before it becomes a gesture (squared distance > DRAG_PX^2). */
export const DRAG_PX = 4;
/** Screen px within which a dragged node snaps to the grid. */
export const SNAP_PX = 8;
/** The default snap candidates: every GRID world units (`gridCandidates`). */
export const GRID = 50;
/** Ticks of a tween; the last one lands exactly on the target. */
export const TWEEN_TICKS = 4;

const TZ = ZONE * TONE;
const WT = WORLD_BOUND * TONE;

export const clampI = (value: number, lo: number, hi: number): number => {
  if (value < lo) {
    return lo;
  }
  return value > hi ? hi : value;
};

export const fdiv = (a: number, b: number): number => Math.floor(a / b);
export const rdiv = (a: number, b: number): number => fdiv(2 * a + b, 2 * b);
/** Pointer coordinates are whole screen px; a fractional client position rounds half up. */
export const roundHalfUp = (value: number): number => Math.floor(value + 0.5);

// ---- camera -----------------------------------------------------------------------------

export const screenToWorld = (s: number, t: number, zf: number): number => rdiv(s * TZ, zf) - t;
export const clampZ = (zf: number): number => clampI(zf, ZMIN, ZMAX);
export const clampT = (t: number): number => clampI(t, -WT, WT);
/** Zoom to `zf2` about screen point `s`; the translation is solved for the CLAMPED zoom. */
export const anchoredT = (t: number, zf: number, zf2: number, s: number): number =>
  clampT(t + rdiv(s * TZ, zf2) - rdiv(s * TZ, zf));
export const panT = (t: number, zf: number, d: number): number => clampT(t + rdiv(d * TZ, zf));
/** Hand-tool pan: keep the grab world point `g` under screen point `s`. */
export const panGrab = (s: number, zf: number, g: number): number => clampT(rdiv(s * TZ, zf) - g);
export const zoomRequest = (zf: number, factor: number): number => clampZ(rdiv(zf * factor, ZONE));
export const lerp = (a: number, b: number, p: number): number => a + fdiv((b - a) * p, TWEEN_TICKS);
/** Camera translation that puts world point (units) `point` at the centre of a viewport of size `extent`. */
export const centreT = (extent: number, zf: number, point: number): number =>
  clampT(rdiv(fdiv(extent, 2) * TZ, zf) - point * TONE);

// ---- selection sets ---------------------------------------------------------------------

export type IndexSet = ReadonlySet<number>;

export const only = (index: number): IndexSet => new Set([index]);
export const union = (a: IndexSet, b: IndexSet): IndexSet => new Set([...a, ...b]);
export const toggled = (a: IndexSet, index: number): IndexSet => {
  const next = new Set(a);
  if (next.has(index)) {
    next.delete(index);
  } else {
    next.add(index);
  }
  return next;
};
export const sameSet = (a: IndexSet, b: IndexSet): boolean =>
  a.size === b.size && [...a].every((index) => b.has(index));
/** The only member, or -1. */
export const sole = (a: IndexSet): number => (a.size === 1 ? ([...a][0] ?? -1) : -1);

export const at = (values: readonly number[], index: number): number => values[index] ?? 0;

// ---- hit testing, marquee ---------------------------------------------------------------

export interface Boxes {
  readonly xs: readonly number[];
  readonly ys: readonly number[];
  readonly ws: readonly number[];
  readonly hs: readonly number[];
  /** Paint order per node: higher is on top. The identity (index = rank) until the host reorders. */
  readonly ranks: readonly number[];
}

/** Topmost node (highest rank) whose half-open box holds the world point (fp), or -1. */
export const hitAt = (boxes: Boxes, wx: number, wy: number): number => {
  let top = -1;
  for (let i = 0; i < boxes.xs.length; i += 1) {
    const bx = at(boxes.xs, i);
    const by = at(boxes.ys, i);
    if (
      wx >= bx * TONE &&
      wx < (bx + at(boxes.ws, i)) * TONE &&
      wy >= by * TONE &&
      wy < (by + at(boxes.hs, i)) * TONE &&
      (top < 0 || at(boxes.ranks, i) > at(boxes.ranks, top))
    ) {
      top = i;
    }
  }
  return top;
};

export type MarqueeMode = "contain" | "overlap";

/** contain = the rectangle encloses the box; overlap = positive-area intersection. */
export const rectHits = (
  boxes: Boxes,
  mode: MarqueeMode,
  rx0: number,
  ry0: number,
  rx1: number,
  ry1: number,
): IndexSet => {
  const hits = new Set<number>();
  for (let i = 0; i < boxes.xs.length; i += 1) {
    const x0 = at(boxes.xs, i) * TONE;
    const y0 = at(boxes.ys, i) * TONE;
    const x1 = (at(boxes.xs, i) + at(boxes.ws, i)) * TONE;
    const y1 = (at(boxes.ys, i) + at(boxes.hs, i)) * TONE;
    const hit =
      mode === "contain"
        ? rx0 <= x0 && x1 <= rx1 && ry0 <= y0 && y1 <= ry1
        : rx0 < x1 && x0 < rx1 && ry0 < y1 && y0 < ry1;
    if (hit) {
      hits.add(i);
    }
  }
  return hits;
};

// ---- drag, snapping ---------------------------------------------------------------------

export const moved = (x: number, y: number, downX: number, downY: number): boolean =>
  (x - downX) ** 2 + (y - downY) ** 2 > DRAG_PX * DRAG_PX;
/** World delta (whole units) between the world pointer and the world grab point (both fp). */
export const rawD = (w: number, g: number): number => rdiv(w - g, TONE);

export type SnapAxis = "x" | "y";
/** The dragged node a snap policy is asked about: its id and its size, whole world units. */
export interface SnapNode {
  readonly id: string;
  readonly width: number;
  readonly height: number;
}
/**
 * What the host's snap policy is asked: `value` is the origin (left / top edge) of `id` on `axis`
 * while it is dragged, `width` / `height` its size. Edge alignment is `target - width` (right) or
 * `target - height` (bottom). One object, so a field can be added without breaking a policy.
 */
export interface SnapContext extends SnapNode {
  readonly axis: SnapAxis;
  readonly value: number;
}
/**
 * The host's snap policy: candidate origins on one axis for the dragged node described by the
 * context. WHOLE world units (never 1/256 fixed point); a fractional candidate is ignored. The
 * primitive keeps the mechanism (nearest candidate, the 8 screen px threshold, the guides).
 */
export type SnapCandidates = (context: SnapContext) => readonly number[];
/** The default policy and the one `specs/canvas/pointer.qnt` models: every `GRID` units. */
export const gridCandidates: SnapCandidates = ({ value }) => [rdiv(value, GRID) * GRID];

/** The candidate nearest `value` on one axis (a tie goes to the larger, like `rdiv`), or none. */
export type NearestCandidate = (value: number) => number | undefined;
export const nearestOn =
  (candidates: SnapCandidates, axis: SnapAxis, node: SnapNode): NearestCandidate =>
  (value) => {
    let best: number | undefined;
    for (const candidate of candidates({ ...node, axis, value })) {
      if (!Number.isInteger(candidate)) {
        continue;
      }
      const gap = Math.abs(candidate - value);
      const bestGap = best === undefined ? gap : Math.abs(best - value);
      if (best === undefined || gap < bestGap || (gap === bestGap && candidate > best)) {
        best = candidate;
      }
    }
    return best;
  };

const snapTarget = (
  v: number,
  on: boolean,
  zf: number,
  nearest: NearestCandidate,
): number | undefined => {
  const candidate = on ? nearest(v) : undefined;
  return candidate !== undefined && Math.abs(v - candidate) * zf <= SNAP_PX * ZONE
    ? candidate
    : undefined;
};
export const snapHit = (v: number, on: boolean, zf: number, nearest: NearestCandidate): boolean =>
  snapTarget(v, on, zf, nearest) !== undefined;
const snapNudge = (v: number, on: boolean, zf: number, nearest: NearestCandidate): number =>
  (snapTarget(v, on, zf, nearest) ?? v) - v;
/** Live drag delta on one axis; `base` is the dragged node's committed position on it. */
export const liveDD = (
  w: number,
  g: number,
  base: number,
  on: boolean,
  zf: number,
  nearest: NearestCandidate,
): number => rawD(w, g) + snapNudge(base + rawD(w, g), on, zf, nearest);
export const clampPos = (value: number, extent: number): number =>
  clampI(value, -WORLD_BOUND, WORLD_BOUND - extent);
