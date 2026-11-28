import { clusterIndexOf } from "./cluster.ts";
import { dummyId } from "./dummy.ts";
import type { Graph, Layout } from "./index.ts";
import { DEFAULT_CLUSTER_PADDING, clusterBoxes, type Placement } from "./place.ts";

/** A point of a route. */
export interface RoutePoint {
  readonly x: number;
  readonly y: number;
}

/** A port on a cluster's border: the cluster and the point the route crosses its border at. */
export interface BorderPort {
  readonly cluster: string;
  readonly point: RoutePoint;
}

/** One edge drawn: the two nodes it joins and the polyline from the source's border to the target's. */
export interface Route {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly points: ReadonlyArray<RoutePoint>;
  /** Where the route crosses a cluster's border: one port per cluster it enters or leaves, absent with no clusters. */
  readonly borders?: ReadonlyArray<BorderPort>;
}

/** The set of directions a route's segments may take: `4` is orthogonal, `8` adds the two diagonals (octilinear). */
export interface RouteOptions {
  readonly directions?: 4 | 8;
  /** The space a cluster's box keeps around its members, 12 by default: the border a port sits on is grown by it. */
  readonly clusterPadding?: number;
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
 * A graph with clusters adds the borders: an edge with one end inside a cluster crosses that border once, at a port of its own
 * (see {@link clusterBoxes} for the box), reported on the route as `borders`. The port's two bends sit in the cluster's padding
 * and in the gap beside it, so a crossing never draws a segment through a box, and a long edge's dummy row is clamped into the
 * cluster's columns while the edge is inside them.
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
  const padding = options.clusterPadding ?? DEFAULT_CLUSTER_PADDING;
  const rects = new Map(clusterBoxes(graph, boxes, padding).map((box) => [box.id, box]));
  const bordersAt = [
    ...new Set([...rects.values()].flatMap((rect) => [rect.x, rect.x + rect.width])),
  ].sort((one, two) => one - two);
  const bands: Array<readonly [number, number]> = [...rects.values()].flatMap((rect) => [
    [rect.x, rect.x + padding] as const,
    [rect.x + rect.width - padding, rect.x + rect.width] as const,
  ]);

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
        clearOf(
          channel.start + (width * (index + 1)) / (crossings.length + 1),
          bordersAt,
          channel,
          bands,
        ),
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

  const { owner } = clusterIndexOf(graph);
  const ports = portsOf(chains, owner, rects, boxOf);
  const band = Math.min(6, Math.max(1, padding / 2));
  const nodes = new Set(graph.nodes);
  const rowOf = (chain: { source: string; target: string }, id: string): number => {
    const box = boxOf.get(id);
    let y = box === undefined ? 0 : box.y + box.height / 2;
    if (box === undefined || nodes.has(id)) return y;
    for (const end of [chain.source, chain.target]) {
      const cluster = owner.get(end);
      const rect = cluster === undefined ? undefined : rects.get(cluster);
      if (rect === undefined) continue;
      if (box.x < rect.x || box.x > rect.x + rect.width) continue;
      y = Math.min(Math.max(y, rect.y + 1), rect.y + rect.height - 1);
    }
    return y;
  };

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
          : rowOf({ source, target }, chain[boundary - from + 1] ?? "");
      points.push({ x, y });
      const rise = next - y;
      const diagonal = octilinear && x + Math.abs(rise) < channel.end;
      points.push(diagonal ? { x: x + Math.abs(rise), y: next } : { x, y: next });
      y = next;
    }
    points.push({ x: end === undefined ? 0 : end.x, y });

    const borders: BorderPort[] = [];
    const open = (ports.get(index) ?? []).flatMap((port) => {
      const rect = rects.get(port.cluster);
      if (rect === undefined) return [];
      if (port.side !== "left" && port.side !== "right") return [];
      const px = port.side === "left" ? rect.x : rect.x + rect.width;
      return [{ cluster: port.cluster, px, py: port.y }];
    });
    const stepped =
      open.length === 0
        ? { points: dedupe(points), landed: [] }
        : staircase(points, open, band, bordersAt);
    const crossed = stepped.points;
    for (const port of stepped.landed) {
      borders.push({ cluster: port.cluster, point: { x: port.px, y: port.py } });
    }
    for (const port of ports.get(index) ?? []) {
      if (port.side === "left" || port.side === "right") continue;
      const rect = rects.get(port.cluster);
      if (rect === undefined) continue;
      const py = port.side === "top" ? rect.y : rect.y + rect.height;
      const point = crossing(crossed, rect, py);
      if (point !== undefined) borders.push({ cluster: port.cluster, point });
    }
    return {
      id,
      source,
      target,
      points: crossed,
      ...(borders.length === 0 ? {} : { borders }),
    };
  });
  return [...through, ...loops];
};

