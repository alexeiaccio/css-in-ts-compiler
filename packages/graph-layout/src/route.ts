import { dummyId } from "./dummy.ts";
import type { Graph, Layout } from "./index.ts";
import type { Placement } from "./place.ts";

/** A point of a route. */
export interface RoutePoint {
  readonly x: number;
  readonly y: number;
}

/** One edge drawn: the two nodes it joins and the polyline from the source's border to the target's. */
export interface Route {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly points: ReadonlyArray<RoutePoint>;
}

/** The set of directions a route's segments may take: `4` is orthogonal, `8` adds the two diagonals (octilinear). */
export interface RouteOptions {
  readonly directions?: 4 | 8;
}

/** The x band of one layer boundary: from the right borders of the layer before it to the left edges of the next. */
export interface Channel {
  readonly start: number;
  readonly end: number;
}

/**
 * The channels of a drawing, one per layer boundary: the band between a layer's rightmost node border and the next layer's
 * left column. The router puts one track per edge inside it and a label takes its x from it.
 *
 * @param {Graph} graph the graph the layout and the placement belong to
 * @param {Layout} layout the layout whose boundaries are wanted
 * @param {ReadonlyArray<Placement>} boxes the slots' boxes, as {@link place} returns them
 * @returns {ReadonlyArray<Channel>} one channel per boundary, `{0, 0}` where the drawing has none
 */
export const channels = (
  graph: Graph,
  layout: Layout,
  boxes: ReadonlyArray<Placement>,
): ReadonlyArray<Channel> => {
  const nodes = new Set(graph.nodes);
  const boxOf = new Map(boxes.map((box) => [box.id, box]));
  const columns = layout.slots.map((ids) => Math.min(...ids.map((id) => boxOf.get(id)?.x ?? 0)));
  const borders = layout.slots.map((ids) =>
    Math.max(
      ...ids
        .filter((id) => nodes.has(id))
        .map((id) => (boxOf.get(id)?.x ?? 0) + (boxOf.get(id)?.width ?? 0)),
    ),
  );
  return columns.slice(0, -1).map((_, boundary) => ({
    start: borders[boundary] ?? 0,
    end: columns[boundary + 1] ?? 0,
  }));
};

/**
 * Routes through the placement's channels: every layer boundary gets a channel, each edge crossing it gets its own track
 * there (ordered by the y it leaves with, so two verticals never share a line), the route crosses each layer in between at
 * its dummy's y — which the placement has already put in a gap between the boxes — and a node's ports are one anchor per edge
 * along the border, ordered by where each edge goes, so two edges from one node never share their stem.
 *
 * With `directions: 8` a channel's jog may become a single 45° segment from the edge's track to the right, when the height it
 * has to change fits in the channel before the next layer's boxes. The bands stay horizontal at the slots' heights, so a long
 * edge still passes through its dummy; the diagonal only replaces the vertical, which is the same number of bends at a
 * smaller angle.
 *
 * @param {Graph} graph the graph the layout and the placement belong to
 * @param {Layout} layout the layout the routes cross
 * @param {ReadonlyArray<Placement>} boxes the slots' boxes, as {@link place} returns them
 * @param {RouteOptions} options the direction set, four (the default) or eight
 * @returns {ReadonlyArray<Route>} one route per edge, in the graph's edge order
 */
