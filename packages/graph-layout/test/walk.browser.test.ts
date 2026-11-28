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

import { crossings, layout, minimizeCrossings, place, route } from "../src/index";
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

  it("places the diamond's boxes in three columns", () => {
    const sizes = Object.fromEntries(
      ["a", "b", "c", "d"].map((id) => [id, { width: 40, height: 20 }]),
    );
    const diamond = {
      nodes: ["a", "b", "c", "d"],
      sizes,
      edges: [
        { source: "a", target: "b" },
        { source: "a", target: "c" },
        { source: "b", target: "d" },
        { source: "c", target: "d" },
      ],
    };
    expect(place(diamond, layout(diamond))).toEqual([
      { id: "a", x: 0, y: 20, width: 40, height: 20 },
      { id: "b", x: 70, y: 0, width: 40, height: 20 },
      { id: "c", x: 70, y: 40, width: 40, height: 20 },
      { id: "d", x: 140, y: 20, width: 40, height: 20 },
    ]);
  });

  it("puts a long edge's dummies in the gap of the layers they cross", () => {
    const sizes = Object.fromEntries(
      ["a", "b", "c", "d"].map((id) => [id, { width: 40, height: 20 }]),
    );
    const long = {
      nodes: ["a", "b", "c", "d"],
      sizes,
      edges: [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "c", target: "d" },
        { source: "a", target: "d" },
      ],
    };
    const boxes = place(long, layout(long));
    expect(boxes.filter((box) => box.id.includes(">"))).toEqual([
      { id: "a>d@1", x: 70, y: 40, width: 0, height: 0 },
      { id: "a>d@2", x: 140, y: 40, width: 0, height: 0 },
    ]);
  });

  it("draws a route as a path the DOM measures", () => {
    const sizes = Object.fromEntries(
      ["a", "b", "c", "d"].map((id) => [id, { width: 40, height: 20 }]),
    );
    const diamond = {
      nodes: ["a", "b", "c", "d"],
      sizes,
      edges: [
        { source: "a", target: "b" },
        { source: "a", target: "c" },
        { source: "b", target: "d" },
        { source: "c", target: "d" },
      ],
    };
    const ordered = layout(diamond);
    const [line] = route(diamond, ordered, place(diamond, ordered));
    expect(line).toBeDefined();
    if (line === undefined) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${line.points.map((point) => `${point.x} ${point.y}`).join(" L ")}`);
    document.body.append(path);
    const measured = line.points.slice(1).reduce((sum, point, index) => {
      const before = line.points[index];
      return before === undefined ? sum : sum + Math.hypot(point.x - before.x, point.y - before.y);
    }, 0);
    expect(path.getTotalLength()).toBeCloseTo(measured, 3);
    const start = path.getPointAtLength(0);
    expect(start.x).toBeCloseTo(line.points[0]?.x ?? 0, 3);
    expect(start.y).toBeCloseTo(line.points[0]?.y ?? 0, 3);
    path.remove();
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
