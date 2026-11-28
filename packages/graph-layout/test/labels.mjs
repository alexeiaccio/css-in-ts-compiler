// Labels' contract: one slot per requested route, in route order; the box inside the channel of the boundary it sits at,
// clear of every node box and of every other label; the ideal y never moved up; the order at a boundary the routes' own. Then
// the corpus measured against a greedy first-fit, which is the baseline a search would start from.
import assert from "node:assert/strict";

import { channels, label, layout, minimizeCrossings, place, route } from "../src/index.ts";
import { chain, corpus, cycle, randomGraph } from "./graphs.mjs";

const HEIGHT = 12;
const GAP = 4;
const INSET = 2;

const sizesOf = (graph) =>
  Object.fromEntries(
    graph.nodes.map((id, index) => [
      id,
      { width: 30 + (index % 3) * 10, height: 20 + (index % 2) * 10 },
    ]),
  );

const overlap = (one, two) =>
  one.x < two.x + two.width &&
  two.x < one.x + one.width &&
  one.y < two.y + two.height &&
  two.y < one.y + one.height;

const sortedByY = (slots) =>
  [...slots].sort((one, two) => one.y - two.y || one.id.localeCompare(two.id));

const idealOf = (line, channel) => {
  const through = line.points.filter((point) => point.x >= channel.start && point.x <= channel.end);
  const head = through[0];
  const tail = through[through.length - 1];
  return ((head?.y ?? 0) + (tail?.y ?? 0)) / 2;
};

/**
 * The routes that want a label, grouped by the boundary the engine gives them.
 *
 * @param {object} graph the sized graph
 * @param {object} ordered its layout
 * @param {ReadonlyArray<object>} boxes the placed slots
 * @param {ReadonlyArray<object>} routes its routes
 * @returns {Map<number, Array<object>>} per boundary, the routes with their ideal y and channel
 */
const groupsOf = (graph, ordered, boxes, routes) => {
  const bands = channels(graph, ordered, boxes);
  const layerOf = new Map();
  ordered.slots.forEach((ids, layer) => ids.forEach((id) => layerOf.set(id, layer)));
  const groups = new Map();
  for (const line of routes) {
    if (line.source === line.target) continue;
    const first = layerOf.get(line.source) ?? 0;
    const last = layerOf.get(line.target) ?? 0;
    const boundary = first + Math.floor((last - first - 1) / 2);
    const channel = bands[boundary] ?? { start: 0, end: 0 };
    const list = groups.get(boundary) ?? [];
    list.push({ line, channel, idealY: idealOf(line, channel), id: line.id });
    groups.set(boundary, list);
  }
  return groups;
};

