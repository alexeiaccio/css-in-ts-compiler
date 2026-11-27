import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { differentialWalk, specDriver } from "@cssints/apg-specs/scenario";
import {
  graphLayoutBridge,
  graphLayoutProbe,
  graphLayoutSteps,
} from "@cssints/apg-specs/patterns/graph-layout.bridge";
import definitionJson from "@cssints/apg-specs/patterns/graph-layout.model.json";
import { describe, expect, it } from "vite-plus/test";

import { layout } from "../src/index";
import { engineDriver } from "./engine-driver";

const model = makeReferenceModel(decodeDefinition(definitionJson));

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
    });
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
});
