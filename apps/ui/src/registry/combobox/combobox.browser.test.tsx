import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { COMBOBOX_LABEL, type MountedCombobox, mountCombobox } from "./combobox.fixture";

// @cssints/headless walks `createCombobox` against the APG combobox specs in test/combobox.browser.test.tsx, so that file
// is the primitive's oracle. This file is the skin's: it mounts the starter in a real Chromium, reads the field and the
// listbox the primitive built, and types, keys and picks the way a reader does. The filter, the active option and every
// `aria-*` are the primitive's; the field's display of the chosen label after a commit is the skin's.

/** Solid 2 applies setters and the primitive's effects on later turns. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

/** A frame for the computed styles, after a transition has been given time to start. */
const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const waitFor = async (done: () => boolean, limit = 2000): Promise<void> => {
  const start = performance.now();
  while (!done()) {
    if (performance.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await frame();
  }
};

const live: MountedCombobox[] = [];

const mounted = (config?: Parameters<typeof mountCombobox>[0]): MountedCombobox => {
  const instance = mountCombobox(config);
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
    throw new Error(`combobox: no ${selector}`);
  }
  return element;
};

const field = (root: ParentNode): HTMLInputElement =>
  required<HTMLInputElement>(root, '[data-part="combobox-input"]');

const list = (root: ParentNode): HTMLElement => required(root, '[data-part="combobox-listbox"]');

const rows = (root: ParentNode): ReadonlyArray<HTMLElement> => [
  ...root.querySelectorAll<HTMLElement>('[data-part="combobox-option"]'),
];

const labels = (root: ParentNode): ReadonlyArray<string> =>
  rows(root).map((row) => row.textContent ?? "");

const activeId = (root: ParentNode): string | null =>
  field(root).getAttribute("aria-activedescendant");

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);

/** Real typing in the field, replacing what is there, as a reader's first character does. */
const type = async (root: ParentNode, text: string): Promise<void> => {
  const input = field(root);
  input.focus();
  input.select();
  await userEvent.keyboard(text);
  flush();
  await settle();
};

/** A key on the focused field, as a reader's would arrive. */
const press = async (root: ParentNode, key: string): Promise<void> => {
  field(root).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  flush();
  await settle();
};

