// `solid/specs/before-after.json`, `solid/specs/layer-stack.json`, `solid/specs/modal.json`, `solid/specs/app-shell.json`,
// `solid/specs/card-grid.json` and `solid/specs/list-detail.json`, written from frames this script captures: the Widgets
// page's switch off and on, the Dialog's modal and menu frames, and the Sky page at rest — captured the way solid/goldens
// stores a page's last frame (solid/dump.ts). The tree is the same in both switch frames, so a command's index is the same
// element, and the numbers a before/after is about are the commands whose fields differ: the track's colour and the
// thumb's x. A shell's bands, a grid's cards and a list/detail page's panes are the frame's own elements — `sky-bar`,
// `sky-feed`, `sky-status`, `sky-card-<i>`, `sky-feed-pane`, `sky-thread` — so their boxes are looked up by the element's
// id, never typed. Nothing in the spec is typed by hand but the two states' captions, the two parts' names and the shell
// bands' role words, and the figures' own tests recompute the same numbers from fresh captures to hold the spec to the
// frames.
//
//   bun solid/specs/from-frames.ts                  # write the six specs, here
//   bun solid/specs/from-frames.ts "$TMPDIR/specs"  # ... or into another directory, for solid/test.sh's cmp
//
// Both switch frames are taken with the switch focused (`Tab,Tab`) and the second with Space after it, so the focus ring is
// the same command in both and the only fields that move are the two the figure is about. The list/detail one is the Sky
// page at 720px — the wide form — with its second card's thread open, settled: the page's own two panes.
import "../plugin.ts";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Command, FrameDump } from "../src/dump.ts";
import { frameOf, gridOf } from "../src/figure/kinds/wireframe.ts";
import {
  check,
  type AppShellData,
  type BeforeAfterData,
  type CardGridData,
  type LayerStackData,
  type ListDetailData,
  type ListPane,
  type ModalData,
} from "../src/figure/spec.ts";
import type { Loader } from "../app/Sky.tsx";

// the page itself is imported dynamically: a static import of a page is resolved before the plugin registers, and Bun
// would load solid-js's server build (dump.ts's header says the same of `main.ts`)
const { screenOf } = await import("../app/Sky.tsx");

/** The keys the off frame is taken with: two Tabs reach the Wi-Fi switch and focus it. */
export const OFF_KEYS = ["Tab", "Tab"] as const;
/** ... and Space toggles it, so the on frame is the same page with one more key. */
export const ON_KEYS = ["Tab", "Tab", "Space"] as const;

/** The two states' captions: the page's own names for a switch's values. */
const CAPTIONS = ["off", "on"] as const;

/** One command that differs between two frames of one page, and the fields that differ. */
export interface Difference {
  index: number;
  fields: string[];
  before: Command;
  after: Command;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Every command whose fields differ, in the frame's order: the tree is the same, so an index is one element. */
export function differencesOf(off: FrameDump, on: FrameDump): Difference[] {
  if (off.commands.length !== on.commands.length)
    throw new Error(
      `the two frames have ${off.commands.length} and ${on.commands.length} commands: one tree is one command stream`,
    );
  return off.commands.flatMap((before, index) => {
    const after = on.commands[index]!;
    const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
      (field) => !same(before[field as keyof Command], after[field as keyof Command]),
    );
    return fields.length ? [{ index, fields, before, after }] : [];
  });
}

/** A colour's three channels as the figure prints them: `60,64,78`, the alpha dropped. */
const rgb = (colour: readonly number[] | undefined) => (colour ?? []).slice(0, 3).map(Math.round).join(",");

/**
 * The before/after data of two frames: the component's box (the command whose colour changed: the switch's track), the
 * colour the two states give it, and the thumb's own offset inside it (`box[0]` of the command whose x moved). Two changes
 * and no more — a page change that moves something else fails here rather than writing a figure about the wrong numbers.
 */
export function dataOf(off: FrameDump, on: FrameDump): BeforeAfterData {
  const differences = differencesOf(off, on);
  const coloured = differences.filter((difference) => difference.fields.includes("color"));
  const moved = differences.filter(
    (difference) => difference.fields.includes("box") && difference.before.box[0] !== difference.after.box[0],
  );
  if (differences.length !== 2 || coloured.length !== 1 || moved.length !== 1)
    throw new Error(
      `the frames differ in ${differences.length} command(s) (${differences
        .map((difference) => `#${difference.index} ${difference.fields.join("+")}`)
        .join(", ")}): the switch's two states are its track's colour and its thumb's x`,
    );
  const track = coloured[0]!;
  const thumb = moved[0]!;
  const width = Math.round(track.before.box[2]);
  const height = Math.round(track.before.box[3]);
  return {
    before: {
      caption: CAPTIONS[0],
      box: { width, height },
      measures: [
        { label: "the track", value: rgb(track.before.color) },
        { label: "the thumb", value: `${Math.round(thumb.before.box[0] - track.before.box[0])}px` },
      ],
    },
    after: {
      caption: CAPTIONS[1],
      box: { width, height },
      measures: [
        { label: "the track", value: rgb(track.after.color) },
        { label: "the thumb", value: `${Math.round(thumb.after.box[0] - track.before.box[0])}px` },
      ],
    },
  };
}