/**
 * A track keeps out of two places a cluster puts in its way: its border, where the port would land on a vertex instead of
 * crossing through it, and its padding band, where a row change would happen inside the box and leave through the top or the
 * bottom although the edge's other end is beyond the border. The channel is 30 px wide and a band 12, so a free pixel is
 * always there.
 *
 * @param {number} x the track a boundary's order gives
 * @param {ReadonlyArray<number>} borders every cluster border's x
 * @param {Channel} channel the band the track must stay inside
 * @param {ReadonlyArray<[number, number]>} bands the padding bands of every cluster
 * @returns {number} the track, moved if it had to be
 */
const clearOf = (
  x: number,
  borders: ReadonlyArray<number>,
  channel: Channel,
  bands: ReadonlyArray<readonly [number, number]>,
): number => {
  if (borders.length === 0 && bands.length === 0) return x;
  const free = (at: number): boolean =>
    at > channel.start &&
    at < channel.end &&
    borders.every((border) => Math.abs(border - at) > 0.5) &&
    bands.every(([low, high]) => at <= low || at >= high);
  if (free(x)) return x;
  for (let away = 1; away <= 30; away += 1) {
    if (free(x + away)) return x + away;
    if (free(x - away)) return x - away;
  }
  return x;
};

type Side = "left" | "right" | "top" | "bottom";

interface Port {
  readonly cluster: string;
  readonly side: Side;
  readonly y: number;
}

/**
 * The border ports of the cross-hierarchy edges, before the routes are drawn: an edge with one end inside a cluster leaves or
 * enters it on the side the other end lies beyond, and the left and right borders spread their ports the way a node spreads
 * its own — evenly, ordered by the height of the other end, ties by edge order. A top or bottom port needs no point of its
 * own: the route already crosses there at its track, and a track is one per edge and ordered by the same height.
 *
 * @param {ReadonlyArray<{ id: string; source: string; target: string }>} chains the routes' effective ends
 * @param {ReadonlyMap<string, string>} owner each member's cluster
 * @param {ReadonlyMap<string, Placement>} rects the cluster boxes
 * @param {ReadonlyMap<string, Placement>} boxOf every slot's box
 * @returns {ReadonlyMap<number, ReadonlyArray<Port>>} per chain, the clusters whose border it crosses
 */
const portsOf = (
  chains: ReadonlyArray<{ id: string; source: string; target: string }>,
  owner: ReadonlyMap<string, string>,
  rects: ReadonlyMap<string, Placement>,
  boxOf: ReadonlyMap<string, Placement>,
): ReadonlyMap<number, ReadonlyArray<Port>> => {
  const byCluster = new Map<string, Map<Side, Array<{ chain: number; height: number }>>>();
  const sides = new Map<number, Map<string, Side>>();
  for (const [index, chain] of chains.entries()) {
    for (const [inside, outside] of [
      [chain.source, chain.target],
      [chain.target, chain.source],
    ] as const) {
      const cluster = owner.get(inside);
      if (cluster === undefined) continue;
      if (owner.get(outside) === cluster) continue;
      const rect = rects.get(cluster);
      const box = boxOf.get(outside);
      if (rect === undefined || box === undefined) continue;
      const height = box.y + box.height / 2;
      let side: Side;
      if (box.x + box.width <= rect.x) side = "left";
      else if (box.x >= rect.x + rect.width) side = "right";
      else side = height < rect.y + rect.height / 2 ? "top" : "bottom";
      const mine = sides.get(index) ?? new Map<string, Side>();
      mine.set(cluster, side);
      sides.set(index, mine);
      if (side === "top" || side === "bottom") continue;
      const perSide =
        byCluster.get(cluster) ?? new Map<Side, Array<{ chain: number; height: number }>>();
      perSide.set(side, [...(perSide.get(side) ?? []), { chain: index, height }]);
      byCluster.set(cluster, perSide);
    }
  }
  const ports = new Map<number, Port[]>();
  for (const [cluster, perSide] of byCluster) {
    const rect = rects.get(cluster);
    if (rect === undefined) continue;
    for (const [side, list] of perSide) {
      list.sort((one, two) => one.height - two.height || one.chain - two.chain);
      list.forEach((one, at) => {
        const y = rect.y + (rect.height * (at + 1)) / (list.length + 1);
        ports.set(one.chain, [...(ports.get(one.chain) ?? []), { cluster, side, y }]);
      });
    }
  }
  for (const [index, mine] of sides) {
    for (const [cluster, side] of mine) {
      if (side !== "top" && side !== "bottom") continue;
      ports.set(index, [...(ports.get(index) ?? []), { cluster, side, y: 0 }]);
    }
  }
  return ports;
};

