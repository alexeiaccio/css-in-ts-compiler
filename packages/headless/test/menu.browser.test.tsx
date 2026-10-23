import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createMenu, createMenubar } from "../src";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import {
  menuCheckableBridge,
  menuCheckableConfig,
  menuCheckableProbe,
  menuCheckableSteps,
} from "@cssints/apg-specs/src/apg/menu-checkable.bridge";
import {
  menuMenubarBridge,
  menuMenubarConfig,
  menuMenubarProbe,
  menuMenubarSteps,
} from "@cssints/apg-specs/src/apg/menu-menubar.bridge";
import { mountCheckableMenu, mountMenubar } from "./menu.fixture";
import ariakit from "@cssints/apg-specs/scenarios/apg/menubar.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/menubar.base-ui.json";
import checkableDefinition from "@cssints/apg-specs/src/apg/menu-checkable.model.generated.json";
import { domDriver } from "./dom-driver";
import menuAriakit from "@cssints/apg-specs/scenarios/apg/menu-button.ariakit.json";
import menuBaseUi from "@cssints/apg-specs/scenarios/apg/menu-button.base-ui.json";
import menuReactAria from "@cssints/apg-specs/scenarios/apg/menu-button.react-aria.json";
import menubarDefinition from "@cssints/apg-specs/src/apg/menu-menubar.model.generated.json";
import { partsDriver } from "./parts-driver";

const checkableModel = makeReferenceModel(decodeDefinition(checkableDefinition));
const menubarModel = makeReferenceModel(decodeDefinition(menubarDefinition));

const checkableDom = (config: ScenarioConfig) =>
  domDriver(mountCheckableMenu(menuCheckableConfig(config)), {
    hideableParts: ["menu"],
  });

const menubarDom = (config: ScenarioConfig) =>
  partsDriver(mountMenubar(menuMenubarConfig(config)), {
    hideableParts: ["menu:0", "menu:1", "submenu:1"],
  });

// Scenarios whose expectations we deliberately do not meet: the ported
// menubar/checkable scenarios describe the upstream fixtures' own trees and
// library defaults; the primitive implements the APG/Quint contract. Each entry
// must still fail (so closing the gap forces removing it) and says why.
const MENUBAR_TREE =
  "the ported scenario describes the upstream fixture tree (menu sizes / which item owns the submenu / a menu-less bar); the primitive renders the menu-menubar.qnt fixed tree";
const MENUBAR_VERTICAL =
  "menu-menubar.qnt models a horizontal bar; vertical navigation (Up/Down between bar items, the cross-axis key opening a menu) is not modelled";
const MENUBAR_HOVER =
  "store hover-intent opening (APG optional; an ariakit/base-ui extension) is not modelled; menus open on keyboard and click";
const MENUBAR_POPUP_FOCUS =
  "ariakit keeps DOM focus on the popup container; the primitive focuses the first menu item (APG)";
const MENUBAR_CONTAINER_FOCUS =
  "the scenario focuses the menu container; the primitive keeps DOM focus on menu items";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "menubar.ariakit.aria-expanded-reflects-open-menu": MENUBAR_VERTICAL,
  "menubar.ariakit.arrow-down-keeps-focus-on-control-in-vertical-menubar": MENUBAR_VERTICAL,
  "menubar.ariakit.arrow-keys-keep-focus-on-input-in-vertical-menubar": MENUBAR_VERTICAL,
  "menubar.ariakit.vertical-arrow-down-moves-between-items-without-opening": MENUBAR_VERTICAL,
  "menubar.ariakit.vertical-arrow-right-opens-menu": MENUBAR_VERTICAL,
  "menubar.base-ui.vertical-main-axis-arrow-moves-between-triggers": MENUBAR_VERTICAL,
  "menubar.ariakit.hover-switches-open-menu": MENUBAR_HOVER,
  "menubar.base-ui.hover-opens-nested-submenu": MENUBAR_HOVER,
  "menubar.base-ui.hover-switches-open-menu-when-submenu-open": MENUBAR_HOVER,
  "menubar.base-ui.open-new-menu-on-hover-after-click": MENUBAR_HOVER,
  "menubar.ariakit.click-opens-menu-and-focuses-menu": MENUBAR_POPUP_FOCUS,
  "menubar.ariakit.arrow-right-traverses-from-menu-container": MENUBAR_CONTAINER_FOCUS,
  "menubar.ariakit.arrow-up-within-open-menu-moves-to-last-item": MENUBAR_TREE,
  "menubar.ariakit.escape-then-arrow-right-moves-without-opening": MENUBAR_TREE,
  "menubar.ariakit.shift-tab-to-trigger-then-enter-closes": MENUBAR_TREE,
  "menubar.base-ui.arrow-left-right-switch-open-menus": MENUBAR_TREE,
  "menubar.base-ui.arrow-right-closes-submenus-when-navigating-next": MENUBAR_TREE,
  "menubar.base-ui.arrow-right-opens-submenu": MENUBAR_TREE,
};

