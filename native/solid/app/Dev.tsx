// The dev page (the map's item 7): the Widgets page with a panel beside it — the page's accessibility tree, the box
// under the pointer, and the frame's phases. The page on the left is the Widgets component itself, not a copy
// (`Widgets` below), in a 360px column, so its keys, focus and mouse are the ones `bun solid/main.ts widgets` has; the
// panel is 300px of plain rows on the right. The whole page is 660x760.
//
// The panel reads the page's own tree (`a11y.ts`'s `snapshot`, whose bounds are `ui.bounds` of the last layout), the
// innermost box with a role under the pointer (`ui.over` + `ui.bounds`) and the frame's numbers (`stats`, which the
// host's `createFrame` pushes, and `ui.draws`/`ui.presents`) every frame — and it *prints* them when they change. That
// is the whole point of the page: the panel is in the same Clay frame as the page, so reprinting a frame's phases
// every frame would change the frame's hash every frame and the page could never rest, which is what its counters are
// here to show. The numbers are therefore those of the frame that last changed the page.
//
// The Widgets page's first-mount entry is off (it is given no motion hook): the entry draws ~21 frames over a page that
// does not change, and this page is about the frames after that.
import * as css from "cssints/clay" with { type: "cssints" };
import { createSignal, flush, For } from "solid-js";

import { snapshot, type A11yNode, type States } from "../a11y.ts";
import type { Motion } from "../src/entry.ts";
import { ui } from "../src/ffi.ts";
import type { Input } from "../src/input.ts";
import { El } from "../src/renderer.ts";
import { Widgets, size as pageSize, type Drag } from "./Widgets.tsx";

// the Widgets page's palette, a shade darker for the panel, so the two sit side by side in either theme
const t = css.createTokens({
  color: {
    $type: "color",
    page: { $value: "rgb(16 18 24)" },
    panel: { $value: "rgb(24 26 33)" },
    ink: { $value: "rgb(235 235 240)" },
    muted: { $value: "rgb(150 155 170)" },
  },
});
css.createGlobalTheme(t, "light", {
  color: {
    page: "rgb(244 245 248)",
    panel: "rgb(232 234 240)",
    ink: "rgb(25 27 34)",
    muted: "rgb(95 100 115)",
  },
});
const font = css.fonts("Roboto");

const root = css.cn(css.width("stretch"), css.height("stretch"), css.bg(t.color.page));
// the page's column: the Widgets page's own 360, and the page's root is `stretch` inside it
const left = css.cn(css.width(pageSize.width), css.height("stretch"), css.flexDirection("column"));
const panel = css.cn(
  css.width(300),
  css.height("stretch"),
  css.p(10, 12),
  css.gap(3),
  css.flexDirection("column"),
  css.bg(t.color.panel),
);
const head = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(10), css.pt(6));
const row = css.cn(font.Roboto, css.color(t.color.ink), css.fontSize(10));
const rowBox = css.cn(css.width("stretch"));

/** The window of the dev page: the Widgets page at its own size, and a 300px panel beside it. */
export const size = { width: pageSize.width + 300, height: pageSize.height };

/**
 * The frames' phases, which the host's `createFrame` pushes into `View.stats` (main.ts hands the dev page this array):
 * the panel reads it, so the numbers it prints are the frame loop's own.
 */
export const stats: [number, number, number, number][] = [];

/** The frames the mean and the max are taken over. */
const WINDOW = 30;

/** One row of the tree: the a11y node's fields, and how deep it is (the panel indents by 8px a level). */
export interface Row {
  depth: number;
  text: string;
}

const round = (n: number) => String(Math.round(n));
const two = (n: number) => n.toFixed(2);

/** `x,y w×h` of a node's bounds, or that it has none (a container the page never drew a box for). */
const boxText = (bounds: A11yNode["bounds"]): string =>
  bounds === undefined
    ? "no bounds"
    : `${round(bounds[0])},${round(bounds[1])} ${round(bounds[2])}×${round(bounds[3])}`;

const statesText = (states: States): string => {
  const on = Object.entries(states).map(([k, v]) => `${k}=${v}`);
  return on.length ? ` [${on.join(" ")}]` : "";
};

/** `role "name" [states] x,y w×h`, the row the panel prints for one node. */
export function rowOf(node: A11yNode, depth = 0): Row {
  const name = node.name === undefined ? "" : ` "${node.name}"`;
  return { depth, text: `${node.role}${name}${statesText(node.states)} ${boxText(node.bounds)}` };
}

/** The whole tree as rows in document order, the snapshot's `document` node itself left out. */
export function rowsOf(node: A11yNode, depth = 0): Row[] {
  return node.children.flatMap((child) => [rowOf(child, depth), ...rowsOf(child, depth + 1)]);
}

/** The indented row's box: the one style the page makes at run time, kept per depth. */
const indent = new Map<number, unknown>();
const indentOf = (depth: number): unknown => {
  let style = indent.get(depth);
  if (!style) {
    const base = rowBox as any;
    const padding = { left: depth * 8 };
    indent.set(depth, (style = { ...base, layout: { ...base.layout, padding } }));
  }
  return style;
};

const ids = new Map<string, Uint8Array>();
const idBytes = (id: string): Uint8Array =>
  ids.get(id) ?? (ids.set(id, Buffer.from(id)), ids.get(id)!);

/**
 * The deepest box with an id and a role under the pointer: Clay's `over` is true for a box and for its ancestors, and
 * a box without a role is not a node of the tree, so the innermost a11y node is the one reported.
 */