/**
 * The path through the border ports of one horizontal run: each port gets two bends — a jog to its height just before its
 * border and one after — so the path crosses the border on a horizontal segment at the port's own height, exactly once. The
 * jogs sit in a cluster's padding or in the gap beside it, which no box reaches, so a port never draws a segment through a box.
 *
 * @param {ReadonlyArray<RoutePoint>} points the path
 * @param {ReadonlyArray<{ px: number; py: number; cluster: string }>} ports the borders to cross
 * @param {number} band the farthest from a border a jog may sit
 * @param {ReadonlyArray<number>} borders every cluster border's x, sorted: a jog keeps out of a neighbour's box
 * @returns {{ points: RoutePoint[]; landed: ReadonlyArray<{ px: number; py: number; cluster: string }> }} the path through
 * the ports, and the ports it crossed
 */
const staircase = (
  points: ReadonlyArray<RoutePoint>,
  ports: ReadonlyArray<{ px: number; py: number; cluster: string }>,
  band: number,
  borders: ReadonlyArray<number>,
): {
  points: ReadonlyArray<RoutePoint>;
  landed: ReadonlyArray<{ px: number; py: number; cluster: string }>;
} => {
  const sorted = [...ports].sort((one, two) => one.px - two.px);
  const out: RoutePoint[] = points[0] === undefined ? [] : [points[0]];
  const landed: Array<{ px: number; py: number; cluster: string }> = [];
  let pending = sorted;
  for (let at = 1; at < points.length; at += 1) {
    const from = points[at - 1];
    const to = points[at];
    if (from === undefined || to === undefined) continue;
    const inside =
      from.y === to.y ? pending.filter((port) => from.x < port.px && port.px < to.x) : [];
    if (inside.length === 0) {
      out.push(to);
      continue;
    }
    pending = pending.filter((port) => !inside.includes(port));
    landed.push(...inside);
    let y = from.y;
    let previous = from.x;
    for (const port of inside) {
      const jog = Math.max(from.x, port.px - Math.min(band, (port.px - previous) / 2));
      out.push({ x: jog, y }, { x: jog, y: port.py });
      y = port.py;
      previous = port.px;
    }
    const last = inside[inside.length - 1];
    const px = last?.px ?? 0;
    const next = borders.find((x) => x > px);
    const step = Math.min(band, next === undefined ? band : (next - px) / 2);
    const jog = Math.min(to.x, px + step);
    out.push({ x: jog, y }, { x: jog, y: from.y }, to);
  }
  return { points: dedupe(out), landed };
};

/**
 * The point where a path's vertical segment crosses a horizontal border line, inside the cluster's x range.
 *
 * @param {ReadonlyArray<RoutePoint>} points the path
 * @param {Placement} rect the cluster's box
 * @param {number} py the border's y
 * @returns {RoutePoint | undefined} the crossing, if the path has one
 */
const crossing = (
  points: ReadonlyArray<RoutePoint>,
  rect: Placement,
  py: number,
): RoutePoint | undefined => {
  for (let at = 1; at < points.length; at += 1) {
    const from = points[at - 1];
    const to = points[at];
    if (from === undefined || to === undefined) continue;
    if (from.x !== to.x) continue;
    const low = Math.min(from.y, to.y);
    const high = Math.max(from.y, to.y);
    if (!(low < py && py < high)) continue;
    if (!(rect.x < from.x && from.x < rect.x + rect.width)) continue;
    return { x: from.x, y: py };
  }
  return undefined;
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
