import { type ActionStep, type Driver, Unsupported } from "@cssints/apg-specs/scenario";
import {
  GRAPH_LAYOUT_NODES,
  GRAPH_LAYOUT_PICKS,
  type GraphLayoutPick,
  layersOf,
} from "@cssints/apg-specs/patterns/graph-layout.bridge";
import type { Schema } from "effect";

import { type Graph, type Layout, assignLayers, breakCycles, orderSlots } from "../src/index.ts";

// The spec's dummy id is the pair in model order (`ad@1`); the engine names the edge's effective ends (`a>d@1`). The six
// graphs have one-letter ids, so dropping the arrow is the whole translation.
const pairOf = (id: string): string => id.replace(">", "");

interface Pipeline {
  graph: Graph | undefined;
  oriented: Graph | undefined;
  layerOf: ReadonlyMap<string, number> | undefined;
  result: Layout | undefined;
}

const emptyPipeline = (): Pipeline => ({
  graph: undefined,
  oriented: undefined,
  layerOf: undefined,
  result: undefined,
});

/**
 * One user-level step, gated exactly as the spec's actions are: `set_graph` picks one of the six graphs, the three phases
 * only move the pipeline forward, and `layout` is all three.
 *
 * @param {Pipeline} state where the pipeline is kept
 * @param {ActionStep} action the step
 */
const perform = (state: Pipeline, action: ActionStep): void => {
  switch (action.event) {
    case "set_graph": {
      const pick = action.value;
      if (typeof pick !== "number" || !Object.hasOwn(GRAPH_LAYOUT_PICKS, pick)) {
        throw new Unsupported(`graph ${JSON.stringify(pick)}`);
      }
      state.graph = {
        nodes: GRAPH_LAYOUT_NODES,
        edges: GRAPH_LAYOUT_PICKS[pick as GraphLayoutPick].edges.split(" ").map((pair) => {
          const [source, target] = pair.split(">");
          return { source: source ?? "", target: target ?? "" };
        }),
      };
      state.oriented = undefined;
      state.layerOf = undefined;
      state.result = undefined;
      return;
    }
    case "break_cycles":
      if (state.graph !== undefined && state.oriented === undefined) {
        state.oriented = breakCycles(state.graph);
      }
      return;
    case "assign_layers":
      if (state.oriented !== undefined && state.layerOf === undefined) {
        state.layerOf = assignLayers(state.oriented);
      }
      return;
    case "order_nodes":
      if (
        state.oriented !== undefined &&
        state.layerOf !== undefined &&
        state.result === undefined
      ) {
        state.result = orderSlots(state.oriented, state.layerOf);
      }
      return;
    case "layout":
      perform(state, { event: "break_cycles" });
      perform(state, { event: "assign_layers" });
      perform(state, { event: "order_nodes" });
      return;
    default:
      throw new Unsupported(`event ${action.event}`);
  }
};

const observerOf = (value: () => Schema.Json) => ({
  focus: () => null,
  visible: () => [],
  attr: (target: string, name: string) => {
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  events: () => [],
  value,
});

/**
 * The engine as the first spec's driver: the layers, each layer's ids sorted.
 *
 * @returns {Driver} a fresh driver
 */
export const engineDriver = (): Driver => {
  const state = emptyPipeline();
  return {
    perform: (action) => perform(state, action),
    observer: observerOf(() => {
      if (state.graph === undefined) {
        throw new Unsupported("graph");
      }
      return {
        layers: layersOf(
          state.graph.nodes.map((id) => ({
            id,
            x: state.layerOf?.get(id) ?? 0,
            y: state.result?.ranks[id] ?? 0,
          })),
        ),
      };
    }),
  };
};

/**
 * The engine as the slots spec's driver: the occupants of each layer — nodes and dummies — sorted, so a layer compares as a
 * set and the order inside it stays the crossing-minimization's business.
 *
 * @returns {Driver} a fresh driver
 */
export const slotsDriver = (): Driver => {
  const state = emptyPipeline();
  return {
    perform: (action) => perform(state, action),
    observer: observerOf(() => ({
      slots: (state.result?.slots ?? []).map((ids) => ids.map(pairOf).sort()),
    })),
  };
};
