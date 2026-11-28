import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { explore } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";

import definitionJson from "../../src/patterns/graph-layout-labels.model.generated.json";
import {
  GRAPH_LAYOUT_LABELS_PAIRS,
  graphLayoutLabelsBridge,
  labelsOfState,
} from "../../src/patterns/graph-layout-labels.bridge";
import { parseScenarioFile, replayScenario, specDriver } from "../../src/scenario";
import scenariosJson from "../../scenarios/patterns/graph-layout-labels.spec.json";

// Spec-only verification for specs/patterns/graph-layout-labels.qnt: the discrete half of the engine's `label` — the boundary
// a route's label sits at and its order among the labels there. There is no second implementation with labels to compare
// against (elk-rs is not asked for them here), so the model is checked against its own invariants, the scenarios' pinned
// values, and the engine's `labelsDriver` under Bun.
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

const labelled = (pick: number): QuintModelValue =>
  run(
    step(model.initial, { _tag: "set_graph", pick: BigInt(pick) }),
    "break_cycles",
    "assign_layers",
    "order_slots",
    "place_labels",
  );

describe("patterns graph-layout-labels (spec-only)", () => {
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
      "LabelOnSpan",
      "MiddleBoundary",
      "DistinctTracks",
      "TrackOrder",
    ]);
  });

  it("has no label before the placement phase", () => {
    const slotted = run(
      step(model.initial, { _tag: "set_graph", pick: 2n }),
      "break_cycles",
      "assign_layers",
      "order_slots",
    );
    expect(labelsOfState(slotted)).toEqual([]);
    expect(labelsOfState(step(slotted, { _tag: "place_labels" }))).toEqual([
      ["ab", "ac"],
      ["bd", "cd"],
    ]);
  });

  it("puts a label at the middle boundary of a long edge", () => {
    // the long edge is a -> d across four layers: boundaries 0, 1 and 2, so the middle is 1, one-based 2
    const state = labelled(4);
    expect(state["l_ad"]).toBe(2n);
    expect(state["l_ab"]).toBe(1n);
    expect(state["l_cd"]).toBe(3n);
  });

  it("orders the labels at one boundary by their right-side slots", () => {
    // the diamond: a -> b and a -> c share boundary 0, and b takes the first slot of layer 1
    expect(labelsOfState(labelled(2))).toEqual([
      ["ab", "ac"],
      ["bd", "cd"],
    ]);
    // the long edge: ad's right side at boundary 1 is the dummy ad@2, below c, so bc comes first
    expect(labelsOfState(labelled(4))[1]).toEqual(["bc", "ad"]);
  });

  it("keeps every pair's label inside its edge's span", () => {
    for (const pick of [1, 2, 3, 4, 5, 6]) {
      const state = labelled(pick);
      for (const pair of GRAPH_LAYOUT_LABELS_PAIRS) {
        const boundary = Number(state[`l_${pair}`] ?? 0);
        if (boundary === 0) continue;
        const source = Number(state[`layer_${pair[0]}`] ?? 0);
        const target = Number(state[`layer_${pair[1]}`] ?? 0);
        expect(boundary, `${pick} ${pair}`).toBeGreaterThan(source);
        expect(boundary, `${pick} ${pair}`).toBeLessThanOrEqual(target);
      }
    }
  });

  it("holds every invariant over the whole state space", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
  });

  it("replays every scenario against the model", async () => {
    for (const scenario of scenarios.scenarios) {
      const result = await replayScenario(scenario, graphLayoutLabelsBridge, (config) =>
        specDriver(model, graphLayoutLabelsBridge, config),
      );
      expect(result.status, scenario.id).toBe("passed");
    }
  });
});
