import { For } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";
import { userEvent } from "vite-plus/test/browser";
import {
  type CommandPalette,
  type PaletteCommand,
  createCommandPalette,
} from "../src/command-palette";

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const makeCommands = (ran: string[]): ReadonlyArray<PaletteCommand> => [
  {
    id: "deploy",
    label: "Deploy",
    group: "Ship",
    keywords: ["release", "production"],
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
    keywords: ["dark", "light"],
    run: () => {
      ran.push("theme");
    },
  },
  {
    id: "settings",
    label: "Open settings",
    group: "View",
    keywords: ["preferences"],
    run: () => {
      ran.push("settings");
    },
  },
];

interface Mounted {
  readonly palette: CommandPalette;
  readonly root: HTMLElement;
  readonly ran: string[];
  readonly dispose: () => void;
}

const mount = (): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const ran: string[] = [];
  let palette: CommandPalette | undefined;

  const dispose = render(() => {
    const created = createCommandPalette({ commands: makeCommands(ran), hotkey: "ctrl+k" });
    palette = created;
    const groups = (): string[] => [...new Set(created.results().map((r) => r.group ?? ""))];
    const inGroup = (group: string) =>
      created.results().filter((result) => (result.group ?? "") === group);
    return (
      <>
        <button data-part="before" type="button">
          Before
        </button>
        <div data-part="backdrop" {...created.backdropProps} />
        <div data-part="dialog" {...created.dialogProps}>
          <h2 {...created.titleProps}>{created.labels.title}</h2>
          <input data-part="input" {...created.inputProps} />
          <div data-part="list" {...created.listProps}>
            <For each={groups()}>
              {(group) => (
                <section data-part="group">
                  <h3>{group}</h3>
                  <For each={inGroup(group)}>
                    {(result) => (
                      <div
                        data-part="option"
                        data-command={result.id}
                        {...created.optionProps(result.id)}
                      >
                        {result.label}
                      </div>
                    )}
                  </For>
                </section>
              )}
            </For>
          </div>
          <p data-part="empty" {...created.emptyProps}>
            {created.labels.empty}
          </p>
          <div data-part="status" {...created.statusProps}>
            {created.status()}
          </div>
        </div>
      </>
    );
  }, root);

  if (palette === undefined) {
    throw new Error("mount: the palette did not render");
  }
  const detach = palette.attach();
  return {
    palette,
    root,
    ran,
    dispose: () => {
      detach();
      dispose();
      root.remove();
    },
  };
};

const part = <T extends HTMLElement = HTMLElement>(root: HTMLElement, name: string): T => {
  const element = root.querySelector<T>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`mount: no ${name}`);
  }
  return element;
};

const inputOf = (root: HTMLElement): HTMLInputElement => part<HTMLInputElement>(root, "input");

const visible = (root: HTMLElement): string[] =>
  [...root.querySelectorAll<HTMLElement>('[data-part="option"]')]
    .filter((option) => option.closest("[hidden]") === null)
    .map((option) => option.dataset["command"] ?? "");

/** Real keyboard input; selecting first so the field is replaced, not appended to. */
const fill = async (root: HTMLElement, text: string): Promise<void> => {
  const input = inputOf(root);
  input.focus();
  input.select();
  await userEvent.keyboard(text);
  await tick();
};

const clear = async (root: HTMLElement): Promise<void> => {
  const input = inputOf(root);
  input.focus();
  input.select();
  await userEvent.keyboard("{Backspace}");
  await tick();
};

