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
  meterBridge,
  meterConfig,
  meterProbe,
  meterSteps,
} from "@cssints/apg-specs/src/apg/meter.bridge";
import baseUi from "@cssints/apg-specs/scenarios/apg/meter.base-ui.json";
import definitionJson from "@cssints/apg-specs/src/apg/meter.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountMeter } from "./meter.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/meter.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountMeter(meterConfig(config)), { hideableParts: [] });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {};

describe("createMeter x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, meterBridge, dom);
          const divergence = DIVERGENCES[scenario.id];
          if (divergence !== undefined) {
            await expect(run).rejects.toThrow(ScenarioMismatch);
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

describe("createMeter x spec (differential walk)", () => {
  for (const config of [
    { value: 25, min: 0, max: 100 },
    { value: 25, min: 10, max: 50 },
    { value: 60, min: 20, max: 200 },
    { value: 150, min: 0, max: 100 },
    { value: -5, min: 0, max: 100 },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: meterSteps,
        probe: meterProbe,
        makePair: () => Promise.resolve([specDriver(model, meterBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
