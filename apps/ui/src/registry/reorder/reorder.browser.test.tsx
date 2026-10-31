import { afterEach, describe, expect, it } from "vite-plus/test";

import { REORDER_LABEL, type MountedReorder, mountReorder } from "./reorder.fixture";

// @cssints/headless walks `createRearrangeableListbox` against its Quint spec in
// test/listbox-rearrangeable.browser.test.tsx, so that file is the primitive's oracle. This file is the skin's: it mounts
// the starter in a real Chromium, reads the listbox the primitive built, and drags and keys the rows the way a reader
// does. The starter renders one of the primitive's two lists, so the transfer keys have nowhere to go and the count
// never changes: that is the skin's decision, and it is checked here.

/** Solid 2 applies setters and the primitive's effects on later turns. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const live: MountedReorder[] = [];

const mounted = (): MountedReorder => {
  const instance = mountReorder();
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
    throw new Error(`reorder: no ${selector}`);
  }
  return element;
};

const list = (root: ParentNode): HTMLElement => required(root, '[data-part="reorder-list"]');

const rows = (root: ParentNode): ReadonlyArray<HTMLElement> => [
  ...root.querySelectorAll<HTMLElement>('[data-part="reorder-row"]'),
];

const labelOf = (row: HTMLElement): string =>
  required(row, '[data-part="reorder-label"]').textContent ?? "";

const labels = (root: ParentNode): ReadonlyArray<string> => rows(root).map(labelOf);

const rowByLabel = (root: ParentNode, label: string): HTMLElement => {
  const row = rows(root).find((element) => labelOf(element) === label);
  if (row === undefined) {
    throw new Error(`reorder: no row ${label}`);
  }
  return row;
};

const status = (root: ParentNode): HTMLElement => required(root, '[data-part="reorder-status"]');

/** A key on the focused listbox, as a reader's would arrive. */
const press = async (element: HTMLElement, key: string, alt = false): Promise<void> => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { key, altKey: alt, bubbles: true, cancelable: true }),
  );
  await settle();
};

const pointer = (element: EventTarget, type: string, buttons: number): void => {
  element.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons,
    }),
  );
};

/** A drag from one row's handle onto another row: down, over the target, up. */
const drag = async (from: HTMLElement, onto: HTMLElement): Promise<void> => {
  pointer(required(from, '[data-part="reorder-handle"]'), "pointerdown", 1);
  await settle();
  pointer(onto, "pointermove", 1);
  await settle();
  pointer(window, "pointerup", 0);
  await settle();
};

