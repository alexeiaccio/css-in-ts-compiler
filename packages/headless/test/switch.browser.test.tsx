import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import {
  canonicalEvent,
  switchBridge,
  switchConfig,
  switchProbe,
  switchSteps,
} from "@cssints/apg-specs/src/apg/switch.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import baseUi from "@cssints/apg-specs/scenarios/apg/switch.base-ui.json";
import definitionJson from "@cssints/apg-specs/src/apg/switch.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountSwitch } from "./switch.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/switch.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountSwitch(switchConfig(config)), {
    hideableParts: [],
    eventName: canonicalEvent,
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const NATIVE_ATTR =
  "react-aria renders a native input; the primitive exposes role=switch + aria-checked (APG) instead of the checked attribute";
const ANCESTOR_EVENT =
  "base-ui reports onClick/onClickCapture to ancestors; the primitive only owns the switch callbacks";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "switch.base-ui.onclick-called": ANCESTOR_EVENT,
  "switch.base-ui.click-propagates-once": ANCESTOR_EVENT,
  "switch.react-aria.disabled-state": NATIVE_ATTR,
  "switch.react-aria.selected-state-onchange": NATIVE_ATTR,
  "switch.react-aria.s1-switch-disabled": NATIVE_ATTR,
  "switch.react-aria.s1-switch-read-only": NATIVE_ATTR,
};

describe("createSwitch x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, switchBridge, dom);
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

describe("createSwitch x spec (differential walk)", () => {
  // an uncontrolled switch, then a controlled host that accepts every request
  // and one that pins the value (rejects), plus the optional Enter key
  for (const config of [
    {},
    { defaultChecked: true },
    { disabled: true },
    { enterToggles: true },
    { enterToggles: true, defaultChecked: true },
    { checked: false },
    { checked: true },
    { isSelected: false },
    { isSelected: true, disabled: true },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: switchSteps,
        probe: switchProbe,
        makePair: () => Promise.resolve([specDriver(model, switchBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
