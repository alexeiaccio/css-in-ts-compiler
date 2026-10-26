// The List page: thirty rows in a fixed-height viewport whose offset the page owns (src/vscroll.ts — the Sky feed's
// machine). The viewport is still one clip element (`css.overflow("hidden")`) with the same id, so Clay lays out the rows
// in it and the renderer's scissor cuts what leaves the box, but the offset is the page's: `ui.scrollPut`/`ui.scrollTo`
// write it every frame before the tree is declared, and `ui.autoScroll(false)` keeps Clay's own wheel scrolling out of the
// way. The wheel accumulates 10px notches (a flick flings), a press inside the viewport drags it 1:1 with a 4px click
// threshold (the selection is keyboard-only, so the drag changes nothing about it), a drag or a wheel past an end pulls a
// rubber band that springs back 80ms after the last input, and the keyboard eases the track to the offset that shows the
// moved row (the reveal). Reduced motion has no band and no fling, and a key lands at once. The scrollbar is the machine's
// too (`BAR`): a 4px thumb on the viewport's right edge that fades in while the rows move, fades out 600ms after they stop,
// and drags the viewport from where it is pressed. The header and the footer are the viewport's siblings: they do not move.
import * as css from "cssints/clay" with { type: "cssints" };
import { createSignal, onCleanup } from "solid-js";

import { pageEntry, type Motion } from "../src/entry.ts";
import { scroll } from "../src/vscroll.ts";
import { ui } from "../src/ffi.ts";
import type { FocusPart, Input } from "../src/input.ts";

// the same palette and the same 2px ring as the Widgets, Dialog and Text field pages
const t = css.createTokens({
  color: {
    $type: "color",
    page: { $value: "rgb(16 18 24)" },
    title: { $value: "rgb(230 60 60)" },
    muted: { $value: "rgb(150 155 170)" },
    ink: { $value: "rgb(235 235 240)" },
    accent: { $value: "rgb(240 140 50)" },
    surface: { $value: "rgb(36 40 52)" },
    ring: { $value: "rgb(90 170 255)" },
  },
});
css.createGlobalTheme(t, "light", {
  color: {
    page: "rgb(244 245 248)",
    title: "rgb(200 30 40)",
    muted: "rgb(95 100 115)",
    ink: "rgb(25 27 34)",
    accent: "rgb(190 90 10)",
    surface: "rgb(255 255 255)",
    ring: "rgb(20 100 220)",
  },
});
const font = css.fonts("Roboto");

const root = css.cn(
  css.width("stretch"),
  css.height("stretch"),
  css.p(28, 40, 24, 40),
  css.gap(8),
  css.flexDirection("column"),
  css.bg(t.color.page),
);
const title = css.cn(font.Roboto, css.color(t.color.title), css.fontSize(32));
const label = css.cn(font.Roboto, css.color(t.color.ink), css.fontSize(16));
const note = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(14));
const detail = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(13));

const head = css.cn(css.width("stretch"), css.height(20), css.gap(8), css.alignItems("center"));
const foot = css.cn(css.width("stretch"), css.height(20));

// the viewport: a fixed height and `overflow: hidden` — Clay's clip element, which is also its scroll container. No
// padding, so a row's bounds are the viewport's top plus the offset plus the rows above it, exactly.
const view = css.cn(
  css.width("stretch"),
  css.height(240),
  css.gap(2),
  css.flexDirection("column"),
  css.overflow("hidden"),
  css.bg(t.color.page),
  css.borderRadius(8),
  css.border(1, t.color.muted),
);

// the viewport's id: the clip element, Clay's scroll container, and the float's parent
const VIEW = "list";
// the scrollbar's thumb (src/vscroll.ts writes its height, its top and its opacity every frame): 4px at the viewport's
// inner right edge, a 2px inset (the float's right edge is the viewport's, so the offset x is -2), rounded, the muted
// token. It is a float on the viewport, so Clay positions it from the viewport's own box: it does not travel with the rows.
const thumb = css.cn(
  css.width(4),
  css.height(24),
  css.borderRadius(2),
  css.bg(t.color.muted),
  css.float({
    parent: VIEW,
    attach: { element: "right top", parent: "right top" },
    offset: { x: -2 },
    zIndex: 1,
    capture: false, // a visible thumb takes the press through the value channel (FIELDS.CAPTURE); at rest the page's
  }),
);

