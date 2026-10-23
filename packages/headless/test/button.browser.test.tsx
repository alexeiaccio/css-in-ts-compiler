import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  buttonBridge,
  buttonConfig,
  buttonProbe,
  buttonSteps,
  canonicalEvent,
} from "@cssints/apg-specs/apg/button.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import ariakit from "@cssints/apg-specs/scenarios/apg/button.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/button.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/button.model.json";
import { domDriver } from "./dom-driver";
import { mountButton } from "./button.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/button.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountButton(buttonConfig(config)), {
    hideableParts: [],
    eventName: canonicalEvent,
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "button.base-ui.toggle-disabled":
    "a bare `<Toggle disabled>` with no pressed config is read as a command button (no aria-pressed) using aria-disabled, not the native disabled attribute",
  "button.react-aria.disabled-state":
    "the primitive uses aria-disabled (focusable, per the APG button text), not the native disabled attribute",
  "button.react-aria.toggle-button-disabled":
    "the primitive uses aria-disabled, not the native disabled attribute",
  "button.react-aria.hover-state-and-callbacks":
    "hover state and onHoverStart/onHoverChange/onHoverEnd are library extensions; the primitive reports activation only",
  "button.react-aria.s1-button-keyboard-activates-non-submit":
    "react-aria press handling reports onKeyDown/onKeyUp defaultPrevented; the primitive activates through the native click",
  "button.react-aria.s1-toggle-button-controlled-selected":
    "react-aria pins the controlled `isSelected` value and rejects the click; the primitive models `isSelected` as a host that answers every request",
  "button.react-aria.toggle-button-selected-state":
    "the ported scenario expects `onChange` to hold only the latest payload (`[false]`); the replay engine reports every call since mount, and the primitive fires both (`[true, false]`)",
};

describe("createButton x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, buttonBridge, dom);
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

describe("createButton x spec (differential walk)", () => {
  // an uncontrolled toggle, then a controlled host that accepts every request
  // and one that pins the value (rejects), plus command buttons
  for (const config of [
    {},
    { toggle: true },
    { disabled: true },
    { toggle: true, disabled: true },
    { defaultPressed: true },
    { pressed: false },
    { pressed: true },
    { value: false },
    { value: true },
    { value: true, disabled: true },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: buttonSteps,
        probe: buttonProbe,
        makePair: () => Promise.resolve([specDriver(model, buttonBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