function deepest(el: El): El | undefined {
  let best: El | undefined;
  for (const c of el.children) {
    if (!(c instanceof El)) continue;
    const inside = deepest(c);
    if (inside) best = inside;
    else if (isNode(c) && ui.over(idBytes(c.props.id))) best = c;
  }
  return best;
}

/** Is this box a node of the tree: an `id` and a `role` (a box with neither has nothing to report)? */
const isNode = (el: El): boolean =>
  typeof el.props.id === "string" && typeof el.props.role === "string";

/**
 * The node of the snapshot the box drew: the same role at the same bounds (`ui.bounds` both ways), so the hovered box
 * reads the tree's own name for it.
 */
function nodeOf(node: A11yNode, role: string, bounds: Float32Array): A11yNode | undefined {
  const b = node.bounds;
  if (node.role === role && b !== undefined && b.every((v, i) => v === bounds[i])) return node;
  for (const child of node.children) {
    const hit = nodeOf(child, role, bounds);
    if (hit) return hit;
  }
  return undefined;
}

/** What the panel shows: the rows, the hovered box's two lines, and the frame's four lines. */
interface Shown {
  rows: Row[];
  hover: string[];
  frame: string[];
}

export interface DevProps {
  readonly input: Input;
  /** The host's hook: the page samples the panel at its tick, before the tree is declared. */
  readonly motion?: Motion;
  /** The Widgets page's slider drag, as `main.ts` hands it to the page on its own. */
  readonly drag?: Drag;
}

/**
 * The dev page: `size` (660x760), the Widgets page on the left and the panel on the right. The panel is three
 * sections, read every frame and printed when they change: the a11y tree, the hovered box, and the frame's phases plus
 * the draw and present counters.
 */
export function Dev(props: DevProps) {
  const [shown, setShown] = createSignal<Shown>({ rows: [], hover: ["nothing"], frame: [] });
  // the page is the Widgets component with no motion hook: its entry is off, and it writes no value of its own
  const pageEl = Widgets({ input: props.input, drag: props.drag }) as unknown as El;

  let lastKey = "";
  let again = false;

  /** The frame's four lines: the last frame's phases, the mean and the max of the last 30, and the counters. */
  const frameOf = (): string[] => {
    const last = stats[stats.length - 1];
    if (!last) return ["no frame yet"];
    const ms = last.map((n) => n / 1e6);
    const window = stats.slice(-WINDOW).map((s) => s[0]! + s[1]! + s[2]! + s[3]!);
    const mean = window.reduce((sum, s) => sum + s, 0) / window.length / 1e6;
    return [
      `events+flush ${two(ms[0]!)}   declare ${two(ms[1]!)}`,
      `layout ${two(ms[2]!)}   draw ${two(ms[3]!)}`,
      `last ${window.length}: mean ${two(mean)}  max ${two(Math.max(...window) / 1e6)} ms`,
      `draws ${ui.draws()}  presents ${ui.presents()}`,
    ];
  };

  /** The hovered box's two lines: its id, role and name, and its bounds. */
  const hoverOf = (snap: A11yNode): string[] => {
    const box = deepest(pageEl);
    if (box === undefined) return ["nothing", "the pointer is over the page's background"];
    const id = box.props.id as string;
    const bounds = ui.bounds(idBytes(id));
    const node = bounds === undefined ? undefined : nodeOf(snap, box.props.role as string, bounds);
    const name = node?.name === undefined ? "" : ` "${node.name}"`;
    return [
      `${id}  ${box.props.role}${name}`,
      bounds === undefined
        ? "no bounds"
        : boxText([bounds[0]!, bounds[1]!, bounds[2]!, bounds[3]!]),
    ];
  };

  /**
   * One reading of the panel: the page's tree, the box under the pointer, and the frame's numbers. The tree is
   * rebuilt every frame and printed only when it changed; `ponytail:` nothing is cached between frames, which at 28
   * nodes (0.09 ms with the hover walk) is cheaper than a diff — a page of hundreds of nodes wants a window of rows
   * (the List's `virtual.ts`) and rows as a golden instead of a panel.
   */
  const sample = () => {
    // the page's own props for this frame: a key's focus lands at the flush, which is after the host's tick
    flush();
    const snap = snapshot(pageEl);
    const rows = rowsOf(snap);
    const hover = hoverOf(snap);
    const key = `${rows.map((r) => `${r.depth}|${r.text}`).join("\n")}\n${hover.join("\n")}`;
    // a change prints at once, and its frame's phases on the next reading: the phases of the frame the change was in
    // are only pushed by the host after this tick
    if (key !== lastKey) {
      lastKey = key;
      again = true;
      setShown({ rows, hover, frame: frameOf() });
      return;
    }
    if (!again) return;
    // the same tree and the same hover: the panel keeps the numbers it printed, so the frame is one a page at rest has
    again = false;
    setShown({ ...shown(), frame: frameOf() });
  };

  if (props.motion) props.motion.tick = () => sample();

  return (
    <box id="dev-root" style={s.root}>
      <box id="dev-left" style={s.left}>
        {pageEl}
      </box>
      <box id="dev-panel" style={s.panel}>
        <text style={s.head}>a11y tree</text>
        <For each={shown().rows}>
          {(line) => (
            <box style={indentOf(line.depth)}>
              <text style={s.row}>{line.text}</text>
            </box>
          )}
        </For>
        <text style={s.head}>hovered box</text>
        <For each={shown().hover}>{(line) => <text style={s.row}>{line}</text>}</For>
        <text style={s.head}>frame</text>
        <For each={shown().frame}>{(line) => <text style={s.row}>{line}</text>}</For>
      </box>
    </box>
  );
}

const s = { root, left, panel, head, row };
