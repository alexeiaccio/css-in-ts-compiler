import { For, Show } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";
import { userEvent } from "vite-plus/test/browser";
import {
  type FilterableMenu,
  type FilterableMenuItem,
  createFilterableMenu,
} from "../src/filterable-menu";

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const makeItems = (ran: string[]): ReadonlyArray<FilterableMenuItem> => [
  {
    id: "deploy",
    label: "Deploy",
    group: "Ship",
    run: () => {
      ran.push("deploy");
    },
  },
  {
    id: "rollback",
    label: "Roll back",
    group: "Ship",
    run: () => {
      ran.push("rollback");
    },
  },
  {
    id: "theme",
    label: "Toggle theme",
    group: "View",
    run: () => {
      ran.push("theme");
    },
  },
  {
    id: "settings",
    label: "Open settings",
    group: "View",
    run: () => {
      ran.push("settings");
    },
  },
  {
    id: "more",
    label: "More actions",
    group: "View",
    submenu: [
      { id: "archive", label: "Archive" },
      { id: "delete", label: "Delete" },
    ],
    run: () => {
      ran.push("more");
    },
  },
];

interface Mounted {
  readonly menu: FilterableMenu;
  readonly root: HTMLElement;
  readonly ran: string[];
  readonly dispose: () => void;
}