export const route = (
  graph: Graph,
  layout: Layout,
  boxes: ReadonlyArray<Placement>,
  options: RouteOptions = {},
): ReadonlyArray<Route> => {
  const octilinear = (options.directions ?? 4) === 8;
  const layerOf = new Map<string, number>();
  layout.slots.forEach((ids, layer) => ids.forEach((id) => layerOf.set(id, layer)));
  const boxOf = new Map(boxes.map((box) => [box.id, box]));
  const centreOf = (id: string): number => {
    const box = boxOf.get(id);
    return box === undefined ? 0 : box.y + box.height / 2;
  };

  const column = channels(graph, layout, boxes);
  const channelOf = (boundary: number): Channel => column[boundary] ?? { start: 0, end: 0 };

  const loops: Route[] = [];
  const chains: Array<{ id: string; source: string; target: string; chain: string[] }> = [];
  const seen = new Set<string>();
  for (const edge of graph.edges) {
    const first = layerOf.get(edge.source);
    const last = layerOf.get(edge.target);
    if (first === undefined || last === undefined) continue;
    if (first === last) {
      if (edge.source !== edge.target || seen.has(`${edge.source}>${edge.target}`)) continue;
      seen.add(`${edge.source}>${edge.target}`);
      loops.push(loopOf(edge.source, boxOf.get(edge.source)));
      continue;
    }
    const source = first < last ? edge.source : edge.target;
    const target = first < last ? edge.target : edge.source;
    const id = `${source}>${target}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const from = layerOf.get(source) ?? 0;
    const to = layerOf.get(target) ?? 0;
    const chain = [source];
    for (let layer = from + 1; layer < to; layer += 1) {
      chain.push(dummyId({ source, target }, layer));
    }
    chain.push(target);
    chains.push({ id, source, target, chain });
  }

  const crossingsAt = new Map<number, Array<{ id: string; y: number }>>();
  for (const { id, chain } of chains) {
    for (let index = 0; index + 1 < chain.length; index += 1) {
      const layer = layerOf.get(chain[index] ?? "");
      if (layer === undefined) continue;
      const list = crossingsAt.get(layer) ?? [];
      list.push({ id, y: centreOf(chain[index + 1] ?? "") });
      crossingsAt.set(layer, list);
    }
  }
  const tracks = new Map<string, number>();
  for (const [boundary, crossings] of crossingsAt) {
    crossings.sort((one, two) => one.y - two.y || one.id.localeCompare(two.id));
    const channel = channelOf(boundary);
    const width = channel.end - channel.start;
    crossings.forEach((crossing, index) => {
      tracks.set(
        `${crossing.id}@${boundary}`,
        channel.start + (width * (index + 1)) / (crossings.length + 1),
      );
    });
  }

  /**
   * One anchor per edge on a node's border, evenly spaced between the corners and ordered by the height its edges leave
   * (right) or arrive (left) with; a node with one edge keeps the midpoint.
   *
   * @param {ReadonlyArray<{ chain: number; y: number }>} list the node's edges with the height of the other end
   * @param {string} id the node
   * @param {number} index the chain whose anchor is wanted
   * @returns {number} the anchor's y
   */
  const anchorOf = (
    list: ReadonlyArray<{ chain: number; y: number }>,
    id: string,
    index: number,
  ): number => {
    const sorted = [...list].sort((one, two) => one.y - two.y || one.chain - two.chain);
    const at = sorted.findIndex((entry) => entry.chain === index);
    const box = boxOf.get(id);
    const height = box?.height ?? 0;
    return (box?.y ?? 0) + (height * (at + 1)) / (sorted.length + 1);
  };
  const outgoing = new Map<string, Array<{ chain: number; y: number }>>();
  const incoming = new Map<string, Array<{ chain: number; y: number }>>();
  for (const [index, chain] of chains.entries()) {
    const last = chain.chain.length - 1;
    const leave = centreOf(chain.chain[1] ?? "");
    const arrive = centreOf(chain.chain[last - 1] ?? "");
    const outs = outgoing.get(chain.source) ?? [];
    outs.push({ chain: index, y: leave });
    outgoing.set(chain.source, outs);
    const ins = incoming.get(chain.target) ?? [];
    ins.push({ chain: index, y: arrive });
    incoming.set(chain.target, ins);
  }

  const through = chains.map(({ id, source, target, chain }, index) => {
    const from = layerOf.get(source) ?? 0;
    const to = layerOf.get(target) ?? 0;
    const start = boxOf.get(source);
    const end = boxOf.get(target);
    const startX = start === undefined ? 0 : start.x + start.width;
    const startY = anchorOf(outgoing.get(source) ?? [], source, index);
    const points: RoutePoint[] = [{ x: startX, y: startY }];
    let y = startY;
    for (let boundary = from; boundary < to; boundary += 1) {
      const channel = channelOf(boundary);
      const x = tracks.get(`${id}@${boundary}`) ?? channel.start;
      const next =
        boundary + 1 === to
          ? anchorOf(incoming.get(target) ?? [], target, index)
          : centreOf(chain[boundary - from + 1] ?? "");
      points.push({ x, y });
      const rise = next - y;
      const diagonal = octilinear && x + Math.abs(rise) < channel.end;
      points.push(diagonal ? { x: x + Math.abs(rise), y: next } : { x, y: next });
      y = next;
    }
    points.push({ x: end === undefined ? 0 : end.x, y });
    return { id, source, target, points: dedupe(points) };
  });
  return [...through, ...loops];
};

const LOOP_OUT = 16;
const LOOP_HALF = 6;

const loopOf = (id: string, box: Placement | undefined): Route => {
  const x = box === undefined ? 0 : box.x + box.width;
  const y = box === undefined ? 0 : box.y + box.height / 2;
  return {
    id: `${id}>${id}`,
    source: id,
    target: id,
    points: [
      { x, y: y - LOOP_HALF },
      { x: x + LOOP_OUT, y: y - LOOP_HALF },
      { x: x + LOOP_OUT, y: y + LOOP_HALF },
      { x, y: y + LOOP_HALF },
    ].map((point) => ({ ...point })),
  };
};

const dedupe = (points: ReadonlyArray<RoutePoint>): ReadonlyArray<RoutePoint> =>
  points.filter((point, index) => {
    const before = points[index - 1];
    return before === undefined || before.x !== point.x || before.y !== point.y;
  });