/** The keys the Dialog's modal frame is taken with: Tab reaches the "Settings" control, Enter opens it. */
export const MODAL_KEYS = ["Tab", "Enter"] as const;
/** ... and the menu's: two Tabs reach the "Zoom" control. */
export const MENU_KEYS = ["Tab", "Tab", "Enter"] as const;
/** The frames at rest after the overlay opens: the entry's group and shadow have settled (a property read mid-fade is
 *  the animation's, not the layer's). */
export const SETTLE = 40;

/** One layer's rectangle and effect rows: the page's own numbers, not a z scale typed into the spec. */
const layerOf = (name: string, frame: FrameDump, element: string) => {
  const command = frame.commands.find((c) => c.element === element && c.type === "rectangle");
  if (!command) throw new Error(`layerStack: ${element} is not a rectangle of its frame`);
  const [width, height] = [command.box[2]!, command.box[3]!];
  const blur = frame.effects.backdrops.find((backdrop) => backdrop.element === element)?.blur;
  const shadow = frame.effects.shadows.find((row) => row.element === element);
  return {
    name,
    z: command.z,
    box: { width, height },
    alpha: (command.color?.[3] ?? 255) / 255,
    radius: command.radii?.[0] ?? 0,
    ...(blur === undefined ? {} : { blur }),
    ...(shadow === undefined ? {} : { shadow: { x: shadow.x, y: shadow.y, blur: shadow.blur } }),
  };
};

/**
 * The Dialog's layers, back to front: the page, the modal's scrim and the dialog (its modal frame), and the menu (its
 * menu frame). Each row's z, box, alpha, radius, blur and shadow are that frame's own command and effect row for the
 * element, so a page that moves a float moves the figure.
 */
export function layersOf(modal: FrameDump, menu: FrameDump): LayerStackData {
  return [
    layerOf("the page", modal, "Root"),
    layerOf("the dialog's scrim", modal, "settings-backdrop"),
    layerOf("the dialog", modal, "settings-dialog"),
    layerOf("the menu", menu, "zoom-menu"),
  ];
}

/** The Dialog's modal as a wireframe's data: its frame's boxes and runs, the keys it was taken with and the panel. */
export function modalOf(frame: FrameDump, keys: readonly string[], settle: number): ModalData {
  const panel = frame.commands.find((c) => c.element === "settings-dialog" && c.type === "rectangle");
  if (!panel) throw new Error("modal: settings-dialog is not a rectangle of its frame");
  return {
    page: "dialog",
    keys: [...keys],
    settle,
    width: frame.size[0],
    height: frame.size[1],
    ...frameOf(frame.commands),
    panel: { x: panel.box[0]!, y: panel.box[1]!, width: panel.box[2]!, height: panel.box[3]! },
  };
}

/** The modal's spec: the Dialog with its modal open, the frame's own boxes and runs. */
export function modalSpecOf(data: ModalData) {
  return {
    kind: "modal" as const,
    title: "The Dialog, open",
    intent:
      "The Dialog page's frame with its modal open — the scrim over the whole page and the panel inside it — cut to the " +
      "cell grid, with the panel's own box under the drawing.",
    source: `solid/specs/from-frames.ts, the Dialog's modal frame (${data.keys.join(", ")}, settled)`,
    data,
  };
}

/** The Sky page's shell bands, in the page's own order: the bar, the feed and the status line. The role words are the
 *  author's; each band's element and its box are the frame's. */
export const SHELL_BANDS: readonly { band: string; element: string }[] = [
  { band: "nav", element: "sky-bar" },
  { band: "content", element: "sky-feed" },
  { band: "status", element: "sky-status" },
] as const;

/** The Sky page's shell as a wireframe's data: each band the box of the frame's element with that name, plus the frame. */
export function appShellOf(frame: FrameDump): AppShellData {
  const regions = SHELL_BANDS.map(({ band, element }) => {
    const command = frame.commands.find(
      (candidate) => candidate.element === element && (candidate.type === "rectangle" || candidate.type === "border"),
    );
    if (!command) throw new Error(`appShell: ${element} is not a rectangle of its frame`);
    return {
      band,
      element,
      x: command.box[0]!,
      y: command.box[1]!,
      width: command.box[2]!,
      height: command.box[3]!,
    };
  });
  return { page: "sky", width: frame.size[0], height: frame.size[1], ...frameOf(frame.commands), regions };
}

