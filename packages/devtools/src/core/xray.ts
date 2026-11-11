// The X-ray: the page (or a picked element) as boxes and the measurements between them. Read once per frame while the
// mode is on: every number here is what the browser laid out, not what the sheet says. Plain code — computed style and
// rects, no failure to model — and no DOM in the result: `Box` is data, so a host other than the overlay draws it too.

/** The step of the grid drawn inside a box (Gridray's 4 px), in CSS pixels. */
export const GRID = 4;

// A measure in CSS pixels; a percentage (a corner radius) counts as 0, a track we do not print.
const px = (value: string) => {
  if (value.endsWith("%")) return 0;
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
};

/** The box of an element: its border box in viewport coordinates, and what it spends inside itself. */
export interface Box {
  /** the name under which a person looks for the box: `button#go.primary` */
  readonly label: string;
  readonly display: string;
  /** 0 for the root, then one per level under it */
  readonly depth: number;
  /** the border box, viewport coordinates (`getBoundingClientRect`) */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** padding, [top, right, bottom, left] */
  readonly pad: readonly [number, number, number, number];
  /** border widths, [top, right, bottom, left] */
  readonly border: readonly [number, number, number, number];
  /** corner radii, [top-left, top-right, bottom-right, bottom-left] */
  readonly radius: readonly [number, number, number, number];
  /** the row and column gap of a flex or grid container, [row, column]; both 0 in flow */
  readonly gap: readonly [number, number];
}

/** The empty room between two adjacent boxes: a margin, a flex/grid gap, or a line break. */
export interface Space {
  /** the box of the empty room, viewport coordinates */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** the distance along `axis` */
  readonly size: number;
  readonly axis: "x" | "y";
  /** the depth of the parent whose children left it, 0 for the root's */
  readonly depth: number;
}

/** What the mode draws: the root box, the subtree's boxes, the spaces between them, and the grid's step. */
export interface Xray {
  readonly root: Box;
  /** the root first, then the subtree in document order */
  readonly boxes: readonly Box[];
  /** between adjacent siblings, under the parents within `spaces` */
  readonly spaces: readonly Space[];
  readonly grid: number;
}

export interface XrayOptions {
  /** how many levels under the root to measure; 0 is the root alone (default 6) */
  readonly depth?: number;
  /** a hard cap on boxes, so a page mode cannot walk a list of ten thousand rows (default 400) */
  readonly max?: number;
  /** how deep the parents whose children's spaces are measured (default 1: the root's) */
  readonly spaces?: number;
}

// The spaces between adjacent boxes: the horizontal room and the vertical room, each when it is a real one.
const between = (a: Box, b: Box, depth: number) => {
  const out: Space[] = [];
  const across = b.x - (a.x + a.w);
  if (across >= 1) {
    const top = Math.max(a.y, b.y);
    out.push({
      x: a.x + a.w,
      y: top,
      w: across,
      h: Math.max(1, Math.min(a.y + a.h, b.y + b.h) - top),
      size: across,
      axis: "x",
      depth,
    });
  }
  const down = b.y - (a.y + a.h);
  if (down >= 1) {
    const left = Math.max(a.x, b.x);
    out.push({
      x: left,
      y: a.y + a.h,
      w: Math.max(1, Math.min(a.x + a.w, b.x + b.w) - left),
      h: down,
      size: down,
      axis: "y",
      depth,
    });
  }
  return out;
};

const boxOf = (el: Element, depth: number) => {
  const style = getComputedStyle(el);
  // no box to draw: a display: contents element is its children, a display: none one is nothing
  if (style.display === "none" || style.display === "contents") return undefined;
  const rect = el.getBoundingClientRect();
  const cls = el.classList[0];
  return {
    label: `${el.localName}${el.id ? `#${el.id}` : ""}${cls ? `.${cls}` : ""}`.slice(0, 48),
    display: style.display,
    depth,
    x: rect.x,
    y: rect.y,
    w: rect.width,
    h: rect.height,
    pad: [
      px(style.paddingTop),
      px(style.paddingRight),
      px(style.paddingBottom),
      px(style.paddingLeft),
    ],
    border: [
      px(style.borderTopWidth),
      px(style.borderRightWidth),
      px(style.borderBottomWidth),
      px(style.borderLeftWidth),
    ],
    radius: [
      px(style.borderTopLeftRadius),
      px(style.borderTopRightRadius),
      px(style.borderBottomRightRadius),
      px(style.borderBottomLeftRadius),
    ],
    gap: [px(style.rowGap), px(style.columnGap)],
  } satisfies Box;
};

/**
 * Measures an element and its subtree: the boxes, the spaces between siblings, and the grid step.
 * @param {Element} root the border box the mode is about (an element, or `document.body` for the page)
 * @param {XrayOptions} options the depth, the box cap, and the depth of the parents whose spaces are measured
 * @returns {Xray} the measurement, data only (no DOM node in it)
 */
export const xray = (root: Element, options: XrayOptions = {}) => {
  const depthLimit = options.depth ?? 6;
  const max = options.max ?? 400;
  const spaceDepth = options.spaces ?? 1;
  const boxes: Box[] = [];
  const spaces: Space[] = [];
  // `add` says whether the box goes into the result: below the depth limit the children are only measured, so the spaces
  // between them are there even when the mode draws the root alone
  const measure = (el: Element, depth: number, add: boolean) => {
    if (add && boxes.length >= max) return undefined;
    const box = boxOf(el, depth);
    if (!box) return undefined;
    if (add) boxes.push(box);
    const deeper = add && depth < depthLimit;
    if (!deeper && depth >= spaceDepth) return box;
    const children = [...el.children].flatMap((child) => {
      const found = measure(child, depth + 1, deeper);
      return found ? [found] : [];
    });
    if (depth < spaceDepth) {
      children.forEach((child, index) => {
        const next = children[index + 1];
        if (next) spaces.push(...between(child, next, depth));
      });
    }
    return box;
  };
  const measured = measure(root, 0, true);
  if (measured) return { root: measured, boxes, spaces: spaces.slice(0, max), grid: GRID };
  // a root with no box (a `display: contents` pick) is measured as a box of no size rather than nothing: the mode needs a
  // rectangle to put its label on
  const empty: Box = {
    label: root.localName,
    display: "contents",
    depth: 0,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    pad: [0, 0, 0, 0],
    border: [0, 0, 0, 0],
    radius: [0, 0, 0, 0],
    gap: [0, 0],
  };
  return { root: empty, boxes: [empty], spaces: [], grid: GRID };
};
