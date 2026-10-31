import {
  createPagination,
  type Pagination as PaginationController,
  type PaginationItem as PaginationEntry,
  type PaginationOptions,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, For, merge, untrack, useContext } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the part, `data-part` and the caller's class merged in. */
export interface PaginationPartProps extends PartProps, Renderable<PaginationPartProps, void> {}

/** A part that carries nothing of its own: the list, a gap, the status text. */
export interface PaginationSectionProps extends PaginationPartProps {}

export interface PaginationProps extends PaginationOptions, Renderable<PaginationPartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
  /** The primitive, once: a page that reads the page list itself. */
  readonly onReady?: (pagination: PaginationController) => void;
}

/** One entry of the list: the page it shows; a gap is `PaginationEllipsis`. */
export interface PaginationItemProps extends Renderable<PaginationPartProps, void> {
  readonly page: number;
  readonly class?: string;
  readonly children?: JSX.Element;
}

/** A page control: `PaginationLink` for a page, the two arrow names for the ends. */
export interface PaginationLinkProps extends Renderable<PaginationPartProps, void> {
  readonly page: number;
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface PaginationEndProps extends Renderable<PaginationPartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

const PaginationContext = createContext<{ readonly pagination: PaginationController }>();

const nav = css.cn(
  css.display("flex"),
  css.flexWrap("wrap"),
  css.alignItems("center"),
  css.gap(t.space._3),
);

const list = css.cn(
  css.display("flex"),
  css.flexWrap("wrap"),
  css.alignItems("center"),
  css.gap(t.space._1),
  css.margin("0"),
  css.padding("0"),
  css.listStyle("none"),
);

const box = css.cn(css.display("flex"));

// A target is 24 CSS px square at AA (WCAG 2.2, 2.5.8): the box, not the text, is what a pointer has to hit. The current
// page is painted from its `aria-current`, so the skin keeps no copy of it, and an end that is out of range is painted
// disabled while staying in place and in the tab order, as the primitive asks.
const control = css.cn(
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.boxSizing("border-box"),
  css.minWidth(t.space._6),
  css.minHeight(t.space._6),
  css.padding(t.space._1, t.space._2),
  css.border("1px solid", "transparent"),
  css.borderRadius(t.radius.sm),
  css.bg("transparent"),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.textDecoration("none"),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-current", "page")(
    css.bg(t.color.highlight),
    css.color(t.color.onHighlight),
    css.fontWeight("500"),
  ),
  css.attr("aria-current", "page")(css.hover(css.bg(t.color.highlight))),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);

const ellipsis = css.cn(
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.minWidth(t.space._6),
  css.color(t.color.muted),
  css.userSelect("none"),
);

const status = css.cn(css.margin("0"), css.fontSize(t.font.sizeSm), css.color(t.color.muted));

/**
 * Pagination: `createPagination` owns the page list, the elided runs, the ends and the announced count; this skin paints
 * the current page from `aria-current` and gives every target its 24 px square.
 *
 * `Pagination` is the nav landmark; `PaginationContent` is the list and, without children, its ordinary composition —
 * previous, the pages and their elided runs, next. The parts are exported for a caller that wants another order; a gap is
 * `PaginationEllipsis`, never a control.
 *
 * A page control is an `<a>` when `hrefFor` gives it an address (so it works without JS) and a `<button>` otherwise.
 */
export const Pagination = (props: PaginationProps): JSX.Element => {
  const pagination = createPagination({
    get page() {
      return props.page;
    },
    get pageCount() {
      return props.pageCount;
    },
    get siblings() {
      return props.siblings;
    },
    get boundaries() {
      return props.boundaries;
    },
    get hrefFor() {
      return props.hrefFor;
    },
    get disabled() {
      return props.disabled;
    },
    get labels() {
      return props.labels;
    },
    get onPageChange() {
      return props.onPageChange;
    },
  });
  untrack(() => props.onReady)?.(pagination);
  const merged = merge(pagination.navProps, () => ({
    "data-part": "pagination",
    get class() {
      return css.cn(nav, props.class);
    },
  }));
  return (
    <PaginationContext value={{ pagination }}>
      {renderPart(props, merged, undefined, (part) => (
        <nav {...part}>{props.children}</nav>
      ))}
    </PaginationContext>
  );
};

