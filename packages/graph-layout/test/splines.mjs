import assert from "node:assert/strict";

import ELK from "@openedges/elk-layout";
import {
  GRAPH_LAYOUT_NODES,
  GRAPH_LAYOUT_PICKS,
} from "@cssints/apg-specs/patterns/graph-layout.bridge";
import { layout, minimizeCrossings, place, route } from "../src/index.ts";
import { clusterCorpus } from "./cluster-graphs.mjs";
import { chain, corpus, cycle, randomGraph } from "./graphs.mjs";

const CURVE_SAMPLES = 16;
const RADIUS_CAP = 8;
const EPSILON = 1e-9;

const sizesOf = (graph) =>
  Object.fromEntries(
    graph.nodes.map((id, index) => [
      id,
      { width: 30 + (index % 3) * 10, height: 20 + (index % 2) * 10 },
    ]),
  );

const sampleCurve = (d) => {
  const tokens = d.trim().split(" ");
  const samples = [];
  let at = null;
  let cursor = 0;
  while (cursor < tokens.length) {
    const command = tokens[cursor];
    cursor += 1;
    if (command === "M" || command === "L") {
      at = { x: Number(tokens[cursor]), y: Number(tokens[cursor + 1]) };
      cursor += 2;
      samples.push(at);
      continue;
    }
    assert.equal(command, "C", `the curve is drawn with M, L and C, not ${command}`);
    const one = { x: Number(tokens[cursor]), y: Number(tokens[cursor + 1]) };
    const two = { x: Number(tokens[cursor + 2]), y: Number(tokens[cursor + 3]) };
    const to = { x: Number(tokens[cursor + 4]), y: Number(tokens[cursor + 5]) };
    cursor += 6;
    for (let step = 1; step <= CURVE_SAMPLES; step += 1) {
      const t = step / CURVE_SAMPLES;
      const u = 1 - t;
      samples.push({
        x: u * u * u * at.x + 3 * u * u * t * one.x + 3 * u * t * t * two.x + t * t * t * to.x,
        y: u * u * u * at.y + 3 * u * u * t * one.y + 3 * u * t * t * two.y + t * t * t * to.y,
      });
    }
    at = to;
  }
  return samples;
};

const commandsOf = (d) => d.trim().split(" ");

const cubicsOf = (d) => commandsOf(d).filter((token) => token === "C").length;

const lengthOf = (points) => {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    total += Math.hypot(to.x - from.x, to.y - from.y);
  }
  return total;
};

const distanceOf = (point, from, to) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const square = dx * dx + dy * dy;
  const at =
    square === 0
      ? 0
      : Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / square));
  return Math.hypot(point.x - (from.x + at * dx), point.y - (from.y + at * dy));
};

const distanceToPolyline = (point, points) => {
  let best = Infinity;
  for (let index = 1; index < points.length; index += 1) {
    best = Math.min(best, distanceOf(point, points[index - 1], points[index]));
  }
  return best;
};

const bboxOf = (points) =>
  points.reduce(
    (box, point) => ({
      lowX: Math.min(box.lowX, point.x),
      highX: Math.max(box.highX, point.x),
      lowY: Math.min(box.lowY, point.y),
      highY: Math.max(box.highY, point.y),
    }),
    { lowX: Infinity, highX: -Infinity, lowY: Infinity, highY: -Infinity },
  );

const turnOf = (before, corner, after) => {
  const inX = corner.x - before.x;
  const inY = corner.y - before.y;
  const outX = after.x - corner.x;
  const outY = after.y - corner.y;
  const cosine = (inX * outX + inY * outY) / (Math.hypot(inX, inY) * Math.hypot(outX, outY));
  return Math.acos(Math.min(1, Math.max(-1, cosine)));
};

const isBend = (turn) => turn > EPSILON && turn < Math.PI - EPSILON;

const crossOf = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const crossingOf = (a, b, c, d) => {
  const first = crossOf(a, b, c);
  const second = crossOf(a, b, d);
  const third = crossOf(c, d, a);
  const fourth = crossOf(c, d, b);
  if (first === 0 || second === 0 || third === 0 || fourth === 0) return null;
  if (!(first > 0 !== second > 0 && third > 0 !== fourth > 0)) return null;
  const at = first / (first - second);
  return { x: a.x + at * (b.x - a.x), y: a.y + at * (b.y - a.y) };
};

const drawnCrossings = (paths) => {
  let count = 0;
  for (let first = 0; first < paths.length; first += 1) {
    for (let second = first + 1; second < paths.length; second += 1) {
      const one = paths[first];
      const two = paths[second];
      for (let mine = 1; mine < one.length; mine += 1) {
        for (let theirs = 1; theirs < two.length; theirs += 1) {
          if (crossingOf(one[mine - 1], one[mine], two[theirs - 1], two[theirs]) !== null) {
            count += 1;
          }
        }
      }
    }
  }
  return count;
};

