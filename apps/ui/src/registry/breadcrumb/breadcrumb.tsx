import {
  type Breadcrumb as BreadcrumbController,
  type BreadcrumbItem as BreadcrumbEntry,
  type BreadcrumbOptions,
  createBreadcrumb,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, merge, omit, useContext } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the part, `data-part` and the caller's class merged in. */
export interface BreadcrumbPartProps extends PartProps, Renderable<BreadcrumbPartProps, void> {}

export interface BreadcrumbProps extends Omit<BreadcrumbOptions, "items">, BreadcrumbPartProps {
  readonly items: ReadonlyArray<BreadcrumbEntry>;
  readonly children?: JSX.Element;
}

/** An item of the trail: its place in `items` is what the primitive reads. */
export interface BreadcrumbItemProps extends BreadcrumbPartProps {
  readonly index: number;
  readonly children?: JSX.Element;
}

export type BreadcrumbLinkProps = BreadcrumbItemProps;

const BreadcrumbContext = createContext<{ readonly crumb: BreadcrumbController }>();

const navClass = css.cn(css.fontSize(t.font.size));

const listClass = css.cn(
  css.display("flex"),
  css.flexWrap("wrap"),
  css.alignItems("center"),
  css.gap(t.space._1),
  css.margin("0"),
  css.padding("0"),
  css.listStyle("none"),
);

const itemClass = css.cn(css.display("flex"), css.alignItems("center"), css.gap(t.space._1));

const separatorClass = css.cn(css.color(t.color.muted), css.userSelect("none"));

// The trail is a row of links, the last one the page the reader is on. The current page is marked by the primitive on the
// item and on its link (`aria-current="page"`), so it is painted from that attribute and not from a prop: it is text, not
// something to press, and a disabled trail greys every link it announces as disabled.
const linkClass = css.cn(
  css.color(t.color.link),
  css.textDecoration("none"),
  css.borderRadius(t.radius.sm),
  css.hover(css.textDecoration("underline")),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-current", "page")(css.color(t.color.text), css.fontWeight("500")),
  css.attr("aria-current", "page")(css.hover(css.textDecoration("none"))),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);

/**
 * APG breadcrumb: a trail of links in hierarchical order, the current page last and marked `aria-current="page"` on both the
 * item and its link. `Breadcrumb` is the navigation landmark and the context; `BreadcrumbList`, `BreadcrumbItem` and
 * `BreadcrumbLink` are the trail, and an item draws the slash before every one but the first.
 */
export const Breadcrumb = (props: BreadcrumbProps): JSX.Element => {
  const crumb = createBreadcrumb({
    get items() {
      return props.items;
    },
    get currentIndex() {
      return props.currentIndex;
    },
    get disabled() {
      return props.disabled;
    },
    get label() {
      return props.label;
    },
    get labelledby() {
      return props.labelledby;
    },
    get describedby() {
      return props.describedby;
    },
    get onPress() {
      return props.onPress;
    },
  });
  const rest = omit(
    props,
    "render",
    "class",
    "children",
    "items",
    "currentIndex",
    "disabled",
    "label",
    "labelledby",
    "describedby",
    "onPress",
  );
  const merged = merge(rest, crumb.navProps, () => ({
    "data-part": "breadcrumb",
    class: css.cn(navClass, props.class),
  }));
  return (
    <BreadcrumbContext value={{ crumb }}>
      {renderPart(props, merged, undefined, (part) => (
        <nav {...part}>{props.children}</nav>
      ))}
    </BreadcrumbContext>
  );
};

/** The trail: an ordered list, as the pattern wants it. */
export const BreadcrumbList = (props: BreadcrumbPartProps): JSX.Element => {
  const { crumb } = useContext(BreadcrumbContext);
  return renderPart(
    props,
    merge(crumb.listProps, {
      "data-part": "breadcrumb-list",
      get class() {
        return css.cn(listClass, props.class);
      },
    }),
    undefined,
    (part) => <ol {...part}>{props.children}</ol>,
  );
};

/** One step of the trail: the item's place in it, its current-page mark, and the slash before it. */
export const BreadcrumbItem = (props: BreadcrumbItemProps): JSX.Element => {
  const { crumb } = useContext(BreadcrumbContext);
  return renderPart(
    props,
    merge(crumb.itemProps(props.index), {
      "data-part": "breadcrumb-item",
      get class() {
        return css.cn(itemClass, props.class);
      },
    }),
    undefined,
    (part) => (
      <li {...part}>
        {props.index > 0 ? (
          <span aria-hidden="true" data-part="breadcrumb-separator" class={separatorClass}>
            /
          </span>
        ) : null}
        {props.children}
      </li>
    ),
  );
};

/** The link of a step: its `href`, its `aria-current` and the press the trail reports. */
export const BreadcrumbLink = (props: BreadcrumbLinkProps): JSX.Element => {
  const { crumb } = useContext(BreadcrumbContext);
  return renderPart(
    props,
    merge(crumb.linkProps(props.index), {
      "data-part": "breadcrumb-link",
      get class() {
        return css.cn(linkClass, props.class);
      },
    }),
    undefined,
    (part) => <a {...part}>{props.children}</a>,
  );
};
