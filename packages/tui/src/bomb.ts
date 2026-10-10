// The @bomb.sh/tty adapter of cssints/tui styles (docs/research/tui.md): a frame is a list of ops, so a style becomes the
// options of open() and text() for the state of its element id, and a tracker turns the pointer events of term.render()
// into :hover and :active for the next frame, with the mouse pointer (OSC 22) and the caret (DECSCUSR, OSC 12).
import {
  fit,
  fixed,
  grow,
  open,
  percent,
  rgba,
  text,
  type Op,
  type OpenElement,
  type PointerEvent,
  type RenderOptions,
  type RenderResult,
  type Term,
  type Text,
} from "@bomb.sh/tty";
import type { TuiProps, TuiShape } from "cssints/tui";

import { resolve, type TuiState } from "./index.ts";

export { onTheme, resolve, setTheme, theme, type TuiState } from "./index.ts";

/** The options of `open(id, options)`. */
export type OpenProps = Omit<OpenElement, "directive" | "id">;
/** The options of `text(content, options)`. */
export type TextProps = Omit<Text, "directive" | "content">;
type Layout = NonNullable<OpenProps["layout"]>;

// the attrs bits of a text op (SGR 1, 2, 3, 4, 9)
const ATTRS = { bold: 1, dim: 2, italic: 4, underline: 8, strikethrough: 64 } as const;
const START = { "flex-start": 0, center: 1, "flex-end": 2 } as const;
const X = ["left", "center", "right"] as const;
const Y = ["top", "center", "bottom"] as const;
const CARET = { auto: 0, block: 1, underscore: 3, bar: 5 } as const;

/**
 * A colour of a style (`#rrggbb` or `#rrggbbaa`) as bomb.sh packs it.
 *
 * @param {string} hex a colour of `resolve()`
 * @returns {number} `rgba(r, g, b, a)`
 */
export const rgbaOf = (hex: string): number => {
  const n = (i: number) => Number.parseInt(hex.slice(i, i + 2), 16);
  return rgba(n(1), n(3), n(5), hex.length > 7 ? n(7) : 255);
};

const bound = (v: unknown) => (typeof v === "number" ? v : 0);
const axis = (v: TuiProps["width"], min: unknown, max: unknown, grows: boolean) => {
  if (typeof v === "number") return fixed(v);
  if (v !== undefined && v !== "auto") return percent(Number.parseFloat(v) / 100);
  if (grows) return grow(bound(min), bound(max));
  if (v === "auto" || bound(min) || bound(max)) return fit(bound(min), bound(max));
  return undefined;
};
const align = (v: string | undefined) =>
  v !== undefined && Object.hasOwn(START, v) ? START[v as keyof typeof START] : undefined;

/**
 * The options of `open()` for props of `resolve()`: sizes (a number is `fixed`, `N%` is `percent`, `auto` is `fit`,
 * `flexGrow` is `grow` on each axis without a size), `flexDirection`, padding, gap, `justifyContent` and `alignItems`
 * (`alignX`, `alignY`), `backgroundColor`, the border (one cell a side; `rounded` gives round corners), `overflow`
 * (clip) and `position: absolute` (floating). What bomb.sh has no option for is left out (docs/research/tui.md).
 *
 * @param {TuiProps} p the props of `resolve()`
 * @returns {OpenProps} the options of `open(id, options)`
 */