const throughBox = (a, b, box) => {
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
  if (!clip(a.x, b.x - a.x, box.x, box.x + box.width)) return false;
  if (!clip(a.y, b.y - a.y, box.y, box.y + box.height)) return false;
  return low < high;
};

const radiiOf = (line, bends) => {
  const tokens = commandsOf(line.curve);
  const radii = [];
  const reaches = [];
  let cursor = 0;
  let at = null;
  let bend = 0;
  while (cursor < tokens.length) {
    const command = tokens[cursor];
    cursor += 1;
    if (command === "M" || command === "L") {
      at = { x: Number(tokens[cursor]), y: Number(tokens[cursor + 1]) };
      cursor += 2;
      continue;
    }
    const start = at;
    cursor += 4;
    const to = { x: Number(tokens[cursor]), y: Number(tokens[cursor + 1]) };
    cursor += 2;
    const index = bends[bend];
    bend += 1;
    const corner = line.points[index];
    const turn = turnOf(line.points[index - 1], corner, line.points[index + 1]);
    const reach = Math.hypot(corner.x - start.x, corner.y - start.y);
    radii.push(reach / Math.tan(turn / 2));
    reaches.push({ index, reach });
    at = to;
  }
  return { radii, reaches };
};

const fresh = () => ({
  bends: 0,
  fillets: 0,
  smallest: Infinity,
  polyline: 0,
  curve: 0,
  deviation: 0,
  drawn: 0,
  curveDrawn: 0,
  worse: 0,
});

const checkRoute = (plain, line, boxes, label, tally) => {
  assert.deepEqual(line.points, plain.points, `${label}: ${line.id} keeps the polyline's points`);
  assert.deepEqual(line.borders, plain.borders, `${label}: ${line.id} keeps the polyline's ports`);
  assert.equal(typeof line.curve, "string", `${label}: ${line.id} has one curve`);

  const samples = sampleCurve(line.curve);
  const first = samples[0];
  const end = samples.at(-1);
  assert.equal(first.x, line.points[0].x, `${label}: ${line.id} starts where the polyline starts`);
  assert.equal(first.y, line.points[0].y, `${label}: ${line.id} starts where the polyline starts`);
  const last = line.points.at(-1);
  assert.equal(end.x, last.x, `${label}: ${line.id} ends where the polyline ends`);
  assert.equal(end.y, last.y, `${label}: ${line.id} ends where the polyline ends`);
  assert.equal(
    commandsOf(line.curve).filter((token) => token === "M").length,
    1,
    `${label}: ${line.id} is one path`,
  );

  for (const point of samples) {
    assert.ok(
      Number.isFinite(point.x) && Number.isFinite(point.y),
      `${label}: ${line.id} is finite`,
    );
  }

  const box = bboxOf(line.points);
  for (const point of samples) {
    assert.ok(
      point.x >= box.lowX - EPSILON &&
        point.x <= box.highX + EPSILON &&
        point.y >= box.lowY - EPSILON &&
        point.y <= box.highY + EPSILON,
      `${label}: ${line.id} stays in the polyline's box`,
    );
  }
  for (const other of boxes) {
    if (other.width === 0 || other.height === 0) continue;
    if (other.id === line.source || other.id === line.target) continue;
    for (let index = 1; index < samples.length; index += 1) {
      assert.ok(
        !throughBox(samples[index - 1], samples[index], other),
        `${label}: ${line.id} stays out of ${other.id}'s box`,
      );
    }
  }

  if (line.source !== line.target) {
    for (let index = 1; index < samples.length; index += 1) {
      assert.ok(
        samples[index].x >= samples[index - 1].x - EPSILON,
        `${label}: ${line.id} stays monotone in x`,
      );
    }
  }

  let bends = 0;
  const bendIndices = [];
  for (let index = 1; index + 1 < line.points.length; index += 1) {
    if (isBend(turnOf(line.points[index - 1], line.points[index], line.points[index + 1]))) {
      bends += 1;
      bendIndices.push(index);
    }
  }
  const { radii, reaches } = radiiOf(line, bendIndices);
  assert.equal(cubicsOf(line.curve), bends, `${label}: ${line.id} softens every bend and no more`);
  for (const index of bendIndices) {
    const before = reaches.find((reach) => reach.index === index);
    const after = reaches.find((reach) => reach.index === index + 1);
    assert.ok(before !== undefined, `${label}: ${line.id} rounds the bend at ${index}`);
    if (after === undefined) continue;
    const segment = Math.hypot(
      line.points[index + 1].x - line.points[index].x,
      line.points[index + 1].y - line.points[index].y,
    );
    assert.ok(
      before.reach + after.reach <= segment + EPSILON,
      `${label}: ${line.id} does not let two bends overlap`,
    );
  }

  tally.bends += bends;
  tally.fillets += radii.length;
  for (const radius of radii) {
    assert.ok(radius > 0 && radius <= RADIUS_CAP + EPSILON, `${label}: ${line.id} radius bound`);
    tally.smallest = Math.min(tally.smallest, radius);
  }

  const polylineLength = lengthOf(line.points);
  const curveLength = lengthOf(samples);
  assert.ok(
    curveLength <= polylineLength + EPSILON,
    `${label}: ${line.id}'s curve is no longer than its polyline`,
  );
  tally.polyline += polylineLength;
  tally.curve += curveLength;
  for (const point of samples) {
    tally.deviation = Math.max(tally.deviation, distanceToPolyline(point, line.points));
  }
};

