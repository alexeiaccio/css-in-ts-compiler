import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  canonicalEvent,
  radioBridge,
  radioConfig,
  radioProbe,
  radioSteps,
} from "@cssints/apg-specs/apg/radio.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import ariakit from "@cssints/apg-specs/scenarios/apg/radio.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/radio.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/radio.model.json";
import { domDriver } from "./dom-driver";
import { mountRadio } from "./radio.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/radio.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountRadio(radioConfig(config)), {
    hideableParts: [],
    eventName: canonicalEvent,
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const NATIVE_ATTR =
  "react-aria renders a native <input type=radio>; the primitive exposes role=radio + aria-checked (APG) instead of the HTML disabled attribute";
const PER_RADIO_CALLBACKS =
  "the upstream test uses per-radio onFocusA/onBlurA callbacks; the primitive reports one onFocus/onBlur with the radio target";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "radio.react-aria.disabled-radio-state": NATIVE_ATTR,
  "radio.react-aria.focus-moves-between-radios-fires-blur": PER_RADIO_CALLBACKS,
};

describe("RadioGroup x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, radioBridge, dom);
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

// Config remounts (`preselect` / `disabled` / `flavor`) write the uncontrolled
// local directly and have no controlled-host equivalent in the walk.
const CONFIG_PROPS = new Set(["preselect", "disabled", "flavor"]);

describe("RadioGroup x spec (differential walk)", () => {
  const base: ScenarioConfig = { items: 4, values: ["0", "1", "2", "3"] };
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [
    base,
    { ...base, checked: "radio:1" },
    { ...base, disabled: [1, 2] },
    { ...base, flavor: "activedescendant" },
    // controlled: a host that accepts every request, and one that pins the
    // value (rejects), so no event commits
    { ...base, controlled: true, checked: "radio:0" },
    { ...base, controlled: true, value: 2 },
  ];
  for (const config of CONFIGS) {
    const alphabet = config["controlled"]
      ? radioSteps.filter((step) => step.prop === undefined || !CONFIG_PROPS.has(step.prop))
      : radioSteps;
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet,
        probe: radioProbe,
        makePair: () => Promise.resolve([specDriver(model, radioBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
