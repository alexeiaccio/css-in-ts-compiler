import { userEvent } from "vite-plus/test/browser";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedTreegrid, mountTreegrid } from "./treegrid.fixture";

// @cssints/headless checks `createTreegrid` against specs/apg/treegrid.qnt and the ported APG scenarios. This file is the
// skin's oracle: it mounts the starter in a real Chromium and drives the same rows and cells a reader does. The skin's own
// parts (the frame, the zebra, the selected look, the indent and the focus that follows the primitive's tab stop) are only
// observable through the DOM.

/** Solid 2 delivers events through its delegated listener on a later turn. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const live: MountedTreegrid[] = [];

const mounted = (): MountedTreegrid => {
  const instance = mountTreegrid();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const required = <T extends Element>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`treegrid: no ${selector}`);
  }
  return element;
};

const grid = (root: ParentNode): HTMLElement => required(root, '[data-part="treegrid"]');

const rows = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="treegrid-row"]'),
];

const row = (root: ParentNode, id: string): HTMLElement =>
  required(root, `[data-part="treegrid-row"][data-id="${id}"]`);

const cell = (root: ParentNode, id: string, col: number): HTMLElement =>
  required(root, `[data-part="treegrid-row"][data-id="${id}"] [data-col="${col}"]`);

const expander = (root: ParentNode, id: string): HTMLElement =>
  required(root, `[data-part="treegrid-row"][data-id="${id}"] [data-part="treegrid-expander"]`);

/** The row id the DOM focus is on, or the cell it is on as `row:col`. */
const focused = (): string | null => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    return null;
  }
  const id = active.dataset["id"];
  return active.dataset["part"] === "treegrid-cell"
    ? `${id}:${active.dataset["col"]}`
    : (id ?? null);
};

/** A key on the focused element, as a reader's would arrive. */
const press = async (key: string): Promise<boolean> => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    throw new Error("treegrid: nothing has the focus");
  }
  const allowed = active.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
  await settle();
  return allowed;
};