// a row: the number dim and right-aligned, the label, the detail at the end. The selected row is the panel's surface with
// its label in the accent (as the tree's selected node) and takes the focus ring while the list has focus.
const row = css.cn(
  css.width("stretch"),
  css.height(28),
  css.p(0, 8),
  css.gap(8),
  css.alignItems("center"),
  css.borderRadius(6),
  css.focus(css.border(2, t.color.ring)),
);
const rowSelected = css.cn(row, css.bg(t.color.surface));
const number = css.cn(css.width(24), css.justifyContent("flex-end"));
const numberText = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(12));
const name = css.cn(css.width("stretch"));
const labelSelected = css.cn(font.Roboto, css.color(t.color.accent), css.fontSize(16));

export const s = {
  t,
  font,
  root,
  title,
  label,
  note,
  detail,
  head,
  foot,
  view,
  thumb,
  row,
  rowSelected,
  number,
  numberText,
  name,
  labelSelected,
};

/** The window: 28 + the title (37.5) + the header (20), the 240 viewport and the footer (20) end at 369.5, so the 24px
 *  bottom padding fits a 400 window with slack. */
export const size = { width: 360, height: 400 };

const COUNT = 30;
/** The rows a PageUp or a PageDown jumps: the viewport holds eight of the 30 (240 / 30). */
const PAGE = 8;
const BAR = "list-thumb";
/** One row: its number, its name and a dim temperature. No state, no tree of its own. */
interface Row {
  readonly number: string;
  readonly label: string;
  readonly detail: string;
  readonly id: string;
}
const ROWS: readonly Row[] = Array.from({ length: COUNT }, (_unused, i) => ({
  id: `row-${i}`,
  number: String(i + 1).padStart(2, "0"),
  // Room A1 .. Room F5: six letters, five of each, so all thirty read apart
  label: `Room ${String.fromCharCode(65 + (i % 6))}${Math.floor(i / 6) + 1}`,
  detail: `${(18 + ((i * 7) % 11))}.${i % 10} °C`,
}));

/**
 * The page. One Tab stop: the viewport. Up and Down move the selection a row, PageUp and PageDown eight, Home and End go
 * to the ends; it clamps (it never wraps and never leaves 0..29) and every move eases the viewport to the offset that
 * shows the selected row. The wheel scrolls the viewport under the pointer 10px a notch (a flick flings) and leaves the
 * selection alone, and a held pointer drags it 1:1 — the drag never selects. On its first mount the page rises 8px and
 * fades in once (src/entry.ts).
 */
