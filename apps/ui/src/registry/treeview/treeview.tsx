import {
  createTreeview,
  type Treeview as TreeviewController,
  type TreeviewNode,
  type TreeviewOptions,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, For, merge, untrack } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** The tree's state, as accessors: the roving node, and whether focus is inside the tree. */
export interface TreeviewState {
  readonly focus: () => number;
  readonly hasFocus: () => boolean;
}

/** What `render` gets: the props of the tree, `data-part` and the caller's class merged in. */
export type TreeviewPartProps = PartProps;

export interface TreeviewProps
  extends Omit<TreeviewOptions, "nodes" | "label">, Renderable<TreeviewPartProps, TreeviewState> {
  /** The nodes, in document order: `parent` is 0 for a root. */
  readonly nodes: ReadonlyArray<TreeviewNode>;
  /** The tree's name: a `role="tree"` needs one. */
  readonly label: string;
  readonly class?: string;
  /** The primitive, once: a page that moves the selection itself. */
  readonly onReady?: (tree: TreeviewController) => void;
}

// A tree is a list of rows. The primitive owns the roving tabindex, the expanded and selected flags and the ARIA that says
// where a row sits; the kit paints from those attributes and indents from `aria-level`. A flat list with `aria-level` is the
// pattern's other shape, and it is the one the primitive's per-node attributes describe.
const tree = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.gap("1px"),
  css.margin("0"),
  css.padding(t.space._1),
  css.listStyle("none"),
  css.borderRadius(t.radius.lg),
  css.bg(t.color.surface),
  css.fontSize(t.font.size),
  css.color(t.color.text),
);

const item = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._1),
  css.padding(t.space._1, t.space._2),
  css.borderRadius(t.radius.sm),
  css.cursor("pointer"),
  css.userSelect("none"),
  css.outline("none"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  css.attr("aria-selected", "true")(css.bg(t.color.buttonBackground)),
  css.attr("aria-level", "2")(css.paddingInlineStart(t.space._5)),
  css.attr("aria-level", "3")(css.paddingInlineStart(t.space._7)),
);

const chevron = css.cn(
  css.display("inline-block"),
  css.width("1em"),
  css.color(t.color.muted),
  css.fontSize(t.font.sizeSm),
  css.transition("transform 120ms"),
  css.within(css.attr("aria-expanded", "true"))(css.transform("rotate(90deg)")),
);

/**
 * APG tree view: a `role="tree"` of rows whose levels, sizes and positions are the primitive's `aria-*`. Arrows, Home, End,
 * type-ahead and the roving tabindex are `createTreeview`'s; the kit syncs the DOM focus to the node it moved to, paints the
 * selected row, and turns the chevron with `aria-expanded`. A row deeper than the third level keeps the third level's indent.
 */
export const Treeview = (props: TreeviewProps): JSX.Element => {
  const treeControl = createTreeview({
    nodes: props.nodes,
    get multiSelectable() {
      return props.multiSelectable;
    },
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    defaultExpanded: props.defaultExpanded,
    defaultSelected: props.defaultSelected,
    defaultFocus: props.defaultFocus,
    label: props.label,
    orientation: props.orientation,
    onExpandedChange: props.onExpandedChange,
    onSelectionChange: props.onSelectionChange,
    onValueChange: props.onValueChange,
    onActivate: props.onActivate,
  });
  untrack(() => props.onReady)?.(treeControl);

  let element: HTMLUListElement | undefined;
  // The primitive keeps the roving tabindex; real DOM focus is the host's to move to that row when focus is inside.
  createEffect(
    () => `${treeControl.hasFocus()}|${treeControl.focus()}`,
    () => {
      if (!treeControl.hasFocus()) {
        return;
      }
      const roving = element?.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]');
      if (roving !== null && roving !== undefined && document.activeElement !== roving) {
        roving.focus();
      }
    },
  );

  const own = {
    "data-part": "treeview",
    get class() {
      return css.cn(tree, props.class);
    },
  } as PartProps;
  const state: TreeviewState = { focus: treeControl.focus, hasFocus: treeControl.hasFocus };
  return renderPart(props, merge(treeControl.treeProps, own), state, (part) => (
    <ul
      {...part}
      ref={(node) => {
        element = node;
      }}
    >
      <For each={treeControl.nodeIds()}>
        {(id) => (
          <li {...treeControl.itemProps(id)} data-part="treeview-item" class={item}>
            <span aria-hidden="true" class={chevron}>
              {treeControl.isParent(id) ? "▸" : ""}
            </span>
            <span>{props.nodes.find((node) => node.id === id)?.label}</span>
          </li>
        )}
      </For>
    </ul>
  ));
};
