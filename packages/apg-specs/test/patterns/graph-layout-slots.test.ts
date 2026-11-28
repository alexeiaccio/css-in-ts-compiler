import ELK from "@openedges/elk-layout";
import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { explore } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";

import definitionJson from "../../src/patterns/graph-layout-slots.model.generated.json";
import { GRAPH_LAYOUT_PICKS, type GraphLayoutPick } from "../../src/patterns/graph-layout.bridge";
import {
  graphLayoutSlotsBridge,
  graphLayoutSlotsProbe,
  graphLayoutSlotsSteps,
  slotsOfState,
} from "../../src/patterns/graph-layout-slots.bridge";
import {
  type ActionStep,
  type Driver,
  type ScenarioConfig,
  Unsupported,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "../../src/scenario";
import scenariosJson from "../../scenarios/patterns/graph-layout-slots.spec.json";
import { graphOf, slotsOfLayout } from "./elk";

// Spec-only verification for specs/patterns/graph-layout-slots.qnt, and the oracle run it exists for: the same scenarios
// against the generated reference model and against elk-rs, whose routes are read back as slots.
const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);
const scenarios = parseScenarioFile(scenariosJson);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (state: QuintModelValue, ...tags: ReadonlyArray<string>): QuintModelValue =>
  tags.reduce((current, tag) => step(current, { _tag: tag }), state);

const layoutOf = (pick: GraphLayoutPick): QuintModelValue =>
  run(
    step(model.initial, { _tag: "set_graph", pick: BigInt(pick) }),
    "break_cycles",
    "assign_layers",
    "order_slots",
  );

const elkSlots = (elk: ELK, _config: ScenarioConfig): Driver => {
  let slots: ReadonlyArray<ReadonlyArray<string>> | undefined;
  let phase = 0;
  return {
    perform: async (action: ActionStep) => {
      switch (action.event) {
        case "set_graph": {
          const pick = action.value;
          if (typeof pick !== "number" || !Object.hasOwn(GRAPH_LAYOUT_PICKS, pick)) {
            throw new Unsupported(`graph ${JSON.stringify(pick)}`);
          }
          const graph = await elk.layout(graphOf(pick as GraphLayoutPick));
          slots = slotsOfLayout(graph);
          phase = 0;
          return;
        }
        case "break_cycles":
          phase = phase === 0 ? 1 : phase;
          return;
        case "assign_layers":
          phase = phase === 1 ? 2 : phase;
          return;
        case "order_nodes":
          phase = phase === 2 ? 3 : phase;
          return;
        case "layout":
          phase = 3;
          return;
        default:
          throw new Unsupported(`event ${action.event}`);
      }
    },
    observer: {
      focus: () => null,
      visible: () => [],
      attr: (target, name) => {
        throw new Unsupported(`attribute ${name} on ${target}`);
      },
      events: () => [],
      value: () => {
        if (phase < 3 || slots === undefined) {
          throw new Unsupported("slots");
        }
        return { slots };
      },
    },
  };
};

describe("patterns graph-layout-slots (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(model.invariants.map((invariant) => invariant.name)).toEqual([
      "GraphWellFormed",
      "PhaseInRange",
      "ReversedOnlyBackwards",
      "LayersOnlyAfterLayering",
      "LayersForward",
      "LayersTight",
      "SlotsEmptyBeforeOrdering",
      "SlotsDense",
      "NodesInTheirLayers",
      "NodesInModelOrder",
      "DummyInItsLayer",
      "NoCrowdedLayer",
      "AtMostOneLongEdgePerLayer",
    ]);
  });

  it("splices a long edge into one dummy per layer it crosses", () => {
    expect(slotsOfState(layoutOf(4))).toEqual([["a"], ["ad@1", "b"], ["ad@2", "c"], ["d"]]);
    expect(slotsOfState(layoutOf(6))).toEqual([["a", "d"], ["ac@1", "b"], ["c"]]);
  });

  it("leaves a short edge without a dummy", () => {
    for (const pick of [1, 2, 3, 5] as ReadonlyArray<GraphLayoutPick>) {
      for (const layer of slotsOfState(layoutOf(pick))) {
        expect(
          layer.some((id) => id.includes("@")),
          `pick ${pick}`,
        ).toBe(false);
      }
    }
  });

  it("has no slots before the ordering phase", () => {
    const pick: GraphLayoutPick = 4;
    const layered = run(
      step(model.initial, { _tag: "set_graph", pick: BigInt(pick) }),
      "break_cycles",
      "assign_layers",
    );
    expect(slotsOfState(layered)).toEqual([]);
    expect(slotsOfState(step(layered, { _tag: "order_slots" }))).toEqual([
      ["a"],
      ["ad@1", "b"],
      ["ad@2", "c"],
      ["d"],
    ]);
  });

  it("puts the layer's node first and its dummy below it", () => {
    const slotted = layoutOf(4);
    expect(slotted["s_10"]).toBe(2n);
    expect(slotted["s_11"]).toBe(7n);
  });

  it("holds every invariant over the whole state space", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
  });

  it("replays every scenario against the model", async () => {
    for (const scenario of scenarios.scenarios) {
      const result = await replayScenario(scenario, graphLayoutSlotsBridge, (config) =>
        specDriver(model, graphLayoutSlotsBridge, config),
      );
      expect(result.status, scenario.id).toBe("passed");
    }
  });
});

describe("the slots projection of a drawing", () => {
  it("refuses a route drawn through a node", () => {
    const graph = {
      children: [
        { id: "a", x: 0, y: 0, width: 40, height: 20 },
        { id: "b", x: 100, y: 0, width: 40, height: 20 },
        { id: "c", x: 200, y: 0, width: 40, height: 20 },
      ],
      edges: [
        {
          id: "ac",
          sources: ["a"],
          targets: ["c"],
          sections: [
            {
              startPoint: { x: 40, y: 10 },
              bendPoints: [{ x: 150, y: 10 }],
              endPoint: { x: 200, y: 10 },
            },
          ],
        },
      ],
    };
    expect(() => slotsOfLayout(graph)).toThrow(/inside node b/);
  });
});

describe("patterns graph-layout-slots (elk-rs)", () => {
  const elk = new ELK();

  for (const scenario of scenarios.scenarios) {
    it(`agrees with elk-rs on ${scenario.id}`, async () => {
      const result = await replayScenario(scenario, graphLayoutSlotsBridge, (config) =>
        elkSlots(elk, config),
      );
      expect(result.status).toBe("passed");
      expect(result.status === "passed" ? result.skipped : []).toEqual([]);
    });
  }

  it("walks the same random steps as the spec", async () => {
    await differentialWalk({
      alphabet: graphLayoutSlotsSteps,
      probe: graphLayoutSlotsProbe,
      makePair: () =>
        Promise.resolve([specDriver(model, graphLayoutSlotsBridge), elkSlots(elk, {})]),
      runs: 5,
      steps: 20,
      seed: 11,
    });
  });
});
