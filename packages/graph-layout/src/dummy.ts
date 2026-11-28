import type { Edge } from "./index.ts";

/**
 * The id of a long edge's dummy in a layer: `a>d@1`.
 *
 * @param {Edge} edge the edge, in its effective direction
 * @param {number} layer the layer the dummy sits in
 * @returns {string} the dummy's id
 */
export const dummyId = (edge: Edge, layer: number): string =>
  `${edge.source}>${edge.target}@${layer}`;