/** The prefix the Sky feed's cards share: a card is the element the page gave that name. */
export const CARD_PREFIX = "sky-card-";

/** The Sky feed's cards as a card grid's data: every element whose name is the prefix and an index, at its own box, and
 *  the columns and gaps the boxes make (`gridOf`). */
export function cardGridOf(frame: FrameDump, prefix = CARD_PREFIX): CardGridData {
  const seen = new Set<string>();
  const cards: CardGridData["cards"][number][] = [];
  for (const command of frame.commands) {
    const element = command.element;
    if (command.type !== "rectangle" && command.type !== "border") continue;
    if (!element || !element.startsWith(prefix) || seen.has(element)) continue;
    seen.add(element);
    cards.push({
      index: Number(element.slice(prefix.length)),
      element,
      x: command.box[0]!,
      y: command.box[1]!,
      width: command.box[2]!,
      height: command.box[3]!,
    });
  }
  cards.sort((a, b) => a.index - b.index);
  const { columns, gap, columnGap } = gridOf(cards);
  return { page: "sky", width: frame.size[0], height: frame.size[1], ...frameOf(frame.commands), prefix, cards, columns, gap, columnGap };
}

/** The shell's spec: the Sky page's own bands, each the element the frame drew. */
export function shellSpecOf(data: AppShellData) {
  return {
    kind: "appShell" as const,
    title: "The Sky page's shell",
    intent:
      "The Sky page's own frame, band by band: the bar, the feed under it and the status line — each band the box the " +
      "page drew, labelled with the element it came from.",
    source: "solid/specs/from-frames.ts, the Sky page's frame at rest (solid/dump.ts)",
    data,
  };
}

/** The grid's spec: the Sky feed's post cards, each at the box its element drew. */
export function gridSpecOf(data: CardGridData) {
  return {
    kind: "cardGrid" as const,
    title: "The Sky feed's cards",
    intent:
      "The Sky page's post cards, each at its own box with its index; the columns and the gaps are the cards' boxes', " +
      "not a layout the figure chose.",
    source: "solid/specs/from-frames.ts, the Sky page's frame at rest (solid/dump.ts)",
    data,
  };
}

/** The Sky page in its wide form: the list's element and the detail's, one either side of the page's 720px. */
export const LIST_DETAIL_ELEMENTS = ["sky-feed-pane", "sky-thread"] as const;

/** The width the wide Sky page is captured at (`app/Sky.tsx`'s `WIDE_AT`): two 360px columns. */
export const LIST_DETAIL_WIDTH = 720;
/** The element the capture presses, to open a thread: the second card's body (a wide card's middle is its author row). */
export const LIST_DETAIL_CLICK = "sky-body-1";
/** The frames at rest after that press: the thread's entry is 0.3s and its rows are the loader's answer at once. */
export const LIST_DETAIL_SETTLE = 40;

/** apps/csssky's recorded getPostThread answer, the screen an offline frame draws (`src/skyload.ts` reads the same one). */
export function offlineLoader(): Loader {
  const fixture = new URL("../../../apps/csssky/test/fixtures/thread.json", import.meta.url);
  let screen: ReturnType<typeof screenOf> | undefined;
  return () => (screen ??= screenOf((JSON.parse(readFileSync(fixture, "utf8")) as { thread: unknown }).thread));
}

/** One pane of the frame: the element's own rectangle, or the sentence the script fails with. */
function paneOf(frame: FrameDump, element: string): ListPane {
  const command = frame.commands.find(
    (candidate) => candidate.element === element && (candidate.type === "rectangle" || candidate.type === "border"),
  );
  if (!command) throw new Error(`listDetail: ${element} is not a rectangle of its frame`);
  return { element, x: command.box[0]!, y: command.box[1]!, width: command.box[2]!, height: command.box[3]! };
}

/** The wide Sky page's two panes as a list/detail figure's data: each the box its element drew, plus the whole frame. */
export function listDetailOf(frame: FrameDump): ListDetailData {
  const [list, detail] = LIST_DETAIL_ELEMENTS;
  return {
    page: "sky",
    width: frame.size[0],
    height: frame.size[1],
    ...frameOf(frame.commands),
    list: paneOf(frame, list),
    detail: paneOf(frame, detail),
  };
}

