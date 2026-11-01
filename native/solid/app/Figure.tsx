// The Figure page: one glyph-kit spec (solid/src/figure/spec.ts) declared as Clay's boxes and texts, so the numbers are
// geometry — a bar is a track box with a fill box whose width is the value's — and not characters. The same tree runs on
// the desktop (pixels), the terminal (cells) and the browser (a canvas): the layout speaks cells, and this page multiplies
// a cell by eight across and sixteen down, which is the rectangle terminal/cells.h gives a cell, so the three targets draw
// the same shape.
//
// The page is static: no state, no input, no entry. A width is data, and a style is a literal (the tokens are evaluated
// when a `.styles.ts` module loads), so every item's width goes through the value channel in `tick`, the frame's own hook,
// before the tree is declared — as the List's spacers and the terminal's re-cut do. A page at rest writes the same values
// every frame, so its hash does not move and it draws nothing after its first frame.
import { For } from "solid-js";

import type { Motion } from "../src/entry.ts";
import { layout, sizeOf, type Item, type Layout, type Paint } from "../src/figure/kinds.ts";
import type { Spec } from "../src/figure/spec.ts";
import { FIELDS } from "../src/pack.ts";
import { ui } from "../src/ffi.ts";
import * as s from "./Figure.styles.ts";

const ids = new Map<string, Uint8Array>();
const idBytes = (id: string) => ids.get(id) ?? (ids.set(id, new TextEncoder().encode(id)), ids.get(id)!);
const put = (id: string, field: number, value: number) => ui.value(idBytes(id), field, value);
/** A FIXED axis through the value channel: the type, then the min and the max (pack.ts's `axis`). */
const fixedWidth = (id: string, px: number) => {
  put(id, FIELDS.WIDTH, 3);
  put(id, FIELDS.WIDTH + 1, px);
  put(id, FIELDS.WIDTH + 2, px);
};

/** Every item's width, and a bar's fill, written for the frame about to be declared (the channel is a frame's). */
function apply(l: Layout, motion: Motion | undefined): void {
  if (!motion) return;
  motion.tick = () => {
    for (const line of l.lines)
      for (const item of line.items) {
        fixedWidth(item.id, item.cells * 8);
        if (item.kind === "bar") fixedWidth(item.fillId, item.fill * 8);
      }
  };
}

const styleOf = (paint: Paint) => s.s.text[paint];

function ItemView(props: { item: Item }) {
  const it = props.item;
  if (it.kind === "bar")
    return (
      <box id={it.id} style={s.s.track}>
        <box
          id={it.fillId}
          style={s.s.fill[it.paint === "problem" ? "problem" : it.paint === "good" ? "good" : "plain"]}
        />
      </box>
    );
  return (
    <box id={it.id} style={it.kind === "box" ? s.s.box : s.s.cell}>
      {it.kind !== "space" && (
        <text id={it.textId} style={styleOf(it.paint)}>
          {it.text}
        </text>
      )}
    </box>
  );
}

/** The page's size in pixels, from the spec: what `ui.init` gets and what a browser canvas takes. */
export function size(spec: Spec): { width: number; height: number } {
  return sizeOf(spec);
}

/** The page: the title, the rows (a label, a bar or boxes, the number as text), the source and the focus line. */
export function Figure(props: { spec: Spec; motion?: Motion }) {
  const l = layout(props.spec);
  apply(l, props.motion);
  return (
    <box id="Root" style={s.s.root}>
      <For each={l.lines}>
        {(line) => (
          <box style={s.s.line}>
            <For each={line.items}>{(item) => <ItemView item={item} />}</For>
          </box>
        )}
      </For>
    </box>
  );
}