export const openProps = (p: TuiProps): OpenProps => {
  const out: OpenProps = {};
  const layout: Layout = {};
  const hidden = p.visible === false;
  const grows = (p.flexGrow ?? 0) > 0;
  const width = hidden ? fixed(0) : axis(p.width, p.minWidth, p.maxWidth, grows);
  const height = hidden ? fixed(0) : axis(p.height, p.minHeight, p.maxHeight, grows);
  if (width) layout.width = width;
  if (height) layout.height = height;
  const ttb = p.flexDirection === "column" || p.flexDirection === "column-reverse";
  if (p.flexDirection) layout.direction = ttb ? "ttb" : "ltr";
  const padding: NonNullable<Layout["padding"]> = {};
  for (const [side, v] of [
    ["top", p.paddingTop],
    ["right", p.paddingRight],
    ["bottom", p.paddingBottom],
    ["left", p.paddingLeft],
  ] as const)
    if (typeof v === "number") padding[side] = v;
  if (Object.keys(padding).length) layout.padding = padding;
  const gap = (ttb ? p.rowGap : p.columnGap) ?? p.gap;
  if (typeof gap === "number") layout.gap = gap;
  const main = align(p.justifyContent);
  const cross = align(p.alignItems);
  const x = (ttb ? cross : main) ?? (p.textAlign ? X.indexOf(p.textAlign) : undefined);
  const y = ttb ? main : cross;
  if (x !== undefined) layout.alignX = X[x];
  if (y !== undefined) layout.alignY = Y[y];
  if (Object.keys(layout).length) out.layout = layout;
  if (p.backgroundColor) out.bg = rgbaOf(p.backgroundColor);
  if (p.border && !hidden) {
    out.border = {
      color: rgbaOf(p.borderColor ?? p.color ?? "#ffffff"),
      top: 1,
      right: 1,
      bottom: 1,
      left: 1,
    };
    if (p.borderStyle === "rounded") out.cornerRadius = { tl: 1, tr: 1, bl: 1, br: 1 };
  }
  if (hidden || p.overflow === "hidden" || p.overflow === "scroll")
    out.clip = { horizontal: true, vertical: true };
  if (p.position === "absolute") {
    const right = p.left === undefined && typeof p.right === "number";
    const bottom = p.top === undefined && typeof p.bottom === "number";
    const point = `${right ? "right" : "left"}-${bottom ? "bottom" : "top"}` as const;
    out.floating = {
      attachTo: "parent",
      attachPoints: { element: point, parent: point },
      x: right ? -bound(p.right) : bound(p.left),
      y: bottom ? -bound(p.bottom) : bound(p.top),
    };
    if (p.zIndex !== undefined) out.floating.zIndex = p.zIndex;
  }
  return out;
};

/**
 * The options of `text()` for props of `resolve()`: `color`, `backgroundColor` (`bg`) and the text attributes
 * (`bold`, `dim`, `italic`, `underline`, `strikethrough`) as the bits of `attrs`.
 *
 * @param {TuiProps} p the props of `resolve()`
 * @returns {TextProps} the options of `text(content, options)`
 */
export const textProps = (p: TuiProps): TextProps => {
  const out: TextProps = {};
  if (p.color) out.color = rgbaOf(p.color);
  if (p.backgroundColor) out.bg = rgbaOf(p.backgroundColor);
  let attrs: number | undefined;
  for (const [k, bit] of Object.entries(ATTRS))
    if (Object.hasOwn(p, k)) attrs = (attrs ?? 0) | (p[k as keyof typeof ATTRS] ? bit : 0);
  if (attrs !== undefined) out.attrs = attrs;
  return out;
};

const encoder = new TextEncoder();
const osc = (body: string) => `\x1b]${body}\x1b\\`;
const caretOf = (p: TuiProps) => {
  let out = "";
  if (p.caretShape || p.caretAnimation) {
    const n = CARET[p.caretShape ?? "auto"];
    out += `\x1b[${n && p.caretAnimation === "manual" ? n + 1 : n} q`;
  }
  if (p.caretColor) out += osc(`12;${p.caretColor.slice(0, 7)}`);
  return out;
};
const join = (parts: (Uint8Array | string)[]) => {
  const bytes = parts.map((b) => (typeof b === "string" ? encoder.encode(b) : b));
  const out = new Uint8Array(bytes.reduce((n, b) => n + b.length, 0));
  let at = 0;
  for (const b of bytes) {
    out.set(b, at);
    at += b.length;
  }
  return out;
};

