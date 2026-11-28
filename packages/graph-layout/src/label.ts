import type { Graph, Layout } from "./index.ts";
import type { Placement } from "./place.ts";
import { channels, type Route } from "./route.ts";

/** What a label asks for: its height, and a width if the caller has measured the text (the band is the default). */
export interface LabelRequest {
  readonly width?: number;
  readonly height: number;
}

/** The gaps a label keeps: from the labels above and below it at one boundary, and from the channel's two borders. */
export interface LabelSpacing {
  readonly labels?: number;
  readonly inset?: number;
}

/** A label placed: its box, and the layer boundary it sits at (`-1` for a loop, which has no boundary). */
export interface LabelSlot {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly boundary: number;
}

const DEFAULT_LABEL_SPACING = 4;
const DEFAULT_LABEL_INSET = 2;

interface Wanted {
  readonly id: string;
  readonly boundary: number;
  readonly x: number;
  readonly width: number;
  readonly height: number;
  readonly idealY: number;
  readonly at: number;
}

/**
 * Labels as slots: one box per requested route, inside the channel of the layer boundary the route crosses, in a track of
 * its own.
 *
 * A label's x band is the channel — from `inset` px inside the previous layer's right border to `inset` px before the next
 * layer's left one — and a request wider than that band comes back clamped to it. That clamp is what makes "no label over a
 * box" true by construction: a channel is the gap between two layers, so a box inside it cannot be reached whatever the
 * caller measured.
 *
 * The boundary is the middle of the ones the route crosses, `first + floor((last - first - 1) / 2)`: a one-boundary edge
 * takes that boundary, a two-boundary edge the first of them, a three-boundary edge the middle. A loop crosses none, gets
 * `boundary: -1`, and sits in a column of its own to the right of its bracket.
 *
 * The ideal y is the middle of the route's own segment inside that channel — the diagonal's midpoint for the octilinear
 * router, the vertical's for the orthogonal one. At a boundary the labels are sorted by that y, ties by route id, and then
 * stacked top-down: a label keeps its ideal y unless it would reach the label above, in which case it is pushed down. Only
 * down, so the stack is one pass with no search, and no two labels can overlap: the order of the drawing never has to be
 * revisited once a label has a place.
 *
 * @param {Graph} graph the graph the layout, the boxes and the routes belong to
 * @param {Layout} layout the layout they cross
 * @param {ReadonlyArray<Placement>} boxes the slots' boxes, as {@link place} returns them
 * @param {ReadonlyArray<Route>} routes the routes, as {@link route} returns them
 * @param {Readonly<Record<string, LabelRequest>>} requests the routes that want a label, keyed by route id
 * @param {LabelSpacing} spacing the gap between labels and the inset from a channel's borders
 * @returns {ReadonlyArray<LabelSlot>} one slot per requested route, in route order
 */
export const label = (
  graph: Graph,
  layout: Layout,
  boxes: ReadonlyArray<Placement>,
  routes: ReadonlyArray<Route>,
  requests: Readonly<Record<string, LabelRequest>>,
  spacing: LabelSpacing = {},
): ReadonlyArray<LabelSlot> => {
  const gap = spacing.labels ?? DEFAULT_LABEL_SPACING;
  const inset = spacing.inset ?? DEFAULT_LABEL_INSET;
  const bands = channels(graph, layout, boxes);
  const layerOf = new Map<string, number>();
  layout.slots.forEach((ids, layer) => ids.forEach((id) => layerOf.set(id, layer)));

  const wanted: Wanted[] = [];
  const loops: Array<{ at: number; slot: LabelSlot }> = [];

  for (const [at, line] of routes.entries()) {
    const request = requests[line.id];
    if (request === undefined) continue;
    if (line.source === line.target) {
      const left = Math.max(...line.points.map((point) => point.x));
      const top = Math.min(...line.points.map((point) => point.y));
      const bottom = Math.max(...line.points.map((point) => point.y));
      loops.push({
        at,
        slot: {
          id: line.id,
          x: left + gap,
          y: (top + bottom) / 2 - request.height / 2,
          width: request.width ?? 0,
          height: request.height,
          boundary: -1,
        },
      });
      continue;
    }
    const first = layerOf.get(line.source) ?? 0;
    const last = layerOf.get(line.target) ?? 0;
    const boundary = first + Math.floor((last - first - 1) / 2);
    const channel = bands[boundary] ?? { start: 0, end: 0 };
    const room = Math.max(0, channel.end - channel.start - 2 * inset);
    const through = line.points.filter(
      (point) => point.x >= channel.start && point.x <= channel.end,
    );
    const head = through[0];
    const tail = through[through.length - 1];
    wanted.push({
      id: line.id,
      boundary,
      x: channel.start + inset,
      width: Math.min(request.width ?? room, room),
      height: request.height,
      idealY: ((head?.y ?? 0) + (tail?.y ?? 0)) / 2,
      at,
    });
  }

  const placed = new Map<number, Wanted[]>();
  for (const one of wanted) {
    placed.set(one.boundary, [...(placed.get(one.boundary) ?? []), one]);
  }

  const slots: LabelSlot[] = [];
  for (const [boundary, list] of [...placed].sort((one, two) => one[0] - two[0])) {
    list.sort((one, two) => one.idealY - two.idealY || one.id.localeCompare(two.id));
    let below = Number.NEGATIVE_INFINITY;
    for (const one of list) {
      const y = Math.max(one.idealY - one.height / 2, below);
      below = y + one.height + gap;
      slots[one.at] = {
        id: one.id,
        x: one.x,
        y,
        width: one.width,
        height: one.height,
        boundary,
      };
    }
  }
  for (const loop of loops) slots[loop.at] = loop.slot;
  return slots.filter((slot): slot is LabelSlot => slot !== undefined);
};