/** The list: a `role="list"`, and without children the pages, their gaps and the two ends in order. */
export const PaginationContent = (props: PaginationSectionProps): JSX.Element => {
  const { pagination } = useContext(PaginationContext);
  return renderPart(
    props,
    merge(pagination.listProps, {
      "data-part": "pagination-list",
      get class() {
        return css.cn(list, props.class);
      },
    }),
    undefined,
    (part) => (
      <ul {...part}>
        {props.children ?? (
          <>
            <li class={box}>
              <PaginationPrevious />
            </li>
            <For each={pagination.items()}>
              {(item: PaginationEntry) =>
                item.kind === "gap" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationItem page={item.page}>
                    <PaginationLink page={item.page} />
                  </PaginationItem>
                )
              }
            </For>
            <li class={box}>
              <PaginationNext />
            </li>
          </>
        )}
      </ul>
    ),
  );
};

/** One page of the list: the current-page mark comes from the primitive, on the item and on its control. */
export const PaginationItem = (props: PaginationItemProps): JSX.Element => {
  const { pagination } = useContext(PaginationContext);
  return renderPart(
    props,
    merge(pagination.itemProps(props.page), {
      "data-part": "pagination-item",
      get class() {
        return css.cn(box, props.class);
      },
    }),
    undefined,
    (part) => <li {...part}>{props.children}</li>,
  );
};

/** The element a control is: the caller's `render`, else an anchor when it has an address and a button when it does not. */
const renderControl = (
  props: Renderable<PaginationPartProps, void>,
  merged: PartProps,
  href: string | undefined,
  children: JSX.Element,
): JSX.Element =>
  renderPart(props, merged, undefined, (part) =>
    href === undefined ? (
      <button {...part} type="button">
        {children}
      </button>
    ) : (
      <a {...part}>{children}</a>
    ),
  );

/**
 * A page's control: an anchor when the primitive gives it an `href`, a button otherwise, so a keyboard reaches it either
 * way. The label is the one the primitive announces.
 */
export const PaginationLink = (props: PaginationLinkProps): JSX.Element => {
  const { pagination } = useContext(PaginationContext);
  const link = pagination.linkProps(props.page);
  return renderControl(
    props,
    merge(link, {
      "data-part": "pagination-link",
      get class() {
        return css.cn(control, props.class);
      },
    }),
    link.href,
    props.children ?? props.page,
  );
};

/** The previous page: kept in place at the first page and painted disabled there. */
export const PaginationPrevious = (props: PaginationEndProps): JSX.Element => {
  const { pagination } = useContext(PaginationContext);
  return renderControl(
    props,
    merge(() => pagination.previousProps, {
      "data-part": "pagination-previous",
      get class() {
        return css.cn(control, props.class);
      },
    }),
    pagination.previousProps.href,
    props.children ?? "Previous",
  );
};

/** The next page: kept in place at the last page and painted disabled there. */
export const PaginationNext = (props: PaginationEndProps): JSX.Element => {
  const { pagination } = useContext(PaginationContext);
  return renderControl(
    props,
    merge(() => pagination.nextProps, {
      "data-part": "pagination-next",
      get class() {
        return css.cn(control, props.class);
      },
    }),
    pagination.nextProps.href,
    props.children ?? "Next",
  );
};

/** A run of pages the list elides: text, not a control, and hidden from a screen reader that hears the count. */
export const PaginationEllipsis = (props: PaginationPartProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "pagination-gap",
      get class() {
        return css.cn(box, ellipsis, props.class);
      },
    },
    undefined,
    (part) => (
      <li {...part}>
        <span aria-hidden="true">…</span>
      </li>
    ),
  );

/** The count, announced once here rather than in every control. */
export const PaginationStatus = (props: PaginationSectionProps): JSX.Element => {
  const { pagination } = useContext(PaginationContext);
  return renderPart(
    props,
    merge(pagination.statusProps, {
      "data-part": "pagination-status",
      get class() {
        return css.cn(status, props.class);
      },
    }),
    undefined,
    (part) => <p {...part}>{props.children ?? pagination.status()}</p>,
  );
};
