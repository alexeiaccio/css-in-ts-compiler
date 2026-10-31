// The command palette's conformance test: the composition has no APG spec (the primitive is a dialog + a text field + a
// status, not a new pattern), so this walks the kit's own DOM instead of replaying a scenario. What it pins is the split:
// the primitive owns the filter, the active option and the keys; the skin owns the dialog layer, the field's look and the
// highlight — painted from the announcement, never from a copy of the active index.
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import {
  activeId,
  clickRow,
  inputOf,
  layerOf,
  listOf,
  open,
  openThrough,
  paletteOf,
  panelOf,
  press,
  rowsOf,
  triggerOf,
  type,
  visibleLabels,
} from "./command-palette-driver.ts";
import { type MountedPalette, mountPalette } from "./command-palette.fixture.tsx";

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const byPart = <T extends HTMLElement = HTMLElement>(name: string): T => {
  const element = document.querySelector<T>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`the palette has no ${name}`);
  }
  return element;
};

const live: MountedPalette[] = [];
const mounted = (config?: Parameters<typeof mountPalette>[0]): MountedPalette => {
  const instance = mountPalette(config);
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

describe("the kit's command palette", () => {
  it("opens from its trigger into a modal dialog whose field holds the focus", async () => {
    const instance = mounted();
    const palette = paletteOf(instance);
    const trigger = triggerOf(instance);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(layerOf()).toBeNull();

    await open(instance);

    // the trigger says the dialog is up, and the layer is the portal's: a child of the body, not of the fixture
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const layer = layerOf();
    expect(layer).not.toBeNull();
    expect(layer!.parentElement).toBe(document.body);
    expect(layer!.getAttribute("data-part")).toBe("command-palette-layer");
    // the wash under the panel is the dialog's backdrop, and it closes the palette
    expect(byPart("command-palette-backdrop").id).toBe(palette.backdropProps.id);

    const panel = panelOf();
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("true");
    expect(panel.getAttribute("aria-labelledby")).toBe(palette.titleProps.id);
    // the title is the name of the dialog and of the listbox, so it is in the panel though nothing shows it
    const title = byPart("command-palette-title");
    expect(title.id).toBe(palette.titleProps.id);
    expect(title.textContent).toBe("Command palette");
    expect(style(title).clipPath).toBe("inset(50%)");

    const input = inputOf();
    expect(input.getAttribute("role")).toBe("searchbox");
    expect(input.getAttribute("type")).toBe("text");
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-controls")).toBe(listOf().id);
    expect(listOf().getAttribute("role")).toBe("listbox");
    expect(listOf().getAttribute("aria-labelledby")).toBe(palette.titleProps.id);
    expect(input.getAttribute("aria-activedescendant")).toBe(palette.optionProps("deploy").id);

    const rows = rowsOf();
    expect(rows.map((row) => row.getAttribute("role"))).toEqual([
      "option",
      "option",
      "option",
      "option",
    ]);
    expect(rows.map((row) => row.tabIndex)).toEqual([-1, -1, -1, -1]);
    // the highlight is the primitive's announcement: one row says yes, the rest say no, and the skin keeps no index
    expect(rows.map((row) => row.getAttribute("aria-selected"))).toEqual([
      "true",
      "false",
      "false",
      "false",
    ]);
    // the groups the primitive reports head their rows
    expect(
      [...panel.querySelectorAll('[data-part="command-palette-group"]')].map(
        (group) => group.getAttribute("role") ?? "",
      ),
    ).toEqual(["group", "group"]);
    expect(byPart("command-palette-empty").hidden).toBe(true);

    const status = byPart("command-palette-status");
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe("4 commands");
  });

  it("renders the primitive's results, not a filter of its own", async () => {
    const instance = mounted();
    const palette = paletteOf(instance);
    await open(instance);
    const ids = (): string[] => palette.results().map((result) => result.id);

    expect(visibleLabels()).toEqual(palette.results().map((result) => result.label));

    await type("roll");
    expect(ids()).toEqual(["rollback"]);
    expect(visibleLabels()).toEqual(["Roll back"]);
    expect(activeId()).toBe(palette.optionProps("rollback").id);
    // the rollback keyword match is the primitive's too
    expect(visibleLabels()).toEqual(palette.results().map((result) => result.label));

    await type("production");
    expect(visibleLabels()).toEqual(["Deploy"]);

    await type("PREFERENCES");
    expect(visibleLabels()).toEqual(["Open settings"]);

    await type("zzz");
    expect(palette.results()).toEqual([]);
    expect(rowsOf()).toEqual([]);
    expect(activeId()).toBeNull();
    // the empty state is the primitive's `hidden`, and the count is announced once per query
    const empty = byPart("command-palette-empty");
    expect(empty.hidden).toBe(false);
    expect(empty.textContent).toBe("No commands found");
    expect(byPart("command-palette-status").textContent).toBe("No commands");
  });

  it("moves aria-activedescendant with the arrows and paints the row it names", async () => {
    const instance = mounted();
    const palette = paletteOf(instance);
    await open(instance);
    const input = inputOf();
    const rows = rowsOf();
    const selected = (): (string | null)[] => rows.map((row) => row.getAttribute("aria-selected"));

    // the highlight is the row the primitive names, and it is painted from that attribute
    expect(style(rows[0]!).backgroundColor).not.toBe(style(rows[1]!).backgroundColor);
    press(input, "ArrowDown");
    expect(activeId()).toBe(palette.optionProps("rollback").id);
    expect(selected()).toEqual(["false", "true", "false", "false"]);
    expect(style(rows[1]!).backgroundColor).not.toBe(style(rows[2]!).backgroundColor);

    press(input, "ArrowDown");
    press(input, "ArrowDown");
    expect(activeId()).toBe(palette.optionProps("settings").id);
    expect(selected()).toEqual(["false", "false", "false", "true"]);

    // ↓ on the last row returns the highlight to the field, and it paints no row
    press(input, "ArrowDown");
    expect(activeId()).toBeNull();
    expect(selected()).toEqual(["false", "false", "false", "false"]);
    // and ↓ from the field enters at the first row, ↑ at the last
    press(input, "ArrowDown");
    expect(activeId()).toBe(palette.optionProps("deploy").id);
    press(input, "ArrowUp");
    expect(activeId()).toBe(palette.optionProps("settings").id);
  });

  it("runs the highlighted command on Enter, closes, and returns the focus", async () => {
    const instance = mounted();
    const palette = paletteOf(instance);
    const trigger = triggerOf(instance);
    await open(instance);
    const input = inputOf();

    // the arrow moves the highlight; Enter runs the row it names, not the first one
    press(input, "ArrowDown");
    expect(activeId()).toBe(palette.optionProps("rollback").id);
    press(input, "Enter");

    expect(instance.chosen).toEqual(["rollback"]);
    expect(layerOf()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on Escape and returns the focus to whatever had it", async () => {
    const instance = mounted();
    const trigger = triggerOf(instance);
    await open(instance);
    expect(document.activeElement).toBe(inputOf());

    press(inputOf(), "Escape");
    expect(layerOf()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    // the query is the primitive's and it resets on close, so the next open starts from the corpus
    expect(paletteOf(instance).query()).toBe("");
  });

  it("runs a command clicked with the pointer and keeps the focus in the field", async () => {
    const instance = mounted();
    const palette = paletteOf(instance);
    await open(instance);
    const input = inputOf();

    await clickRow("Open settings");

    expect(instance.chosen).toEqual(["settings"]);
    expect(layerOf()).toBeNull();
    // the primitive cancels the mouse-down, so the press never moved the DOM focus
    expect(document.activeElement).toBe(triggerOf(instance));
    expect(palette.open()).toBe(false);
    expect(input.isConnected).toBe(false);
  });

  it("keeps the field's focus after a press on the panel, so Escape still closes it", async () => {
    const instance = mounted();
    await open(instance);
    // a heading is not a control: the press must not move the focus out of the field the dialog listens from
    await userEvent.click(
      document.querySelector<HTMLElement>('[data-part="command-palette-group-label"]')!,
    );
    flush();
    expect(document.activeElement).toBe(inputOf());
    press(inputOf(), "Escape");
    expect(layerOf()).toBeNull();
  });

  it("stands outside a transformed, clipped ancestor, and can be sent to a host's own root", async () => {
    const instance = mounted({ hostile: true });
    const host = instance.root.querySelector<HTMLElement>('[data-part="palette-host"]')!;
    expect(style(host).transform).not.toBe("none");

    await open(instance);
    const layer = layerOf()!;
    // inline, the transformed ancestor would be the containing block of `position: fixed` and clip the layer
    expect(layer.closest('[data-part="palette-host"]')).toBeNull();
    expect(layer.parentElement).toBe(document.body);
    expect(layer.offsetParent).toBeNull();
    expect(layer.getBoundingClientRect().width).toBe(window.innerWidth);

    // `mount` is the host's own modal root, as the dialog's is
    press(inputOf(), "Escape");
    const root = document.createElement("div");
    document.body.append(root);
    const owned = mounted({ mount: root });
    openThrough(owned);
    expect(root.querySelector('[data-part="command-palette-layer"]')?.parentElement).toBe(root);
    root.remove();
  });

  it("binds the page chord it is given, and nothing when it is told not to", async () => {
    const quiet = mounted();
    // the fixture's default is `hotkey: false`, so the page keeps its keys
    press(document.body, "k", { ctrlKey: true });
    expect(layerOf()).toBeNull();

    const bound = mounted({ hotkey: "ctrl+k" });
    press(document.body, "k", { ctrlKey: true });
    expect(layerOf()).not.toBeNull();
    expect(document.activeElement).toBe(inputOf());
    // the same chord closes it again
    press(document.body, "k", { ctrlKey: true });
    expect(layerOf()).toBeNull();

    // a host that binds its own chord opens the palette through the primitive
    openThrough(quiet);
    expect(layerOf()).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    flush();
    expect(layerOf()).toBeNull();
  });
});
