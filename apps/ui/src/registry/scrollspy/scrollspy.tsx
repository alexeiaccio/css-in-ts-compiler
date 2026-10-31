import { createScrollspy } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createMemo, For, onSettled, untrack } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

/** One heading of the page: its `id`, the link's text, and how deep it sits. */
export interface ScrollspyEntry {
  /** The heading's `id`, which the link targets. */
  readonly id: string;
  /** The link's text. */
  readonly text: string;
  /** The heading's rank, 1 for the outermost; each step indents the link once. @default 1 */
  readonly level?: number | undefined;
}

export interface ScrollspyProps {
  /**
   * The table of contents, in document order. The headings carry these ids. The list is read again on every scroll, so
   * entries may grow; the id used before any heading reaches the line is the first entry at mount.
   */
  readonly entries: ReadonlyArray<ScrollspyEntry>;
  /**
   * The scroll container the primitive watches; the document by default. Read once, when the component settles, so a
   * swapped container needs a new `Scrollspy` (the primitive's `root` is read once too).
   */
  readonly root?: (() => HTMLElement | undefined) | undefined;
  /**
   * How far below the scrollport's top edge a heading counts as current, in px: a sticky header's height inside that
   * container. @default 0
   */
  readonly offset?: number | undefined;
  /** The navigation landmark's accessible name. @default "Table of contents" */
  readonly label?: string | undefined;
  /** The current id changed. */
  readonly onChange?: ((id: string | undefined) => void) | undefined;
  readonly class?: string | undefined;
}

const navClass = css.cn(css.fontSize(t.font.size), css.color(t.color.text));

// The rule the current link sits on: the list draws it, and the link's own border covers it in the accent, so the marker
// is a 1px inset that does not move the text when the current entry changes.
const listClass = css.cn(
  css.margin("0"),
  css.padding("0"),
  css.listStyle("none"),
  css.borderInlineStart("1px solid", t.color.border),
);

const linkClass = css.cn(
  css.display("block"),
  css.marginInlineStart("-1px"),
  css.paddingBlock(t.space._1),
  css.paddingInlineEnd(t.space._3),
  css.borderInlineStart("1px solid", "transparent"),
  css.color(t.color.muted),
  css.lineHeight(1.4),
  css.textDecoration("none"),
  // the state is the primitive's attribute, not a prop: the link the reader is at is the one it marked
  css.attr("aria-current", "location")(
    css.color(t.color.text),
    css.fontWeight("500"),
    css.borderInlineStartColor(t.color.highlight),
  ),
  css.hover(css.color(t.color.text)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);

/** The entries' levels as an indent: a step is one `space-3`, and the outermost heading keeps it too. */
const indent = (level: number | undefined): JSX.CSSProperties => ({
  "padding-inline-start": `calc(var(--space-3) * ${Math.max(1, level ?? 1)})`,
});

/**
 * A table of contents over `createScrollspy`: a named navigation landmark, one link per entry and the current one marked
 * `aria-current="location"`. The primitive owns the observation (one passive scroll listener on `root()`, the document by
 * default), the "last heading at or above the offset" rule and the one-current-link invariant; the skin owns the list, the
 * indent from each entry's level, and the left rule painted from `aria-current` in the theme's tokens.
 *
 * The links are plain `#id` targets, so the scrollport moves itself and smooth scrolling is the page's (`scroll-behavior`).
 * A heading below the list's first is not current until its top passes the container's offset line; before any scroll, the
 * first entry is.
 */
export const Scrollspy = (props: ScrollspyProps): JSX.Element => {
  // a new array per change of the caller's list, so the primitive's scroll listener reads the current entries
  const entries = createMemo(() =>
    props.entries.map((entry) => ({ id: entry.id, label: entry.text })),
  );
  const spy = createScrollspy({
    // untracked: the primitive reads the entries once at construction and again on every scroll, outside any computation
    get entries() {
      return untrack(entries);
    },
    get offset() {
      return props.offset;
    },
    get root() {
      return props.root;
    },
    get onChange() {
      return props.onChange;
    },
  });
  // `attach` wires the one listener and returns its teardown, which Solid runs on cleanup
  onSettled(() => spy.attach());

  return (
    <nav
      {...spy.navProps}
      aria-label={props.label ?? "Table of contents"}
      data-part="scrollspy"
      class={css.cn(navClass, props.class)}
    >
      <ul {...spy.listProps} data-part="scrollspy-list" class={listClass}>
        <For each={props.entries}>
          {(entry) => (
            <li {...spy.itemProps(entry.id)}>
              <a
                {...spy.linkProps(entry.id)}
                data-part="scrollspy-link"
                class={linkClass}
                style={indent(entry.level)}
              >
                {entry.text}
              </a>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
};
