// The window: which items a scrolling page declares this frame. A list of thousands costs what the screen shows if the
// page declares only the visible items plus an overscan, and two spacer boxes stand in for the items above and below
// them: the clip element's content height, and so the scroll's clamp and the thumb, stay the real page's.
//
// The items and the spacers are children of one gap-spaced column, so a spacer's own gap is taken out of its height
// (`above = first·slot - gap`): the first item starts at `above + gap`, and the items above are `first·slot` worth of
// content. At an end there is no spacer at all — a zero-height box would still add its gap.
//
// Two shapes. `fixedWindow` is arithmetic: every item is `item` px and the nth item starts at `n·(item + gap)`.
// `measuredWindow` is for items whose heights differ: a height per index (a cache the page fills from `ui.bounds`), and
// a fallback for the ones not measured yet (the mean of the measured ones, or `fallback` when none is).
//
// ponytail: `measuredWindow` builds a prefix sum over the heights on every call (O(n) a frame; n is a feed, not a
// dataset). A persistent prefix sum maintained as heights arrive, or a binary search over a running total, is the
// upgrade if hundreds of thousands of items ever matter.

/** The items declared either side of the viewport, on top of the ones it shows. */
export const OVERSCAN = 2;

/** A window: the indexes to declare (`first..last`, inclusive), the spacer heights above and below them, and the real
 *  content height of *all* the items and the gaps between them (the clamp's and the thumb's, not the declared subset's). */
export interface Window {
  /** The first item to declare, 0..count-1 (`last < first` when there is nothing). */
  readonly first: number;
  /** The last item to declare, inclusive. */
  readonly last: number;
  /** The height of the top spacer box, px: 0 when `first` is 0 and there is no spacer. */
  readonly above: number;
  /** The height of the bottom spacer box, px: 0 when `last` is the last item and there is no spacer. */
  readonly below: number;
  /** The real content's height — every item and the gaps between them, not just the declared ones' (the clamp's and
   *  the thumb's). */
  readonly content: number;
}

const NONE: Window = { first: 0, last: -1, above: 0, below: 0, content: 0 };
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

/** The window of `count` items of one `item` height, `gap` between them, for a viewport `view` tall at `offset` (positive
 *  down, as the page's scroll reports it). */
export function fixedWindow(opts: {
  offset: number;
  view: number;
  count: number;
  item: number;
  gap: number;
  overscan?: number;
}): Window {
  const { offset, view, count, item, gap } = opts;
  if (!(count > 0) || !(item > 0)) return NONE;
  const overscan = opts.overscan ?? OVERSCAN;
  const slot = item + gap;
  const content = count * item + (count - 1) * gap;
  const y = clamp(offset, 0, Math.max(content - view, 0));
  // the item whose slot holds the viewport's top, and the last one whose top is above its bottom (an item starting at
  // exactly the bottom is not visible)
  const firstVisible = Math.min(count - 1, Math.floor(y / slot));
  const lastVisible = Math.min(count - 1, Math.max(firstVisible, Math.ceil((y + view) / slot) - 1));
  const first = clamp(firstVisible - overscan, 0, count - 1);
  const last = clamp(lastVisible + overscan, first, count - 1);
  return {
    first,
    last,
    above: first ? first * slot - gap : 0,
    below: last === count - 1 ? 0 : (count - 1 - last) * slot - gap,
    content,
  };
}

/**
 * The window of items of different heights: `heights[i]` where the page has measured one, and a fallback — the mean of
 * the measured heights, or `fallback` (190) when none is yet — for the rest. `gap` is the column's gap, and the offset
 * and the viewport are in the items' own block (the page takes its padding out of the offset before asking).
 */
export function measuredWindow(opts: {
  offset: number;
  view: number;
  count: number;
  heights: readonly (number | undefined)[];
  gap: number;
  fallback?: number;
  overscan?: number;
}): Window {
  const { offset, view, count, heights, gap } = opts;
  if (!(count > 0)) return NONE;
  const overscan = opts.overscan ?? OVERSCAN;
  // the fallback: the mean of what has been measured, so an unseen item is the size of the feed's typical one
  let measured = 0,
    sum = 0;
  for (let i = 0; i < count; i++) {
    const h = heights[i];
    if (h && h > 0) measured++, (sum += h);
  }
  const mean = measured ? sum / measured : (opts.fallback ?? 190);
  const h: number[] = new Array(count);
  const top: number[] = new Array(count + 1); // the item's top in the items' block, gaps included
  top[0] = 0;
  for (let i = 0; i < count; i++) {
    const v = heights[i];
    h[i] = v && v > 0 ? v : mean;
    top[i + 1] = top[i]! + h[i]! + gap;
  }
  const content = top[count]! - gap;
  const y = clamp(offset, 0, Math.max(content - view, 0));
  let firstVisible = 0;
  while (firstVisible < count - 1 && top[firstVisible]! + h[firstVisible]! <= y) firstVisible++;
  let lastVisible = firstVisible;
  while (lastVisible < count - 1 && top[lastVisible + 1]! < y + view) lastVisible++;
  const first = clamp(firstVisible - overscan, 0, count - 1);
  const last = clamp(lastVisible + overscan, first, count - 1);
  return {
    first,
    last,
    above: first ? top[first]! - gap : 0,
    below: last === count - 1 ? 0 : content - top[last]! - h[last]! - gap,
    content,
  };
}
