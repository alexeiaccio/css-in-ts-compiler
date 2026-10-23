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
  disclosureBridge,
  disclosureConfig,
  disclosureProbe,
  disclosureSteps,
} from "@cssints/apg-specs/apg/disclosure.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import apg from "@cssints/apg-specs/scenarios/apg/disclosure.apg.json";
import ariakit from "@cssints/apg-specs/scenarios/apg/disclosure.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/disclosure.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/disclosure.model.json";
import { domDriver } from "./dom-driver";
import { mountDisclosure } from "./disclosure.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/disclosure.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountDisclosure(disclosureConfig(config)), {
    hideableParts: ["panel"],
    eventName: canonicalEvent,
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
// APG makes aria-controls optional and says nothing on the other attributes.
const UNMOUNTED_PANEL =
  "base-ui unmounts the closed panel, so aria-controls is absent while collapsed; our panel stays mounted (hidden) with aria-controls always set";
const CONSUMER_ATTR =
  "react-aria forwards consumer-supplied attributes; the primitive only returns the pattern attributes";
const REDUNDANT_HIDDEN =
  "react-aria adds aria-hidden next to hidden; `hidden` already removes the panel from the accessibility tree";
const GROUP_ROLE =
  "react-aria gives the panel role=group named by the trigger; APG puts no role on the disclosure content";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "disclosure.base-ui.uncontrolled-pointer-toggle": UNMOUNTED_PANEL,
  "disclosure.base-ui.keyboard-enter-space-toggle": UNMOUNTED_PANEL,
  "disclosure.base-ui.panel-keep-mounted-visibility": UNMOUNTED_PANEL,
  "disclosure.react-aria.aria-label-heading-and-panel": CONSUMER_ATTR,
  "disclosure.react-aria.aria-attributes-collapsed": REDUNDANT_HIDDEN,
  "disclosure.react-aria.aria-attributes-expanded": REDUNDANT_HIDDEN,
  "disclosure.react-aria.ids-for-accessibility": GROUP_ROLE,
  "disclosure.base-ui.controlled-external-toggle": UNMOUNTED_PANEL,
};

describe("createDisclosure x ported scenarios (real DOM)", () => {
  for (const source of [apg, ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, disclosureBridge, dom);
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

describe("createDisclosure x spec (differential walk)", () => {
  // an uncontrolled primitive, then a controlled host that accepts every
  // request, one that pins the value (rejects), and one that pins it while disabled
  for (const config of [
    {},
    { defaultExpanded: true },
    { disabled: true },
    { controlled: true, initialOpen: false },
    { controlled: true, initialOpen: true },
    { controlled: true, expanded: false },
    { controlled: true, expanded: true, disabled: true },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: disclosureSteps,
        probe: disclosureProbe,
        makePair: () => Promise.resolve([specDriver(model, disclosureBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
