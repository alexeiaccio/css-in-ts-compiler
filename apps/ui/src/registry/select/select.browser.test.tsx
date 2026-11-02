import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { type MountedSelect, SELECT_LABEL, mountSelect } from "./select.fixture";

// @cssints/headless walks `createCombobox` against the APG select-only combobox spec in test/combobox.browser.test.tsx,
// so that file is the primitive's oracle. This file is the skin's: it mounts the starter in a real Chromium, reads the
// button the primitive made the combobox and the listbox it floats, and opens, moves, types and chooses the way a
// reader does. DOM focus never leaves the trigger; `aria-activedescendant` and `aria-selected` are the primitive's.

/** Solid 2 applies setters and the primitive's effects on later turns. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const live: MountedSelect[] = [];

const mounted = (config?: Parameters<typeof mountSelect>[0]): MountedSelect => {
  const instance = mountSelect(config);
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
    throw new Error(`select: no ${selector}`);
  }
  return element;
};

/** The button that shows the chosen label *is* the combobox: a select-only combobox has no text field. */
const trigger = (root: ParentNode): HTMLElement => required(root, '[role="combobox"]');
const list = (root: ParentNode): HTMLElement => required(root, '[data-part="select-listbox"]');
const options = (root: ParentNode): ReadonlyArray<HTMLElement> => [
  ...root.querySelectorAll<HTMLElement>('[data-part="select-option"]'),
];
const labels = (root: ParentNode): ReadonlyArray<string> =>
  options(root).map((option) => option.textContent ?? "");
const activeId = (root: ParentNode): string | null =>
  trigger(root).getAttribute("aria-activedescendant");
const activeLabel = (root: ParentNode): string | undefined =>
  options(root).find((option) => option.id === activeId(root))?.textContent ?? undefined;
const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);

/** Open the listbox from the trigger, as a reader's click does. */
const open = async (root: ParentNode): Promise<void> => {
  trigger(root).focus();
  await userEvent.click(trigger(root));
  flush();
  await settle();
};

/** A key on the trigger, where the DOM focus stays for the whole interaction. */
const press = async (root: ParentNode, key: string): Promise<void> => {
  trigger(root).dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
  flush();
  await settle();
};

