import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  menuMenubarBridge,
  menuMenubarConfig,
  menuMenubarProbe,
  menuMenubarSteps,
} from "@cssints/apg-specs/apg/menu-menubar.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";
import ariakit from "@cssints/apg-specs/scenarios/apg/menubar.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/menubar.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/menu-menubar.model.json";
import { menubarDriver } from "./menubar-driver.ts";
import { mountBar, mountMenubar } from "./menubar.fixture";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) => menubarDriver(mountMenubar(menuMenubarConfig(config)));

// Scenarios whose expectations the primitive deliberately does not meet: the ported menubar scenarios describe the upstream
// fixtures' own trees and library defaults, while the primitive implements the APG/Quint contract. These are the same
// divergences `packages/headless/test/menu.browser.test.tsx` pins; each must still fail here, so closing the primitive's
// gap forces removing the entry.
const MENUBAR_TREE =
  "the ported scenario describes the upstream fixture tree (menu sizes / which item owns the submenu / a menu-less bar); the primitive renders the menu-menubar.qnt fixed tree";
const MENUBAR_ROW_CONTROL =
  "the upstream fixture's row is a native control (a text input, a link or a button) that keeps the arrows and whose menu stays open; the kit's rows are buttons that the library owns, and activating a leaf closes every menu";
const MENUBAR_VERTICAL_CROSS_AXIS =
  "menu-menubar.qnt models a horizontal bar: its Left / Right out of an open menu move along the bar, while a vertical bar's inline pair is the cross axis (upstream closes the menu and returns to the bar item)";
const MENUBAR_HOVER =
  "store hover-intent opening (APG optional; an ariakit/base-ui extension) is not modelled; menus open on keyboard and click";
const MENUBAR_POPUP_FOCUS =
  "ariakit keeps DOM focus on the popup container; the primitive focuses the first menu item (APG)";
const MENUBAR_CONTAINER_FOCUS =
  "the scenario focuses the menu container; the primitive keeps DOM focus on menu items";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "menubar.ariakit.arrow-down-keeps-focus-on-control-in-vertical-menubar": MENUBAR_ROW_CONTROL,
  "menubar.ariakit.arrow-down-keeps-focus-on-input-in-vertical-menubar": MENUBAR_ROW_CONTROL,
  "menubar.ariakit.arrow-keys-keep-focus-on-input-in-vertical-menubar": MENUBAR_ROW_CONTROL,
  "menubar.ariakit.vertical-arrow-right-opens-menu": MENUBAR_VERTICAL_CROSS_AXIS,
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

