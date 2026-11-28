import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import {
  GRAPH_LAYOUT_NODES,
  GRAPH_LAYOUT_PICKS,
} from "@cssints/apg-specs/patterns/graph-layout.bridge";

import {
  clusterBoxes,
  clusterIndexOf,
  channels,
  label,
  layout,
  minimizeCrossings,
  place,
  route,
} from "../src/index.ts";
import { clusterCorpus } from "./cluster-graphs.mjs";
import {
  bendsOf,
  bordersOf,
  crossingOf,
  overlapsOf,
  segmentsOf,
  spansChannel,
  throughBox,
} from "./geometry.mjs";
import { chain, corpus, cycle, randomGraph } from "./graphs.mjs";

const sizesOf = (graph) =>
  Object.fromEntries(
    graph.nodes.map((id, index) => [
      id,
      { width: 30 + (index % 3) * 10, height: 20 + (index % 2) * 10 },
    ]),
  );

const drew = (graph, orderedBy = (sized) => minimizeCrossings(sized, layout(sized))) => {
  const sized = { ...graph, sizes: graph.sizes ?? sizesOf(graph) };
  const ordered = orderedBy(sized);
  return { sized, ordered, boxes: place(sized, ordered) };
};

const measure = (routes) => {
  let drawn = 0;
  let bundled = 0;
  let bends = 0;
  let length = 0;
  for (const line of routes) {
    const segments = segmentsOf(line.points);
    bends += bendsOf(segments);
    for (const segment of segments) length += Math.hypot(segment.dx, segment.dy);
  }
  for (let first = 0; first < routes.length; first += 1) {
    for (let second = first + 1; second < routes.length; second += 1) {
      const one = segmentsOf(routes[first].points);
      const two = segmentsOf(routes[second].points);
      for (const mine of one) {
        for (const theirs of two) {
          if (crossingOf(mine, theirs)) drawn += 1;
          if (overlapsOf(mine, theirs) > 0) bundled += 1;
        }
      }
    }
  }
  return { drawn, bundled, bends, length };
};

const bandsOf = (ordered, boxes, nodes) =>
  ordered.slots.slice(0, -1).map((ids, boundary) => ({
    start: Math.max(
      ...ids
        .filter((id) => nodes.has(id))
        .map(
          (id) =>
            (boxes.find((box) => box.id === id)?.x ?? 0) +
            (boxes.find((box) => box.id === id)?.width ?? 0),
        ),
    ),
    end: Math.min(
      ...(ordered.slots[boundary + 1] ?? []).map(
        (id) => boxes.find((box) => box.id === id)?.x ?? 0,
      ),
    ),
  }));

const checkLattice = (graph, name, directions) => {
  const { sized, ordered, boxes } = drew(graph);
  const byId = new Map(boxes.map((box) => [box.id, box]));
  const nodes = new Set(sized.nodes);
  const options = { router: "lattice", directions };
  const routes = route(sized, ordered, boxes, options);
  const reference = route(sized, ordered, boxes);
  const bands = bandsOf(ordered, boxes, nodes);

  assert.deepEqual(
    routes.map((line) => line.id),
    reference.map((line) => line.id),
    `${name}: the same edges, in the same order`,
  );
  assert.deepEqual(
    route(sized, ordered, boxes, options),
    routes,
    `${name}: the same graph, the same routes`,
  );

  for (const [index, line] of routes.entries()) {
    const from = byId.get(line.source);
    const to = byId.get(line.target);
    assert.ok(from !== undefined && to !== undefined, `${name}: ${line.id} has ends`);
    const first = line.points[0];
    const last = line.points.at(-1);
    assert.ok(first !== undefined && last !== undefined, `${name}: ${line.id} has points`);
    const segments = segmentsOf(line.points);
    if (line.source === line.target) {
      assert.equal(line.points.length, 4, `${name}: ${line.id} is a bracket`);
      continue;
    }
    assert.equal(first.x, from.x + from.width, `${name}: ${line.id} leaves the right border`);
    assert.ok(
      first.y > from.y && first.y < from.y + from.height,
      `${name}: ${line.id} leaves inside the border`,
    );
    assert.equal(last.x, to.x, `${name}: ${line.id} arrives at the left border`);
    assert.ok(
      last.y > to.y && last.y < to.y + to.height,
      `${name}: ${line.id} arrives inside the border`,
    );
    if (line.borders === undefined) {
      assert.deepEqual(first, reference[index].points[0], `${name}: ${line.id} starts on its port`);
      assert.deepEqual(
        last,
        reference[index].points.at(-1),
        `${name}: ${line.id} ends on its band`,
      );
    }

    for (const point of line.points) {
      assert.ok(
        Number.isFinite(point.x) && Number.isFinite(point.y),
        `${name}: ${line.id} has finite points`,
      );
    }
    for (const segment of segments) {
      assert.ok(
        !(segment.horizontal && segment.vertical),
        `${name}: ${line.id} has no empty segment`,
      );
      assert.ok(
        segment.horizontal || segment.vertical || (directions === 8 && segment.diagonal),
        `${name}: ${line.id} is in its direction set`,
      );
      assert.ok(segment.to.x >= segment.from.x, `${name}: ${line.id} never goes back in x`);
    }

    const startLayer = ordered.slots.findIndex((ids) => ids.includes(line.source));
    const endLayer = ordered.slots.findIndex((ids) => ids.includes(line.target));
    for (let boundary = startLayer; boundary < endLayer; boundary += 1) {
      const band = bands[boundary];
      if (band === undefined) continue;
      const touching = segments.flatMap((segment, at) => (spansChannel(segment, band) ? [at] : []));
      assert.ok(touching.length >= 1, `${name}: ${line.id} crosses boundary ${boundary}`);
      assert.equal(
        (touching.at(-1) ?? 0) - (touching[0] ?? 0) + 1,
        touching.length,
        `${name}: ${line.id} crosses boundary ${boundary} once`,
      );
    }

    for (const segment of segments) {
      for (const box of boxes) {
        if (box.width === 0 || box.height === 0) continue;
        if (box.id === line.source || box.id === line.target) continue;
        assert.ok(!throughBox(segment, box), `${name}: ${line.id} avoids ${box.id}'s box`);
      }
    }
  }
  return measure(routes);
};

