import { createVirtualizer, type Virtualizer, type VirtualWindow } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, For, merge, onCleanup, Show, untrack, useContext } from "solid-js";

import { type PartProps, renderPart, type Render, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the scrollport, `data-part` and the caller's class merged in. */
export interface VirtualListPartProps extends PartProps {}

/** The column's props: a `role="list"` whose children are the declared rows and the two spacers. */
export interface VirtualListColumnProps extends VirtualListPartProps {
  readonly role: "list";
  readonly "data-part": string;
  readonly children?: JSX.Element;
}

/** A spacer's props: which end it stands in for, and the height the primitive computed. */
export interface VirtualListSpacerProps extends VirtualListPartProps {
  readonly "data-position": "start" | "end";
  readonly "aria-hidden": "true";
  readonly "data-part": string;
}

/** The window as the part sees it: the declared range, its spacers and the whole content's height. */
export interface VirtualListState {
  readonly window: () => VirtualWindow;
  readonly rangeCount: () => number;
}

export interface VirtualListProps extends Renderable<VirtualListPartProps, VirtualListState> {
  /** The whole list's length: 10 000 rows cost what the screen shows, not 10 000 elements. */
  readonly count: number | (() => number);
  /** Every row's height, px: the primitive's arithmetic window. The skin sets it on the row. */
  readonly itemSize: number;
  /** The scrollport's height, px or a CSS length. @default "24rem" */
  readonly height?: number | string | undefined;
  /** The gap between rows, px, and the column's `row-gap`. @default 0 */
  readonly gap?: number | undefined;
  /** The rows declared either side of the viewport. @default OVERSCAN (2) */
  readonly overscan?: number | undefined;
  /** One row's content: the caller renders the interactive element (its `ref` and `tabindex` are its own). */
  readonly renderItem: (index: number) => JSX.Element;
  /** `render` for the column, which is also the `role="list"`; it gets the rows as `children`. */
  readonly renderColumn?: Render<VirtualListColumnProps, void> | undefined;
  /** `render` for a spacer box; `position` is the end it stands in for. */
  readonly renderSpacer?:
    | ((position: "start" | "end", props: VirtualListSpacerProps) => JSX.Element)
    | undefined;
  readonly class?: string;
  /** The primitive, once: the host's keys call `scrollToIndex` on it, then focus the row it declared. */
  readonly onReady?: (list: Virtualizer) => void;
}

const VirtualListContext = createContext<Virtualizer>();

/**
 * The list's primitive inside a `<VirtualList>`: the host's keys call `scrollToIndex(index)` on it and focus the row
 * once `window()` declares it. Outside a list it is `undefined`.
 */
export const useVirtualList = (): Virtualizer | undefined => useContext(VirtualListContext);

const port = css.cn(
  // The primitive's arithmetic starts at the content's 0, so the scrollport and its column take no padding.
  css.overflow("auto"),
  css.padding("0"),
  css.position("relative"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.fontSize(t.font.size),
  css.color(t.color.text),
);

// One gap-spaced column: the spacers and the rows are its children, and a spacer's height is already the gap short.
const column = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.padding("0"),
  css.margin("0"),
  css.listStyle("none"),
);

const item = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.padding(t.space._1, t.space._3),
  css.boxSizing("border-box"),
  css.overflow("hidden"),
);

const spacerBox = css.cn(css.flexShrink("0"));

const heightOf = (height: number | string): string =>
  typeof height === "number" ? `${height}px` : height;

/**
 * A scrolling list on `createVirtualizer`: the scrollport, the gap-spaced column of rows and the two spacers that stand
 * in for the rows above and below the window, so the scrollbar, the clamp and the content height are the whole list's.
 *
 * **Focus is the item's, and the host owns it.** A row that leaves the window unmounts, so the caller keeps the focus
 * index, calls `scrollToIndex(index)` when its keys move past the window, and focuses its own element only once
 * `window()` declares that index — the list declares the target, the host focuses it. `onReady` (or `useVirtualList()`
 * inside the list) is that accessor; waiting for the declaration is not optional, because a row outside the window has no
 * element to focus yet.
 *
 * Every declared row is a `role="listitem"` with the primitive's `aria-setsize` (the whole count) and `aria-posinset`
 * (index + 1), so a screen reader says "row 4,321 of 10,000" while only a screenful exists. `renderItem` builds only the
 * declared rows: 10 000 rows never build 10 000 elements.
 *
 * A `render` on the scrollport replaces the element; the caller must then call the primitive's `attach` on it (from
 * `onReady` or `useVirtualList()`), or the window never follows the scroll.
 */
export const VirtualList = (props: VirtualListProps): JSX.Element => {
  const list = createVirtualizer({
    count: props.count,
    itemSize: props.itemSize,
    gap: props.gap,
    overscan: props.overscan,
  });
  untrack(() => props.onReady)?.(list);

  let detach: (() => void) | undefined;
  onCleanup(() => detach?.());

  const indexes = (): number[] => {
    const at = list.window();
    return Array.from({ length: Math.max(0, at.last - at.first + 1) }, (_, step) => {
      return at.first + step;
    });
  };

  // A spacer exists only while its height is positive: a zero-height box would still take the column's gap.
  const spacer = (position: "start" | "end"): JSX.Element => {
    const own: VirtualListSpacerProps = {
      "data-part": "virtual-list-spacer",
      "data-position": position,
      "aria-hidden": "true",
      get class() {
        return css.cn(spacerBox);
      },
      get style() {
        return list.spacerProps(position).style;
      },
    };
    return props.renderSpacer === undefined ? <div {...own} /> : props.renderSpacer(position, own);
  };

  const rows = (): JSX.Element => (
    <>
      <Show when={list.window().above > 0}>{spacer("start")}</Show>
      <For each={indexes()}>
        {(index) => (
          <div
            {...list.itemProps(index)}
            role="listitem"
            data-part="virtual-list-item"
            data-index={index}
            class={item}
            style={{ height: `${props.itemSize}px` }}
          >
            {props.renderItem(index)}
          </div>
        )}
      </For>
      <Show when={list.window().below > 0}>{spacer("end")}</Show>
    </>
  );

  // role=list is the column: its children are the two hidden spacers and the declared listitems.
  const body = (): JSX.Element => {
    const own: VirtualListColumnProps = {
      "data-part": "virtual-list-column",
      role: "list",
      get class() {
        return css.cn(column);
      },
      get style() {
        return { "row-gap": `${props.gap ?? 0}px` };
      },
      children: rows(),
    };
    return props.renderColumn === undefined ? <div {...own} /> : props.renderColumn(own, undefined);
  };

  const state: VirtualListState = { window: list.window, rangeCount: list.rangeCount };
  const own = {
    "data-part": "virtual-list",
    get class() {
      return css.cn(port, props.class);
    },
    get style() {
      return { height: heightOf(props.height ?? "24rem") };
    },
  } as PartProps;

  return (
    <VirtualListContext value={list}>
      {renderPart(props, merge(list.scrollProps, own), state, (part) => (
        <div
          {...part}
          ref={(element) => {
            detach = list.attach(element);
          }}
        >
          {body()}
        </div>
      ))}
    </VirtualListContext>
  );
};
