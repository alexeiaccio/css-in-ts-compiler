import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import {
  alertBridge,
  alertConfig,
  alertProbe,
  alertSteps,
} from "@cssints/apg-specs/src/apg/alert.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import baseUi from "@cssints/apg-specs/scenarios/apg/alert.base-ui.json";
import definitionJson from "@cssints/apg-specs/src/apg/alert.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountAlert } from "./alert.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/alert.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountAlert(alertConfig(config)), { hideableParts: [] });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "alert.react-aria.toast-content-role-alert":
    "the useToast defaults suite mounts a toast eagerly; APG (and the other ported suites) render no live region until a message exists",
};

describe("createAlert x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, alertBridge, dom);
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

describe("createAlert x spec (differential walk)", () => {
  for (const config of [{}, { titleId: "toast-title" }]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: alertSteps,
        probe: alertProbe,
        makePair: () => Promise.resolve([specDriver(model, alertBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