const mount = (): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const ran: string[] = [];
  let menu: FilterableMenu | undefined;

  const dispose = render(() => {
    const created = createFilterableMenu({ items: makeItems(ran) });
    menu = created;
    const groups = (): string[] => [...new Set(created.results().map((row) => row.group ?? ""))];
    const rowsIn = (group: string) =>
      created.results().filter((row) => (row.group ?? "") === group);
    return (
      <>
        <button data-part="trigger" {...created.triggerProps}>
          Actions
        </button>
        {/* Mounted only while open: the trigger must work before the field exists. */}
        <Show when={created.open()}>
          <div data-part="backdrop" {...created.backdropProps} />
          <div data-part="dialog" {...created.dialogProps}>
            <h2 {...created.titleProps}>Actions</h2>
            <input data-part="input" {...created.inputProps} />
            <button data-part="clear" {...created.clearProps}>
              {created.labels.clear}
            </button>
            <div data-part="menu" {...created.menuProps}>
              <For each={groups()}>
                {(group) => (
                  <div data-part="group" {...created.groupProps(group)}>
                    <h3 data-part="group-label" {...created.groupLabelProps(group)}>
                      {group}
                    </h3>
                    <For each={rowsIn(group)}>
                      {(row) => (
                        <Show
                          when={row.hasSubmenu}
                          fallback={
                            <div data-part="item" data-id={row.id} {...created.itemProps(row.id)}>
                              {row.label}
                            </div>
                          }
                        >
                          <div
                            data-part="item"
                            data-id={row.id}
                            {...created.submenuTriggerProps(row.id)}
                          >
                            {row.label}
                            <div data-part="submenu" {...created.submenuProps(row.id)} />
                          </div>
                        </Show>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>
            <p data-part="empty" {...created.emptyProps}>
              {created.emptyProps.text}
            </p>
            <div data-part="status" {...created.statusProps}>
              {created.status()}
            </div>
          </div>
        </Show>
        <button data-part="after" type="button">
          After
        </button>
      </>
    );
  }, root);

  if (menu === undefined) {
    throw new Error("mount: the menu did not render");
  }
  return { menu, root, ran, dispose };
};

const part = <T extends HTMLElement = HTMLElement>(root: HTMLElement, name: string): T => {
  const element = root.querySelector<T>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`mount: no ${name}`);
  }
  return element;
};

const inputOf = (root: HTMLElement): HTMLInputElement => part<HTMLInputElement>(root, "input");

const open = async (root: HTMLElement): Promise<void> => {
  await userEvent.click(part(root, "trigger"));
  await tick();
};

const visible = (root: HTMLElement): string[] =>
  [...root.querySelectorAll<HTMLElement>('[data-part="item"]')].map(
    (item) => item.dataset["id"] ?? "",
  );

/** Real keyboard input; selecting first so the field is replaced, not appended to. */
const fill = async (root: HTMLElement, text: string): Promise<void> => {
  const input = inputOf(root);
  input.focus();
  input.select();
  await userEvent.keyboard(text);
  await tick();
};

const press = (target: Element, key: string): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

const live: Mounted[] = [];

const mounted = (): Mounted => {
  const instance = mount();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

describe("createFilterableMenu (real DOM)", () => {
  it("opens from the trigger, which needs nothing from the field", async () => {
    const { root, menu } = mounted();
    const trigger = part(root, "trigger");

    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(root.querySelector('[data-part="input"]')).toBeNull();

    await open(root);

    const dialog = part(root, "dialog");
    const input = inputOf(root);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBe(menu.titleProps.id);
    expect(input.getAttribute("role")).toBe("searchbox");
    expect(input.getAttribute("type")).toBe("text");
    expect(input.getAttribute("aria-autocomplete")).toBeNull();
    expect(input.getAttribute("aria-haspopup")).toBeNull();
    expect(input.getAttribute("aria-expanded")).toBeNull();
    expect(document.activeElement).toBe(input);
    expect(input.hasAttribute("data-highlighted")).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("filters on a case-insensitive substring of the label", async () => {
    const { root, menu } = mounted();
    await open(root);
    expect(visible(root)).toEqual(["deploy", "rollback", "theme", "settings", "more"]);

    await fill(root, "ROLL");
    expect(menu.query()).toBe("ROLL");
    expect(visible(root)).toEqual(["rollback"]);
    expect(inputOf(root).getAttribute("aria-activedescendant")).toBe(menu.itemProps("rollback").id);

    await fill(root, "theme");
    expect(visible(root)).toEqual(["theme"]);
  });

  it("shows the empty state and announces it", async () => {
    const { root, menu } = mounted();
    await open(root);
    expect(part(root, "empty").hidden).toBe(true);

    await fill(root, "zzz");
    expect(visible(root)).toEqual([]);
    expect(part(root, "empty").hidden).toBe(false);
    expect(part(root, "empty").textContent).toBe("No actions found");
    expect(menu.status()).toBe("No actions");
  });

  it("moves aria-activedescendant with the arrows and back to the field at the ends", async () => {
    const { root, menu } = mounted();
    await open(root);
    const input = inputOf(root);
    const active = (): string | null => input.getAttribute("aria-activedescendant");

    press(input, "ArrowDown");
    await tick();
    expect(active()).toBe(menu.itemProps("deploy").id);
    press(input, "ArrowDown");
    await tick();
    expect(active()).toBe(menu.itemProps("rollback").id);

    press(input, "End");
    await tick();
    expect(active()).toBe(menu.itemProps("more").id);
    // ↓ on the last row returns the highlight to the field
    press(input, "ArrowDown");
    await tick();
    expect(active()).toBeNull();
    expect(input.hasAttribute("data-highlighted")).toBe(true);
    expect(document.activeElement).toBe(input);

    // ↓ from the field re-enters at the first row; ↑ before it goes to the field
    press(input, "ArrowDown");
    await tick();
    expect(active()).toBe(menu.itemProps("deploy").id);
    expect(input.hasAttribute("data-highlighted")).toBe(false);
    press(input, "ArrowUp");
    await tick();
    expect(active()).toBeNull();
    // ↑ from the field enters at the last row
    press(input, "ArrowUp");
    await tick();
    expect(active()).toBe(menu.itemProps("more").id);
  });

  it("keeps Home and End for the caret while the field has text", async () => {
    const { root, menu } = mounted();
    await open(root);
    const input = inputOf(root);

    await fill(root, "e");
    const withText = press(input, "End");
    expect(withText.defaultPrevented).toBe(false);
    expect(input.getAttribute("aria-activedescendant")).toBe(menu.itemProps("deploy").id);

    input.select();
    await userEvent.keyboard("{Backspace}");
    await tick();
    expect(menu.query()).toBe("");
    const empty = press(input, "End");
    await tick();
    expect(empty.defaultPrevented).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBe(menu.itemProps("more").id);
    press(input, "Home");
    await tick();
    expect(input.getAttribute("aria-activedescendant")).toBe(menu.itemProps("deploy").id);
  });

  it("runs the highlighted row on Enter and closes", async () => {
    const { root, menu, ran } = mounted();
    await open(root);

    await fill(root, "deploy");
    press(inputOf(root), "Enter");
    await tick();

    expect(ran).toEqual(["deploy"]);
    expect(menu.open()).toBe(false);
    expect(root.querySelector('[data-part="dialog"]')).toBeNull();
  });

  it("enters a submenu on Enter, focusing its field, and pops one level on Escape", async () => {
    const { root, menu } = mounted();
    await open(root);

    await fill(root, "more");
    press(inputOf(root), "Enter");
    await tick();

    expect(menu.query()).toBe("");
    expect(menu.active()).toBeNull();
    expect(menu.results().map((row) => row.id)).toEqual(["archive", "delete"]);
    expect(visible(root)).toEqual(["archive", "delete"]);
    expect(document.activeElement).toBe(inputOf(root));

    press(inputOf(root), "ArrowDown");
    await tick();
    expect(menu.active()).toBe("archive");

    press(inputOf(root), "Escape");
    await tick();
    expect(part(root, "dialog").hidden).toBe(false);
    expect(menu.query()).toBe("more");
    expect(menu.results().map((row) => row.id)).toEqual(["more"]);

    press(inputOf(root), "Escape");
    await tick();
    expect(menu.open()).toBe(false);
    expect(root.querySelector('[data-part="dialog"]')).toBeNull();
  });

  it("shows a submenu on hover without moving focus, and Backspace on its empty field goes back", async () => {
    const { root, menu } = mounted();
    await open(root);
    const input = inputOf(root);

    const trigger = root.querySelector<HTMLElement>('[data-id="more"]');
    expect(trigger).not.toBeNull();
    // Not userEvent.hover: opening the level detaches the trigger mid-hover.
    trigger?.dispatchEvent(new MouseEvent("mouseenter"));
    await tick();

    expect(menu.results().map((row) => row.id)).toEqual(["archive", "delete"]);
    expect(document.activeElement).toBe(input);

    press(input, "Backspace");
    await tick();
    expect(menu.results().map((row) => row.id)).toEqual([
      "deploy",
      "rollback",
      "theme",
      "settings",
      "more",
    ]);
    expect(part(root, "dialog").hidden).toBe(false);
  });

  it("closes on Tab and leaves focus outside the menu", async () => {
    const { root } = mounted();
    await open(root);
    const input = inputOf(root);
    expect(document.activeElement).toBe(input);

    await userEvent.keyboard("{Tab}");
    await tick();

    expect(root.querySelector('[data-part="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(part(root, "after"));
  });

  it("announces the count once per change, not on every arrow", async () => {
    const { root, menu } = mounted();
    await open(root);
    const status = part(root, "status");

    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(menu.status()).toBe("5 actions");

    await fill(root, "e");
    expect(menu.status()).toBe("4 actions");

    let mutations = 0;
    const observer = new MutationObserver(() => {
      mutations += 1;
    });
    observer.observe(status, { childList: true, subtree: true, characterData: true });
    press(inputOf(root), "ArrowDown");
    await tick();
    press(inputOf(root), "ArrowUp");
    await tick();
    expect(mutations).toBe(0);
    expect(menu.status()).toBe("4 actions");
    observer.disconnect();
  });

  it("does not filter while an IME composition is in progress", async () => {
    const { root, menu } = mounted();
    await open(root);
    const input = inputOf(root);

    input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    input.value = "deploy";
    input.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
    await tick();

    expect(menu.query()).toBe("deploy");
    expect(visible(root)).toEqual(["deploy", "rollback", "theme", "settings", "more"]);
    expect(menu.status()).toBe("5 actions");

    input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    await tick();

    expect(visible(root)).toEqual(["deploy"]);
    expect(menu.status()).toBe("1 action");
  });

  it("names a group and hides its label from the accessibility tree", async () => {
    const { root, menu } = mounted();
    await open(root);

    const group = part(root, "group");
    const label = part(root, "group-label");
    expect(group.getAttribute("role")).toBe("group");
    expect(label.getAttribute("aria-hidden")).toBe("true");
    expect(group.getAttribute("aria-labelledby")).toBe(label.id);
    expect(label.id).toBe(menu.groupLabelProps("Ship").id);
  });
});
