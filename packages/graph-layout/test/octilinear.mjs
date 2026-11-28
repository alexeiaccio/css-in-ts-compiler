import assert from "node:assert/strict";

import { layout, minimizeCrossings, place, route } from "../src/index.ts";
import { chain, corpus, cycle, randomGraph } from "./graphs.mjs";

const TOLERANCE = 1e-9;

const sizesOf = (graph) =>
  Object.fromEntries(
    graph.nodes.map((id, index) => [
      id,
      { width: 30 + (index % 3) * 10, height: 20 + (index % 2) * 10 },
    ]),
  );

const segmentsOf = (points) =>
  points.slice(1).map((to, index) => {
    const from = points[index];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const horizontal = dy === 0;
    const vertical = dx === 0;
    const diagonal = Math.abs(Math.abs(dx) - Math.abs(dy)) < TOLERANCE;
    return {
      from,
      to,
      dx,
      dy,
      horizontal,
      vertical,
      diagonal,
      kind: horizontal ? "H" : vertical ? "V" : diagonal ? "D" : "?",
    };
  });

const bendsOf = (segments) =>
  segments.slice(1).filter((segment, index) => segment.kind !== segments[index].kind).length;

const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const within = (a, b, c) =>
  c.x > Math.min(a.x, b.x) &&
  c.x < Math.max(a.x, b.x) &&
  c.y > Math.min(a.y, b.y) &&
  c.y < Math.max(a.y, b.y);

const crossingOf = (one, two) => {
  const d1 = cross(one.from, one.to, two.from);
  const d2 = cross(one.from, one.to, two.to);
  const d3 = cross(two.from, two.to, one.from);
  const d4 = cross(two.from, two.to, one.to);
  if (d1 === 0 || d2 === 0 || d3 === 0 || d4 === 0) {
    if (d1 === 0 && within(one.from, one.to, two.from)) return true;
    if (d2 === 0 && within(one.from, one.to, two.to)) return true;
    if (d3 === 0 && within(two.from, two.to, one.from)) return true;
    if (d4 === 0 && within(two.from, two.to, one.to)) return true;
    return false;
  }
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
};

const overlapsOf = (one, two) => {
  if (one.kind !== two.kind) return 0;
  if (one.horizontal && one.from.y === two.from.y) {
    return (
      Math.min(Math.max(one.from.x, one.to.x), Math.max(two.from.x, two.to.x)) -
      Math.max(Math.min(one.from.x, one.to.x), Math.min(two.from.x, two.to.x))
    );
  }
  if (one.vertical && one.from.x === two.from.x) {
    return (
      Math.min(Math.max(one.from.y, one.to.y), Math.max(two.from.y, two.to.y)) -
      Math.max(Math.min(one.from.y, one.to.y), Math.min(two.from.y, two.to.y))
    );
  }
  if (one.diagonal && two.diagonal) {
    const up = (segment) => segment.dy > 0;
    if (up(one) !== up(two)) return 0;
    const line = (segment) =>
      up(segment) ? segment.from.x - segment.from.y : segment.from.x + segment.from.y;
    if (Math.abs(line(one) - line(two)) > TOLERANCE) return 0;
    return (
      Math.min(Math.max(one.from.x, one.to.x), Math.max(two.from.x, two.to.x)) -
      Math.max(Math.min(one.from.x, one.to.x), Math.min(two.from.x, two.to.x))
    );
  }
  return 0;
};

const throughBox = (segment, box) => {
  const inset = TOLERANCE;
  const left = box.x + inset;
  const right = box.x + box.width - inset;
  const top = box.y + inset;
  const bottom = box.y + box.height - inset;
  if (right <= left || bottom <= top) return false;
  let low = 0;
  let high = 1;
  const clip = (start, delta, minimum, maximum) => {
    if (delta === 0) return start >= minimum && start <= maximum;
    const one = (minimum - start) / delta;
    const two = (maximum - start) / delta;
    low = Math.max(low, Math.min(one, two));
    high = Math.min(high, Math.max(one, two));
    return low < high;
  };
  if (!clip(segment.from.x, segment.dx, left, right)) return false;
  if (!clip(segment.from.y, segment.dy, top, bottom)) return false;
  return low < high;
};

const spansChannel = (segment, channel) =>
  Math.max(segment.from.x, segment.to.x) > channel.start &&
  Math.min(segment.from.x, segment.to.x) < channel.end;