const CHECKABLE_DEFAULT =
  "ariakit defaults checkbox items to checked; the primitive follows the APG/base-ui unchecked default";
const CHECKABLE_FOCUS =
  "ariakit re-anchors navigation on each keydown target; the primitive moves relative to its own focused item";
const CHECKABLE_SKIP =
  "skipping hidden/disabled items is an ariakit store behaviour; the primitive keeps disabled items focusable";
Object.assign(DIVERGENCES, {
  "menu-button.ariakit.checkbox-item-toggles-on-click": CHECKABLE_DEFAULT,
  "menu-button.ariakit.syncs-boolean-items-with-menu-values": CHECKABLE_DEFAULT,
  "menu-button.ariakit.checkbox-item-toggles-on-enter": CHECKABLE_FOCUS,
  "menu-button.ariakit.values-navigation-skips-disabled-hidden": CHECKABLE_SKIP,
} satisfies Readonly<Record<string, string>>);

describe("createMenu (checkable) x menu-checkable.qnt (differential walk)", () => {
  const base = {
    items: ["alpha", "bravo", "charlie", "delta", "echo"],
    variant: "mixed" as const,
  };
  for (const config of [
    base,
    { ...base, controlled: true, accepts: true },
    { ...base, controlled: true, accepts: true, value: 7 },
    { ...base, controlled: true, accepts: false, value: 3 },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: menuCheckableSteps,
        probe: menuCheckableProbe,
        makePair: () =>
          Promise.resolve([
            specDriver(checkableModel, menuCheckableBridge, config),
            checkableDom(config),
          ]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

describe("createMenubar x menu-menubar.qnt (differential walk)", () => {
  it("matches the generated model", async () => {
    const config = { items: ["File", "Edit", "About"] };
    await differentialWalk({
      alphabet: menuMenubarSteps,
      probe: menuMenubarProbe,
      makePair: () =>
        Promise.resolve([specDriver(menubarModel, menuMenubarBridge, config), menubarDom(config)]),
      runs: 15,
      steps: 25,
      seed: 11,
    });
  });
});

describe("createMenu (checkable) x ported scenarios (real DOM)", () => {
  const isCheckable = (config: ScenarioConfig | undefined): boolean =>
    config?.["variant"] === "checkbox-items" || config?.["variant"] === "radio-items";
  for (const source of [menuAriakit, menuBaseUi, menuReactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        if (!isCheckable(scenario.config)) {
          continue;
        }
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, menuCheckableBridge, checkableDom);
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

describe("createMenubar x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, menuMenubarBridge, menubarDom);
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

// One check per honoured pref: the typeahead buffer timeout is the injected delay.
describe("createMenu / createMenubar x prefs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("menu typeaheadDelayMs is the buffer timeout", () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(globalThis, "setTimeout");
    const menu = createMenu({
      items: ["alpha", "bravo", "charlie"],
      defaultOpen: true,
      prefs: { typeaheadDelayMs: 120 },
    });
    menu.type("a");
    expect(spy.mock.calls.map((call) => call[1])).toContain(120);
  });

  it("menubar typeaheadDelayMs is the buffer timeout", () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(globalThis, "setTimeout");
    const bar = createMenubar({
      items: ["File", "Edit"],
      prefs: { typeaheadDelayMs: 90 },
    });
    bar.focusIn();
    bar.type("F");
    expect(spy.mock.calls.map((call) => call[1])).toContain(90);
  });
});