describe("Combobox", () => {
  it("is a named combobox field whose popup is a listbox of options", async () => {
    const { root } = mounted();
    await settle();

    const input = field(root);
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-label")).toBe(COMBOBOX_LABEL);
    expect(input.getAttribute("aria-haspopup")).toBe("listbox");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    // closed: no popup is named and no option is active
    expect(input.getAttribute("aria-controls")).toBeNull();
    expect(input.getAttribute("aria-activedescendant")).toBeNull();
    expect(input.value).toBe("");

    const box = list(root);
    expect(box.getAttribute("role")).toBe("listbox");
    expect(box.getAttribute("aria-label")).toBe(COMBOBOX_LABEL);
    expect(box.hidden).toBe(true);

    const all = rows(root);
    expect(all).toHaveLength(12);
    expect(all.every((row) => row.getAttribute("role") === "option")).toBe(true);
    // every row has the primitive's own id, and none of them is announced while the popup is closed
    expect(new Set(all.map((row) => row.id)).size).toBe(12);
    expect(all.every((row) => row.getAttribute("aria-selected") === "false")).toBe(true);
  });

  it("filters as the reader types, and the listbox holds the matches with the first one active", async () => {
    const { root } = mounted();
    await settle();

    await type(root, "s");

    const input = field(root);
    expect(input.value).toBe("s");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.getAttribute("aria-controls")).toBe(list(root).id);
    expect(list(root).hidden).toBe(false);
    expect(labels(root)).toEqual(["Select", "Slider", "Switch"]);

    const all = rows(root);
    expect(input.getAttribute("aria-activedescendant")).toBe(all[0]?.id);
    expect(all.map((row) => row.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    // the active row is painted from the announcement, not from a copy of the active index
    await waitFor(() => style(all[0]!).backgroundColor !== style(all[1]!).backgroundColor);
  });

  it("moves the active option with the arrows, and aria-activedescendant follows it", async () => {
    const { root } = mounted();
    await settle();

    await type(root, "s");
    const input = field(root);
    expect(activeId(root)).toBe(rows(root)[0]?.id);

    await press(root, "ArrowDown");
    expect(activeId(root)).toBe(rows(root)[1]?.id);
    expect(rows(root)[1]?.getAttribute("aria-selected")).toBe("true");
    expect(rows(root)[0]?.getAttribute("aria-selected")).toBe("false");

    await press(root, "ArrowDown");
    expect(activeId(root)).toBe(rows(root)[2]?.id);

    // the end holds: one more down stays on the last match
    await press(root, "ArrowDown");
    expect(activeId(root)).toBe(rows(root)[2]?.id);

    await press(root, "ArrowUp");
    expect(activeId(root)).toBe(rows(root)[1]?.id);
    await press(root, "ArrowUp");
    expect(activeId(root)).toBe(rows(root)[0]?.id);
    // and the start holds
    await press(root, "ArrowUp");
    expect(activeId(root)).toBe(rows(root)[0]?.id);
  });

  it("picks the active option with Enter or Space, and the field shows the chosen label", async () => {
    const { root, changes } = mounted();
    await settle();

    await type(root, "d");
    expect(labels(root)).toEqual(["Dialog", "Drawer"]);
    await press(root, "ArrowDown");
    await press(root, "Enter");

    const input = field(root);
    expect(list(root).hidden).toBe(true);
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.getAttribute("aria-activedescendant")).toBeNull();
    expect(input.value).toBe("Drawer");
    expect(document.activeElement).toBe(input);
    expect(changes()).toEqual(["drawer"]);

    // Space commits the active row too, and the field replaces its display with the next choice
    await type(root, "sw");
    expect(labels(root)).toEqual(["Switch"]);
    await press(root, " ");
    expect(field(root).value).toBe("Switch");
    expect(list(root).hidden).toBe(true);
    expect(changes()).toEqual(["drawer", "switch"]);
  });

  it("closes on Escape, keeps the focus in the field, and shows the chosen label again", async () => {
    const { root } = mounted();
    await settle();

    await type(root, "di");
    await press(root, "Enter");
    expect(field(root).value).toBe("Dialog");

    await type(root, "s");
    expect(list(root).hidden).toBe(false);

    await press(root, "Escape");
    const input = field(root);
    expect(list(root).hidden).toBe(true);
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.getAttribute("aria-activedescendant")).toBeNull();
    expect(document.activeElement).toBe(input);
    // the filter text is gone and the field reads the selection again
    expect(input.value).toBe("Dialog");
  });

  it("says so when nothing matches", async () => {
    const { root } = mounted();
    await settle();

    await type(root, "zzz");
    expect(rows(root)).toHaveLength(0);
    expect(field(root).getAttribute("aria-expanded")).toBe("true");
    expect(field(root).getAttribute("aria-activedescendant")).toBeNull();

    const empty = required(root, '[data-part="combobox-empty"]');
    expect(empty.textContent).toBe("No matches");
  });

  it("never opens while disabled, and the field keeps the model's text", async () => {
    const { root, changes } = mounted({ disabled: true });
    await settle();

    const input = field(root);
    expect(input.getAttribute("aria-disabled")).toBe("true");
    // the pattern keeps the tab stop and announces the state; it is not a native disabled input
    expect(input.hasAttribute("disabled")).toBe(false);

    // a click and a key are dropped before they become a request, and focus does not change the picture
    input.focus();
    input.click();
    flush();
    await settle();
    await press(root, "ArrowDown");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(list(root).hidden).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBeNull();

    // the input event is dropped too: the DOM text goes back to what the model holds
    input.value = "s";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    flush();
    await settle();
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.value).toBe("");
    expect(changes()).toEqual([]);
  });
});