const press = (target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
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

describe("createCommandPalette (real DOM)", () => {
  it("opens on the hotkey and moves focus into the searchbox", async () => {
    const { root, palette } = mounted();
    part(root, "before").focus();

    press(document.body, "k", { ctrlKey: true });
    await tick();

    const dialog = part(root, "dialog");
    const input = inputOf(root);
    expect(dialog.hidden).toBe(false);
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe(palette.titleProps.id);
    expect(input.getAttribute("role")).toBe("searchbox");
    expect(input.getAttribute("type")).toBe("text");
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-activedescendant")).toBe(palette.optionProps("deploy").id);
  });

  it("opens on openPalette and closes on Escape, returning focus", async () => {
    const { root, palette } = mounted();
    const before = part(root, "before");
    before.focus();

    palette.openPalette();
    await tick();
    expect(document.activeElement).toBe(inputOf(root));

    press(inputOf(root), "Escape");
    await tick();
    expect(part(root, "dialog").hidden).toBe(true);
    expect(document.activeElement).toBe(before);
  });

  it("filters on the label and on the keywords", async () => {
    const { root, palette } = mounted();
    palette.openPalette();
    await tick();
    expect(visible(root)).toEqual(["deploy", "rollback", "theme", "settings"]);

    await fill(root, "roll");
    expect(visible(root)).toEqual(["rollback"]);
    expect(inputOf(root).getAttribute("aria-activedescendant")).toBe(
      palette.optionProps("rollback").id,
    );

    await fill(root, "production");
    expect(visible(root)).toEqual(["deploy"]);

    await fill(root, "PREFERENCES");
    expect(visible(root)).toEqual(["settings"]);
  });

  it("moves aria-activedescendant with the arrows and back to the input at the ends", async () => {
    const { root, palette } = mounted();
    palette.openPalette();
    await tick();
    const input = inputOf(root);
    const active = (): string | null => input.getAttribute("aria-activedescendant");

    expect(active()).toBe(palette.optionProps("deploy").id);
    press(input, "ArrowDown");
    await tick();
    expect(active()).toBe(palette.optionProps("rollback").id);
    press(input, "ArrowDown");
    await tick();
    press(input, "ArrowDown");
    await tick();
    expect(active()).toBe(palette.optionProps("settings").id);

    // ↓ on the last option returns the highlight to the field
    const event = press(input, "ArrowDown");
    await tick();
    expect(event.defaultPrevented).toBe(true);
    expect(active()).toBeNull();
    expect(document.activeElement).toBe(input);

    // ↓ again picks the first one back up; ↑ from the first goes to the last
    press(input, "ArrowDown");
    await tick();
    expect(active()).toBe(palette.optionProps("deploy").id);
    press(input, "ArrowUp");
    await tick();
    expect(active()).toBe(palette.optionProps("settings").id);
    press(input, "ArrowUp");
    await tick();
    expect(active()).toBe(palette.optionProps("theme").id);
  });

  it("keeps Home and End for the caret while the field has text", async () => {
    const { root, palette } = mounted();
    palette.openPalette();
    await tick();
    const input = inputOf(root);

    await fill(root, "e");
    const withText = press(input, "End");
    expect(withText.defaultPrevented).toBe(false);
    expect(input.getAttribute("aria-activedescendant")).toBe(palette.optionProps("deploy").id);

    await clear(root);
    const empty = press(input, "End");
    await tick();
    expect(empty.defaultPrevented).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBe(palette.optionProps("settings").id);
    press(input, "Home");
    await tick();
    expect(input.getAttribute("aria-activedescendant")).toBe(palette.optionProps("deploy").id);
  });

  it("runs the highlighted command on Enter and closes", async () => {
    const { root, palette, ran } = mounted();
    palette.openPalette();
    await tick();

    await fill(root, "deploy");
    press(inputOf(root), "Enter");
    await tick();

    expect(ran).toEqual(["deploy"]);
    expect(part(root, "dialog").hidden).toBe(true);
  });

  it("runs a command clicked with the pointer", async () => {
    const { root, palette, ran } = mounted();
    palette.openPalette();
    await tick();

    const option = root.querySelector<HTMLElement>('[data-command="settings"]');
    expect(option).not.toBeNull();
    await userEvent.click(option as HTMLElement);
    await tick();

    expect(ran).toEqual(["settings"]);
    expect(part(root, "dialog").hidden).toBe(true);
  });

  it("shows the empty state and announces the count once per query", async () => {
    const { root, palette } = mounted();
    palette.openPalette();
    await tick();
    const status = part(root, "status");

    expect(part(root, "empty").hidden).toBe(true);
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(palette.status()).toBe("4 commands");

    await fill(root, "zzz");
    expect(visible(root)).toEqual([]);
    expect(part(root, "empty").hidden).toBe(false);
    expect(part(root, "empty").textContent).toBe("No commands found");
    expect(palette.status()).toBe("No commands");

    await clear(root);
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
    expect(palette.status()).toBe("4 commands");
    observer.disconnect();
  });

  it("takes translated labels", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const dispose = render(() => {
      const palette = createCommandPalette({
        commands: makeCommands([]),
        labels: { placeholder: "Chercher" },
      });
      return <input data-part="input" {...palette.inputProps} />;
    }, root);
    expect(inputOf(root).getAttribute("placeholder")).toBe("Chercher");
    dispose();
    root.remove();
  });
});
