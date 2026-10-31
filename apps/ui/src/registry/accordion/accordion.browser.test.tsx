import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  accordionBridge,
  accordionConfig,
  accordionProbe,
  accordionSteps,
} from "@cssints/apg-specs/apg/accordion.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import baseUi from "@cssints/apg-specs/scenarios/apg/accordion.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/accordion.model.json";
import { domDriver } from "./accordion-driver.ts";
import { mountAccordion } from "./accordion.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/accordion.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountAccordion(accordionConfig(config)), {
    hideableParts: ["panel"],
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const INDEX_KEYS = "the primitive keys expanded panels by index; react-aria keys them by item text";
const EVENT_PAYLOAD =
  "react-aria reports a single boolean per change; the primitive reports the expanded index set (base-ui model)";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "accordion.react-aria.click-toggles": INDEX_KEYS,
  "accordion.react-aria.enter-toggles": INDEX_KEYS,
  "accordion.react-aria.repeat-keydown-toggles-once": EVENT_PAYLOAD,
  "accordion.react-aria.controlled-is-expanded": EVENT_PAYLOAD,
};

describe("Accordion x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, accordionBridge, dom);
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

describe("Accordion x spec (differential walk)", () => {
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [
    {},
    { defaultExpanded: [0] },
    { multiple: true },
    { collapsible: false },
    { multiple: true, collapsible: false },
    // uncontrolled, then a controlled host that accepts every request, one that
    // pins the value (rejects), and one that pins it while disabled
    { controlled: true, accepts: true },
    { controlled: true, accepts: true, defaultExpanded: [0] },
    { controlled: true, accepts: true, multiple: true },
    { controlled: true, accepts: false, defaultExpanded: [0] },
    { expanded: [0] },
    { expanded: [0, 1], multiple: true },
  ];
  for (const config of CONFIGS) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: accordionSteps,
        probe: accordionProbe,
        makePair: () => Promise.resolve([specDriver(model, accordionBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
