import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { type MountedShortcuts, mountShortcuts } from "./shortcuts.fixture";

// No APG pattern and no Quint spec exists for a shortcut sheet, so this file is the skin's oracle. It mounts the starter in
// a real Chromium: `?` is a real key on the page, the sheet is the kit's Dialog — a native `<dialog>` in the top layer — and
// the demo's own chords are the host's.

/** Solid 2 delivers events through its delegated listener on a later turn; `onSettled` binds on the flush. */
const settle = (): Promise<void> => Promise.resolve();

/** The resolved value of a theme colour, read without naming the format the engine emitted. */
const background = (token: string): string => {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
};

const live: MountedShortcuts[] = [];

const mounted = (options: { readonly isApple?: boolean } = {}): MountedShortcuts => {
  const instance = mountShortcuts(options);
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

/** A key on `target` (the focused element by default), as a reader's would arrive. */
const press = async (
  key: string,
  init: KeyboardEventInit = {},
  target?: EventTarget | null,
): Promise<KeyboardEvent> => {
  const element =
    target ??
    (document.activeElement instanceof HTMLElement ? document.activeElement : document.body);
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  element.dispatchEvent(event);
  await settle();
  return event;
};

/** Escape is the UA's on a modal `<dialog>`: a synthetic `keydown` never reaches its cancel step, so a real key is sent. */
const escape = async (): Promise<void> => {
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(document.querySelector('[data-part="dialog"]')).toBeNull());
};

const open = (root: HTMLElement): HTMLButtonElement => {
  const found = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
    (element) => element.textContent?.trim() === "Keyboard shortcuts",
  );
  if (found === undefined) {
    throw new Error("shortcuts: no open button");
  }
  return found;
};

const text = (root: ParentNode, part: string): string =>
  (root.querySelector(`[data-part="${part}"]`)?.textContent ?? "").trim();

const row = (label: string): HTMLElement => {
  const found = [...document.querySelectorAll<HTMLElement>('[data-part="shortcuts-row"]')].find(
    (element) => element.querySelector('[data-part="shortcuts-label"]')?.textContent === label,
  );
  if (found === undefined) {
    throw new Error(`shortcuts: no row "${label}"`);
  }
  return found;
};

const capsOf = (element: HTMLElement): string[] =>
  [...element.querySelectorAll('[data-part="kbd-cap"]')].map((cap) => cap.textContent ?? "");

