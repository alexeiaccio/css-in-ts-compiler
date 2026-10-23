import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import {
  breadcrumbBridge,
  breadcrumbConfig,
  breadcrumbProbe,
  breadcrumbSteps,
} from "@cssints/apg-specs/src/apg/breadcrumb.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import definitionJson from "@cssints/apg-specs/src/apg/breadcrumb.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountBreadcrumb } from "./breadcrumb.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/breadcrumb.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountBreadcrumb(breadcrumbConfig(config)), {
    hideableParts: ["breadcrumb", "item"],
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "breadcrumb.react-aria.label-on-list-and-items":
    "the upstream stamps a generic aria-label on every item; the primitive exposes item labels as text, not aria-label",
  "breadcrumb.react-aria.descendant-href-item-keeps-no-role":
    "the primitive always renders role=listitem items around their links; this suite expects the wrapper to carry no role",
  "breadcrumb.react-aria.adobe-current-item-marked":
    "this suite focuses the first ancestor item at mount; the primitive does not move focus",
};

describe("createBreadcrumb x ported scenarios (real DOM)", () => {
  const file = parseScenarioFile(reactAria);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const run = replayScenario(scenario, breadcrumbBridge, dom);
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
});

describe("createBreadcrumb x spec (differential walk)", () => {
  for (const config of [{ items: 4 }, { items: 2 }]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: breadcrumbSteps,
        probe: breadcrumbProbe,
        makePair: () => Promise.resolve([specDriver(model, breadcrumbBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
