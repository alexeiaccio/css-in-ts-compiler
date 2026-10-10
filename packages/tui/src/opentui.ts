// The OpenTUI adapter of cssints/tui styles (docs/research/tui.md): sets the props of a style on a renderable and keeps
// them in step with its states (`over`/`out`, `down`/`up`, `focused`/`blurred`), the mouse pointer and the theme.
import type { MouseEvent, Renderable } from "@opentui/core";
import type { TuiProps, TuiShape } from "cssints/tui";

import { onTheme, resolve, type TuiState } from "./index.ts";

export { resolve, setTheme, theme, type TuiState } from "./index.ts";

// TextAttributes of @opentui/core
const BITS = { bold: 1, dim: 2, italic: 4, underline: 8, strikethrough: 128 } as const;
const ALL = 1 | 2 | 4 | 8 | 128;
const SHAPE = { auto: "default", bar: "line", block: "block", underscore: "underline" } as const;
// What a renderable draws while it has the focus in place of a prop (a box while a descendant has it too): kept on the
// prop's value, which is the :focus one while it is focused (cssints-pkpg)
const FOCUSED = [
  ["borderColor", "focusedBorderColor"],
  ["backgroundColor", "focusedBackgroundColor"],
  ["textColor", "focusedTextColor"],
] as const;

/**
 * The OpenTUI props of a style (`has` tells which props the renderable has: a box takes `backgroundColor`, a text `bg`):
 * `color` is `fg` (`textColor` on an editable or a select), the text attributes are the bits of `attributes`, the
 * caret is `cursorStyle` and `cursorColor` (Input, Textarea). `cursor` is not a prop: `attach` sets the mouse pointer.
 *
 * @param {TuiProps} p the props of `resolve()`
 * @param {Function} has whether the renderable has a prop
 * @returns {Record<string, unknown>} the props of an OpenTUI renderable
 */
export const props = (
  p: TuiProps,
  has: (key: string) => boolean = () => true,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  let bits: number | undefined;
  for (const [k, v] of Object.entries(p)) {
    if (Object.hasOwn(BITS, k)) bits = (bits ?? 0) | (v ? BITS[k as keyof typeof BITS] : 0);
    else if (k === "color") out[has("fg") || !has("textColor") ? "fg" : "textColor"] = v;
    else if (k === "backgroundColor") out[has("backgroundColor") ? "backgroundColor" : "bg"] = v;
    else if (k === "caretColor") out.cursorColor = v;
    else if (k !== "cursor" && k !== "caretShape" && k !== "caretAnimation") out[k] = v;
  }
  if (bits !== undefined) out.attributes = bits;
  if (p.caretShape || p.caretAnimation)
    out.cursorStyle = {
      style: SHAPE[p.caretShape ?? "auto"],
      blinking: p.caretAnimation !== "manual",
    };
  return out;
};

type Hooked = Renderable & { onMouseEvent(event: MouseEvent): void };

/**
 * Sets the props of `style` on `r` and keeps them up to date: `:hover` from `over` to `out`, `:active` from `down` to
 * `up` (or `out`), `:focus` while it has focus (a box needs `focusable: true`), and the theme of `setTheme`. The mouse
 * pointer is the style's `cursor` on `over`, `default` again on `out`. Handlers of your own (`onMouseOver`) still run.
 * A focused renderable draws its `focused*` colours (`focusedBorderColor` of a box): they follow the style too.
 *
 * @param {Renderable} r a renderable of OpenTUI
 * @param {TuiShape} style a style of cssints/tui
 * @returns {Renderable} `r`
 */
export const attach = <R extends Renderable>(r: R, style: TuiShape): R => {
  const state: TuiState = {};
  const target = r as unknown as Record<string, unknown>;
  const saved = new Map<string, unknown>(); // the renderable's own value of each prop the style has set
  const last = new Map<string, unknown>();
  let pointer = false;
  const apply = () => {
    const next = props(resolve(style, state), (k) => k in r);
    for (const [from, to] of FOCUSED) if (Object.hasOwn(next, from)) next[to] = next[from];
    const attrs = next.attributes as number | undefined;
    for (const k of new Set([...saved.keys(), ...Object.keys(next)])) {
      if (!(k in r)) continue;
      if (!saved.has(k)) saved.set(k, target[k]);
      let v = Object.hasOwn(next, k) ? next[k] : saved.get(k);
      if (k === "attributes" && attrs !== undefined) v = ((saved.get(k) as number) & ~ALL) | attrs;
      if (last.get(k) === v) continue;
      last.set(k, v);
      target[k] = v;
    }
    r.requestRender();
  };
  const set = (key: keyof TuiState, on: boolean) => {
    if (!!state[key] === on) return false;
    state[key] = on;
    return true;
  };
  const hooked = r as unknown as Hooked;
  const own = hooked.onMouseEvent.bind(r);
  hooked.onMouseEvent = (event) => {
    let changed = false;
    if (event.type === "over") {
      changed = set("hover", true);
      const cursor = resolve(style, { ...state, hover: true }).cursor;
      if (cursor) r.ctx.setMousePointer(cursor);
      pointer = !!cursor;
    } else if (event.type === "out") {
      changed = set("hover", false);
      changed = set("active", false) || changed;
      if (pointer) r.ctx.setMousePointer("default");
      pointer = false;
    } else if (event.type === "down") changed = set("active", true);
    else if (event.type === "up") changed = set("active", false);
    if (changed || pointer) apply();
    own(event);
  };
  r.on("focused", () => set("focus", true) && apply());
  r.on("blurred", () => set("focus", false) && apply());
  const stop = onTheme(apply);
  r.once("destroyed", stop);
  apply();
  return r;
};

/**
 * Props to spread on an OpenTUI element of Solid or React: `<box {...use(card)} />`. The `ref` attaches the style
 * (`attach`) when the renderable is made, before its first frame.
 *
 * @param {TuiShape} style a style of cssints/tui
 * @returns {object} `{ ref }`
 */
export const use = (style: TuiShape): { ref: (r: Renderable | null) => void } => ({
  ref: (r) => {
    if (r) attach(r, style);
  },
});
