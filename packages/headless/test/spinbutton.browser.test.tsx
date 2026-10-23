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
  spinbuttonBridge,
  spinbuttonConfig,
  spinbuttonProbe,
  spinbuttonSteps,
} from "@cssints/apg-specs/src/apg/spinbutton.bridge";
import baseUi from "@cssints/apg-specs/scenarios/apg/spinbutton.base-ui.json";
import definitionJson from "@cssints/apg-specs/src/apg/spinbutton.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountSpinbutton } from "./spinbutton.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/spinbutton.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountSpinbutton(spinbuttonConfig(config)), { hideableParts: [] });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const SEED_FROM_ZERO =
  "base-ui seeds an untouched field to 0 (clamped into range); the spec starts at 5 and clamps to min 1";
const TEXTBOX_ROLE = "base-ui exposes the editable field as role=textbox; APG uses role=spinbutton";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "spinbutton.base-ui.input-has-textbox-role": TEXTBOX_ROLE,
  "spinbutton.base-ui.increment-starts-empty-at-zero": SEED_FROM_ZERO,
  "spinbutton.base-ui.decrement-starts-empty-at-zero": SEED_FROM_ZERO,
  "spinbutton.base-ui.increment-once-per-click": SEED_FROM_ZERO,
  "spinbutton.base-ui.decrement-once-per-click": SEED_FROM_ZERO,
};

describe("createSpinbutton x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, spinbuttonBridge, dom);
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

describe("createSpinbutton x spec (differential walk)", () => {
  // uncontrolled, then a controlled host that accepts every request, one that
  // pins the value (rejects), and one that accepts while wrapping
  for (const config of [
    {},
    { buttons: true },
    { controlled: true },
    { controlled: true, value: 5 },
    { controlled: true, wrap: true },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: spinbuttonSteps,
        probe: spinbuttonProbe,
        makePair: () => Promise.resolve([specDriver(model, spinbuttonBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