export function List(props: { input: Input; motion?: Motion }) {
  const { input } = props;
  const [selected, setSelected] = createSignal(0);
  const [focused, setFocused] = createSignal(false);
  pageEntry(props.motion);
  // the entry's tick, which the page's own scroll ticks beside (the entry sets `motion.tick` itself)
  const entry = props.motion?.tick;
  // the page owns the viewport's offset: Clay's own wheel scrolling is off, and the track (src/vscroll.ts) writes it
  ui.autoScroll(false);
  onCleanup(() => ui.autoScroll(true));

  /** How far the viewport can scroll: the last row's bottom (in screen coordinates, already shifted by the offset), less
   *  the viewport's bottom, less the offset's own lift. The column has no padding; 0 when it fits (it does not). */
  const maxScroll = () => {
    const view = ui.bounds(Buffer.from(VIEW));
    const last = ui.bounds(Buffer.from(ROWS[COUNT - 1]!.id));
    if (!view || !last) return 0;
    return Math.max(0, last[1]! + last[3]! - (view[1]! + view[3]!) - ui.scrollOffset(VIEW));
  };

  /** The viewport's scroll: the wheel's 10px, the drag, the band and the fling, on the page's track. The scrollbar's thumb
   *  (`BAR`) is the machine's too: it writes its box and its fade every frame. */
  const viewScroll = scroll(VIEW, maxScroll, BAR);

  /** Eases the viewport to the least offset that shows row `i`: the row's place in the content (its bounds from the last
   *  frame are shifted by the offset, so the offset is added back) against the track's own target — not the presented
   *  offset, so a key pressed while the track is still travelling still lands where the row is. With the row in view
   *  nothing moves. */
  const reveal = (i: number) => {
    const row = ui.bounds(Buffer.from(ROWS[i]!.id));
    const view = ui.bounds(Buffer.from(VIEW));
    if (!row || !view) return;
    const top = row[1]! - view[1]! - ui.scrollOffset(VIEW); // the row's top in the content, positive down
    const at = viewScroll.target();
    const to =
      top < at ? top : top + row[3]! > at + view[3]! ? top + row[3]! - view[3]! : at;
    if (to !== at) viewScroll.seek(to);
  };

  const select = (i: number) => {
    setSelected(i);
    reveal(i);
  };

  const part: FocusPart & { readonly disabled: boolean } = {
    id: VIEW,
    disabled: false,
    get focused() {
      return focused();
    },
    // the active row comes into view when the list gets the focus, as a browser does
    focus: () => {
      setFocused(true);
      reveal(selected());
    },
    blur: () => setFocused(false),
    keyDown: (key) => {
      const step =
        key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : key === "PageDown" ? PAGE : key === "PageUp" ? -PAGE : 0;
      const to = key === "Home" ? 0 : key === "End" ? COUNT - 1 : step ? selected() + step : -1;
      if (to < 0) return false;
      select(Math.max(0, Math.min(COUNT - 1, to)));
      return true;
    },
    keyUp: () => false,
  };
  const bind = input.add(part);

  // the frame: the entry writes its two group fields, then the scroll retargets on the wheel and a key and writes the
  // viewport's offset, all before the tree is declared
  const tick = (dt: number) => {
    entry?.(dt);
    viewScroll.tick(dt);
  };
  // Clay scrolled the container under the pointer only; a page that owns the offset has to keep that rule itself, or a
  // wheel over the title would scroll the rows. The visible thumb is chrome of the viewport: the wheel over it scrolls too.
  const viewId = Buffer.from(VIEW);
  const barId = Buffer.from(BAR);
  const wheel = (dx: number, dy: number) => {
    if (ui.over(viewId) || ui.over(barId)) viewScroll.wheel(dx, dy);
  };
  if (props.motion)
    (props.motion.onWheel = wheel),
      (props.motion.onPointer = viewScroll.pointer),
      (props.motion.tick = tick);

  const current = () => ROWS[selected()]!;

  return (
    <box id="Root" style={s.root}>
      <text style={s.title}>List</text>
      <box id="list-head" style={s.head}>
        <text style={s.note}>{`${current().label} — ${selected() + 1} of ${COUNT}`}</text>
      </box>
      <box {...bind} onPress={() => (bind.onPress(), viewScroll.press())} style={s.view}>
        {ROWS.map((r, i) => (
          <box id={r.id} focused={i === selected() && focused()} style={i === selected() ? s.rowSelected : s.row}>
            <box style={s.number}>
              <text style={s.numberText}>{r.number}</text>
            </box>
            <box style={s.name}>
              <text style={i === selected() ? s.labelSelected : s.label}>{r.label}</text>
            </box>
            <text style={s.detail}>{r.detail}</text>
          </box>
        ))}
      </box>
      {/* the scrollbar: a float on the viewport, over the rows and outside the clip's child offset (it does not scroll) */}
      <box id={BAR} style={s.thumb} onPress={() => viewScroll.thumb()} />
      <box id="list-foot" style={s.foot}>
        <text style={s.note}>Wheel, Up/Down, Page, Home/End.</text>
      </box>
    </box>
  );
}
