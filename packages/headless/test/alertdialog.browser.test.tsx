import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import {
  alertdialogBridge,
  alertdialogConfig,
  alertdialogProbe,
  alertdialogSteps,
} from "@cssints/apg-specs/src/apg/alertdialog.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import baseUi from "@cssints/apg-specs/scenarios/apg/alertdialog.base-ui.json";
import definitionJson from "@cssints/apg-specs/src/apg/alertdialog.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountAlertDialog } from "./alertdialog.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/alertdialog.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountAlertDialog(alertdialogConfig(config)), {
    hideableParts: ["dialog"],
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const RICH_REASON =
  "base-ui reports onOpenChange with a { open, reason } object; the primitive fires the neutral boolean payload the APG pattern describes";
const NO_BACKDROP_PART =
  "the fixture renders a non-dismissable backdrop (clicking it must not close), but it is not a hideable part, so `visible` lists only the dialog";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "alertdialog.base-ui.onopenchange-reason-trigger-and-close": RICH_REASON,
  "alertdialog.base-ui.escape-close-reason": RICH_REASON,
  "alertdialog.base-ui.modal-inerts-page": NO_BACKDROP_PART,
};

describe("createAlertDialog x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, alertdialogBridge, dom);
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

describe("createAlertDialog x spec (differential walk)", () => {
  for (const config of [
    {},
    { open: true },
    { controlled: true },
    { controlled: true, accepts: false },
    { controlled: true, open: true, accepts: false },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: alertdialogSteps,
        probe: alertdialogProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, alertdialogBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 17,
      });
    });
  }
});
