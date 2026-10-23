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
  checkboxBridge,
  checkboxConfig,
  checkboxProbe,
  checkboxSteps,
} from "@cssints/apg-specs/src/apg/checkbox.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import ariakit from "@cssints/apg-specs/scenarios/apg/checkbox.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/checkbox.base-ui.json";
import definitionJson from "@cssints/apg-specs/src/apg/checkbox.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountCheckbox } from "./checkbox.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/checkbox.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountCheckbox(checkboxConfig(config)), {
    hideableParts: [],
    eventName: canonicalEvent,
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const NATIVE_ATTR =
  "react-aria renders a native <input type=checkbox>; the primitive exposes role=checkbox + aria-checked (APG) instead of the checked attribute";
const ANCESTOR_EVENT =
  "base-ui reports onClick to an ancestor element; the primitive only owns the checkbox callbacks";
const MANUAL_INDETERMINATE =
  "APG checks a mixed tri-state checkbox on activation; base-ui pins a manually indeterminate control so a click leaves it mixed";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "checkbox.base-ui.onclick-propagates-once": ANCESTOR_EVENT,
  "checkbox.base-ui.indeterminate-ignores-click": MANUAL_INDETERMINATE,
  "checkbox.react-aria.disabled-state": NATIVE_ATTR,
  "checkbox.react-aria.indeterminate-state": NATIVE_ATTR,
  "checkbox.react-aria.selected-state-onchange": NATIVE_ATTR,
};

describe("createCheckbox x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, checkboxBridge, dom);
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

describe("createCheckbox x spec (differential walk)", () => {
  // an uncontrolled checkbox, then a controlled host that accepts every request
  // and one that pins the value (rejects), in dual- and tri-state flavours
  for (const config of [
    {},
    { defaultChecked: true },
    { allowMixed: true },
    { indeterminate: true },
    { disabled: true },
    { checked: false },
    { checked: true },
    { value: false },
    { value: true },
    { controlled: true, indeterminate: true },
    { value: true, disabled: true },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: checkboxSteps,
        probe: checkboxProbe,
        makePair: () => Promise.resolve([specDriver(model, checkboxBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