const checkOctilinear = (graph, label, orderedBy) => {
  const sized = { ...graph, sizes: sizesOf(graph) };
  const ordered = orderedBy(sized);
  const boxes = place(sized, ordered);
  const routes = route(sized, ordered, boxes, { directions: 8 });
  const orthogonal = route(sized, ordered, boxes);
  const byId = new Map(boxes.map((box) => [box.id, box]));
  const nodes = new Set(graph.nodes);

  assert.equal(
    routes.length,
    new Set(graph.edges.map((edge) => [edge.source, edge.target].sort().join(">"))).size,
    `${label}: one route per edge`,
  );

  const channels = ordered.slots.slice(0, -1).map((ids, boundary) => {
    const start = Math.max(
      ...ids
        .filter((id) => nodes.has(id))
        .map((id) => (byId.get(id)?.x ?? 0) + (byId.get(id)?.width ?? 0)),
    );
    const end = Math.min(...(ordered.slots[boundary + 1] ?? []).map((id) => byId.get(id)?.x ?? 0));
    return { start, end };
  });
  const portsOut = new Set();
  const portsIn = new Set();

  let diagonals = 0;
  let bends = 0;
  let bendsOrthogonal = 0;
  for (const [index, line] of routes.entries()) {
    const segments = segmentsOf(line.points);
    const base = segmentsOf(orthogonal[index]?.points ?? []);
    const from = byId.get(line.source);
    const to = byId.get(line.target);
    assert.ok(from !== undefined && to !== undefined, `${label}: ${line.id} has ends`);
    const first = line.points[0];
    const last = line.points.at(-1);
    assert.ok(first !== undefined && last !== undefined, `${label}: ${line.id} has points`);
    assert.equal(
      segments.length,
      base.length,
      `${label}: ${line.id} has the orthogonal route's number of segments`,
    );
    assert.equal(
      bendsOf(segments),
      bendsOf(base),
      `${label}: ${line.id} has the orthogonal route's number of bends`,
    );
    assert.equal(
      segments.filter((segment) => segment.diagonal).length,
      base.filter((segment) => segment.vertical).length -
        segments.filter((segment) => segment.vertical).length,
      `${label}: ${line.id} replaces a vertical with each diagonal`,
    );
    diagonals += segments.filter((segment) => segment.diagonal).length;
    bends += bendsOf(segments);
    bendsOrthogonal += bendsOf(base);

    if (line.source === line.target) {
      assert.equal(line.points.length, 4, `${label}: ${line.id} is a bracket`);
    } else {
      assert.equal(first.x, from.x + from.width, `${label}: ${line.id} leaves the right border`);
      assert.ok(
        first.y > from.y && first.y < from.y + from.height,
        `${label}: ${line.id} leaves inside the border`,
      );
      assert.equal(last.x, to.x, `${label}: ${line.id} arrives at the left border`);
      assert.ok(
        last.y > to.y && last.y < to.y + to.height,
        `${label}: ${line.id} arrives inside the border`,
      );
      const startKey = `${line.source}@${first.y}`;
      const endKey = `${line.target}@${last.y}`;
      assert.ok(!portsOut.has(startKey), `${label}: ${line.id} has a port of its own`);
      assert.ok(!portsIn.has(endKey), `${label}: ${line.id} has a port of its own`);
      portsOut.add(startKey);
      portsIn.add(endKey);
      assert.ok(segments[0]?.horizontal, `${label}: ${line.id} leaves horizontally`);
      assert.ok(segments.at(-1)?.horizontal, `${label}: ${line.id} arrives horizontally`);
    }

    for (const point of line.points) {
      assert.ok(
        Number.isFinite(point.x) && Number.isFinite(point.y),
        `${label}: ${line.id} has finite points`,
      );
    }
    for (const segment of segments) {
      assert.ok(
        segment.horizontal || segment.vertical || segment.diagonal,
        `${label}: ${line.id} is one of the eight directions`,
      );
      assert.ok(
        !(segment.horizontal && segment.vertical),
        `${label}: ${line.id} has no zero-length segment`,
      );
      if (line.source !== line.target) {
        assert.ok(segment.to.x >= segment.from.x, `${label}: ${line.id} never goes back`);
      }
    }

    const startLayer = ordered.slots.findIndex((ids) => ids.includes(line.source));
    const endLayer = ordered.slots.findIndex((ids) => ids.includes(line.target));
    for (let boundary = startLayer; boundary < endLayer; boundary += 1) {
      const channel = channels[boundary];
      if (channel === undefined) continue;
      const touching = segments.flatMap((segment, at) =>
        spansChannel(segment, channel) ? [at] : [],
      );
      assert.ok(
        touching.length >= 1,
        `${label}: ${line.id} passes through boundary ${boundary}'s channel`,
      );
      const firstTouching = touching[0];
      const lastTouching = touching.at(-1);
      assert.equal(
        (lastTouching ?? 0) - (firstTouching ?? 0) + 1,
        touching.length,
        `${label}: ${line.id} crosses boundary ${boundary} once`,
      );
    }
  }

  for (const line of routes) {
    for (const segment of segmentsOf(line.points)) {
      for (const box of boxes) {
        if (box.width === 0 || box.height === 0) continue;
        if (box.id === line.source || box.id === line.target) continue;
        assert.ok(!throughBox(segment, box), `${label}: ${line.id} avoids ${box.id}'s box`);
      }
    }
  }

  let bundled = 0;
  for (let first = 0; first < routes.length; first += 1) {
    for (let second = first + 1; second < routes.length; second += 1) {
      const one = routes[first];
      const two = routes[second];
      if (one === undefined || two === undefined) continue;
      for (const mine of segmentsOf(one.points)) {
        for (const theirs of segmentsOf(two.points)) {
          if (overlapsOf(mine, theirs) <= 0) continue;
          const low = Math.max(
            Math.min(mine.from.x, mine.to.x),
            Math.min(theirs.from.x, theirs.to.x),
          );
          const high = Math.min(
            Math.max(mine.from.x, mine.to.x),
            Math.max(theirs.from.x, theirs.to.x),
          );
          const inChannel = channels.some((channel) => low >= channel.start && high <= channel.end);
          assert.ok(
            inChannel,
            `${label}: ${one.id} and ${two.id} share a segment outside a channel`,
          );
          bundled += 1;
        }
      }
    }
  }

  let drawn = 0;
  for (let first = 0; first < routes.length; first += 1) {
    for (let second = first + 1; second < routes.length; second += 1) {
      const one = routes[first];
      const two = routes[second];
      if (one === undefined || two === undefined) continue;
      for (const mine of segmentsOf(one.points)) {
        for (const theirs of segmentsOf(two.points)) {
          if (crossingOf(mine, theirs)) drawn += 1;
        }
      }
    }
  }
  return { diagonals, bends, bendsOrthogonal, drawn, bundled };
};

