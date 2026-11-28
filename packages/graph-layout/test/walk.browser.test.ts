import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import {
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  graphLayoutBridge,
  graphLayoutProbe,
  graphLayoutSteps,
} from "@cssints/apg-specs/patterns/graph-layout.bridge";
import {
  graphLayoutSlotsBridge,
  graphLayoutSlotsProbe,
  graphLayoutSlotsSteps,
} from "@cssints/apg-specs/patterns/graph-layout-slots.bridge";
import definitionJson from "@cssints/apg-specs/patterns/graph-layout.model.json";
import slotsDefinitionJson from "@cssints/apg-specs/patterns/graph-layout-slots.model.json";
import scenariosJson from "@cssints/apg-specs/scenarios/patterns/graph-layout.spec.json";
import slotsScenariosJson from "@cssints/apg-specs/scenarios/patterns/graph-layout-slots.spec.json";
import { describe, expect, it } from "vite-plus/test";

import { crossings, layout, minimizeCrossings } from "../src/index";
import { engineDriver, slotsDriver } from "./engine-driver";

const model = makeReferenceModel(decodeDefinition(definitionJson));
const slotsModel = makeReferenceModel(decodeDefinition(slotsDefinitionJson));
const scenarios = parseScenarioFile(scenariosJson);
const slotsScenarios = parseScenarioFile(slotsScenariosJson);

describe("graph-layout", () => {
  it("lays out a diamond and ranks a layer by model order", () => {
    const diamond = {
      nodes: ["a", "b", "c", "d"],
      edges: [
        { source: "a", target: "b" },
        { source: "a", target: "c" },
        { source: "b", target: "d" },
        { source: "c", target: "d" },
      ],
    };
    expect(layout(diamond)).toEqual({
      layers: [["a"], ["b", "c"], ["d"]],
      ranks: { a: 0, b: 0, c: 1, d: 0 },
      slots: [["a"], ["b", "c"], ["d"]],
    });
  });

  it("splices a long edge into a dummy and uncrosses two edges", () => {
    const long = {
      nodes: ["a", "b", "c", "d"],
      edges: [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "c", target: "d" },
        { source: "a", target: "d" },
      ],
    };
    expect(layout(long).slots).toEqual([["a"], ["b", "a>d@1"], ["c", "a>d@2"], ["d"]]);

    const crossing = {
      nodes: ["a", "b", "c", "d"],
      edges: [
        { source: "a", target: "d" },
        { source: "b", target: "c" },
      ],
    };
    const baseline = layout(crossing);
    expect(crossings(crossing, baseline)).toBe(1);
    const swept = minimizeCrossings(crossing, baseline);
    expect(crossings(crossing, swept)).toBe(0);
    expect(swept.slots).toEqual([
      ["a", "b"],
      ["d", "c"],
    ]);
    expect(swept.ranks).toEqual({ a: 0, b: 1, d: 0, c: 1 });
  });
});

describe("graph-layout x its spec (Chromium)", () => {
  it("walks the same seeded steps as the reference model", async () => {
    await differentialWalk({
      alphabet: graphLayoutSteps,
      probe: graphLayoutProbe,
      makePair: () => Promise.resolve([specDriver(model, graphLayoutBridge), engineDriver()]),
      runs: 8,
      steps: 24,
      seed: 3,
    });
  });

  it("replays the spec's scenarios", async () => {
    for (const scenario of scenarios.scenarios) {
      const result = await replayScenario(scenario, graphLayoutBridge, () => engineDriver());
      expect(result.status, scenario.id).toBe("passed");
    }
  });
});

describe("graph-layout x the slots spec (Chromium)", () => {
  it("walks the same seeded steps as the slots model", async () => {
    await differentialWalk({
      alphabet: graphLayoutSlotsSteps,
      probe: graphLayoutSlotsProbe,
      makePair: () =>
        Promise.resolve([specDriver(slotsModel, graphLayoutSlotsBridge), slotsDriver()]),
      runs: 8,
      steps: 24,
      seed: 5,
    });
  });

  it("replays the slots scenarios", async () => {
    for (const scenario of slotsScenarios.scenarios) {
      const result = await replayScenario(scenario, graphLayoutSlotsBridge, () => slotsDriver());
      expect(result.status, scenario.id).toBe("passed");
    }
  });
});
