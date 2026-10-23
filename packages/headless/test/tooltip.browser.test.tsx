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
  tooltipBridge,
  tooltipConfig,
  tooltipProbe,
  tooltipSteps,
} from "@cssints/apg-specs/src/apg/tooltip.bridge";
import ariakit from "@cssints/apg-specs/scenarios/apg/tooltip.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/tooltip.base-ui.json";
import { createRoot } from "solid-js";
import { createTooltipGroup } from "../src";
import definitionJson from "@cssints/apg-specs/src/apg/tooltip.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountTooltip } from "./tooltip.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/tooltip.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountTooltip(tooltipConfig(config)), {
    hideableParts: ["tooltip"],
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
// The timer-driven scenarios never reach here: the shared DOM driver has no
// clock, so a `wait` step is `Unsupported` and the scenario is skipped.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "tooltip.base-ui.default-open-uncontrolled-closes-on-unhover":
    "the scenario starts open via defaultOpen and then unhovers a trigger that was never hovered; the DOM fires no pointerleave, so the hide grace is never armed",
};

describe("createTooltipGroup x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, tooltipBridge, dom);
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

describe("createTooltipGroup x spec (differential walk)", () => {
  for (const config of [
    {},
    { controlled: true },
    { controlled: true, accepts: false },
    { controlled: true, open: true, accepts: false },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: tooltipSteps,
        probe: tooltipProbe,
        makePair: () => Promise.resolve([specDriver(model, tooltipBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 13,
      });
    });
  }
});

// One check per honoured pref: the exposed delays reflect the injected values.
describe("createTooltipGroup x prefs", () => {
  it("exposes the injected show and hide delays", () =>
    createRoot(() => {
      const group = createTooltipGroup({
        triggers: [{}, {}],
        prefs: { tooltipShowDelayMs: 150, tooltipHideDelayMs: 75 },
      });
      expect(group.showDelayMs()).toBe(150);
      expect(group.hideDelayMs()).toBe(75);
    }));

  it("defaults match the lexicon defaults when prefs are absent", () =>
    createRoot(() => {
      const group = createTooltipGroup({ triggers: [{}, {}] });
      expect(group.showDelayMs()).toBe(600);
      expect(group.hideDelayMs()).toBe(300);
    }));
});
