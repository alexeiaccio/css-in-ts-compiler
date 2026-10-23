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
  linkBridge,
  linkConfig,
  linkProbe,
  linkSteps,
} from "@cssints/apg-specs/src/apg/link.bridge";
import ariakit from "@cssints/apg-specs/scenarios/apg/link.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/link.base-ui.json";
import definitionJson from "@cssints/apg-specs/src/apg/link.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountLink } from "./link.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/link.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountLink(linkConfig(config)), { hideableParts: [] });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "link.react-aria.accessible-props-passed-through":
    "the scenario passes aria-current through a consumer prop; the primitive only returns the pattern attributes",
};

describe("createLink x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, linkBridge, dom);
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

describe("createLink x spec (differential walk)", () => {
  for (const config of [{ native: true, href: "#link" }, { native: false }]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: linkSteps,
        probe: linkProbe,
        makePair: () => Promise.resolve([specDriver(model, linkBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
