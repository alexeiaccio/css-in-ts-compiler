import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  toolbarBridge,
  toolbarConfig,
  toolbarProbe,
  toolbarSteps,
} from "@cssints/apg-specs/apg/toolbar.bridge";
import ariakit from "@cssints/apg-specs/scenarios/apg/toolbar.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/toolbar.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/toolbar.model.json";
import { domDriver } from "./dom-driver";
import { mountToolbar } from "./toolbar.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/toolbar.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountToolbar(toolbarConfig(config)), { hideableParts: ["popup"] });

// Scenarios whose expectations the primitive deliberately does not meet: a
// config or nested control the spec's fixed five-item toolbar does not model.
// Each entry must still fail (so closing the gap forces removing it).
const SKIP_DISABLED =
  "base-ui/ariakit skip disabled items in roving navigation; toolbar.qnt keeps aria-disabled items focusable (APG disabled-but-focusable)";
const COMPOSITE_TABSTOP =
  "the abstract Composite picks the first non-disabled item as the initial tab stop; toolbar.qnt starts on item 0";
const COMPOSITE_ROLE =
  "the abstract Composite role omits aria-orientation; the primitive renders role=toolbar";
const TOGGLE_GROUP =
  "Toolbar.ToggleGroup renders role=group with aria-pressed; the primitive implements the role=toolbar roving model";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "toolbar.ariakit.skips-direct-disabled-inactive-accessible": SKIP_DISABLED,
  "toolbar.ariakit.skips-disabled-inactive-focusable": SKIP_DISABLED,
  "toolbar.ariakit.skips-disabled-inactive-focusable-below": SKIP_DISABLED,
  "toolbar.ariakit.skips-inherited-disabled-inactive-accessible": SKIP_DISABLED,
  "toolbar.base-ui.composite-navigation-skips-disabled-index": SKIP_DISABLED,
  "toolbar.base-ui.composite-disabled-indices-initial-stop": COMPOSITE_TABSTOP,
  "toolbar.base-ui.composite-no-aria-orientation": COMPOSITE_ROLE,
  "toolbar.base-ui.toggle-group-arrow-horizontal": TOGGLE_GROUP,
  "toolbar.base-ui.toggle-group-arrow-vertical": TOGGLE_GROUP,
  "toolbar.base-ui.toggle-group-enter-space-toggles": TOGGLE_GROUP,
  "toolbar.base-ui.toggle-group-role-orientation": TOGGLE_GROUP,
};

describe("createToolbar x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, toolbarBridge, dom);
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

describe("createToolbar x toolbar.qnt (differential walk)", () => {
  // item 0 is the spec's menu-button; the fixture composes createMenu with
  // createToolbar for that item
  const items = ["menutrigger", "button", "text", "spin", "button"];
  for (const config of [
    { items, orientation: "horizontal" as const },
    { items, orientation: "vertical" as const, loopFocus: true },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: toolbarSteps,
        probe: toolbarProbe,
        makePair: () => Promise.resolve([specDriver(model, toolbarBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 17,
      });
    });
  }
});
