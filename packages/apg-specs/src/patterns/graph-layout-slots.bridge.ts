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
import {
  GRAPH_LAYOUT_NODES,
  GRAPH_LAYOUT_PICKS,
  type GraphLayoutPick,
} from "./graph-layout.bridge";

// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, boolean | bigint | string> = {},
): QuintEvent => ({ _tag: tag, ...params });

/** The pairs of the modelled graph, in the order the spec's slot codes number them (5 is `ab`). */
export const GRAPH_LAYOUT_SLOTS_PAIRS = ["ab", "ac", "ad", "bc", "bd", "cd"] as const;

/** The layers the model can hold: four nodes in model order give a longest path of at most three. */
export const GRAPH_LAYOUT_SLOTS_LAYERS = 4;

const isPick = (value: Schema.Json | undefined): value is GraphLayoutPick =>
  typeof value === "number" && Object.hasOwn(GRAPH_LAYOUT_PICKS, value);

const acceptConfig = (config: ScenarioConfig): void => {
  for (const [key, raw] of Object.entries(config)) {
    checkUnknownConfigKey(key, raw);
  }
};

const idOf = (code: number, layer: number): string | undefined => {
  if (code === 0) return undefined;
  if (code <= GRAPH_LAYOUT_NODES.length) return GRAPH_LAYOUT_NODES[code - 1];
  const pair = GRAPH_LAYOUT_SLOTS_PAIRS[code - GRAPH_LAYOUT_NODES.length - 1];
  return pair === undefined ? undefined : `${pair}@${layer}`;
};

/**
 * The slots projection of the model: per layer, the ids of its occupants — node ids, and `pair@layer` for a dummy — sorted,
 * so a layer compares as a set. The order inside a layer is the crossing-minimization strategy's business, as in the first
 * slice, and this model's own order (nodes, then the dummy) is a baseline rather than a claim.
 *
 * @param {QuintModelValue} state the model's state
 * @returns {ReadonlyArray<ReadonlyArray<string>>} one array of ids per non-empty layer
 */
export const slotsOfState = (state: QuintModelValue): ReadonlyArray<ReadonlyArray<string>> => {
  const layers: string[][] = [];
  for (let layer = 0; layer < GRAPH_LAYOUT_SLOTS_LAYERS; layer += 1) {
    const ids: string[] = [];
    for (const slot of [0, 1]) {
      const code = Number(state[`s_${layer}${slot}`] ?? 0);
      const id = idOf(code, layer);
      if (id !== undefined) ids.push(id);
    }
    if (ids.length > 0) layers.push(ids.sort());
  }
  return layers;
};

/**
 * Slots vocabulary <-> `specs/patterns/graph-layout-slots.qnt`: the same six graphs and the same phase steps as
 * `graph-layout.qnt`, and the value is the layers' occupants. The third phase is the spec's `order_nodes` here — it orders
 * the slot contents, which is what a drawing calls ordering nodes.
 */
export const graphLayoutSlotsBridge: SpecBridge = {
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
        return [specEvent("order_slots")];
      case "layout":
        return [specEvent("break_cycles"), specEvent("assign_layers"), specEvent("order_slots")];
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => ({ slots: slotsOfState(state) }),
  focus: () => null,
  visible: () => [],
  attr: (_state, target, name) => {
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const graphLayoutSlotsSteps: ReadonlyArray<ActionStep> = [
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

export const graphLayoutSlotsProbe: Probe = {
  attrs: [],
  value: true,
  events: [],
};
