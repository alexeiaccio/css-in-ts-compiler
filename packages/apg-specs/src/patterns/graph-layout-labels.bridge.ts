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

/** The pairs of the modelled graph, in model order — the order a tie at one track falls back to. */
export const GRAPH_LAYOUT_LABELS_PAIRS = ["ab", "ac", "ad", "bc", "bd", "cd"] as const;

const isPick = (value: Schema.Json | undefined): value is GraphLayoutPick =>
  typeof value === "number" && Object.hasOwn(GRAPH_LAYOUT_PICKS, value);

const acceptConfig = (config: ScenarioConfig): void => {
  for (const [key, raw] of Object.entries(config)) {
    checkUnknownConfigKey(key, raw);
  }
};

/**
 * The labels projection of the model: per boundary that carries one, the pair ids in track order. A pair without a label
 * (`l_<pair>` is 0) is not in any group, and the groups are the boundaries from the lowest up.
 *
 * @param {QuintModelValue} state the model's state
 * @returns {ReadonlyArray<ReadonlyArray<string>>} one array of pair ids per boundary that has a label
 */
export const labelsOfState = (state: QuintModelValue): ReadonlyArray<ReadonlyArray<string>> => {
  const at = new Map<number, Array<{ pair: string; track: number }>>();
  for (const pair of GRAPH_LAYOUT_LABELS_PAIRS) {
    const boundary = Number(state[`l_${pair}`] ?? 0);
    if (boundary === 0) continue;
    at.set(boundary, [
      ...(at.get(boundary) ?? []),
      { pair, track: Number(state[`o_${pair}`] ?? 0) },
    ]);
  }
  return [...at]
    .sort((one, two) => one[0] - two[0])
    .map(([, labels]) =>
      [...labels].sort((one, two) => one.track - two.track).map((label) => label.pair),
    );
};

/** Labels vocabulary <-> `specs/patterns/graph-layout-labels.qnt`: the six graphs, the four phases, and the labels. */
export const graphLayoutLabelsBridge: SpecBridge = {
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
      case "order_slots":
        return [specEvent("order_slots")];
      case "place_labels":
        return [specEvent("place_labels")];
      case "layout":
        return [specEvent("break_cycles"), specEvent("assign_layers"), specEvent("order_slots")];
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => ({ boundaries: labelsOfState(state) }),
  focus: () => null,
  visible: () => [],
  attr: (_state, target, name) => {
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  events: () => [],
};

/** Every node the model knows: the six graphs are four nodes. */
export const GRAPH_LAYOUT_LABELS_NODES = GRAPH_LAYOUT_NODES;

/** The user-level steps a differential walk draws from. */
export const graphLayoutLabelsSteps: ReadonlyArray<ActionStep> = [
  ...[1, 2, 3, 4, 5, 6].map((pick) => ({ event: "set_graph", value: pick })),
  { event: "break_cycles" },
  { event: "assign_layers" },
  { event: "order_slots" },
  { event: "place_labels" },
  { event: "layout" },
];

export const graphLayoutLabelsProbe: Probe = {
  attrs: [],
  value: true,
  events: [],
};