/** The states of the elements of a frame, fed by the pointer events of `term.render()`. */
export interface Tracker {
  /** The states of element `id`: `hover` from `pointerenter` to `pointerleave`, `active` while pressed, `focus`. */
  state(id: string): TuiState;
  /** `open(id, ...)` with the options of `style` in the state of `id`; `extra` is laid over them (a `transition`). */
  open(id: string, style: TuiShape, extra?: OpenProps): OpenElement;
  /** `text(content, ...)` with the options of `style` in the state of element `id` (none: the base style). */
  text(content: string, style: TuiShape, id?: string, extra?: TextProps): Text;
  /** Gives element `id` the `:focus` state and its caret style (`undefined`: none). */
  focus(id: string | undefined): void;
  /**
   * Renders `build()` with `options`, reads its pointer events and, when a state changed, renders `build()` again,
   * so a hover shows in the same frame. `output` holds both, and the OSC 22 pointer and caret bytes that changed.
   */
  render(term: Term, build: () => Op[], options?: RenderOptions): RenderResult;
  /** The bytes that give the terminal back its pointer and caret, to write on exit. */
  reset(): Uint8Array;
}

/**
 * A tracker of element states for one `Term`: build each frame with its `open` and `text`, and render with its
 * `render`. `:hover` follows `pointerenter`/`pointerleave` (an element and its ancestors), `:active` holds from a
 * pointer press over the element to the release (`pointerclick`) or a leave, `:focus` is the id given to `focus`.
 *
 * @returns {Tracker} the tracker
 */
export const createTracker = (): Tracker => {
  const hovered = new Set<string>(); // in the order entered: the innermost last
  const active = new Set<string>();
  const styles = new Map<string, TuiShape>();
  let focused: string | undefined;
  let down = false;
  let pointer = "default";
  let caret = "";
  const state = (id: string): TuiState => ({
    hover: hovered.has(id),
    active: active.has(id),
    focus: focused === id,
  });
  const update = (events: PointerEvent[], press: boolean) => {
    let changed = false;
    for (const e of events)
      if (e.type === "pointerenter") {
        changed ||= !hovered.has(e.id);
        hovered.add(e.id);
      } else {
        if (e.type === "pointerleave") changed = hovered.delete(e.id) || changed;
        changed = active.delete(e.id) || changed;
      }
    if (press && !down)
      for (const id of hovered) {
        active.add(id);
        changed = true;
      }
    if (!press && active.size) {
      active.clear();
      changed = true;
    }
    down = press;
    return changed;
  };
  const escapes = () => {
    let out = "";
    let next = "default";
    for (const id of [...hovered].reverse()) {
      const style = styles.get(id);
      const cursor = style && resolve(style, state(id)).cursor;
      if (cursor) {
        next = cursor;
        break;
      }
    }
    if (next !== pointer) out += osc(`22;${next}`);
    pointer = next;
    const style = focused === undefined ? undefined : styles.get(focused);
    const nextCaret = style && focused !== undefined ? caretOf(resolve(style, state(focused))) : "";
    if (nextCaret !== caret) out += nextCaret || "\x1b[0 q" + osc("112");
    caret = nextCaret;
    return out;
  };
  return {
    state,
    open: (id, style, extra) => {
      styles.set(id, style);
      return open(id, { ...openProps(resolve(style, state(id))), ...extra });
    },
    text: (content, style, id, extra) =>
      text(content, { ...textProps(resolve(style, id === undefined ? {} : state(id))), ...extra }),
    focus: (id) => {
      focused = id;
    },
    render: (term, build, options) => {
      const press = options?.pointer?.down ?? false;
      styles.clear();
      const first = term.render(build(), options);
      if (!update(first.events, press))
        return { ...first, output: join([first.output, escapes()]) };
      const output = first.output.slice(); // a view of the WASM memory the next render reuses
      styles.clear();
      const again = term.render(build(), options);
      update(again.events, press);
      return {
        ...again,
        output: join([output, again.output, escapes()]),
        events: [...first.events, ...again.events],
      };
    },
    reset: () => join([osc("22;default"), "\x1b[0 q", osc("112")]),
  };
};
