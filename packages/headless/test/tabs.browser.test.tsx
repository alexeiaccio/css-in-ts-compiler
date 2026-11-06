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
import { createEffect } from "solid-js";
import { render } from "@solidjs/web";
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
import { supportsFocusGroup } from "../src/focusgroup";
import { type Tabs, type TabsOptions, createTabs } from "../src/tabs";
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
const FOCUS_SELECTS =
  "automatic activation is the platform's focusin rule (the polyfill's tabs recipe): a programmatic focus selects, while ariakit leaves the selection alone for screen-reader focus";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "tabs.react-aria.arrow-vertical": AXIS_ONLY,
  "tabs.base-ui.arrow-focuses-disabled-without-activating": SKIP_DISABLED,
  "tabs.ariakit.panel-tabindex-tabbable": PANEL_CONVENTION,
  "tabs.ariakit.focus-does-not-select": FOCUS_SELECTS,
};

describe("createTabs x ported scenarios (real DOM)", () => {
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

interface Native {
  readonly root: HTMLElement;
  readonly before: HTMLButtonElement;
  readonly after: HTMLButtonElement;
  readonly tabs: Tabs;
  readonly tab: (index: number) => HTMLButtonElement;
  readonly dispose: () => void;
}

/**
 * The native provider on real keys. The walk above cannot cover it (untrusted
 * `keydown` is ignored, and no `tabindex` is written), so these run the platform
 * itself: the engine's group moves focus, and the primitive reads the DOM
 * (`focusin`) instead of owning a cursor.
 */
const mountNative = (options: TabsOptions = {}): Native => {
  const before = document.createElement("button");
  before.textContent = "before";
  const after = document.createElement("button");
  after.textContent = "after";
  const root = document.createElement("div");
  document.body.append(before, root, after);
  let api: Tabs | undefined;
  const tabElements = (): HTMLButtonElement[] => [
    ...root.querySelectorAll<HTMLButtonElement>('[data-part="tab"]'),
  ];
  const dispose = render(() => {
    const tabs = createTabs({ items: 3, ...options });
    api = tabs;
    createEffect(
      () => tabs.focused(),
      (index) => {
        const element = tabElements()[index];
        if (index >= 0 && element !== undefined && document.activeElement !== element) {
          element.focus();
        }
      },
    );
    return (
      <div>
        <div data-part="tablist" {...tabs.tablistProps}>
          {Array.from({ length: tabs.items }, (_, index) => (
            <button data-part="tab" {...tabs.tabProps(index)}>
              Tab {index + 1}
            </button>
          ))}
        </div>
        {Array.from({ length: tabs.items }, (_, index) => (
          <div data-part="tabpanel" {...tabs.tabpanelProps(index)}>
            Panel {index + 1}
          </div>
        ))}
      </div>
    );
  }, root);
  return {
    root,
    before,
    after,
    get tabs() {
      return api as Tabs;
    },
    tab: (index) => {
      const element = tabElements()[index];
      if (element === undefined) {
        throw new Error(`no tab ${index}`);
      }
      return element;
    },
    dispose: () => {
      dispose();
      root.remove();
      before.remove();
      after.remove();
    },
  };
};

const entersOn = async (mounted: Native): Promise<void> => {
  mounted.before.focus();
  await userEvent.tab();
};

describe("createTabs x native focusgroup (real keys)", () => {
  it.skipIf(!supportsFocusGroup())(
    "enters on the selected tab, moves with the arrows and wraps",
    async () => {
      const mounted = mountNative({ defaultSelected: 1 });
      try {
        await entersOn(mounted);
        // the entry point is focusgroupstart (the selected tab), not tab 0
        expect(document.activeElement).toBe(mounted.tab(1));

        await userEvent.keyboard("{ArrowRight}");
        expect(document.activeElement).toBe(mounted.tab(2));
        // automatic activation: the platform's focusin selects
        expect(mounted.tabs.selected()).toBe(2);
        expect(mounted.tab(2).getAttribute("aria-selected")).toBe("true");

        await userEvent.keyboard("{ArrowRight}");
        expect(document.activeElement).toBe(mounted.tab(0));
        await userEvent.keyboard("{ArrowLeft}");
        expect(document.activeElement).toBe(mounted.tab(2));

        await userEvent.keyboard("{Home}");
        expect(document.activeElement).toBe(mounted.tab(0));
        await userEvent.keyboard("{End}");
        expect(document.activeElement).toBe(mounted.tab(2));

        // the engine keeps the tab stop in the focus controller, not in markup
        expect(mounted.tab(0).hasAttribute("tabindex")).toBe(false);
        expect(mounted.tab(1).hasAttribute("tabindex")).toBe(false);
      } finally {
        mounted.dispose();
      }
    },
  );

  it.skipIf(!supportsFocusGroup())("runs along the block axis when vertical", async () => {
    const mounted = mountNative({ orientation: "vertical" });
    try {
      await entersOn(mounted);
      await userEvent.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(mounted.tab(1));
      expect(mounted.tabs.selected()).toBe(1);
      await userEvent.keyboard("{ArrowUp}");
      expect(document.activeElement).toBe(mounted.tab(0));
      // a vertical tablist leaves the inline arrows to the author
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("{ArrowLeft}");
      expect(document.activeElement).toBe(mounted.tab(0));
      expect(mounted.tabs.selected()).toBe(0);
    } finally {
      mounted.dispose();
    }
  });

  it.skipIf(!supportsFocusGroup())(
    "keeps manual activation: arrows move focus, Enter / Space select",
    async () => {
      const mounted = mountNative({ activation: "manual" });
      try {
        await entersOn(mounted);
        await userEvent.keyboard("{ArrowRight}");
        expect(document.activeElement).toBe(mounted.tab(1));
        expect(mounted.tabs.selected()).toBe(0);
        expect(mounted.tab(0).getAttribute("aria-selected")).toBe("true");

        await userEvent.keyboard("{Enter}");
        expect(mounted.tabs.selected()).toBe(1);

        await userEvent.keyboard("{ArrowRight}");
        expect(mounted.tabs.selected()).toBe(1);
        await userEvent.keyboard("{ }");
        expect(mounted.tabs.selected()).toBe(2);
      } finally {
        mounted.dispose();
      }
    },
  );

  it.skipIf(!supportsFocusGroup())(
    "has no memory: leaving and re-entering lands on the selected tab",
    async () => {
      const mounted = mountNative({ activation: "manual" });
      try {
        await entersOn(mounted);
        // focus leaves tab 0 (the selected one) but selection does not move
        await userEvent.keyboard("{ArrowRight}");
        expect(document.activeElement).toBe(mounted.tab(1));
        await userEvent.tab();
        expect(document.activeElement).not.toBe(mounted.tab(1));
        await userEvent.tab({ shift: true });
        // nomemory + focusgroupstart: the entry point is the selected tab
        expect(document.activeElement).toBe(mounted.tab(0));
      } finally {
        mounted.dispose();
      }
    },
  );

  it.skipIf(!supportsFocusGroup())(
    "skips a disabled tab and never puts the tab stop on it",
    async () => {
      const mounted = mountNative({ disabled: [1] });
      try {
        await entersOn(mounted);
        expect(document.activeElement).toBe(mounted.tab(0));
        await userEvent.keyboard("{ArrowRight}");
        expect(document.activeElement).toBe(mounted.tab(2));
        await userEvent.keyboard("{ArrowLeft}");
        expect(document.activeElement).toBe(mounted.tab(0));
        // the eligibility opt-out is the only tabindex the primitive renders
        expect(mounted.tab(1).getAttribute("tabindex")).toBe("-1");
        expect(mounted.tab(1).getAttribute("aria-disabled")).toBe("true");
        await userEvent.keyboard("{ArrowRight}");
        expect(mounted.tabs.selected()).toBe(2);
      } finally {
        mounted.dispose();
      }
    },
  );
});

describe("createTabs x spec (differential walk)", () => {
  for (const config of [
    {},
    { activation: "manual" },
    { orientation: "vertical" },
    { disabled: [1] },
    // controlled: a host that accepts every request, and one that pins the
    // value (rejects), so no event commits
    { controlled: true, selected: 0 },
    { controlled: true, value: 2 },
  ]) {
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