const checkLabels = (
  graph,
  name,
  orderedBy = (sized) => minimizeCrossings(sized, layout(sized)),
) => {
  const sized = { ...graph, sizes: sizesOf(graph) };
  const ordered = orderedBy(sized);
  const boxes = place(sized, ordered);
  const routes = route(sized, ordered, boxes);
  const requests = Object.fromEntries(routes.map((line) => [line.id, { height: HEIGHT }]));
  const slots = label(sized, ordered, boxes, routes, requests);

  assert.deepEqual(
    slots.map((slot) => slot.id),
    routes.filter((line) => requests[line.id] !== undefined).map((line) => line.id),
    `${name}: one slot per requested route, in route order`,
  );
  assert.deepEqual(
    label(sized, ordered, boxes, routes, requests),
    slots,
    `${name}: the same graph gives the same labels`,
  );

  const bands = channels(sized, ordered, boxes);
  const groups = groupsOf(sized, ordered, boxes, routes);
  for (const slot of slots) {
    if (slot.boundary < 0) continue;
    const channel = bands[slot.boundary] ?? { start: 0, end: 0 };
    assert.ok(slot.x >= channel.start, `${name}: ${slot.id} starts inside its channel`);
    assert.ok(slot.x + slot.width <= channel.end, `${name}: ${slot.id} ends inside its channel`);
    const line = routes.find((one) => one.id === slot.id);
    const channel2 = groups.get(slot.boundary)?.find((one) => one.id === slot.id)?.channel;
    assert.deepEqual(channel2, channel, `${name}: ${slot.id} is at the boundary it crosses`);
    const ideal = line === undefined ? 0 : idealOf(line, channel);
    assert.ok(
      slot.y >= ideal - slot.height / 2 - 1e-9,
      `${name}: ${slot.id} never moves up from its ideal band`,
    );
  }

  for (const [first, one] of slots.entries()) {
    for (const two of slots.slice(first + 1)) {
      if (one.boundary < 0 !== two.boundary < 0) continue;
      assert.ok(!overlap(one, two), `${name}: ${one.id} and ${two.id} do not overlap`);
    }
  }

  for (const slot of slots) {
    for (const box of boxes) {
      if (box.width === 0 || box.height === 0) continue;
      assert.ok(!overlap(slot, box), `${name}: ${slot.id} is clear of ${box.id}'s box`);
    }
  }

  for (const [boundary, ids] of groups) {
    const here = sortedByY(slots.filter((slot) => slot.boundary === boundary));
    const wanted = [...ids]
      .sort((one, two) => one.idealY - two.idealY || one.id.localeCompare(two.id))
      .map((one) => one.id);
    assert.deepEqual(
      here.map((slot) => slot.id),
      wanted,
      `${name}: boundary ${boundary}'s order`,
    );
    for (let index = 1; index < here.length; index += 1) {
      const above = here[index - 1];
      const below = here[index];
      assert.ok(
        (below?.y ?? 0) >= (above?.y ?? 0) + (above?.height ?? 0) + GAP - 1e-9,
        `${name}: boundary ${boundary} keeps its gap`,
      );
    }
  }

  return { slots, routes, boxes, groups, bands };
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

for (const [name, graph] of shapes) checkLabels(graph, name);

const looped = shapes.find(([name]) => name === "self loops")?.[1];
const loopCheck = checkLabels(looped, "self loops");
for (const slot of loopCheck.slots) {
  if (slot.boundary >= 0) continue;
  const line = loopCheck.routes.find((one) => one.id === slot.id);
  assert.ok(line !== undefined && line.source === line.target, `self loops: ${slot.id} is a loop`);
  assert.equal(
    slot.x,
    Math.max(...line.points.map((point) => point.x)) + GAP,
    "self loops: beside",
  );
  assert.equal(
    slot.y,
    (Math.min(...line.points.map((point) => point.y)) +
      Math.max(...line.points.map((point) => point.y))) /
      2 -
      HEIGHT / 2,
    "self loops: centred on the bracket",
  );
}

{
  const graph = {
    nodes: ["a", "b"],
    edges: [{ source: "a", target: "b" }],
    sizes: { a: { width: 40, height: 20 }, b: { width: 40, height: 20 } },
  };
  const ordered = layout(graph);
  const boxes = place(graph, ordered);
  const routes = route(graph, ordered, boxes);
  const [wide] = label(graph, ordered, boxes, routes, { "a>b": { width: 500, height: HEIGHT } });
  const channel = channels(graph, ordered, boxes)[0];
  assert.ok(channel !== undefined && wide !== undefined, "clamped: one label and one channel");
  assert.equal(wide.width, channel.end - channel.start - 2 * INSET, "clamped: to the channel");
  assert.equal(wide.x, channel.start + INSET, "clamped: against the channel's inset");
  const [none] = label(graph, ordered, boxes, routes, { "a>b": { height: HEIGHT } });
  assert.equal(none?.width, channel.end - channel.start - 2 * INSET, "unmeasured: the band");
}

const seeded = corpus(120);

const drift = (slots, groups) => {
  let total = 0;
  let worst = 0;
  for (const slot of slots) {
    if (slot.boundary < 0) continue;
    const wanted = groups.get(slot.boundary)?.find((one) => one.id === slot.id);
    if (wanted === undefined) continue;
    const moved = Math.abs(slot.y - (wanted.idealY - slot.height / 2));
    total += moved;
    worst = Math.max(worst, moved);
  }
  return { total, worst, count: slots.filter((slot) => slot.boundary >= 0).length };
};

/**
 * The baseline: the same order, each label at its ideal band if it is free, else the first free band below it and then above
 * it, stepping by a label and a gap, and given up after 64 steps or outside the drawing's own y extent.
 *
 * @param {ReadonlyArray<object>} routes every route, for the shape of the request
 * @param {Map<number, Array<object>>} groups the routes by boundary
 * @param {number} extent the drawing's lowest y
 * @returns {{ placed: Array<object>, givenUp: number }} the labels the greedy keeps, and the ones it gives up on
 */
const greedy = (routes, groups, extent) => {
  const placed = [];
  let givenUp = 0;
  for (const [boundary, ids] of [...groups].sort((one, two) => one[0] - two[0])) {
    const here = [];
    const sorted = [...ids].sort(
      (one, two) => one.idealY - two.idealY || one.id.localeCompare(two.id),
    );
    for (const candidate of sorted) {
      const ideal = candidate.idealY - HEIGHT / 2;
      const free = (y) =>
        y >= 0 &&
        y + HEIGHT <= extent &&
        here.every((one) => y >= one.y + HEIGHT + GAP || one.y >= y + HEIGHT + GAP);
      let y;
      if (free(ideal)) {
        y = ideal;
      } else {
        for (let step = 1; step <= 64 && y === undefined; step += 1) {
          const down = ideal + step * (HEIGHT + GAP);
          const up = ideal - step * (HEIGHT + GAP);
          if (free(down)) y = down;
          else if (free(up)) y = up;
        }
      }
      if (y === undefined) {
        givenUp += 1;
        continue;
      }
      here.push({ id: candidate.id, y, ideal, boundary });
      placed.push({ id: candidate.id, y, ideal, boundary });
    }
  }
  return { placed, givenUp };
};

const tally = (orderedBy, labelName) => {
  const total = {
    labels: 0,
    boundaries: 0,
    crowded: 0,
    drift: 0,
    worst: 0,
    baseline: 0,
    baselineDrift: 0,
    baselineWorst: 0,
    givenUp: 0,
    atIdeal: 0,
    baselineAtIdeal: 0,
    deepest: 0,
  };
  for (const graph of seeded) {
    const sized = { ...graph, sizes: sizesOf(graph) };
    const ordered = orderedBy(sized);
    const boxes = place(sized, ordered);
    const routes = route(sized, ordered, boxes);
    const requests = Object.fromEntries(routes.map((line) => [line.id, { height: HEIGHT }]));
    const slots = label(sized, ordered, boxes, routes, requests);
    const groups = groupsOf(sized, ordered, boxes, routes);
    const extent = Math.max(0, ...boxes.map((box) => box.y + box.height));

    const moved = drift(slots, groups);
    total.labels += moved.count;
    total.drift += moved.total;
    total.worst = Math.max(total.worst, moved.worst);
    for (const [boundary, ids] of groups) {
      total.boundaries += 1;
      if (ids.length >= 2) total.crowded += 1;
      total.deepest = Math.max(total.deepest, ids.length);
      for (const one of ids) {
        const slot = slots.find((candidate) => candidate.id === one.id);
        if (slot !== undefined && slot.y === one.idealY - HEIGHT / 2) total.atIdeal += 1;
        void boundary;
      }
    }

    const attempt = greedy(routes, groups, extent);
    total.baseline += attempt.placed.length;
    total.givenUp += attempt.givenUp;
    for (const one of attempt.placed) {
      total.baselineDrift += Math.abs(one.y - one.ideal);
      total.baselineWorst = Math.max(total.baselineWorst, Math.abs(one.y - one.ideal));
      if (one.y === one.ideal) total.baselineAtIdeal += 1;
    }
  }
  console.log(
    `${labelName}: ${total.labels} labels at ${total.boundaries} boundaries (${total.crowded} with two or more); ` +
      `engine ${total.atIdeal} at the ideal band, drift ${(total.drift / Math.max(1, total.labels)).toFixed(2)} px mean, ` +
      `${total.worst.toFixed(2)} px max; greedy first-fit ${total.baseline} placed, ${total.givenUp} given up, ` +
      `${total.baselineAtIdeal} at the ideal band, drift ` +
      `${(total.baselineDrift / Math.max(1, total.baseline)).toFixed(2)} px mean, ` +
      `${total.baselineWorst.toFixed(2)} px max; deepest stack ${total.deepest}`,
  );
  return total;
};

tally((sized) => minimizeCrossings(sized, layout(sized)), "swept");
tally((sized) => layout(sized), "model order");
