import {
  type ActionStep,
  type Driver,
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
  tabsBridge,
  tabsConfig,
  tabsEventName,
  tabsProbe,
  tabsSteps,
} from "@cssints/apg-specs/apg/tabs.bridge";
import ariakit from "@cssints/apg-specs/scenarios/apg/tabs.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/tabs.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/tabs.model.json";
import { domDriver } from "./dom-driver";
import { mountTabs } from "./tabs.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/tabs.react-aria.json";
import { userEvent } from "vite-plus/test/browser";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const NAMED_KEYS = new Set(["Enter", "Tab", "Escape", "Home", "End"]);

const keyboardSyntax = (key: string): string => {
  if (key === "Space" || key === " ") {
    return " ";
  }
  return NAMED_KEYS.has(key) || key.startsWith("Arrow") || key.startsWith("Page")
    ? `{${key}}`
    : key;
};

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });

/**
 * Like `domDriver`, but a `key` step is dispatched to whatever currently holds
 * focus instead of force-focusing the target first: the tabs spec routes keys
 * through its own `focused` cursor, so the two only agree if the DOM is driven
 * the way a user would.
 */
const tabsDom = (config: ScenarioConfig): Driver => {
  const mounted = mountTabs(tabsConfig(config));
  const base = domDriver(mounted, {
    hideableParts: ["tabpanel"],
    eventName: tabsEventName,
  });
  return {
    observer: base.observer,
    dispose: () => base.dispose?.(),
    perform: async (step: ActionStep) => {
      if (step.event === "key") {
        await userEvent.keyboard(keyboardSyntax(step.key ?? ""));
        await settle();
        return;
      }
      await base.perform(step);
    },
  };
};

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const AXIS_ONLY =
  "the spec (and APG) maps arrows to the tablist axis only; react-aria additionally treats Left/Right as previous/next in a vertical stack";
const SKIP_DISABLED =
  "the spec and react-aria skip disabled tabs in one keypress; base-ui moves focus onto the disabled tab without activating it";
const PANEL_CONVENTION =
  "one fixture convention cannot serve both ariakit panel-tabindex files (they assume opposite panels hold focusable content)";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "tabs.react-aria.arrow-vertical": AXIS_ONLY,
  "tabs.base-ui.arrow-focuses-disabled-without-activating": SKIP_DISABLED,
  "tabs.ariakit.panel-tabindex-tabbable": PANEL_CONVENTION,
};

describe("Tabs x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, tabsBridge, tabsDom);
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

describe("Tabs x spec (differential walk)", () => {
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [
    {},
    { activation: "manual" },
    { orientation: "vertical" },
    { disabled: [1] },
    // controlled: a host that accepts every request, and one that pins the
    // value (rejects), so no event commits
    { controlled: true, selected: 0 },
    { controlled: true, value: 2 },
  ];
  for (const config of CONFIGS) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: tabsSteps,
        probe: tabsProbe,
        makePair: () => Promise.resolve([specDriver(model, tabsBridge, config), tabsDom(config)]),
        runs: 12,
        steps: 20,
        seed: 5,
      });
    });
  }
});