describe("Shortcuts", () => {
  it("opens the sheet from ? on the page, in the platform's top layer", async () => {
    const instance = mounted({ isApple: false });
    expect(instance.sheet()).toBeUndefined();

    await press("?", { shiftKey: true });

    const dialog = instance.sheet() as HTMLDialogElement;
    expect(dialog).toBeDefined();
    // a native `<dialog>`: the element is the role, and `showModal()` is both the modal state and the top layer
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog.open).toBe(true);
    expect(dialog.matches(":modal")).toBe(true);
    expect(dialog.getAttribute("role")).toBe("dialog");
    // ARIA in HTML: a modal `<dialog>` is `aria-modal`, and a panel that was unmounted is not `hidden`
    expect(dialog.getAttribute("aria-modal")).toBeNull();
    expect(dialog.hasAttribute("hidden")).toBe(false);
    expect(dialog.getAttribute("aria-label")).toBe("Keyboard shortcuts");
    expect(text(dialog, "dialog-title")).toBe("Keyboard shortcuts");
    // the id a host trigger's `aria-controls` would name exists on the element it controls
    expect(dialog.id).not.toBe("");
    // the top layer, not a portal: the panel is where the skin rendered it, and it is not painted `hidden`
    expect(instance.root.contains(dialog)).toBe(true);
    expect(getComputedStyle(dialog).display).not.toBe("none");
    // the wash is the platform's `::backdrop` on the theme's scrim, not a kit div under the panel
    expect(dialog.querySelector('[data-part="dialog-backdrop"]')).toBeNull();
    expect(getComputedStyle(dialog, "::backdrop").backgroundColor).toBe(
      background("--color-scrim"),
    );
    // the platform moves the focus into the modal: the reader's next key goes to the panel, not to the page
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("does not open while a ? is typed in a field", async () => {
    const instance = mounted({ isApple: false });
    const search = instance.root.querySelector<HTMLInputElement>('input[aria-label="Search"]');
    if (search === null) {
      throw new Error("shortcuts: no search field");
    }

    search.focus();
    const typed = await press("?", { shiftKey: true });
    expect(typed.defaultPrevented).toBe(false);
    expect(instance.sheet()).toBeUndefined();

    search.blur();
    await press("?", { shiftKey: true });
    expect(instance.sheet()).toBeDefined();
  });

  it("closes on Escape and returns the focus to the trigger", async () => {
    const instance = mounted({ isApple: false });
    const trigger = open(instance.root);
    trigger.focus();
    trigger.click();
    await settle();

    const dialog = instance.sheet();
    expect(dialog).toBeDefined();
    expect(dialog?.contains(document.activeElement)).toBe(true);

    await escape();

    expect(instance.sheet()).toBeUndefined();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes from the close control in its header", async () => {
    const instance = mounted({ isApple: false });
    const trigger = open(instance.root);
    trigger.focus();
    trigger.click();
    await settle();

    const close = [...(instance.sheet()?.querySelectorAll<HTMLButtonElement>("button") ?? [])].find(
      (element) => element.textContent?.trim() === "Close",
    );
    if (close === undefined) {
      throw new Error("shortcuts: no close control");
    }
    close.click();
    await settle();

    expect(instance.sheet()).toBeUndefined();
    // the unmounted panel cannot give the focus back itself, so the kit does: the reader lands on the control that
    // opened the sheet, not on the body
    expect(document.activeElement).toBe(trigger);
  });

  it("renders each chord as separate caps with an accessible name", async () => {
    const instance = mounted({ isApple: false });
    const trigger = open(instance.root);
    trigger.click();
    await settle();

    expect(instance.sheet()).toBeDefined();
    const chord = row("Focus the search field");
    expect(capsOf(chord)).toEqual(["Ctrl", "K"]);
    expect(chord.querySelector('[data-part="kbd-separator"]')?.textContent).toBe("+");
    expect(chord.querySelector('[data-part="kbd"]')?.getAttribute("aria-label")).toBe("Ctrl+K");

    const single = row("Close it");
    expect(capsOf(single)).toEqual(["Esc"]);
    expect(single.querySelector('[data-part="kbd-separator"]')).toBeNull();
    expect(single.querySelector('[data-part="kbd"]')?.hasAttribute("aria-label")).toBe(false);
  });

  it("renders mod as Cmd when the platform is Apple", async () => {
    const instance = mounted({ isApple: true });
    await press("?", { shiftKey: true });
    expect(instance.sheet()).toBeDefined();

    expect(capsOf(row("Focus the search field"))).toEqual(["⌘", "K"]);
  });

  it("runs the demo's mod+k with Cmd on macOS and Ctrl elsewhere", async () => {
    const elsewhere = mounted({ isApple: false });
    const box = elsewhere.root.querySelector<HTMLElement>('[data-part="shortcuts-demo"]');
    const search = elsewhere.root.querySelector<HTMLInputElement>('input[aria-label="Search"]');
    if (box === null || search === null) {
      throw new Error("shortcuts: the demo is incomplete");
    }

    await press("k", { ctrlKey: true }, box);
    expect(document.activeElement).toBe(search);

    search.blur();
    await press("k", { metaKey: true }, box);
    expect(document.activeElement).not.toBe(search);

    elsewhere.dispose();
    live.splice(live.indexOf(elsewhere), 1);

    const onMac = mounted({ isApple: true });
    const macBox = onMac.root.querySelector<HTMLElement>('[data-part="shortcuts-demo"]');
    const macSearch = onMac.root.querySelector<HTMLInputElement>('input[aria-label="Search"]');
    if (macBox === null || macSearch === null) {
      throw new Error("shortcuts: the demo is incomplete");
    }

    await press("k", { ctrlKey: true }, macBox);
    expect(document.activeElement).not.toBe(macSearch);

    await press("k", { metaKey: true }, macBox);
    expect(document.activeElement).toBe(macSearch);
  });

  it("keeps the page's s out of a note that binds its own", async () => {
    const instance = mounted({ isApple: false });
    const note = instance.root.querySelector<HTMLElement>('[data-part="shortcuts-note"]');
    const trigger = open(instance.root);
    if (note === null) {
      throw new Error("shortcuts: no note");
    }

    await press("s", {}, note);
    expect(text(instance.root, "shortcuts-log")).toContain("The note's own s");
    expect(text(instance.root, "shortcuts-saved")).toBe("Saved: no");

    await press("s", {}, trigger);
    expect(text(instance.root, "shortcuts-log")).toContain("The page's s");
    expect(text(instance.root, "shortcuts-saved")).toBe("Saved: yes");
  });

  it("stops opening the sheet when its registry is disposed", async () => {
    const instance = mounted({ isApple: false });
    await press("?", { shiftKey: true });
    expect(instance.sheet()).toBeDefined();

    await escape();
    expect(instance.sheet()).toBeUndefined();

    instance.disposeShortcuts();
    await press("?", { shiftKey: true });
    expect(instance.sheet()).toBeUndefined();
  });
});