const checkClusters = (graph, name) => {
  const sized = { ...graph, sizes: sizesOf(graph) };
  const ordered = minimizeCrossings(sized, layout(sized));
  const boxes = place(sized, ordered);
  const rects = new Map(clusterBoxes(sized, boxes).map((rect) => [rect.id, rect]));
  const { owner } = clusterIndexOf(sized);
  for (const directions of [4, 8]) {
    const routes = route(sized, ordered, boxes, { router: "lattice", directions });
    assert.deepEqual(
      route(sized, ordered, boxes, { router: "lattice", directions }),
      routes,
      `${name}: the same two-level graph, the same routes (${directions})`,
    );
    for (const line of routes) {
      for (const segment of segmentsOf(line.points)) {
        for (const box of boxes) {
          if (box.width === 0 || box.height === 0) continue;
          if (box.id === line.source || box.id === line.target) continue;
          assert.ok(!throughBox(segment, box), `${name}: ${line.id} avoids ${box.id}'s box`);
        }
      }
      const cross =
        (owner.get(line.source) !== undefined &&
          owner.get(line.source) !== owner.get(line.target)) ||
        (owner.get(line.target) !== undefined && owner.get(line.target) !== owner.get(line.source));
      if (!cross) {
        assert.equal(line.borders, undefined, `${name}: ${line.id} stays inside its cluster`);
        continue;
      }
      assert.ok(line.borders !== undefined, `${name}: ${line.id} crosses a cluster's border`);
      const cluster = owner.get(line.source) ?? owner.get(line.target);
      const rect = cluster === undefined ? undefined : rects.get(cluster);
      assert.ok(rect !== undefined, `${name}: ${line.id} has a cluster box`);
      const hits = bordersOf(line.points, rect);
      assert.equal(hits.length, 1, `${name}: ${line.id} crosses ${cluster} once`);
      const port = line.borders.find((one) => one.cluster === cluster);
      assert.ok(port !== undefined, `${name}: ${line.id} reports ${cluster}'s port`);
      assert.equal(
        hits[0],
        `${port.point.x},${port.point.y}`,
        `${name}: ${line.id} crosses at its port`,
      );
      assert.ok(
        Math.abs(port.point.x - rect.x) < 1e-9 ||
          Math.abs(port.point.x - (rect.x + rect.width)) < 1e-9 ||
          Math.abs(port.point.y - rect.y) < 1e-9 ||
          Math.abs(port.point.y - (rect.y + rect.height)) < 1e-9,
        `${name}: ${line.id}'s port is on ${port.cluster}'s border`,
      );
    }
  }
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

for (const [name, graph] of shapes) {
  checkLattice(graph, name, 4);
  checkLattice(graph, name, 8);
}

const seeded = corpus(120);
for (const [seed, graph] of seeded.entries()) {
  checkLattice(graph, `corpus ${seed}`, 4);
  checkLattice(graph, `corpus ${seed}`, 8);
}

const clumped = clusterCorpus(120);
for (const [seed, graph] of clumped.entries()) checkClusters(graph, `cluster corpus ${seed}`);

{
  const graph = randomGraph(7, { maxNodes: 40, density: 0.5, isolates: 0 });
  const { sized, ordered, boxes } = drew(graph);
  const routes = route(sized, ordered, boxes, { router: "lattice", directions: 8 });
  const requests = Object.fromEntries(routes.map((line) => [line.id, { height: 12 }]));
  const slots = label(sized, ordered, boxes, routes, requests);
  const bands = channels(sized, ordered, boxes);
  assert.ok(
    routes.some((line) => segmentsOf(line.points).some((segment) => segment.diagonal)),
    "labels: the lattice draws a diagonal to label",
  );
  assert.equal(slots.length, routes.length, "labels: one slot per route");
  for (const slot of slots) {
    if (slot.boundary < 0) continue;
    const band = bands[slot.boundary];
    assert.ok(band !== undefined, `labels: ${slot.id} has a channel`);
    assert.ok(slot.x >= band.start, `labels: ${slot.id} starts inside its channel`);
    assert.ok(slot.x + slot.width <= band.end, `labels: ${slot.id} ends inside its channel`);
    for (const box of boxes) {
      if (box.width === 0 || box.height === 0) continue;
      assert.ok(
        !(
          slot.x < box.x + box.width &&
          box.x < slot.x + slot.width &&
          slot.y < box.y + box.height &&
          box.y < slot.y + slot.height
        ),
        `labels: ${slot.id} is clear of ${box.id}'s box`,
      );
    }
  }
  for (const [at, one] of slots.entries()) {
    for (const two of slots.slice(at + 1)) {
      assert.ok(
        !(
          one.x < two.x + two.width &&
          two.x < one.x + one.width &&
          one.y < two.y + two.height &&
          two.y < one.y + one.height
        ),
        `labels: ${one.id} and ${two.id} do not overlap`,
      );
    }
  }
  console.log(`labels: ${slots.length} lattice routes labelled, every box inside its channel`);
}

const micros = (perRun, count) => {
  const run = () => {
    let checksum = 0;
    for (let index = 0; index < count; index += 1) checksum += perRun(index);
    return checksum;
  };
  run();
  let best = Infinity;
  for (let round = 0; round < 3; round += 1) {
    const start = performance.now();
    const checksum = run();
    best = Math.min(best, performance.now() - start);
    if (!Number.isFinite(checksum)) console.log(`checksum ${checksum}`);
  }
  return (best * 1000) / count;
};

console.log("the lattice over the largest shapes (µs a graph, best of three)");
for (const [name, graph] of [
  ["chain of 200", chain(200)],
  ["cycle of 200", cycle(200)],
  ["dense 40", randomGraph(7, { maxNodes: 40, density: 0.5, isolates: 0 })],
]) {
  const drawing = drew(graph);
  const micro = micros(
    () => route(drawing.sized, drawing.ordered, drawing.boxes, { router: "lattice" }).length,
    1,
  );
  console.log(`  ${name.padEnd(14)} ${micro.toFixed(0)} µs`);
}

const draws = seeded.map((graph) => drew(graph));

const sweep = [];
for (const reuse of [0, 2, 5, 10]) {
  for (const crossing of [0, 5, 20]) {
    const options = { router: "lattice", lattice: { reuse, crossing } };
    const total = { drawn: 0, bundled: 0, bends: 0, length: 0 };
    for (const { sized, ordered, boxes } of draws) {
      const counts = measure(route(sized, ordered, boxes, options));
      for (const key of Object.keys(total)) total[key] += counts[key];
    }
    const micro = micros(
      (index) =>
        route(draws[index].sized, draws[index].ordered, draws[index].boxes, options).length,
      draws.length,
    );
    sweep.push({ reuse, crossing, ...total, micro });
  }
}

const round = (value) => Math.round(value);
console.log(
  "lattice, four directions: the weight sweep over 120 graphs (drawn crossings, bundled pairs, bends, px, µs)",
);
console.log("  wReuse  wCross  drawn  bundled  bends  length  µs");
for (const row of sweep) {
  console.log(
    `  ${String(row.reuse).padStart(6)}  ${String(row.crossing).padStart(6)}  ` +
      `${String(row.drawn).padStart(5)}  ${String(row.bundled).padStart(7)}  ` +
      `${String(row.bends).padStart(5)}  ${String(round(row.length)).padStart(6)}  ${row.micro.toFixed(1)}`,
  );
}

const chosen = { reuse: 0, crossing: 20 };
assert.deepEqual(
  route(draws[0].sized, draws[0].ordered, draws[0].boxes, { router: "lattice" }),
  route(draws[0].sized, draws[0].ordered, draws[0].boxes, {
    router: "lattice",
    lattice: { bend: 20, reuse: chosen.reuse, crossing: chosen.crossing },
  }),
  "the default weights are the chosen pair",
);
assert.ok(
  sweep.some((row) => row.reuse === chosen.reuse && row.crossing === chosen.crossing),
  "the chosen pair is in the sweep",
);

const configurations = [
  ["channels, 4", {}],
  ["channels, 8", { directions: 8 }],
  ["lattice, 4", { router: "lattice" }],
  ["lattice, 8", { router: "lattice", directions: 8 }],
];

const comparison = [];
for (const [name, options] of configurations) {
  const total = { drawn: 0, bundled: 0, bends: 0, length: 0 };
  for (const { sized, ordered, boxes } of draws) {
    const counts = measure(route(sized, ordered, boxes, options));
    for (const key of Object.keys(total)) total[key] += counts[key];
  }
  const micro = micros(
    (index) => route(draws[index].sized, draws[index].ordered, draws[index].boxes, options).length,
    draws.length,
  );
  const pipeline = micros((index) => {
    const { sized } = draws[index];
    const ordered = minimizeCrossings(sized, layout(sized));
    return route(sized, ordered, place(sized, ordered), options).length;
  }, draws.length);
  comparison.push({ name, ...total, micro, pipeline });
}

console.log("the routers over the same 120 swept drawings and the whole pipeline per graph");
console.log("  router         drawn  bundled  bends  length  route µs  pipeline µs");
for (const row of comparison) {
  console.log(
    `  ${row.name.padEnd(12)}  ${String(row.drawn).padStart(5)}  ${String(row.bundled).padStart(7)}  ` +
      `${String(row.bends).padStart(5)}  ${String(round(row.length)).padStart(6)}  ` +
      `${row.micro.toFixed(1).padStart(8)}  ${row.pipeline.toFixed(1).padStart(11)}`,
  );
}

const byName = new Map(comparison.map((row) => [row.name, row]));
const channelFour = byName.get("channels, 4");
const latticeFour = byName.get("lattice, 4");
assert.ok(
  latticeFour.drawn < channelFour.drawn,
  `the lattice draws fewer crossings: ${latticeFour.drawn} < ${channelFour.drawn}`,
);
assert.ok(
  latticeFour.bundled > channelFour.bundled,
  `the lattice bundles more: ${latticeFour.bundled} > ${channelFour.bundled}`,
);
assert.ok(
  latticeFour.bends <= channelFour.bends,
  `the lattice bends no more: ${latticeFour.bends} <= ${channelFour.bends}`,
);
assert.ok(
  latticeFour.length <= channelFour.length + 1e-6,
  `the lattice is no longer: ${latticeFour.length} <= ${channelFour.length}`,
);

const SIZES = Object.fromEntries(GRAPH_LAYOUT_NODES.map((id) => [id, { width: 40, height: 20 }]));
const graphOf = (pick) => ({
  nodes: [...GRAPH_LAYOUT_NODES],
  sizes: SIZES,
  edges: GRAPH_LAYOUT_PICKS[pick].edges
    .split(" ")
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const [source, target] = pair.split(">");
      return { source, target };
    }),
});