describe("Select", () => {
  it("is a named select-only combobox whose popup is a listbox of options", async () => {
    const { root } = mounted();
    await settle();

    const button = trigger(root);
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("aria-label")).toBe(SELECT_LABEL);
    expect(button.getAttribute("aria-haspopup")).toBe("listbox");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    // closed: no popup is named and no option is active; the trigger shows the placeholder
    expect(button.getAttribute("aria-controls")).toBeNull();
    expect(button.getAttribute("aria-activedescendant")).toBeNull();
    expect(button.textContent).toBe("Pick a fruit");

    const box = list(root);
    expect(box.getAttribute("role")).toBe("listbox");
    expect(box.getAttribute("aria-label")).toBe(SELECT_LABEL);
    expect(box.hidden).toBe(true);
    // hidden has to mean hidden: no display in the list's class may override the UA's `[hidden] { display: none }`
    expect(style(box).display).toBe("none");

    const all = options(root);
    expect(labels(root)).toEqual(["Apple", "Banana", "Blueberry", "Cherry", "Cranberry", "Durian"]);
    expect(all.every((option) => option.getAttribute("role") === "option")).toBe(true);
    expect(new Set(all.map((option) => option.id)).size).toBe(6);
    expect(all.every((option) => option.getAttribute("aria-selected") === "false")).toBe(true);
  });

  it("opens from the trigger, names the list and marks the first option active", async () => {
    const { root } = mounted();
    await settle();

    await open(root);

    const button = trigger(root);
    const box = list(root);
    expect(box.hidden).toBe(false);
    expect(style(box).display).not.toBe("none");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-controls")).toBe(box.id);
    // nothing is chosen, so the popup opens on the first option
    expect(activeId(root)).toBe(options(root)[0]?.id);
    expect(options(root)[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("typeahead moves the active option as the letters change", async () => {
    const { root } = mounted();
    await settle();

    trigger(root).focus();
    flush();
    await settle();
    await press(root, "b");
    expect(list(root).hidden).toBe(false);
    expect(activeLabel(root)).toBe("Banana");
    expect(activeId(root)).toBe(options(root)[1]?.id);

    await press(root, "d");
    expect(activeLabel(root)).toBe("Durian");

    // a letter no option starts with moves nothing
    await press(root, "z");
    expect(activeLabel(root)).toBe("Durian");
  });

  it("moves aria-activedescendant with the arrows, Home and End", async () => {
    const { root } = mounted();
    await settle();
    await open(root);

    await press(root, "ArrowDown");
    expect(activeId(root)).toBe(options(root)[1]?.id);
    await press(root, "ArrowDown");
    expect(activeId(root)).toBe(options(root)[2]?.id);
    await press(root, "ArrowUp");
    expect(activeId(root)).toBe(options(root)[1]?.id);

    // the ends hold
    await press(root, "ArrowUp");
    await press(root, "ArrowUp");
    expect(activeId(root)).toBe(options(root)[0]?.id);

    await press(root, "End");
    expect(activeId(root)).toBe(options(root)[5]?.id);
    await press(root, "Home");
    expect(activeId(root)).toBe(options(root)[0]?.id);

    // Page Down moves a page, and Page Up comes back
    await press(root, "PageDown");
    expect(activeLabel(root)).toBe("Cranberry");
    await press(root, "PageUp");
    expect(activeLabel(root)).toBe("Apple");
  });

  it("chooses the active option with Enter, shows its label and keeps the focus", async () => {
    const { root, changes } = mounted();
    await settle();
    await open(root);

    await press(root, "ArrowDown");
    await press(root, "Enter");

    const button = trigger(root);
    expect(list(root).hidden).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-activedescendant")).toBeNull();
    expect(button.textContent).toBe("Banana");
    // the select-only pattern keeps the DOM focus on the trigger
    expect(document.activeElement).toBe(button);
    expect(changes()).toEqual([1]);
  });

  it("chooses with a click on an option too", async () => {
    const { root, changes } = mounted();
    await settle();
    await open(root);

    await userEvent.click(options(root)[2] as HTMLElement);
    flush();
    await settle();

    expect(list(root).hidden).toBe(true);
    expect(trigger(root).textContent).toBe("Blueberry");
    expect(document.activeElement).toBe(trigger(root));
    expect(changes()).toEqual([2]);
  });

  it("closes on Escape without choosing, and the trigger keeps its label", async () => {
    const { root, changes } = mounted();
    await settle();
    // a choice first, so the trigger has a label to keep
    await open(root);
    await press(root, "Enter");
    expect(trigger(root).textContent).toBe("Apple");

    await open(root);
    await press(root, "ArrowDown");
    expect(activeLabel(root)).toBe("Banana");
    await press(root, "Escape");

    expect(list(root).hidden).toBe(true);
    expect(trigger(root).getAttribute("aria-expanded")).toBe("false");
    expect(trigger(root).getAttribute("aria-activedescendant")).toBeNull();
    expect(trigger(root).textContent).toBe("Apple");
    expect(changes()).toEqual([0]);
    expect(document.activeElement).toBe(trigger(root));
  });

  it("keeps its tab stop while disabled and opens nothing", async () => {
    const { root, changes } = mounted({ disabled: true });
    await settle();

    const button = trigger(root);
    // the pattern keeps the tab stop and announces the state; it is not a native disabled button
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(button.tabIndex).toBe(0);

    button.focus();
    // aria-disabled is the pattern's announcement; the click is a real one a reader's pointer makes anyway
    await userEvent.click(button, { force: true });
    flush();
    await settle();
    await press(root, "ArrowDown");
    await press(root, "Enter");
    await press(root, "b");

    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(list(root).hidden).toBe(true);
    expect(button.getAttribute("aria-activedescendant")).toBeNull();
    expect(button.textContent).toBe("Pick a fruit");
    expect(changes()).toEqual([]);
  });

  it("keeps its value when the controlled host ignores the request", async () => {
    const { root, changes } = mounted({ value: 0 });
    await settle();
    expect(trigger(root).textContent).toBe("Apple");

    await open(root);
    await press(root, "ArrowDown");
    await press(root, "Enter");

    // the request reached the host, the host held its value, so the trigger still reads Apple
    expect(changes()).toEqual([1]);
    expect(trigger(root).textContent).toBe("Apple");
    expect(list(root).hidden).toBe(true);
  });
});
