import { createRearrangeableListbox, type RearrangeableListbox } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import {
  createEffect,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  Show,
  untrack,
} from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

/** One row of the list: its words, and the line under them. */
export interface ReorderItem {
  /** The label, which is also the row's name for a reader. */
  readonly label: string;
  /** A second line: what the row is, beside what it is called. */
  readonly description?: string | undefined;
}

export interface ReorderProps {
  /**
   * The rows, in the order they start in. Read once, when the primitive is created: the option id is the index here, so
   * an item's identity survives every move. A page that replaces the set makes a new `<Reorder>`.
   */
  readonly items: ReadonlyArray<ReorderItem>;
  /** The list's accessible name. @default "Reorderable list" */
  readonly label?: string | undefined;
  /** The rows in their new order, after the reader moved one. */
  readonly onReorder?: ((items: ReadonlyArray<ReorderItem>) => void) | undefined;
  /** The primitive, once: a page that drives the order itself. */
  readonly onReady?: ((listbox: RearrangeableListbox) => void) | undefined;
  /** The line under the list; left out, the drag and the keys in one sentence. */
  readonly hint?: string | undefined;
  readonly class?: string | undefined;
}

const DEFAULT_LABEL = "Reorderable list";
const DEFAULT_HINT =
  "Drag a row by its handle, or focus the list and press Alt+↑ or Alt+↓ to move the focused row.";

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2));

// The list is its own frame: the surface, the border and the radius are the kit's, and the dark mode moves the tokens
// underneath. It is the tab stop, so the focus ring is the list's and not a row's.
const listClass = css.cn(
  css.display("grid"),
  css.margin("0"),
  css.padding("0"),
  css.listStyle("none"),
  css.overflow("hidden"),
  css.boxSizing("border-box"),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.xl),
  css.fontSize(t.font.size),
  css.userSelect("none"),
  css.outline("none"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

// A row is the whole option: the handle, the two lines of text and the position number. The selected look is the
// primitive's `aria-selected`, which in a single-select listbox follows the focus; the dragged row is lifted.
const rowClass = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("auto minmax(0, 1fr) auto"),
  css.alignItems("center"),
  css.gap(t.space._3),
  css.minHeight(t.space._9),
  css.padding(t.space._2, t.space._3),
  css.boxSizing("border-box"),
  css.position("relative"),
  css.bg(t.color.surface),
  css.borderBottom("1px solid", t.color.border),
  css.outline("none"),
  css.lastChild(css.borderBottom("none")),
  css.hover(css.bg(t.color.buttonBackground)),
  css.attr("aria-selected", "true")(
    css.bg(t.color.buttonBackgroundPressed),
    css.hover(css.bg(t.color.buttonBackgroundPressed)),
  ),
  css.attr("data-dragging", "true")(
    css.bg(t.color.surface),
    css.borderColor(t.color.borderHover),
    css.boxShadow(t.shadow.popover),
    css.transform("translateY(-1px)"),
    css.zIndex("1"),
    css.hover(css.bg(t.color.surface)),
  ),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("background-color 120ms ease-out, transform 120ms ease-out"),
  ),
);

const handleClass = css.cn(
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.width(t.space._6),
  css.height(t.space._8),
  css.flexShrink("0"),
  css.borderRadius(t.radius.sm),
  css.color(t.color.muted),
  css.cursor("move"),
  css.touchAction("none"),
  css.hover(css.bg(t.color.buttonBackground), css.color(t.color.text)),
);

const glyphClass = css.cn(css.fill("currentColor"));

const textClass = css.cn(css.display("grid"), css.gap("2px"), css.minWidth("0"));

const labelClass = css.cn(
  css.overflow("hidden"),
  css.whiteSpace("nowrap"),
  css.textOverflow("ellipsis"),
);

const descriptionClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.overflow("hidden"),
  css.whiteSpace("nowrap"),
  css.textOverflow("ellipsis"),
);

const positionClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.fontVariantNumeric("tabular-nums"),
);

const statusClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.text),
);

const hintClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

/**
 * A reorderable list, styled: `createRearrangeableListbox` owns the option set and its order, the listbox's
 * `role` / `tabindex` / `aria-activedescendant`, each option's `role` and `aria-selected`, the focus of the list, the
 * arrows, Home and End, and Alt+↑ / Alt+↓ (the primitive's own reorder keys). The skin owns the frame (surface, border,
 * radius and the tokens in light and dark), the handle and its pointer drag, the position numbers, the selected, hover
 * and dragged looks, the focus ring, the reduced-motion rules, the polite status line that says where a row landed,
 * and `onReorder`.
 *
 * The primitive models two lists that share one option set; this starter renders the first one only, so the transfer
 * keys (Enter and Delete) have nowhere to go and are ignored. A page that needs the second list renders
 * `listProps("b")` beside it; a page that only reorders does not.
 */
