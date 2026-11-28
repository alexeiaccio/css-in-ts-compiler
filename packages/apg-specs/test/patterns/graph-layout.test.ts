import ELK from "@openedges/elk-layout";

import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { explore } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";

import definitionJson from "../../src/patterns/graph-layout.model.generated.json";
import {
  GRAPH_LAYOUT_PICKS,
  type GraphLayoutPick,
  graphLayoutBridge,
  graphLayoutProbe,
  graphLayoutSteps,
  layersOf,
} from "../../src/patterns/graph-layout.bridge";
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
import scenariosJson from "../../scenarios/patterns/graph-layout.spec.json";
import { graphOf, placementsOf } from "./elk";

// Spec-only verification for specs/patterns/graph-layout.qnt, and the oracle run it exists for: the same scenarios
// against the generated reference model and against elk-rs, the implementation the spec was written from.
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

// elk-rs as a Driver: the same steps, the engine's layout projected onto the spec's layers.
const elkDriver = (elk: ELK, _config: ScenarioConfig): Driver => {
  let layout: ReadonlyArray<ReadonlyArray<string>> | undefined;
  let phase = 0;
  return {
    perform: async (action: ActionStep) => {
      switch (action.event) {
        case "set_graph": {
          const pick = action.value;
          if (typeof pick !== "number" || !Object.hasOwn(GRAPH_LAYOUT_PICKS, pick)) {
            throw new Unsupported(`graph ${JSON.stringify(pick)}`);
          }
          const out = await elk.layout(graphOf(pick as GraphLayoutPick));
          layout = layersOf(placementsOf(out));
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
        if (phase < 3 || layout === undefined) {
          throw new Unsupported("layout");
        }
        return { layers: layout };
      },
    },
  };
};

describe("patterns graph-layout (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(model.invariants.map((invariant) => invariant.name)).toEqual([
      "GraphWellFormed",
      "PhaseInRange",
      "ReversedOnlyBackwards",
      "LayersOnlyAfterLayering",
      "LayersForward",
      "LayersTight",
      "OrdersOnlyAfterOrdering",
      "OrdersFollowModel",
    ]);
  });

  it("reverses exactly the backwards edges of a cycle", () => {
    const two = step(model.initial, { _tag: "set_graph", pick: 5n });
    const broken = step(two, { _tag: "break_cycles" });
    expect(broken["r_bc"]).toBe(true);
    expect(broken["r_ab"]).toBe(false);
  });

  it("refuses a phase out of the pipeline's order", () => {
    const input = step(model.initial, { _tag: "set_graph", pick: 4n });
    const layered = run(input, "assign_layers");
    expect(layered["phase"]).toBe(0n);
    expect(layered["layer_b"]).toBe(0n);
  });

  it("lays out the six graphs as the layers of the layered algorithm", () => {
    const expected: ReadonlyArray<ReadonlyArray<ReadonlyArray<string>>> = [
      [["a", "d"], ["b"], ["c"]],
      [["a"], ["b", "c"], ["d"]],
      [
        ["a", "c"],
        ["b", "d"],
      ],
      [["a"], ["b"], ["c"], ["d"]],
      [["a", "d"], ["b"], ["c"]],
      [["a", "d"], ["b"], ["c"]],
    ];
    for (const pick of [1, 2, 3, 4, 5, 6] as ReadonlyArray<GraphLayoutPick>) {
      const state = run(
        step(model.initial, { _tag: "set_graph", pick: BigInt(pick) }),
        "break_cycles",
        "assign_layers",
        "order_nodes",
      );
      expect(graphLayoutBridge.value?.(state), `pick ${pick}`).toEqual({
        layers: expected[pick - 1],
      });
    }
  });

  it("holds every invariant over the whole state space", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
  });

  it("replays every scenario against the model", async () => {
    for (const scenario of scenarios.scenarios) {
      const result = await replayScenario(scenario, graphLayoutBridge, (config) =>
        specDriver(model, graphLayoutBridge, config),
      );
      expect(result.status, scenario.id).toBe("passed");
    }
  });
});

describe("patterns graph-layout (elk-rs)", () => {
  const elk = new ELK();

  for (const scenario of scenarios.scenarios) {
    it(`agrees with elk-rs on ${scenario.id}`, async () => {
      const result = await replayScenario(scenario, graphLayoutBridge, (config) =>
        elkDriver(elk, config),
      );
      expect(result.status).toBe("passed");
      expect(result.status === "passed" ? result.skipped : []).toEqual([]);
    });
  }

  it("walks the same random steps as the spec", async () => {
    await differentialWalk({
      alphabet: graphLayoutSteps,
      probe: graphLayoutProbe,
      makePair: async () => [specDriver(model, graphLayoutBridge), elkDriver(elk, {})],
      runs: 5,
      steps: 20,
      seed: 7,
    });
  });
});
