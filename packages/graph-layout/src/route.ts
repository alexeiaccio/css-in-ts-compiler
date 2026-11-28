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

/**
 * Orthogonal routes through the placement's channels: every layer boundary gets a channel, each edge crossing it gets its own
 * track there (ordered by the y it leaves with, so two verticals never share a line), and the route crosses each layer in
 * between at its dummy's y — which the placement has already put in a gap between the boxes.
 *
 * @param {Graph} graph the graph the layout and the placement belong to
 * @param {Layout} layout the layout the routes cross
 * @param {ReadonlyArray<Placement>} boxes the slots' boxes, as {@link place} returns them
 * @returns {ReadonlyArray<Route>} one route per edge, in the graph's edge order
 */
export const route = (
  graph: Graph,
  layout: Layout,
  boxes: ReadonlyArray<Placement>,
): ReadonlyArray<Route> => {
  const layerOf = new Map<string, number>();
  layout.slots.forEach((ids, layer) => ids.forEach((id) => layerOf.set(id, layer)));
  const boxOf = new Map(boxes.map((box) => [box.id, box]));
  const nodes = new Set(graph.nodes);
  const centreOf = (id: string): number => {
    const box = boxOf.get(id);
    return box === undefined ? 0 : box.y + box.height / 2;
  };

  const columns = layout.slots.map((ids) => Math.min(...ids.map((id) => boxOf.get(id)?.x ?? 0)));
  const borders = layout.slots.map((ids) =>
    Math.max(
      ...ids
        .filter((id) => nodes.has(id))
        .map((id) => (boxOf.get(id)?.x ?? 0) + (boxOf.get(id)?.width ?? 0)),
    ),
  );
  const channelOf = (boundary: number): { start: number; end: number } => ({
    start: borders[boundary] ?? 0,
    end: columns[boundary + 1] ?? 0,
  });

  const chains: Array<{ id: string; source: string; target: string; chain: string[] }> = [];
  const seen = new Set<string>();
  for (const edge of graph.edges) {
    const first = layerOf.get(edge.source);
    const last = layerOf.get(edge.target);
    if (first === undefined || last === undefined || first === last) continue;
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

  return chains.map(({ id, source, target, chain }) => {
    const from = layerOf.get(source) ?? 0;
    const to = layerOf.get(target) ?? 0;
    const start = boxOf.get(source);
    const end = boxOf.get(target);
    const startX = start === undefined ? 0 : start.x + start.width;
    const points: RoutePoint[] = [{ x: startX, y: centreOf(source) }];
    let y = centreOf(source);
    for (let boundary = from; boundary < to; boundary += 1) {
      const x = tracks.get(`${id}@${boundary}`) ?? channelOf(boundary).start;
      const next =
        boundary + 1 === to ? centreOf(target) : centreOf(chain[boundary - from + 1] ?? "");
      points.push({ x, y });
      points.push({ x, y: next });
      y = next;
    }
    points.push({ x: end === undefined ? 0 : end.x, y: centreOf(target) });
    return { id, source, target, points: dedupe(points) };
  });
};

const dedupe = (points: ReadonlyArray<RoutePoint>): ReadonlyArray<RoutePoint> =>
  points.filter((point, index) => {
    const before = points[index - 1];
    return before === undefined || before.x !== point.x || before.y !== point.y;
  });
