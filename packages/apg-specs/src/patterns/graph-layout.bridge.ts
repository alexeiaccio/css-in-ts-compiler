import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import type { Schema } from "effect";

import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
  checkUnknownConfigKey,
} from "../scenario";

// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, boolean | bigint | string> = {},
): QuintEvent => ({ _tag: tag, ...params });

/** The six graphs the spec models, by the `pick` a scenario sends. */
export const GRAPH_LAYOUT_PICKS = {
  1: { name: "chain", edges: "a>b b>c" },
  2: { name: "diamond", edges: "a>b a>c b>d c>d" },
  3: { name: "islands", edges: "a>b c>d" },
  4: { name: "long-edge", edges: "a>b b>c c>d a>d" },
  5: { name: "two-cycle", edges: "a>b b>c c>b" },
  6: { name: "three-cycle", edges: "a>b b>c c>a" },
} as const;

export type GraphLayoutPick = keyof typeof GRAPH_LAYOUT_PICKS;

/** The nodes of the modelled graph, in model order. */
export const GRAPH_LAYOUT_NODES = ["a", "b", "c", "d"] as const;

const isPick = (value: Schema.Json | undefined): value is GraphLayoutPick =>
  typeof value === "number" && Object.hasOwn(GRAPH_LAYOUT_PICKS, value);

/** The spec models the pipeline, not a knob: a scenario carries no config. */
const acceptConfig = (config: ScenarioConfig): void => {
  for (const [key, raw] of Object.entries(config)) {
    checkUnknownConfigKey(key, raw);
  }
};

/** A node as a layout engine returns it: an id and a box. Only the origin is read. */
export interface Placement {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

/**
 * A layout as the spec's projection: one array of node ids per layer, left to right, each layer's ids sorted. The order
 * inside a layer is the engine's (ELK orders by the edges that reach it, not by the node order), so sorting is what lets
 * two engines' results be compared.
 *
 * @param {ReadonlyArray<Placement>} placements the nodes with their boxes
 * @returns {ReadonlyArray<ReadonlyArray<string>>} the layers
 */
export const layersOf = (
  placements: ReadonlyArray<Placement>,
): ReadonlyArray<ReadonlyArray<string>> => {
  const xs = [...new Set(placements.map((placement) => placement.x))].sort((a, b) => a - b);
  return xs.map((x) =>
    placements
      .filter((placement) => placement.x === x)
      .map((placement) => placement.id)
      .sort(),
  );
};

const layersOfState = (state: QuintModelValue): ReadonlyArray<ReadonlyArray<string>> => {
  const byLayer = new Map<number, { order: number; id: string }[]>();
  for (const id of GRAPH_LAYOUT_NODES) {
    const layer = Number(state[`layer_${id}`]);
    const order = Number(state[`order_${id}`]);
    byLayer.set(layer, [...(byLayer.get(layer) ?? []), { order, id }]);
  }
  return [...byLayer]
    .sort(([a], [b]) => a - b)
    .map(([, nodes]) =>
      nodes
        .sort((a, b) => a.order - b.order)
        .map((node) => node.id)
        .sort(),
    );
};

/**
 * Layered layout vocabulary <-> `specs/patterns/graph-layout.qnt`: `set_graph` picks one of the six modelled graphs, the
 * three phase events step the pipeline (in this order: cycle breaking, layering, ordering), and `layout` is all three at
 * once — a single step whose value is the finished layout.
 */
export const graphLayoutBridge: SpecBridge = {
  setup: (config) => {
    acceptConfig(config);
    return [];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "set_graph": {
        if (!isPick(step.value)) {
          throw new Unsupported(`graph ${JSON.stringify(step.value)}`);
        }
        return [specEvent("set_graph", { pick: BigInt(step.value) })];
      }
      case "break_cycles":
        return [specEvent("break_cycles")];
      case "assign_layers":
        return [specEvent("assign_layers")];
      case "order_nodes":
        return [specEvent("order_nodes")];
      case "layout":
        return [specEvent("break_cycles"), specEvent("assign_layers"), specEvent("order_nodes")];
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => ({ layers: layersOfState(state) }),
  focus: () => null,
  visible: () => [],
  attr: (_state, target, name) => {
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const graphLayoutSteps: ReadonlyArray<ActionStep> = [
  { event: "set_graph", value: 1 },
  { event: "set_graph", value: 2 },
  { event: "set_graph", value: 3 },
  { event: "set_graph", value: 4 },
  { event: "set_graph", value: 5 },
  { event: "set_graph", value: 6 },
  { event: "break_cycles" },
  { event: "assign_layers" },
  { event: "order_nodes" },
  { event: "layout" },
];

export const graphLayoutProbe: Probe = {
  attrs: [],
  value: true,
  events: [],
};
