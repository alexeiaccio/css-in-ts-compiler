import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedDrawer, mountDrawer } from "./drawer.fixture";

/** Solid 2 delivers events through its delegated listener on a later turn. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

/** The slide is 200 ms: the geometry is final only after it, as a reader sees it. */
const settleSlide = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 260));

const live: MountedDrawer[] = [];

const mounted = (): MountedDrawer => {
  const instance = mountDrawer();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const required = <T extends HTMLElement>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`drawer: no ${selector}`);
  }
  return element;
};

/** The trigger of a drawer, by its label: the fixture has one per drawer. */
const trigger = (root: HTMLElement, label: string): HTMLButtonElement => {
  const found = [...root.querySelectorAll<HTMLButtonElement>('[aria-haspopup="dialog"]')].find(
    (element) => element.textContent?.trim() === label,
  );
  if (found === undefined) {
    throw new Error(`drawer: no trigger "${label}"`);
  }
  return found;
};

/** A panel by the text of its title: both drawers are in the DOM, closed ones included. */
const panel = (title: string): HTMLElement => {
  const found = [...document.querySelectorAll<HTMLElement>('[data-part="drawer"]')].find(
    (element) => element.querySelector('[data-part="drawer-title"]')?.textContent === title,
  );
  if (found === undefined) {
    throw new Error(`drawer: no panel "${title}"`);
  }
  return found;
};

const inside = (root: HTMLElement, name: string): HTMLElement =>
  required(root, `[data-part="${name}"]`);

const click = async (element: HTMLElement): Promise<void> => {
  element.click();
  await settle();
};

/** A key on whatever holds the focus, as a reader's would arrive. */
const press = async (key: string, init: KeyboardEventInit = {}): Promise<void> => {
  const target =
    document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
  );
  await settle();
};

const background = (token: string): string => {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
};

describe("Drawer", () => {
  it("opens from its trigger as a modal dialog", async () => {
    const { root } = mounted();
    const open = trigger(root, "Filters");
    const dialog = panel("Filters");

    expect(open.getAttribute("aria-expanded")).toBe("false");
    expect(open.getAttribute("aria-controls")).toBe(dialog.id);
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBeNull();
    // a closed rail is off screen and out of the accessibility tree, not in the page's flow
    expect(getComputedStyle(dialog).visibility).toBe("hidden");

    open.focus();
    await click(open);

    expect(open.getAttribute("aria-expanded")).toBe("true");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("data-state")).toBe("right-open");
    expect(getComputedStyle(dialog).visibility).toBe("visible");
    // portalled out of the fixture, into the body, so no ancestor can clip it or hold its `position: fixed`
    expect(root.contains(dialog)).toBe(false);
    expect(dialog.closest('[data-part="drawer-layer"]')?.parentElement).toBe(document.body);
  });

  it("names the panel by its title", async () => {
    const { root } = mounted();
    await click(trigger(root, "Filters"));
    const dialog = panel("Filters");
    const title = inside(dialog, "drawer-title");

    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
    expect(title.textContent).toBe("Filters");
    // the close control is an icon button with an accessible name
    expect(inside(dialog, "drawer-close").getAttribute("aria-label")).toBe("Close");
  });

  it("moves the focus into the panel, keeps Tab inside, and returns it on Escape", async () => {
    const { root } = mounted();
    const open = trigger(root, "Filters");
    open.focus();
    await click(open);
    const dialog = panel("Filters");
    const close = inside(dialog, "drawer-close");
    const footerButtons = [
      ...inside(dialog, "drawer-footer").querySelectorAll<HTMLButtonElement>("button"),
    ];
    const last = footerButtons[footerButtons.length - 1];
    if (last === undefined) {
      throw new Error("drawer: no footer button");
    }

    expect(document.activeElement).toBe(close);

    last.focus();
    await press("Tab");
    expect(document.activeElement).toBe(close);

    close.focus();
    await press("Tab", { shiftKey: true });
    expect(document.activeElement).toBe(last);

    await press("Escape");
    expect(open.getAttribute("aria-expanded")).toBe("false");
    expect(dialog.getAttribute("aria-modal")).toBeNull();
    expect(document.activeElement).toBe(open);
  });

  it("closes on a press on the backdrop", async () => {
    const { root } = mounted();
    const open = trigger(root, "Filters");
    open.focus();
    await click(open);
    const backdrop = required<HTMLElement>(document, '[data-part="drawer-backdrop"]');

    expect(backdrop.hidden).toBe(false);
    backdrop.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    await settle();

    expect(open.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(open);
  });

  it("locks the page's scroll while open and releases it on close", async () => {
    const { root } = mounted();
    const open = trigger(root, "Filters");
    expect(document.documentElement.style.overflow).toBe("");

    await click(open);
    expect(document.documentElement.style.overflow).toBe("hidden");

    await press("Escape");
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("renders the bottom variant as a full-width sheet on its own surface", async () => {
    const { root } = mounted();
    await click(trigger(root, "Open the sheet"));
    await settleSlide();
    const sheet = panel("Share");
    const style = getComputedStyle(sheet);
    const rect = sheet.getBoundingClientRect();

    // the top corners are the theme's radius, the bottom ones meet the viewport edge
    expect(style.borderTopLeftRadius).not.toBe("0px");
    expect(style.borderTopRightRadius).not.toBe("0px");
    expect(style.borderBottomLeftRadius).toBe("0px");
    expect(Math.round(rect.left)).toBe(0);
    expect(Math.round(rect.width)).toBe(window.innerWidth);
    expect(Math.round(rect.bottom)).toBe(window.innerHeight);
    expect(style.maxHeight).not.toBe("none");
    // the sheet's surface is a token of its own, not the rail's
    expect(style.backgroundColor).toBe(background("--color-sheet-background"));
  });

  it("lets a controlled host refuse to close", async () => {
    const instance = mounted();
    const open = trigger(instance.root, "Filters");
    await click(open);
    expect(open.getAttribute("aria-expanded")).toBe("true");

    instance.hold();
    await press("Escape");

    expect(instance.requests.at(-1)).toBe(false);
    expect(open.getAttribute("aria-expanded")).toBe("true");
    expect(panel("Filters").getAttribute("aria-modal")).toBe("true");
  });
});
