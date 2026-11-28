import { layout, minimizeCrossings, place } from "@cssints/graph-layout";

import type { DiagramEdgeInput, DiagramNodeInput } from "./diagram.tsx";

/** The box a node gets when the caller gives no size: the skin's own default. */
const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 44;

/**
 * The starter's graph, laid out: the nodes in the diagram's own order are the engine's model order, their boxes its sizes,
 * the edges its pairs, and every node comes back at the engine's top-left. Nothing of the input is mutated, so a second press
 * reads the same graph and gives the same drawing.
 *
 * @param {ReadonlyArray<DiagramNodeInput>} nodes the graph's nodes, in the diagram's order
 * @param {ReadonlyArray<DiagramEdgeInput>} edges the graph's edges
 * @returns {ReadonlyArray<DiagramNodeInput>} the same nodes, moved onto the layout
 */
export const layOut = (
  nodes: ReadonlyArray<DiagramNodeInput>,
  edges: ReadonlyArray<DiagramEdgeInput>,
): ReadonlyArray<DiagramNodeInput> => {
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
  const boxes = new Map(place(graph, ordered).map((box) => [box.id, box]));
  return nodes.map((node) => {
    const box = boxes.get(node.id);
    return box === undefined ? node : { ...node, x: box.x, y: box.y };
  });
};
