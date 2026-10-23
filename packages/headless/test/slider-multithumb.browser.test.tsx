import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  sliderMultithumbBridge,
  sliderMultithumbConfig,
  sliderMultithumbProbe,
  sliderMultithumbSteps,
} from "@cssints/apg-specs/src/apg/slider-multithumb.bridge";
import baseUi from "@cssints/apg-specs/scenarios/apg/slider-multithumb.base-ui.json";
import definitionJson from "@cssints/apg-specs/src/apg/slider-multithumb.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountSliderMultithumb } from "./slider-multithumb.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/slider-multithumb.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountSliderMultithumb(sliderMultithumbConfig(config)), {
    hideableParts: [],
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail. The spec fixes two thumbs over 0..10 with values
// [3, 7], so every ported scenario (which sets other `values`/ranges) is
// `Unsupported` rather than divergent.
const DIVERGENCES: Readonly<Record<string, string>> = {};

describe("createSliderMultiThumb x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, sliderMultithumbBridge, dom);
          const divergence = DIVERGENCES[scenario.id];
          if (divergence !== undefined) {
            await expect(run).rejects.toBeInstanceOf(ScenarioMismatch);
            return;
          }
          const result = await run;
          if (result.status === "unsupported") {
            context.skip(result.reason);
          }
        });
      }
    });
  }
});

describe("createSliderMultiThumb x spec (differential walk)", () => {
  for (const config of [
    {},
    { orientation: "vertical" },
    { dir: "rtl" },
    { orientation: "vertical", dir: "rtl" },
    // controlled: a host that accepts every request, and one that holds
    { controlled: true, accepts: true },
    { controlled: true, accepts: true, values: [3, 7] },
    { controlled: true, accepts: false, values: [3, 7] },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: sliderMultithumbSteps,
        probe: sliderMultithumbProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, sliderMultithumbBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
