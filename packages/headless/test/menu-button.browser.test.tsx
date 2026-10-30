import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import {
  menuButtonBridge,
  menuButtonConfig,
  menuButtonProbe,
  menuButtonSteps,
} from "@cssints/apg-specs/apg/menu-button.bridge";
import { domDriver } from "./dom-driver";
import menuAriakit from "@cssints/apg-specs/scenarios/apg/menu-button.ariakit.json";
import menuBaseUi from "@cssints/apg-specs/scenarios/apg/menu-button.base-ui.json";
import menuButtonDefinition from "@cssints/apg-specs/apg/menu-button.model.json";
import menuReactAria from "@cssints/apg-specs/scenarios/apg/menu-button.react-aria.json";
import { mountMenuButton } from "./menu-button.fixture";

const menuButtonModel = makeReferenceModel(decodeDefinition(menuButtonDefinition));

const menuButtonDom = (config: ScenarioConfig) =>
  domDriver(mountMenuButton(menuButtonConfig(config)), {
    hideableParts: ["menu"],
  });

// Scenarios whose expectations we deliberately do not meet: the ported
// menu-button scenarios describe the upstream libraries' own defaults; the
// primitive implements the APG/Quint contract on the menu-button.qnt fixture.
// Each entry must still fail (so closing the gap forces removing it) and says
// why.
const MENU_POPUP_FOCUS =
  "ariakit moves focus to the popup container on pointer open; the primitive focuses the first menu item (APG)";
const MENU_OUTSIDE_SENTINEL =
  "the scenario names the part focus lands on after Tab as `outside`; the primitive reports no focused part outside the widget";
const MENU_LABEL =
  "the trigger's accessible name is owned by the consumer; the primitive does not set aria-label";
const MENU_HASPOPUP =
  'react-aria reports aria-haspopup as "true"; the primitive uses the APG value "menu"';
const MENU_DISABLED_SKIP =
  "react-aria skips disabled items during keyboard navigation; the primitive keeps disabled items focusable (APG note 1)";
const MENU_ITEM_CALLBACK =
  "react-aria names the item activation callback onAction/onPress; the primitive exposes onItemClick";
const MENU_TAB_TRAP =
  "react-aria traps focus and keeps the menu open on Tab; the primitive closes the menu and lets focus leave (APG)";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "menu-button.ariakit.click-opens-menu-focuses-container": MENU_POPUP_FOCUS,
  "menu-button.ariakit.tab-moves-focus-out-and-closes": MENU_OUTSIDE_SENTINEL,
  "menu-button.ariakit.disclosure-label-updates": MENU_LABEL,
  "menu-button.react-aria.trigger-aria-haspopup-and-expanded": MENU_HASPOPUP,
  "menu-button.react-aria.disabled-items-skipped-in-keyboard-navigation": MENU_DISABLED_SKIP,
  "menu-button.react-aria.press-events-on-items": MENU_ITEM_CALLBACK,
  "menu-button.react-aria.press-events-keyboard": MENU_ITEM_CALLBACK,
  "menu-button.react-aria.menu-containing-focus-on-tab": MENU_TAB_TRAP,
  "menu-button.react-aria.tab-away-keeps-menu-open": MENU_TAB_TRAP,
};

describe("createMenu (plain) x menu-button.qnt (differential walk)", () => {
  const config = {
    items: ["alpha", "bravo", "charlie", "delta"],
    disabled: [2],
  };
  // The spec's `menuOpen` axis is its own controlled contract (`controlled` /
  // `accepts` / `value`) and `createMenu`'s `open` pair is that axis: a holding
  // host must revert the whole transition (focus included), an accepting one
  // commits it, and a host write moves no focus.
  for (const variant of [
    config,
    { ...config, controlled: true, accepts: true },
    { ...config, controlled: true, accepts: false },
    { ...config, controlled: true, accepts: true, value: true },
  ]) {
    it(`matches the generated model for ${JSON.stringify(variant)}`, async () => {
      await differentialWalk({
        alphabet: menuButtonSteps,
        probe: menuButtonProbe,
        makePair: () =>
          Promise.resolve([
            specDriver(menuButtonModel, menuButtonBridge, variant),
            menuButtonDom(variant),
          ]),
        runs: 15,
        steps: 25,
        seed: 13,
      });
    });
  }
});

describe("createMenu (plain) x ported menu-button scenarios (real DOM)", () => {
  for (const source of [menuAriakit, menuBaseUi, menuReactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        // the checkable variants are covered by menu.browser.test.tsx
        if (scenario.config?.["variant"] !== undefined) {
          continue;
        }
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, menuButtonBridge, menuButtonDom);
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

describe("createMenu (plain) x a host that owns the open state", () => {
  const mount = (accepts: boolean, value: boolean) =>
    mountMenuButton({
      items: ["alpha", "bravo", "charlie"],
      disabled: [],
      controlled: true,
      accepts,
      value,
    });

  const triggerOf = (root: HTMLElement): HTMLElement =>
    root.querySelector<HTMLElement>('[data-part="trigger"]') as HTMLElement;
  const menuOf = (root: HTMLElement): HTMLElement =>
    root.querySelector<HTMLElement>('[data-part="menu"]') as HTMLElement;
  const itemsOf = (root: HTMLElement): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="menuitem"]'),
  ];

  it("keeps the menu open and the focus on its item when the host ignores a close", () => {
    const mounted = mount(false, true);
    const menu = menuOf(mounted.root);
    const trigger = triggerOf(mounted.root);
    expect(menu.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    // the host opened it: the focus is on the first item, as the model has it
    expect(mounted.focus?.()).toBe("menuitem:0");
    const items = itemsOf(mounted.root);
    items[1]?.focus();
    flush();
    expect(mounted.focus?.()).toBe("menuitem:1");
    // Escape is a close request: it reaches the host, the host holds, so the
    // menu stays open and the focus stays where it was (menu-button.qnt reverts
    // the whole transition)
    items[1]?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    flush();
    expect(mounted.events.get("onOpenChange")).toEqual([[false]]);
    expect(menu.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(mounted.focus?.()).toBe("menuitem:1");
    // activating an item closes it too, and is ignored the same way (the
    // primitive activates its own focused item)
    items[1]?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    flush();
    expect(menu.hidden).toBe(false);
    expect(mounted.focus?.()).toBe("menuitem:1");
    // the trigger's own click toggles through the request as well
    trigger.click();
    flush();
    expect(menu.hidden).toBe(false);
    mounted.dispose();
  });

  it("moves the focus with the state when the host accepts every request", () => {
    const mounted = mount(true, false);
    const menu = menuOf(mounted.root);
    const trigger = triggerOf(mounted.root);
    expect(menu.hidden).toBe(true);
    trigger.click();
    flush();
    expect(mounted.events.get("onOpenChange")).toEqual([[true]]);
    expect(menu.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    // the accepted request moves the focus to the first item
    expect(mounted.focus?.()).toBe("menuitem:0");
    itemsOf(mounted.root)[0]?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    flush();
    expect(mounted.events.get("onOpenChange")).toEqual([[true], [false]]);
    expect(menu.hidden).toBe(true);
    expect(mounted.focus?.()).toBe("trigger");
    mounted.dispose();
  });
});
