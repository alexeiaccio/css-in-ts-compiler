import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { createEffect } from "solid-js";
import { type Tabs, type TabsOptions, createTabs } from "../src/tabs";

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });

const at = <T extends Element>(list: ArrayLike<T>, index: number): T => {
  const element = list[index];
  if (element === undefined) {
    throw new Error(`no element ${index}`);
  }
  return element;
};

interface Mounted {
  readonly root: HTMLDivElement;
  /** The element after the component, to prove focus can leave it. */
  readonly after: HTMLButtonElement;
  readonly tabs: Tabs;
  readonly tab: (index: number) => HTMLButtonElement;
  readonly panel: (index: number) => HTMLElement;
  /** A focusable child of every panel, hidden or not. */
  readonly panelButton: (index: number) => HTMLButtonElement;
  readonly dispose: () => void;
}

/**
 * A real host: a tablist, one `role=tab` button per tab (its visible label is
 * the tab's only name) and a panel with a focusable child of its own. DOM focus
 * follows the primitive's `focused` tab, as a host would.
 */
const mount = (options: TabsOptions = {}): Mounted => {
  const root = document.createElement("div");
  const after = document.createElement("button");
  after.textContent = "after";
  document.body.append(root, after);
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
            <button data-part="panel-button">Inside {index + 1}</button>
          </div>
        ))}
      </div>
    );
  }, root);

  return {
    root,
    after,
    get tabs() {
      return api as Tabs;
    },
    tab: (index) => at(tabElements(), index),
    panel: (index) => at(root.querySelectorAll<HTMLElement>('[data-part="tabpanel"]'), index),
    panelButton: (index) =>
      at(root.querySelectorAll<HTMLButtonElement>('[data-part="panel-button"]'), index),
    dispose: () => {
      dispose();
      root.remove();
      after.remove();
    },
  };
};

describe("createTabs requirements (real DOM)", () => {
  it("names every tab, panel and state in the accessibility tree", () => {
    const mounted = mount({ disabled: [1] });
    try {
      expect(page.getByRole("tablist").element()).toBe(
        mounted.root.querySelector('[role="tablist"]'),
      );

      const tabs = [0, 1, 2].map((index) => mounted.tab(index));
      for (const [index, tab] of tabs.entries()) {
        const panel = mounted.panel(index);
        expect(tab.getAttribute("role")).toBe("tab");
        expect(tab.getAttribute("aria-selected")).toBe(index === 0 ? "true" : "false");
        expect(tab.getAttribute("aria-controls")).toBe(panel.id);
        expect(panel.getAttribute("role")).toBe("tabpanel");
        expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
        // the accessible name is the label the host rendered: no aria-label
        expect(page.getByRole("tab", { name: `Tab ${index + 1}`, exact: true }).element()).toBe(
          tab,
        );
      }

      // every panel, including the hidden ones, is a tabpanel
      expect(page.getByRole("tabpanel", { includeHidden: true }).elements()).toEqual(
        [0, 1, 2].map((index) => mounted.panel(index)),
      );
      expect(tabs.filter((tab) => tab.getAttribute("aria-selected") === "true")).toHaveLength(1);
      expect(tabs.filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
      expect(mounted.tab(1).getAttribute("aria-disabled")).toBe("true");
    } finally {
      mounted.dispose();
    }
  });

  it("lets focus leave the tablist and keeps hidden panels out of the tab order", async () => {
    const mounted = mount({ focusablePanels: [0, 1, 2] });
    try {
      // hidden is the native attribute, not only a prop the host must honour
      expect(mounted.tabs.tabpanelProps(1).hidden).toBe(true);
      expect(mounted.panel(1).hasAttribute("hidden")).toBe(true);
      expect(mounted.tabs.tabpanelProps(0).hidden).toBe(false);

      mounted.tab(0).focus();
      const visited: Element[] = [];
      for (let step = 0; step < 6; step += 1) {
        await userEvent.tab();
        const active = document.activeElement;
        if (active === null) {
          break;
        }
        visited.push(active);
        if (active === mounted.after) {
          break;
        }
      }

      // the component does not trap: Tab reaches the sibling after it
      expect(document.activeElement).toBe(mounted.after);
      // it passed through the visible panel's content on the way out
      expect(visited).toContain(mounted.panelButton(0));
      // a button in a hidden panel never took focus
      for (const index of [1, 2]) {
        expect(visited).not.toContain(mounted.panelButton(index));
        expect(mounted.panelButton(index).closest("[hidden]")).toBe(mounted.panel(index));
      }
    } finally {
      mounted.dispose();
    }
  });

  it("selects on the up event, not the down event", async () => {
    const mounted = mount();
    try {
      const down = (element: HTMLElement): void => {
        element.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            cancelable: true,
            pointerType: "mouse",
          }),
        );
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      };

      // a mousedown alone is inert: the primitive's only activation path is onClick
      down(mounted.tab(1));
      await settle();
      expect(mounted.tabs.selected()).toBe(0);
      expect(mounted.tab(1).getAttribute("aria-selected")).toBe("false");

      // pointerup / click is the up path and selects
      await userEvent.click(mounted.tab(1));
      await settle();
      expect(mounted.tabs.selected()).toBe(1);
      expect(mounted.tab(1).getAttribute("aria-selected")).toBe("true");

      // a cancelled gesture never reaches the up path
      down(mounted.tab(2));
      mounted.tab(2).dispatchEvent(
        new PointerEvent("pointercancel", {
          bubbles: true,
          cancelable: true,
          pointerType: "mouse",
        }),
      );
      await settle();
      expect(mounted.tabs.selected()).toBe(1);
      expect(mounted.tab(2).getAttribute("aria-selected")).toBe("false");
    } finally {
      mounted.dispose();
    }
  });

  it("swaps ArrowLeft and ArrowRight in a horizontal rtl tablist", async () => {
    const mounted = mount({ dir: "rtl" });
    try {
      mounted.tab(0).focus();
      // right-to-left: the next tab is to the left
      await userEvent.keyboard("{ArrowLeft}");
      await settle();
      expect(mounted.tabs.selected()).toBe(1);
      expect(mounted.tab(1).getAttribute("aria-selected")).toBe("true");

      await userEvent.keyboard("{ArrowRight}");
      await settle();
      expect(mounted.tabs.selected()).toBe(0);
    } finally {
      mounted.dispose();
    }
  });

  it("keeps the ltr arrows and the vertical axis unchanged", async () => {
    const horizontal = mount();
    try {
      horizontal.tab(0).focus();
      await userEvent.keyboard("{ArrowRight}");
      await settle();
      expect(horizontal.tabs.selected()).toBe(1);
      await userEvent.keyboard("{ArrowLeft}");
      await settle();
      expect(horizontal.tabs.selected()).toBe(0);
    } finally {
      horizontal.dispose();
    }

    // dir=rtl does not touch a vertical tablist: Up / Down still move it
    const vertical = mount({ orientation: "vertical", dir: "rtl" });
    try {
      vertical.tab(0).focus();
      await userEvent.keyboard("{ArrowDown}");
      await settle();
      expect(vertical.tabs.selected()).toBe(1);
      await userEvent.keyboard("{ArrowUp}");
      await settle();
      expect(vertical.tabs.selected()).toBe(0);
      await userEvent.keyboard("{ArrowLeft}");
      await userEvent.keyboard("{ArrowRight}");
      await settle();
      expect(vertical.tabs.selected()).toBe(0);
    } finally {
      vertical.dispose();
    }
  });
});