const shapes = [
  ["empty", { nodes: [], edges: [] }],
  ["single", { nodes: ["only"], edges: [] }],
  ["isolates", { nodes: ["a", "b", "c"], edges: [] }],
  [
    "two components",
    {
      nodes: ["a", "b", "c", "d"],
      edges: [
        { source: "a", target: "b" },
        { source: "c", target: "d" },
      ],
    },
  ],
  [
    "self loops",
    {
      nodes: ["a", "b", "c"],
      edges: [
        { source: "a", target: "a" },
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "c", target: "c" },
      ],
    },
  ],
  ["chain of 200", chain(200)],
  ["cycle of 200", cycle(200)],
  ["dense 40", randomGraph(7, { maxNodes: 40, density: 0.5, isolates: 0 })],
];

const tally = (label, orderedBy, graphs) => {
  const total = { diagonals: 0, bends: 0, bendsOrthogonal: 0, drawn: 0, bundled: 0 };
  for (const [index, graph] of graphs.entries()) {
    const counts = checkOctilinear(
      graph,
      `${label} ${index} (${graph.nodes.length} nodes)`,
      orderedBy,
    );
    assert.equal(
      counts.bends,
      counts.bendsOrthogonal,
      `${label} ${index}: the diagonals move a bend, not remove it`,
    );
    for (const key of Object.keys(total)) total[key] += counts[key];
  }
  return total;
};

for (const [name, graph] of shapes) {
  checkOctilinear(graph, name, (sized) => minimizeCrossings(sized, layout(sized)));
}

const seeded = corpus(120);
const swept = tally("swept", (sized) => minimizeCrossings(sized, layout(sized)), seeded);
const modelOrder = tally("model order", (sized) => layout(sized), seeded);

assert.ok(
  swept.drawn <= modelOrder.drawn,
  `the sweep lowers the drawn crossings: ${swept.drawn} against ${modelOrder.drawn}`,
);
console.log(
  `${shapes.length} shapes and ${seeded.length} seeded graphs route in eight directions: ` +
    `${swept.diagonals} diagonal segments of ${swept.bends} bends, ` +
    `${swept.drawn} crossings in swept drawings against ${modelOrder.drawn} at the model order, ` +
    `${swept.bundled} bundled corridor pairs`,
);
