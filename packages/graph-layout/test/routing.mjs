// Routing's contract: axis-aligned polylines from a source's border to its target's, monotone in x, through the channel of
// every boundary between its ends, through each dummy's y in the layer it crosses, never through a box, and with no two
// routes sharing a line — except the stem a shared port gives them, which is the bundling a subway map would draw once.
import assert from "node:assert/strict";

import { crossings, layout, minimizeCrossings, place, route } from "../src/index.ts";
import { chain, corpus, cycle, randomGraph } from "./graphs.mjs";

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
    return { from, to, horizontal: from.y === to.y, vertical: from.x === to.x };
  });

// The open part of a segment against a box's interior: an axis-aligned segment that runs along a border is fine.
const crossesBox = (segment, box) => {
  const { from, to } = segment;
  if (segment.horizontal) {
    const low = Math.min(from.x, to.x);
    const high = Math.max(from.x, to.x);
    return (
      from.y > box.y &&
      from.y < box.y + box.height &&
      Math.max(low, box.x) < Math.min(high, box.x + box.width)
    );
  }
  const low = Math.min(from.y, to.y);
  const high = Math.max(from.y, to.y);
  return (
    from.x > box.x &&
    from.x < box.x + box.width &&
    Math.max(low, box.y) < Math.min(high, box.y + box.height)
  );
};

const overlapOf = (one, two) => {
  if (one.horizontal && two.horizontal && one.from.y === two.from.y) {
    const low = Math.max(Math.min(one.from.x, one.to.x), Math.min(two.from.x, two.to.x));
    const high = Math.min(Math.max(one.from.x, one.to.x), Math.max(two.from.x, two.to.x));
    return high - low;
  }
  if (one.vertical && two.vertical && one.from.x === two.from.x) {
    const low = Math.max(Math.min(one.from.y, one.to.y), Math.min(two.from.y, two.to.y));
    const high = Math.min(Math.max(one.from.y, one.to.y), Math.max(two.from.y, two.to.y));
    return high - low;
  }
  return 0;
};

const crossingOf = (horizontal, vertical) => {
  const x = vertical.from.x;
  const y = horizontal.from.y;
  const inX =
    x > Math.min(horizontal.from.x, horizontal.to.x) &&
    x < Math.max(horizontal.from.x, horizontal.to.x);
  const inY =
    y > Math.min(vertical.from.y, vertical.to.y) && y < Math.max(vertical.from.y, vertical.to.y);
  return inX && inY;
};

