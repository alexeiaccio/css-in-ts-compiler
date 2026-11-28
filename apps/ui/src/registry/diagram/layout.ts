import { label, layout, minimizeCrossings, place, route } from "@cssints/graph-layout";

import type { DiagramEdgeInput, DiagramLabelBand, DiagramNodeInput } from "./diagram.tsx";

/** The box a node gets when the caller gives no size: the skin's own default. */
const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 44;

/**
 * The gap between layers: the engine's 30 px leaves a stub too short for an edge's label (a word is ~27 px) and no room
 * for a loop's ear (20 px) beside it, so the starter lays the graph out with the room a labelled drawing needs.
 */
const LAYER_GAP = 64;

/** The room a label takes when the graph is laid out: one line of the skin's small text. */
const LABEL_HEIGHT = 18;

/** A laid-out graph: its nodes moved onto the layout, and the band each edge's label takes. */
export interface DiagramLayout {
  readonly nodes: ReadonlyArray<DiagramNodeInput>;
  readonly labelSlots: Readonly<Record<string, DiagramLabelBand>>;
}

/**
 * The starter's graph, laid out: the nodes in the diagram's own order are the engine's model order, their boxes its sizes,
 * the edges its pairs, and every node comes back at the engine's top-left. Each edge's label gets the engine's slot, keyed by
 * `from>to` and by `to>from` so the skin finds it whichever way the edge points; a loop's slot is the engine's own column
 * beside the bracket and is left out, because the skin draws a loop's label itself. Nothing of the input is mutated, so a
 * second press reads the same graph and gives the same drawing.
 *
 * @param {ReadonlyArray<DiagramNodeInput>} nodes the graph's nodes, in the diagram's order
 * @param {ReadonlyArray<DiagramEdgeInput>} edges the graph's edges
 * @returns {DiagramLayout} the same nodes, moved onto the layout, and the labels' bands
 */
export const layOut = (
  nodes: ReadonlyArray<DiagramNodeInput>,
  edges: ReadonlyArray<DiagramEdgeInput>,
): DiagramLayout => {
  const sizes = Object.fromEntries(
    nodes.map((node) => [
      node.id,
      { width: node.width ?? DEFAULT_WIDTH, height: node.height ?? DEFAULT_HEIGHT },
    ]),
  );
  const graph = {
    nodes: nodes.map((node) => node.id),
    sizes,
    edges: edges.map((edge) => ({ source: edge.from, target: edge.to })),
  };
  const ordered = minimizeCrossings(graph, layout(graph));
  const boxes = place(graph, ordered, { layers: LAYER_GAP });
  const routes = route(graph, ordered, boxes);
  const asked = Object.fromEntries(routes.map((line) => [line.id, { height: LABEL_HEIGHT }]));
  const labelSlots: Record<string, DiagramLabelBand> = {};
  for (const slot of label(graph, ordered, boxes, routes, asked)) {
    if (slot.boundary < 0) continue;
    const band = { x: slot.x, y: slot.y, width: slot.width, height: slot.height };
    const [from = "", to = ""] = slot.id.split(">");
    labelSlots[slot.id] = band;
    labelSlots[`${to}>${from}`] = band;
  }
  const moved = new Map(boxes.map((box) => [box.id, box]));
  return {
    nodes: nodes.map((node) => {
      const box = moved.get(node.id);
      return box === undefined ? node : { ...node, x: box.x, y: box.y };
    }),
    labelSlots,
  };
};