export const Reorder = (props: ReorderProps): JSX.Element => {
  const labels = props.items.map((item) => item.label);
  const count = labels.length;
  const hintId = createUniqueId();

  const listbox = createRearrangeableListbox({
    items: labels,
    labels: { a: props.label ?? DEFAULT_LABEL, b: "" },
  });
  untrack(() => props.onReady)?.(listbox);

  /** The row's data; the option id is the item's index in the list the page passed. */
  const itemAt = (id: number): ReorderItem => props.items[id] ?? { label: String(id + 1) };

  const order = (): ReadonlyArray<number> => listbox.order("a");

  const [announced, setAnnounced] = createSignal(
    `Order: ${untrack(order)
      .map((id) => itemAt(id).label)
      .join(", ")}.`,
  );
  // The order is the list's identity: a move changes it, and the status line and `onReorder` follow from it. The first
  // run is the order the list mounted with, so it neither announces a move nor calls `onReorder`.
  let last: string | undefined;
  createEffect(
    () => order().join(","),
    (key) => {
      if (last === undefined) {
        last = key;
        return;
      }
      if (last === key) {
        return;
      }
      last = key;
      const ids = untrack(order);
      const active = untrack(() => listbox.active("a"));
      if (active !== null) {
        const position = ids.indexOf(active);
        if (position >= 0) {
          setAnnounced(
            `Moved ${itemAt(active).label} to position ${position + 1} of ${ids.length}.`,
          );
        }
      }
      untrack(() => props.onReorder)?.(ids.map(itemAt));
    },
  );

  let list: HTMLDivElement | undefined;

  /** The primitive says where the order is; the rows are the DOM, and the move is one step at a time. */
  const moveTo = (id: number, target: number): void => {
    let from = order().indexOf(id);
    const to = order().indexOf(target);
    while (from >= 0 && to >= 0 && from !== to) {
      listbox.move(from > to ? "up" : "down");
      const next = order().indexOf(id);
      if (next === from) {
        return;
      }
      from = next;
    }
  };

  const [dragging, setDragging] = createSignal<number | null>(null);

  const endDrag = (): void => {
    setDragging(null);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  };

  onCleanup(endDrag);

  /** The handle is the pointer's way in: it makes the row the primitive's active option, then drags it. */
  const startDrag =
    (id: number) =>
    (event: PointerEvent): void => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      // a drag is an interaction with the list, so the list keeps the focus and the active row follows the row
      list?.focus();
      listbox.optionProps(id).onClick();
      setDragging(id);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    };

  /** The row under the pointer is the target: the dragged row steps to it. */
  const overRow = (event: PointerEvent): void => {
    const id = dragging();
    if (id === null) {
      return;
    }
    const over = Number((event.currentTarget as HTMLElement).dataset["id"]);
    if (Number.isNaN(over) || over === id) {
      return;
    }
    moveTo(id, over);
  };

  // The primitive's Enter and Delete transfer the focused option to the second list. This starter renders one list, so
  // there is nowhere to transfer to, and the order is what a reader is changing.
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter" || event.key === "Delete") {
      event.preventDefault();
      return;
    }
    listbox.listProps("a").onKeyDown(event);
  };

  return (
    <div data-part="reorder-root" class={css.cn(rootClass, props.class)}>
      <div
        {...listbox.listProps("a")}
        data-part="reorder-list"
        aria-describedby={hintId}
        class={listClass}
        ref={(node: HTMLDivElement) => {
          list = node;
        }}
        onKeyDown={onKeyDown}
      >
        <For each={order()}>
          {(id, index) => (
            <div
              {...listbox.optionProps(id)}
              data-part="reorder-row"
              data-id={id}
              data-dragging={dragging() === id ? "true" : "false"}
              aria-posinset={index() + 1}
              aria-setsize={count}
              class={rowClass}
              onPointerMove={overRow}
            >
              <span
                data-part="reorder-handle"
                aria-hidden="true"
                class={handleClass}
                onPointerDown={startDrag(id)}
              >
                <svg viewBox="0 0 10 16" width="10" height="16" class={glyphClass}>
                  <For each={[3, 8, 13]}>
                    {(y) => (
                      <>
                        <circle cx="3" cy={y} r="1.3" />
                        <circle cx="7" cy={y} r="1.3" />
                      </>
                    )}
                  </For>
                </svg>
              </span>
              <span data-part="reorder-text" class={textClass}>
                <span data-part="reorder-label" class={labelClass}>
                  {itemAt(id).label}
                </span>
                <Show when={itemAt(id).description}>
                  {(description) => (
                    <span data-part="reorder-description" class={descriptionClass}>
                      {description()}
                    </span>
                  )}
                </Show>
              </span>
              <span data-part="reorder-position" aria-hidden="true" class={positionClass}>
                {index() + 1}
              </span>
            </div>
          )}
        </For>
      </div>
      <p data-part="reorder-status" role="status" aria-live="polite" class={statusClass}>
        {announced()}
      </p>
      <p id={hintId} data-part="reorder-hint" class={hintClass}>
        {props.hint ?? DEFAULT_HINT}
      </p>
    </div>
  );
};