const checkRoutes = (
  graph,
  label,
  orderedBy = (sized) => minimizeCrossings(sized, layout(sized)),
) => {
  const sized = { ...graph, sizes: sizesOf(graph) };
  const ordered = orderedBy(sized);
  const boxes = place(sized, ordered);
  const routes = route(sized, ordered, boxes);
  const byId = new Map(boxes.map((box) => [box.id, box]));
  const nodes = new Set(graph.nodes);

  assert.equal(
    routes.length,
    new Set(graph.edges.map((edge) => [edge.source, edge.target].sort().join(">"))).size,
    `${label}: one route per edge`,
  );

  for (const line of routes) {
    const from = byId.get(line.source);
    const to = byId.get(line.target);
    assert.ok(from !== undefined && to !== undefined, `${label}: ${line.id} has ends`);
    const first = line.points[0];
    const last = line.points.at(-1);
    if (line.source === line.target) {
      assert.equal(line.points.length, 4, `${label}: ${line.id} is a bracket`);
      assert.ok(
        (first?.x ?? 0) >= from.x + from.width && (last?.x ?? 0) >= from.x + from.width,
        `${label}: ${line.id} leaves and returns on the right border`,
      );
      assert.ok(
        line.points.every((point) => point.x >= from.x + from.width),
        `${label}: ${line.id} stays outside its node`,
      );
    } else {
      assert.deepEqual(
        first,
        { x: from.x + from.width, y: from.y + from.height / 2 },
        `${label}: ${line.id} starts at its source's right port`,
      );
      assert.deepEqual(
        last,
        { x: to.x, y: to.y + to.height / 2 },
        `${label}: ${line.id} ends at its target's left port`,
      );
    }
    for (const point of line.points) {
      assert.ok(
        Number.isFinite(point.x) && Number.isFinite(point.y),
        `${label}: ${line.id} has finite points`,
      );
    }
    for (const segment of segmentsOf(line.points)) {
      assert.ok(segment.horizontal || segment.vertical, `${label}: ${line.id} is axis-aligned`);
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
      const channel = { start: 0, end: 0 };
      for (const ids of [ordered.slots[boundary] ?? []]) {
        for (const id of ids) {
          if (!nodes.has(id)) continue;
          const box = byId.get(id);
          channel.start = Math.max(channel.start, (box?.x ?? 0) + (box?.width ?? 0));
        }
      }
      channel.end = Math.min(
        ...(ordered.slots[boundary + 1] ?? []).map((id) => byId.get(id)?.x ?? 0),
      );
      const insideChannel = line.points.filter(
        (point) => point.x > channel.start && point.x < channel.end,
      );
      assert.ok(
        insideChannel.length >= 1,
        `${label}: ${line.id} passes through boundary ${boundary}'s channel`,
      );
      assert.equal(
        new Set(insideChannel.map((point) => point.x)).size,
        1,
        `${label}: ${line.id} keeps one track across boundary ${boundary}`,
      );
    }
  }

  for (const line of routes) {
    for (const segment of segmentsOf(line.points)) {
      for (const box of boxes) {
        if (box.width === 0 || box.height === 0) continue;
        if (box.id === line.source || box.id === line.target) continue;
        assert.ok(!crossesBox(segment, box), `${label}: ${line.id} avoids ${box.id}'s box`);
      }
    }
  }

  // A shared line is a bundled corridor: allowed at a port both routes use, and inside a channel, where the router keeps one
  // lane per crossing and two lines can still meet at the same height. Anywhere else it is an overlap the drawing cannot fix.
  const channels = ordered.slots.slice(0, -1).map((ids, boundary) => {
    const right = Math.max(
      ...ids
        .filter((id) => nodes.has(id))
        .map((id) => (byId.get(id)?.x ?? 0) + (byId.get(id)?.width ?? 0)),
    );
    const left = Math.min(...(ordered.slots[boundary + 1] ?? []).map((id) => byId.get(id)?.x ?? 0));
    return { right, left };
  });
  let bundled = 0;
  for (let first = 0; first < routes.length; first += 1) {
    for (let second = first + 1; second < routes.length; second += 1) {
      const one = routes[first];
      const two = routes[second];
      if (one === undefined || two === undefined) continue;
      for (const mine of segmentsOf(one.points)) {
        for (const theirs of segmentsOf(two.points)) {
          const overlap = overlapOf(mine, theirs);
          if (overlap <= 0) continue;
          const sharedStart =
            one.points[0]?.x === two.points[0]?.x && one.points[0]?.y === two.points[0]?.y;
          const sharedEnd =
            one.points.at(-1)?.x === two.points.at(-1)?.x &&
            one.points.at(-1)?.y === two.points.at(-1)?.y;
          const low = Math.max(
            Math.min(mine.from.x, mine.to.x),
            Math.min(theirs.from.x, theirs.to.x),
          );
          const high = Math.min(
            Math.max(mine.from.x, mine.to.x),
            Math.max(theirs.from.x, theirs.to.x),
          );
          const inChannel = channels.some(
            (channel) => low >= channel.right && high <= channel.left,
          );
          assert.ok(
            sharedStart || sharedEnd || inChannel,
            `${label}: ${one.id} and ${two.id} share a segment outside a port or a channel`,
          );
          if (inChannel) bundled += 1;
        }
      }
    }
  }

  let crossingsInDrawing = 0;
  for (let first = 0; first < routes.length; first += 1) {
    for (let second = first + 1; second < routes.length; second += 1) {
      const one = routes[first];
      const two = routes[second];
      if (one === undefined || two === undefined) continue;
      for (const mine of segmentsOf(one.points)) {
        for (const theirs of segmentsOf(two.points)) {
          if (mine.horizontal && theirs.vertical && crossingOf(mine, theirs))
            crossingsInDrawing += 1;
          if (mine.vertical && theirs.horizontal && crossingOf(theirs, mine))
            crossingsInDrawing += 1;
        }
      }
    }
  }
  return { drawn: crossingsInDrawing, layout: crossings(sized, ordered), bundled };
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

const tally = (orderedGraphs, graphs, label) => {
  const total = { drawn: 0, layout: 0, bundled: 0 };
  for (const [index, graph] of graphs.entries()) {
    const counts = checkRoutes(
      graph,
      `${label} ${index} (${graph.nodes.length} nodes)`,
      orderedGraphs,
    );
    total.drawn += counts.drawn;
    total.layout += counts.layout;
    total.bundled += counts.bundled;
  }
  return total;
};

for (const [name, graph] of shapes) checkRoutes(graph, name);

const seeded = corpus(120);
const swept = tally((sized) => minimizeCrossings(sized, layout(sized)), seeded, "swept");
const modelOrder = tally((sized) => layout(sized), seeded, "model order");

assert.ok(
  swept.drawn <= modelOrder.drawn,
  `the sweep lowers the drawn crossings: ${swept.drawn} against ${modelOrder.drawn}`,
);
console.log(
  `${shapes.length} shapes and ${seeded.length} seeded graphs route cleanly: ` +
    `${swept.drawn} crossings in swept drawings against ${modelOrder.drawn} at the model order, ` +
    `${swept.bundled} bundled corridor pairs`,
);