describe("Menubar x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, menuMenubarBridge, dom);
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

// Why a config the kit's wiring cannot walk. The spec models a horizontal bar and always wraps, and the primitive exposes no
// controlled top-level menu.
const VERTICAL =
  "menu-menubar.qnt models a horizontal bar and its bridge announces aria-orientation=horizontal; vertical navigation is not modelled";
const WRAP =
  "the bridge rejects a wrap config, and createMenubar does not read its `wrap` option: the spec and the primitive always wrap";
const CONTROLLED =
  "createMenubar exposes no controlled openTop (the spec's value / request pair), so the host cannot be walked against it";

describe("Menubar x spec (differential walk)", () => {
  const BASE: ScenarioConfig = { items: ["File", "Edit", "About"] };
  const CONFIGS: ReadonlyArray<{ readonly config: ScenarioConfig; readonly why?: string }> = [
    { config: BASE },
    { config: { ...BASE, orientation: "horizontal" } },
    { config: { ...BASE, orientation: "vertical" }, why: VERTICAL },
    { config: { ...BASE, wrap: false }, why: WRAP },
    { config: { ...BASE, controlled: true, accepts: true }, why: CONTROLLED },
  ];
  for (const { config, why } of CONFIGS) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async (context) => {
      if (why !== undefined) {
        context.skip(why);
        return;
      }
      await differentialWalk({
        alphabet: menuMenubarSteps,
        probe: menuMenubarProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, menuMenubarBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 11,
      });
    });
  }
});

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const parts = (root: HTMLElement, name: string): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`),
];
const rowsOf = (menu: HTMLElement): HTMLElement[] =>
  [...menu.children].filter((child): child is HTMLElement => child instanceof HTMLElement);
// A real key event on what holds the focus: the platform moves the roving focus only for a trusted keydown (the widget
// itself reads the keys it owns from both). The highlight is the primitive's announcement, not a tabindex.
const key = async (name: string): Promise<void> => {
  await userEvent.keyboard(`{${name}}`);
  flush();
};
const highlighted = (rows: ReadonlyArray<HTMLElement>): ReadonlyArray<string | null> =>
  rows.map((row) => row.getAttribute("data-highlighted"));

describe("Menubar (the kit's DOM)", () => {
  it("is a menubar focusgroup with an anchor and a hidden menu per item", () => {
    const { root, dispose } = mountBar();
    const bar = parts(root, "menubar")[0]!;
    expect(bar.getAttribute("role")).toBe("menubar");
    expect(bar.getAttribute("aria-orientation")).toBe("horizontal");
    // the bar is one `focusgroup` segment (`menubar`, the inline axis, wrap): the provider owns the tab stop, so the
    // markup carries none — the native engine writes no `tabindex` at all
    expect(bar.getAttribute("focusgroup")).toBe("menubar inline wrap");
    const triggers = parts(root, "menubar-trigger");
    expect(triggers.map((trigger) => trigger.getAttribute("role"))).toEqual([
      "menuitem",
      "menuitem",
      "menuitem",
    ]);
    // every bar item is a button (focusable) and the same attribute object: no tabindex of its own
    expect(triggers.map((trigger) => trigger.tagName)).toEqual(["BUTTON", "BUTTON", "BUTTON"]);
    expect(triggers.map((trigger) => trigger.hasAttribute("tabindex"))).toEqual([
      false,
      false,
      false,
    ]);
    expect(triggers.map((trigger) => trigger.getAttribute("aria-haspopup"))).toEqual([
      "menu",
      "menu",
      null,
    ]);
    expect(triggers[0]!.getAttribute("aria-expanded")).toBe("false");
    const menus = parts(root, "menubar-menu");
    expect(menus).toHaveLength(2);
    expect(menus.map((menu) => menu.getAttribute("role"))).toEqual(["menu", "menu"]);
    expect(menus[0]!.hidden).toBe(true);
    // hidden has to mean hidden: no display in the menu's class may override the UA's `[hidden] { display: none }`
    expect(style(menus[0]!).display).toBe("none");
    // the anchor is one box per bar item, and the menu is absolute in it, over the page
    const anchor = parts(root, "menubar-anchor")[0]!;
    expect(style(anchor).position).toBe("relative");
    expect(style(menus[0]!).position).toBe("absolute");
    expect(style(menus[0]!).zIndex).toBe("10");
    dispose();
  });

  it("opens a menu under its bar item, focuses the first row and moves the highlight", async () => {
    const { root, dispose } = mountBar();
    const triggers = parts(root, "menubar-trigger");
    const menu = parts(root, "menubar-menu")[0]!;
    triggers[0]!.focus();
    flush();
    triggers[0]!.click();
    flush();
    expect(triggers[0]!.getAttribute("aria-expanded")).toBe("true");
    expect(menu.hidden).toBe(false);
    expect(style(menu).display).not.toBe("none");
    // a click opens the menu and the focus stays on the bar item; Down is what enters it
    expect(document.activeElement).toBe(triggers[0]);
    const rows = rowsOf(menu);
    expect(rows.map((row) => row.getAttribute("role"))).toEqual([
      "menuitem",
      "menuitem",
      "menuitem",
    ]);
    await key("ArrowDown");
    // the highlight is the row the primitive announces, and the DOM focus went there
    expect(highlighted(rows)).toEqual(["true", null, null]);
    expect(document.activeElement).toBe(rows[0]);
    expect(style(rows[0]!).backgroundColor).not.toBe(style(rows[1]!).backgroundColor);
    await key("ArrowDown");
    expect(highlighted(rows)).toEqual([null, "true", null]);
    expect(document.activeElement).toBe(rows[1]);
    expect(style(rows[1]!).backgroundColor).not.toBe(style(rows[2]!).backgroundColor);
    dispose();
  });

  it("opens the submenu with Right, paints its chevron from aria-expanded and closes only it", async () => {
    const { root, dispose } = mountBar();
    const triggers = parts(root, "menubar-trigger");
    const menu = parts(root, "menubar-menu")[0]!;
    triggers[0]!.click();
    flush();
    await key("ArrowDown");
    await key("ArrowDown");
    const parent = rowsOf(menu)[1]!;
    const submenu = parent.querySelector<HTMLElement>('[data-part="menubar-submenu"]')!;
    const chevron = parent.querySelector<HTMLElement>('span[aria-hidden="true"]')!;
    expect(document.activeElement).toBe(parent);
    expect(parent.getAttribute("aria-haspopup")).toBe("menu");
    expect(parent.getAttribute("aria-expanded")).toBe("false");
    expect(submenu.hidden).toBe(true);
    // the marker is the row's announcement: visible because it says it has a popup, and turned when it is open
    expect(style(chevron).visibility).toBe("visible");
    expect(style(chevron).transform).toBe("none");
    await key("ArrowRight");
    expect(parent.getAttribute("aria-expanded")).toBe("true");
    expect(submenu.hidden).toBe(false);
    expect(submenu.getAttribute("role")).toBe("menu");
    expect(style(chevron).transform).not.toBe("none");
    // the submenu floats beside its parent row, which is its anchor
    expect(style(parent).position).toBe("relative");
    expect(style(submenu).position).toBe("absolute");
    expect(style(submenu).zIndex).toBe("10");
    const subItems = rowsOf(submenu);
    expect(subItems.map((row) => row.getAttribute("role"))).toEqual(["menuitem", "menuitem"]);
    expect(document.activeElement).toBe(subItems[0]);
    // Down moves inside the submenu, and Escape leaves it one level at a time
    await key("ArrowDown");
    expect(highlighted(subItems)).toEqual([null, "true"]);
    expect(document.activeElement).toBe(subItems[1]);
    await key("Escape");
    expect(submenu.hidden).toBe(true);
    expect(parent.getAttribute("aria-expanded")).toBe("false");
    // the chevron is painted from `aria-expanded` through a 120 ms transition: let it land before reading it
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(style(chevron).transform).toBe("none");
    expect(menu.hidden).toBe(false);
    expect(document.activeElement).toBe(parent);
    const barItem = triggers[0]!;
    await key("Escape");
    expect(menu.hidden).toBe(true);
    expect(barItem.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(barItem);
    dispose();
  });

  it("opens the next menu with Right along the bar and leaves the focus on the bar item", async () => {
    const { root, dispose } = mountBar();
    const triggers = parts(root, "menubar-trigger");
    const menus = parts(root, "menubar-menu");
    triggers[0]!.focus();
    flush();
    triggers[0]!.click();
    flush();
    // Right on the open menu's first row moves along the bar and opens that item's menu (the APG rule: the menu opens
    // without the focus going into it)
    await key("ArrowRight");
    expect(menus[0]!.hidden).toBe(true);
    expect(menus[1]!.hidden).toBe(false);
    expect(triggers[1]!.getAttribute("aria-expanded")).toBe("true");
    expect(highlighted(triggers)).toEqual([null, "true", null]);
    expect(document.activeElement).toBe(triggers[1]);
    expect(menus[1]!.contains(document.activeElement)).toBe(false);
    // Down is what enters it
    await key("ArrowDown");
    expect(document.activeElement).toBe(rowsOf(menus[1]!)[0]);
    dispose();
  });

  it("closes every menu on a pointer press outside the bar", () => {
    const { root, dispose } = mountBar();
    const triggers = parts(root, "menubar-trigger");
    const menus = parts(root, "menubar-menu");
    triggers[0]!.click();
    flush();
    expect(menus[0]!.hidden).toBe(false);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    flush();
    expect(menus[0]!.hidden).toBe(true);
    expect(triggers[0]!.getAttribute("aria-expanded")).toBe("false");
    dispose();
  });
});
