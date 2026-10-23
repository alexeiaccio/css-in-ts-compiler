import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import {
  checkboxGroupBridge,
  checkboxGroupConfig,
  checkboxGroupProbe,
  checkboxGroupSteps,
} from "@cssints/apg-specs/src/apg/checkbox-group.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import ariakit from "@cssints/apg-specs/scenarios/apg/checkbox.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/checkbox.base-ui.json";
import definitionJson from "@cssints/apg-specs/src/apg/checkbox-group.model.generated.json";
import { mountCheckboxGroup } from "./checkbox-group.fixture";
import { partsDriver } from "./parts-driver";
import reactAria from "@cssints/apg-specs/scenarios/apg/checkbox.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  partsDriver(mountCheckboxGroup(checkboxGroupConfig(config)));

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const DEFAULT_VALUES =
  "the upstream fixture supplies unstated child values (red/green/blue); without a `values` config the primitive uses its own labels, so the reported value array differs";
const NATIVE_ATTR =
  "react-aria renders native checkboxes; the primitive exposes role=checkbox + aria-checked (APG) and reports onValueChange, not the native checked/onChange pair";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "checkbox.base-ui.group-omitted-defaultvalue": DEFAULT_VALUES,
  "checkbox.react-aria.group-selected-state": NATIVE_ATTR,
};

describe("createCheckboxGroup x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, checkboxGroupBridge, dom);
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

describe("createCheckboxGroup x spec (differential walk)", () => {
  const base: ScenarioConfig = {
    group: true,
    parent: true,
    values: ["0", "1", "2"],
  };
  for (const config of [
    base,
    { ...base, remember: true },
    { ...base, parent: false },
    { group: true, values: ["0", "1", "2"] },
    // controlled: a host that accepts every request, and one that holds
    { ...base, value: ["0"] },
    { ...base, value: ["0", "2"] },
    { ...base, controlled: true, accepts: true },
    { ...base, controlled: true, accepts: false, value: ["1"] },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: checkboxGroupSteps,
        probe: checkboxGroupProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, checkboxGroupBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