describe("Reorder", () => {
  it("is a named single-select listbox whose rows state their place", async () => {
    const { root } = mounted();
    await settle();

    const element = list(root);
    expect(element.getAttribute("role")).toBe("listbox");
    expect(element.getAttribute("aria-label")).toBe(REORDER_LABEL);
    expect(element.getAttribute("aria-multiselectable")).toBe("false");
    expect(element.tabIndex).toBe(0);

    const all = rows(root);
    expect(all).toHaveLength(6);
    for (const [index, row] of all.entries()) {
      expect(row.getAttribute("role")).toBe("option");
      expect(row.getAttribute("aria-posinset")).toBe(String(index + 1));
      expect(row.getAttribute("aria-setsize")).toBe("6");
      expect(row.getAttribute("aria-selected")).toBe("false");
    }
    // the option ids are the primitive's (the index in the list the page passed), one per row
    expect(new Set(all.map((row) => row.id)).size).toBe(6);

    // the status line is polite and already says the order the demo starts in
    expect(status(root).getAttribute("role")).toBe("status");
    expect(status(root).getAttribute("aria-live")).toBe("polite");
    expect(status(root).textContent).toBe(
      "Order: Home, Search, Library, Radio, Podcasts, Settings.",
    );

    // the first row is the option the primitive's tab stop names once the list has the focus
    element.focus();
    await settle();
    expect(element.getAttribute("aria-activedescendant")).toBe(all[0]?.id);
    expect(all[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("reorders by dragging a row's handle onto another row, and the host hears the new order", async () => {
    const { root, order, calls } = mounted();
    await settle();

    const library = rowByLabel(root, "Library");
    const home = rowByLabel(root, "Home");
    expect(labels(root)).toEqual(["Home", "Search", "Library", "Radio", "Podcasts", "Settings"]);

    pointer(required(library, '[data-part="reorder-handle"]'), "pointerdown", 1);
    await settle();
    // the row is lifted, and the list has the focus and the active option
    expect(library.getAttribute("data-dragging")).toBe("true");
    expect(document.activeElement).toBe(list(root));
    expect(list(root).getAttribute("aria-activedescendant")).toBe(library.id);

    pointer(home, "pointermove", 1);
    await settle();
    pointer(window, "pointerup", 0);
    await settle();

    expect(labels(root)).toEqual(["Library", "Home", "Search", "Radio", "Podcasts", "Settings"]);
    expect(rows(root)).toHaveLength(6);
    expect(rowByLabel(root, "Library").getAttribute("data-dragging")).toBe("false");
    expect(rowByLabel(root, "Library").getAttribute("aria-posinset")).toBe("1");
    expect(rowByLabel(root, "Library").getAttribute("aria-selected")).toBe("true");
    // the focus stays in the list, and the option it names is the row that moved
    expect(document.activeElement).toBe(list(root));
    expect(list(root).getAttribute("aria-activedescendant")).toBe(rowByLabel(root, "Library").id);

    // the page heard the order once, and the status line says where the row landed
    expect(calls()).toEqual([["Library", "Home", "Search", "Radio", "Podcasts", "Settings"]]);
    expect(order()).toEqual(["Library", "Home", "Search", "Radio", "Podcasts", "Settings"]);
    expect(status(root).textContent).toBe("Moved Library to position 1 of 6.");
  });

  it("moves the focused row with Alt+Arrow, announces it, and keeps the focus on it", async () => {
    const { root, order } = mounted();
    await settle();

    const element = list(root);
    element.focus();
    await settle();
    // down to Library, the third row
    await press(element, "ArrowDown");
    await press(element, "ArrowDown");
    expect(list(root).getAttribute("aria-activedescendant")).toBe(rowByLabel(root, "Library").id);

    await press(element, "ArrowUp", true);
    expect(labels(root)).toEqual(["Home", "Library", "Search", "Radio", "Podcasts", "Settings"]);
    const library = rowByLabel(root, "Library");
    expect(library.getAttribute("aria-posinset")).toBe("2");
    expect(library.getAttribute("aria-selected")).toBe("true");
    // the primitive keeps the row active, the skin keeps the focus in the list, and the two agree
    expect(list(root).getAttribute("aria-activedescendant")).toBe(library.id);
    expect(document.activeElement).toBe(element);
    expect(status(root).textContent).toBe("Moved Library to position 2 of 6.");
    expect(order()).toEqual(["Home", "Library", "Search", "Radio", "Podcasts", "Settings"]);

    await press(element, "ArrowDown", true);
    expect(labels(root)).toEqual(["Home", "Search", "Library", "Radio", "Podcasts", "Settings"]);
    expect(list(root).getAttribute("aria-activedescendant")).toBe(rowByLabel(root, "Library").id);
    expect(status(root).textContent).toBe("Moved Library to position 3 of 6.");

    // a plain arrow moves the cursor; it does not reorder
    await press(element, "ArrowUp");
    expect(labels(root)).toEqual(["Home", "Search", "Library", "Radio", "Podcasts", "Settings"]);
    expect(list(root).getAttribute("aria-activedescendant")).toBe(rowByLabel(root, "Search").id);
  });

  it("jumps to the ends with Home and End, and the order and the count survive", async () => {
    const { root } = mounted();
    await settle();

    const element = list(root);
    element.focus();
    await settle();

    await press(element, "End");
    expect(list(root).getAttribute("aria-activedescendant")).toBe(rows(root).at(-1)?.id);
    expect(rows(root).at(-1)?.getAttribute("aria-posinset")).toBe("6");

    // the last row cannot move down, and the first cannot move up: the order stays
    await press(element, "ArrowDown", true);
    expect(labels(root)).toEqual(["Home", "Search", "Library", "Radio", "Podcasts", "Settings"]);

    await press(element, "Home");
    expect(list(root).getAttribute("aria-activedescendant")).toBe(rows(root)[0]?.id);
    await press(element, "ArrowUp", true);
    expect(labels(root)).toEqual(["Home", "Search", "Library", "Radio", "Podcasts", "Settings"]);

    // the primitive's transfer keys have no second list here: Enter and Delete change nothing
    await press(element, "ArrowDown");
    await press(element, "Enter");
    await press(element, "Delete");
    expect(labels(root)).toEqual(["Home", "Search", "Library", "Radio", "Podcasts", "Settings"]);
    expect(rows(root)).toHaveLength(6);
  });
});