/** The list/detail spec: the Sky page's thread beside its feed, the panes the wide page's frame drew. */
export function listDetailSpecOf(data: ListDetailData) {
  return {
    kind: "listDetail" as const,
    title: "The Sky page's thread, beside its feed",
    intent:
      "The Sky page in its wide form: the feed's column and the thread's, side by side at 720px — each pane the element " +
      "the page drew, and the two of them the page.",
    // the figure's source line is held to 76 characters, as every one of them is
    source: `solid/specs/from-frames.ts, the Sky page at ${LIST_DETAIL_WIDTH}px, its thread open`,
    // the page's own width in cells: a 720px page is 90 cells, and the figure is drawn at the size its page is
    options: { width: Math.round(data.width / 8) },
    data,
  };
}

/** The layer stack's spec: the Dialog's own overlays, measured where each one opens. */
export function layerSpecOf(data: LayerStackData) {
  return {
    kind: "layerStack" as const,
    title: "The Dialog's layers, back to front",
    intent:
      "The page and the three surfaces the Dialog stacks over it, each read from its own frame: the scrim's alpha, " +
      "the dialog's shadow and the menu's glass are the page's, not a z scale's.",
    source: "solid/specs/from-frames.ts, the Dialog's modal and menu frames (settled)",
    data,
  };
}

/** The spec, with the two states' numbers and the source of every one of them. */
export function specOf(data: BeforeAfterData) {
  return {
    kind: "beforeAfter" as const,
    title: "The Wi-Fi switch, off and on",
    intent:
      "One component, twice: the track's colour and the thumb's x are the commands that differ between the two stored frames, so the figure's numbers are the page's.",
    source: "solid/specs/from-frames.ts, two frames of the Widgets page's switch",
    data,
  };
}

if (import.meta.main) {
  const { capture } = await import("../dump.ts");
  const off = await capture("widgets", undefined, { keys: [...OFF_KEYS] });
  const on = await capture("widgets", undefined, { keys: [...ON_KEYS] });
  const modal = await capture("dialog", undefined, { keys: [...MODAL_KEYS], settle: SETTLE });
  const menu = await capture("dialog", undefined, { keys: [...MENU_KEYS], settle: SETTLE });
  const sky = await capture("sky");
  const wide = await capture("sky", undefined, {
    width: LIST_DETAIL_WIDTH,
    clickOn: LIST_DETAIL_CLICK,
    settle: LIST_DETAIL_SETTLE,
    load: offlineLoader(),
  });
  const spec = specOf(dataOf(off, on));
  const layers = layerSpecOf(layersOf(modal, menu));
  const dialog = modalSpecOf(modalOf(modal, MODAL_KEYS, SETTLE));
  const shell = shellSpecOf(appShellOf(sky));
  const grid = gridSpecOf(cardGridOf(sky));
  const panes = listDetailSpecOf(listDetailOf(wide));
  for (const one of [spec, layers, dialog, shell, grid, panes]) {
    const problems = check(one);
    if (problems.length) throw new Error(`${one.kind} would not draw: ${problems.join(" ")}`);
  }
  const dir = process.argv[2] ?? new URL(".", import.meta.url).pathname;
  mkdirSync(dir, { recursive: true });
  for (const [name, one] of [
    ["before-after.json", spec],
    ["layer-stack.json", layers],
    ["modal.json", dialog],
    ["app-shell.json", shell],
    ["card-grid.json", grid],
    ["list-detail.json", panes],
  ] as const) {
    writeFileSync(join(dir, name), `${JSON.stringify(one, null, 2)}\n`);
    console.log(`${name}: ${join(dir, name)}`);
  }
  const before = spec.data.before;
  const after = spec.data.after;
  console.log(
    `from-frames: the switch ${before.caption} -> ${after.caption}, ${before.box.width}x${before.box.height}; ` +
      `the layer stack ${layers.data.map((layer) => `${layer.name} z${layer.z}`).join(", ")}; the modal ` +
      `${dialog.data.boxes.length} boxes and ${dialog.data.texts.length} runs on ${dialog.data.panel.width}x` +
      `${dialog.data.panel.height}`,
  );
  console.log(
    `from-frames: the shell ${shell.data.regions.map((region) => `${region.band} ${region.element}`).join(", ")}; ` +
      `the grid ${grid.data.cards.length} cards in ${grid.data.columns} column(s), a ${grid.data.gap}px gap`,
  );
  console.log(
    `from-frames: the list/detail page ${panes.data.width}x${panes.data.height} — the list ${panes.data.list.element} ` +
      `${panes.data.list.width}x${panes.data.list.height} at ${panes.data.list.x},${panes.data.list.y}, the detail ` +
      `${panes.data.detail.element} ${panes.data.detail.width}x${panes.data.detail.height} at ${panes.data.detail.x},` +
      `${panes.data.detail.y}`,
  );
}