console.log("the six spec graphs (drawn/bundled/bends/length)");
for (let pick = 1; pick <= 6; pick += 1) {
  const graph = graphOf(pick);
  const ordered = minimizeCrossings(graph, layout(graph));
  const boxes = place(graph, ordered);
  const line = (options) => {
    const counts = measure(route(graph, ordered, boxes, options));
    return `${counts.drawn}/${counts.bundled}/${counts.bends}/${round(counts.length)}`;
  };
  const channel = measure(route(graph, ordered, boxes));
  const lattice = measure(route(graph, ordered, boxes, { router: "lattice" }));
  assert.ok(lattice.drawn <= channel.drawn, `pick ${pick}: the lattice draws no more crossings`);
  assert.ok(lattice.bends <= channel.bends, `pick ${pick}: the lattice bends no more`);
  console.log(
    `  pick ${pick}  channels ${line({})}  channels 8 ${line({ directions: 8 })}  ` +
      `lattice ${line({ router: "lattice" })}  lattice 8 ${line({ router: "lattice", directions: 8 })}`,
  );
}

console.log(
  `${shapes.length} shapes, ${seeded.length} seeded graphs and ${clumped.length} two-level graphs hold the lattice's contract; ` +
    `${channelFour.drawn} crossings and ${channelFour.bundled} bundled pairs for the channel router against ` +
    `${latticeFour.drawn} and ${latticeFour.bundled} for the lattice, bends ${channelFour.bends} against ${latticeFour.bends}`,
);