describe("Treegrid", () => {
  it("is a named treegrid with a header row and the tree's own structure", () => {
    const { root } = mounted();

    expect(grid(root).getAttribute("role")).toBe("treegrid");
    expect(grid(root).getAttribute("aria-label")).toBe("Project files");
    // the default selection is single, so the grid is not announced as multi-selectable
    expect(grid(root).hasAttribute("aria-multiselectable")).toBe(false);

    const headers = [...root.querySelectorAll<HTMLElement>('[data-part="treegrid-header-cell"]')];
    expect(headers.map((header) => header.getAttribute("role"))).toEqual([
      "columnheader",
      "columnheader",
      "columnheader",
    ]);
    expect(headers.map((header) => header.textContent)).toEqual(["Name", "Size", "Modified"]);

    expect(rows(root).map((element) => element.dataset["id"])).toEqual([
      "src",
      "App.tsx",
      "styles.css",
      "components",
      "public",
      "favicon.svg",
      "hero.png",
      "tests",
    ]);
    expect(rows(root).every((element) => element.getAttribute("role") === "row")).toBe(true);

    // the levels, sizes and positions are the primitive's `aria-*`, not a second copy in the skin
    expect(row(root, "src").getAttribute("aria-level")).toBe("1");
    expect(row(root, "App.tsx").getAttribute("aria-level")).toBe("2");
    expect(row(root, "src").getAttribute("aria-expanded")).toBe("true");
    expect(row(root, "components").getAttribute("aria-expanded")).toBe("false");
    expect(row(root, "App.tsx").hasAttribute("aria-expanded")).toBe(false);
    expect(row(root, "App.tsx").getAttribute("aria-posinset")).toBe("1");
    expect(row(root, "App.tsx").getAttribute("aria-setsize")).toBe("3");
    expect(row(root, "public").getAttribute("aria-posinset")).toBe("2");
    expect(row(root, "tests").getAttribute("aria-posinset")).toBe("3");
    expect(row(root, "tests").getAttribute("aria-setsize")).toBe("3");
  });

  it("expands with Right and collapses with Left, then steps into the cells", async () => {
    const { root } = mounted();
    row(root, "src").focus();
    await settle();
    expect(focused()).toBe("src");

    await press("ArrowLeft");
    expect(row(root, "src").getAttribute("aria-expanded")).toBe("false");
    expect(rows(root).map((element) => element.dataset["id"])).toEqual([
      "src",
      "public",
      "favicon.svg",
      "hero.png",
      "tests",
    ]);
    expect(focused()).toBe("src");

    await press("ArrowRight");
    expect(row(root, "src").getAttribute("aria-expanded")).toBe("true");
    expect(row(root, "App.tsx")).not.toBeNull();

    // Right on an open parent enters its first cell; Left at the first cell goes back to the row
    await press("ArrowRight");
    expect(focused()).toBe("src:0");
    await press("ArrowLeft");
    expect(focused()).toBe("src");
  });

  it("moves between the visible rows with Down and Up", async () => {
    const { root } = mounted();
    row(root, "src").focus();
    await settle();

    await press("ArrowDown");
    expect(focused()).toBe("App.tsx");
    await press("ArrowDown");
    expect(focused()).toBe("styles.css");
    await press("ArrowUp");
    expect(focused()).toBe("App.tsx");
  });

  it("jumps to the first and last visible row with Home and End", async () => {
    const { root } = mounted();
    row(root, "App.tsx").focus();
    await settle();

    await press("End");
    expect(focused()).toBe("tests");
    await press("Home");
    expect(focused()).toBe("src");
  });

  it("leaves the grid on Tab", async () => {
    const { root } = mounted();
    row(root, "src").focus();
    await settle();

    // the primitive does not handle Tab: the page's tab order is the grid's, one stop and out
    expect(await press("Tab")).toBe(true);
    await userEvent.tab();
    expect(document.activeElement).toBe(required(root, '[data-part="treegrid-after"]'));
  });

  it("roves across the cells of a row with Right and Left", async () => {
    const { root } = mounted();
    row(root, "src").focus();
    await settle();

    await press("ArrowRight");
    expect(focused()).toBe("src:0");
    await press("ArrowRight");
    expect(focused()).toBe("src:1");
    await press("ArrowRight");
    expect(focused()).toBe("src:2");
    // the last column is the end of the row
    await press("ArrowRight");
    expect(focused()).toBe("src:2");
    await press("ArrowLeft");
    expect(focused()).toBe("src:1");
    await press("ArrowLeft");
    expect(focused()).toBe("src:0");
    await press("ArrowLeft");
    expect(focused()).toBe("src");
  });

  it("selects the row whose cell is clicked and paints it from aria-selected", async () => {
    const { root } = mounted();
    const plain = getComputedStyle(row(root, "src")).backgroundColor;

    cell(root, "App.tsx", 1).click();
    await settle();

    expect(row(root, "App.tsx").getAttribute("aria-selected")).toBe("true");
    expect(row(root, "src").hasAttribute("aria-selected")).toBe(false);
    expect(getComputedStyle(row(root, "App.tsx")).backgroundColor).not.toBe(plain);

    cell(root, "public", 2).click();
    await settle();
    expect(row(root, "public").getAttribute("aria-selected")).toBe("true");
    expect(row(root, "App.tsx").hasAttribute("aria-selected")).toBe(false);
  });

  it("names the expander of each parent and keeps it in the name cell", () => {
    const { root } = mounted();
    const src = expander(root, "src");
    const components = expander(root, "components");

    expect(src.getAttribute("role")).toBe("button");
    expect(src.getAttribute("aria-label")).toBe("Collapse");
    expect(src.getAttribute("aria-expanded")).toBe("true");
    expect(components.getAttribute("aria-label")).toBe("Expand");
    expect(components.getAttribute("aria-expanded")).toBe("false");
    expect(src.parentElement?.dataset["col"]).toBe("0");
    // a leaf has no expander at all
    expect(row(root, "App.tsx").querySelector('[data-part="treegrid-expander"]')).toBeNull();
  });

  it("opens the third level from a collapsed parent's expander", async () => {
    const { root } = mounted();
    expect(rows(root).some((element) => element.dataset["id"] === "Button.tsx")).toBe(false);

    expander(root, "components").click();
    await settle();

    expect(row(root, "components").getAttribute("aria-expanded")).toBe("true");
    expect(row(root, "Button.tsx").getAttribute("aria-level")).toBe("3");
    expect(focused()).not.toBe("Button.tsx");
  });
});