const checkGraph = (graph, label, tally, options = {}) => {
  const sized = { ...graph, sizes: sizesOf(graph) };
  const ordered = minimizeCrossings(sized, layout(sized));
  const boxes = place(sized, ordered);
  const plain = route(sized, ordered, boxes, options);
  const curved = route(sized, ordered, boxes, { ...options, shape: "spline" });
  assert.equal(curved.length, plain.length, `${label}: one route per edge, the same count`);
  for (const [index, line] of curved.entries()) {
    assert.ok(plain[index] !== undefined, `${label}: ${line.id} has a plain route`);
    checkRoute(plain[index], line, boxes, label, tally);
  }
  const drawn = drawnCrossings(plain.map((line) => line.points.map((point) => ({ ...point }))));
  const curveDrawn = drawnCrossings(curved.map((line) => sampleCurve(line.curve)));
  tally.drawn += drawn;
  tally.curveDrawn += curveDrawn;
  if (curveDrawn > drawn) tally.worse += 1;
  return { drawn, curveDrawn };
};

const shapes = {
  empty: { nodes: [], edges: [] },
  single: { nodes: ["only"], edges: [] },
  isolates: { nodes: ["a", "b", "c"], edges: [] },
  "two components": {
    nodes: ["a", "b", "c", "d"],
    edges: [
      { source: "a", target: "b" },
      { source: "c", target: "d" },
    ],
  },
  "self loops": {
    nodes: ["a", "b", "c"],
    edges: [
      { source: "a", target: "a" },
      { source: "a", target: "b" },
      { source: "b", target: "c" },
      { source: "c", target: "c" },
    ],
  },
  "chain of 200": chain(200),
  "cycle of 200": cycle(200),
  "dense 40": randomGraph(7, { maxNodes: 40, density: 0.5, isolates: 0 }),
};
const shapeNames = Object.keys(shapes);

const tally = fresh();
for (const [name, graph] of Object.entries(shapes)) checkGraph(graph, name, tally);
const seeded = corpus(120);
for (const [index, graph] of seeded.entries()) checkGraph(graph, `seeded ${index}`, tally);

const octilinear = fresh();
for (const [name, graph] of Object.entries(shapes))
  checkGraph(graph, `eight directions ${name}`, octilinear, { directions: 8 });

const clustered = fresh();
const clumped = clusterCorpus(60);
for (const [index, graph] of clumped.entries()) checkGraph(graph, `clustered ${index}`, clustered);

const loopGraph = {
  nodes: ["a"],
  edges: [{ source: "a", target: "a" }],
  sizes: { a: { width: 40, height: 20 } },
};
const loopLayout = layout(loopGraph);
const loopBoxes = place(loopGraph, loopLayout);
const loops = route(loopGraph, loopLayout, loopBoxes, { shape: "spline" });
assert.equal(loops.length, 1, "a loop is one route");
assert.equal(cubicsOf(loops[0].curve), 2, "a loop is a bracket with two rounded corners");
assert.deepEqual(
  route(loopGraph, loopLayout, loopBoxes, { shape: "polyline" }),
  route(loopGraph, loopLayout, loopBoxes),
);
assert.equal(
  "curve" in route(loopGraph, loopLayout, loopBoxes)[0],
  false,
  "the default has no curve",
);

assert.ok(tally.worse <= 1, "the curve costs at most one of the 128 drawings a crossing");

const graphOfPick = (pick) => ({
  nodes: [...GRAPH_LAYOUT_NODES],
  sizes: Object.fromEntries(GRAPH_LAYOUT_NODES.map((id) => [id, { width: 40, height: 20 }])),
  edges: GRAPH_LAYOUT_PICKS[pick].edges
    .split(" ")
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const [source, target] = pair.split(">");
      return { source, target };
    }),
});

const OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": 20,
  "elk.layered.spacing.nodeNodeBetweenLayers": 30,
  "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
  "elk.layered.layering.strategy": "LONGEST_PATH",
  "elk.layered.crossingMinimization.strategy": "NONE",
  "elk.layered.nodePlacement.strategy": "SIMPLE",
  "elk.edgeRouting": "SPLINES",
};

const sampleSpline = (points) => {
  const samples = [points[0]];
  for (let at = 1; at + 2 < points.length; at += 3) {
    const one = points[at];
    const two = points[at + 1];
    const to = points[at + 2];
    const from = samples.at(-1);
    assert.ok(from !== undefined, "the spline has a start");
    for (let step = 1; step <= CURVE_SAMPLES; step += 1) {
      const t = step / CURVE_SAMPLES;
      const u = 1 - t;
      samples.push({
        x: u * u * u * from.x + 3 * u * u * t * one.x + 3 * u * t * t * two.x + t * t * t * to.x,
        y: u * u * u * from.y + 3 * u * u * t * one.y + 3 * u * t * t * two.y + t * t * t * to.y,
      });
    }
  }
  return samples;
};

const elk = new ELK();
const oracle = [];
for (const pick of Object.keys(GRAPH_LAYOUT_PICKS)) {
  const graph = graphOfPick(pick);
  const ordered = minimizeCrossings(graph, layout(graph));
  const boxes = place(graph, ordered);
  const paths = route(graph, ordered, boxes, { shape: "spline" });
  const ours = drawnCrossings(paths.map((line) => sampleCurve(line.curve)));

  const laid = await elk.layout({
    id: "root",
    layoutOptions: OPTIONS,
    children: GRAPH_LAYOUT_NODES.map((id) => ({ id, width: 40, height: 20 })),
    edges: graph.edges.map((edge) => ({
      id: `${edge.source}${edge.target}`,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });
  const elkPaths = [];
  let elkCubics = 0;
  for (const edge of laid.edges ?? []) {
    for (const section of edge.sections ?? []) {
      const bends = section.bendPoints ?? [];
      assert.equal((bends.length + 1) % 3, 0, `${pick}: ELK's spline is a chain of cubics`);
      elkCubics += (bends.length + 1) / 3;
      elkPaths.push(
        sampleSpline(
          [section.startPoint, ...bends, section.endPoint].filter((point) => point !== undefined),
        ),
      );
    }
  }
  const theirs = drawnCrossings(elkPaths);
  oracle.push({
    pick,
    name: GRAPH_LAYOUT_PICKS[pick].name,
    fillets: paths.reduce((sum, line) => sum + cubicsOf(line.curve), 0),
    cubic: elkCubics,
    ours,
    theirs,
  });
  assert.ok(ours <= theirs, `${pick}: the rounded corridor crosses no more than ELK's spline`);
}

assert.ok(
  oracle.reduce((sum, one) => sum + one.ours, 0) <=
    oracle.reduce((sum, one) => sum + one.theirs, 0),
  "the six drawings cross no more than ELK's",
);

const percent = (from, to) => (100 * (to - from)) / from;
console.log(
  `${shapeNames.length} shapes and ${seeded.length} seeded graphs: ${tally.fillets} fillets of ${tally.bends} bends, ` +
    `radius ${tally.smallest.toFixed(3)} to ${RADIUS_CAP} px, length ${tally.polyline.toFixed(2)} to ${tally.curve.toFixed(2)} px ` +
    `(${percent(tally.polyline, tally.curve).toFixed(2)}%), at most ${tally.deviation.toFixed(2)} px from the polyline, ` +
    `drawn crossings ${tally.drawn} to ${tally.curveDrawn} (${tally.worse} drawing worse)`,
);
console.log(
  `octilinear: ${octilinear.fillets} fillets of ${octilinear.bends} bends, length ${octilinear.polyline.toFixed(2)} to ` +
    `${octilinear.curve.toFixed(2)} px, at most ${octilinear.deviation.toFixed(2)} px off, drawn crossings ` +
    `${octilinear.drawn} to ${octilinear.curveDrawn}`,
);
console.log(
  `clustered: ${clustered.fillets} fillets of ${clustered.bends} bends, length ${clustered.polyline.toFixed(2)} to ` +
    `${clustered.curve.toFixed(2)} px, at most ${clustered.deviation.toFixed(2)} px off`,
);
for (const one of oracle) {
  console.log(
    `  graph ${one.pick} (${one.name}): ${one.fillets} fillets against ELK's ${one.cubic} cubics, ` +
      `drawn crossings ${one.ours} to ${one.theirs}`,
  );
}
