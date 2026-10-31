import { createDrawer, type Drawer as DrawerController, type DrawerSide } from "@cssints/headless";
import { Portal } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, createUniqueId, merge, omit, useContext } from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface DrawerProps {
  /** Controlled: the host owns the open state and this is the only thing that changes it. */
  readonly open?: boolean;
  /** Open at mount; ignored while `open` is set. */
  readonly defaultOpen?: boolean;
  /** A request to change the open state: uncontrolled it is accepted, controlled the host may ignore it. */
  readonly onOpenChange?: (open: boolean) => void;
  /** The edge the panel is anchored to: a side rail, or the bottom sheet. @default "right" */
  readonly side?: DrawerSide;
  /** `aria-modal`, the Tab trap, the scroll lock and the backdrop (default `true`). */
  readonly modal?: boolean;
  /** A backdrop click or an outside press closes it (default `true`). */
  readonly dismissable?: boolean;
  readonly id?: string;
  /** The element the layer is portalled into (default `document.body`), for a host with its own overlay root. */
  readonly mount?: Element;
  readonly children?: JSX.Element;
}

export interface DrawerTriggerProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerContentProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerHeaderProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerTitleProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerBodyProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerFooterProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerCloseProps {
  /** The accessible name of the icon button (default `"Close"`). */
  readonly label?: string;
  readonly class?: string;
  readonly children?: JSX.Element;
}

const DrawerContext = createContext<{
  readonly drawer: DrawerController;
  /** The title's id: the primitive puts it on `aria-labelledby`, so the panel is named by its heading. */
  readonly titleId: string;
  readonly mount: () => Element | undefined;
}>();

// One positioned layer for the backdrop and the panel, out of the page's flow and over everything but a toast. It never takes
// the page's pointer itself: the panel turns that back on, and so does the backdrop when the drawer is modal.
const layerClass = css.cn(
  css.position("fixed"),
  css.inset("0"),
  // `z-index` takes an `<integer>`, which a `number` token is not: the class reads the token by hand, as the dialog's layer
  css.zIndex("var(--z-dialog)"),
  css.pointerEvents("none"),
);

const backdropClass = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.bg(t.color.scrim),
  css.pointerEvents("auto"),
);

// The panel is edge-anchored: a rail on the left or the right, or a sheet across the bottom. It stays in the DOM while closed
// and hides with `visibility` rather than the `hidden` attribute, so the slide can play both ways and the primitive can move
// the focus into it before the first open frame (a `display: none` panel cannot take the focus).
const panel = css.cv({
  base: css.cn(
    css.position("absolute"),
    css.display("flex"),
    css.flexDirection("column"),
    css.margin("0"),
    css.overflow("hidden"),
    css.pointerEvents("auto"),
    css.color(t.color.text),
    css.boxShadow(t.shadow.popover),
    // the panel takes the focus itself (`tabindex="-1"`) when it holds nothing focusable: a ring around the whole panel is noise
    css.outline("none"),
  ),
  variants: {
    side: {
      left: css.cn(
        css.top("0"),
        css.bottom("0"),
        css.left("0"),
        css.width("min(22rem, 100vw)"),
        css.maxWidth("100%"),
        css.bg(t.color.overlayBackground),
        css.borderInlineEnd("1px solid", t.color.overlayBorder),
      ),
      right: css.cn(
        css.top("0"),
        css.bottom("0"),
        css.right("0"),
        css.width("min(22rem, 100vw)"),
        css.maxWidth("100%"),
        css.bg(t.color.overlayBackground),
        css.borderInlineStart("1px solid", t.color.overlayBorder),
      ),
      // the sheet: full width, its top corners rounded and its own surface token, and a height the body scrolls inside
      bottom: css.cn(
        css.left("0"),
        css.right("0"),
        css.bottom("0"),
        css.width("100%"),
        css.maxHeight("85dvh"),
        css.bg(t.color.sheetBackground),
        css.borderTop("1px solid", t.color.overlayBorder),
        css.borderStartStartRadius(t.radius.xl),
        css.borderStartEndRadius(t.radius.xl),
      ),
    },
  },
  defaultVariants: { side: "right" },
});

// The slide reads one state off `data-state` (`right-open`, `bottom-closed`, ...), so exactly one rule matches and no two
// declarations of the same property compete: closed it is off screen and invisible, open it is in place. With reduced motion
// there is no transition, so `visibility` flips at once instead of waiting for a slide that does not happen.
const panelMotion = css.cn(
  css.visibility("hidden"),
  css.attr("data-state", "left-closed")(css.transform("translateX(-100%)")),
  css.attr("data-state", "right-closed")(css.transform("translateX(100%)")),
  css.attr("data-state", "bottom-closed")(css.transform("translateY(100%)")),
  css.attr("data-state", "left-open")(css.visibility("visible"), css.transform("none")),
  css.attr("data-state", "right-open")(css.visibility("visible"), css.transform("none")),
  css.attr("data-state", "bottom-open")(css.visibility("visible"), css.transform("none")),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.cn(
      css.transition("transform 200ms ease-out, visibility 0s"),
      css.attr(
        "data-state",
        "left-closed",
      )(css.transition("transform 200ms ease-out, visibility 0s linear 200ms")),
      css.attr(
        "data-state",
        "right-closed",
      )(css.transition("transform 200ms ease-out, visibility 0s linear 200ms")),
      css.attr(
        "data-state",
        "bottom-closed",
      )(css.transition("transform 200ms ease-out, visibility 0s linear 200ms")),
    ),
  ),
);

const headerClass = css.cn(
  css.display("flex"),
  css.alignItems("start"),
  css.justifyContent("space-between"),
  css.gap(t.space._3),
  css.padding(t.space._4),
  css.borderBottom("1px solid", t.color.overlayBorder),
  css.flex("none"),
);

const titleClass = css.cn(
  css.margin("0"),
  css.fontSize(t.font.sizeLg),
  css.fontWeight("600"),
  css.color(t.color.text),
);

const closeClass = css.cn(
  css.appearance("none"),
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.width(t.space._6),
  css.height(t.space._6),
  css.margin("0"),
  css.padding("0"),
  css.border("none"),
  css.borderRadius(t.radius.sm),
  css.bg("transparent"),
  css.color(t.color.muted),
  css.fontSize(t.font.sizeLg),
  css.lineHeight(1),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackground), css.color(t.color.text)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const bodyClass = css.cn(
  css.flex("1 1 auto"),
  css.overflowY("auto"),
  css.overscrollBehavior("contain"),
  css.padding(t.space._4),
  css.fontSize(t.font.size),
  css.color(t.color.text),
);

const footerClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("end"),
  css.gap(t.space._2),
  css.padding(t.space._4),
  css.borderTop("1px solid", t.color.overlayBorder),
  css.flex("none"),
);

/**
 * A drawer or bottom sheet, styled: `Drawer.Trigger` opens a panel on the edge of the viewport. `createDrawer` owns the open
 * state (controlled by `open`), the ARIA, the focus into the panel and back to whatever opened it, the Tab cycle, Escape, the
 * backdrop, the outside press and the page's scroll lock; the kit adds the three edges, the slide, the surface and the slots.
 *
 * The panel is named by `DrawerTitle` (`aria-labelledby`) and closes from a `DrawerClose` in its header, the backdrop, Escape
 * or the trigger. `side` and `modal` are the whole presentation switch: `{ side: "bottom" }` is the sheet, a rail is
 * `{ side: "right" }`, and a non-modal rail (`modal={false}`) keeps the page's scroll, focus and clicks.
 */
export const Drawer = (props: DrawerProps): JSX.Element => {
  // the heading names the panel: the id is made here, because `createDrawer` needs it at creation time
  const titleId = createUniqueId();
  const drawer = createDrawer({
    id: props.id,
    get open() {
      return props.open;
    },
    defaultOpen: props.defaultOpen,
    get side() {
      return props.side;
    },
    get modal() {
      return props.modal;
    },
    get dismissable() {
      return props.dismissable;
    },
    labelledby: titleId,
    get onOpenChange() {
      return props.onOpenChange;
    },
  });
  const mount = () => props.mount;
  return <DrawerContext value={{ drawer, titleId, mount }}>{props.children}</DrawerContext>;
};

/** The button that opens the drawer: `Button` unless `render` says otherwise. It is the element with `aria-haspopup`. */
export const DrawerTrigger = (props: DrawerTriggerProps): JSX.Element => {
  const { drawer } = useContext(DrawerContext);
  const rest = omit(props, "render", "class", "children");
  // no `data-part` of its own: the part renders a `Button` by default, and the button owns the attribute, as `Dialog` does
  const merged = merge(rest, drawer.triggerProps, () => ({
    get class() {
      return css.cn(props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children}</Button>
  ));
};

/**
 * The panel and the wash under it, portalled into `document.body` (or `mount`) so an ancestor's `transform`, `filter`,
 * `contain` or `overflow` can neither clip the layer nor become the containing block of its `position: fixed`.
 */
export const DrawerContent = (props: DrawerContentProps): JSX.Element => {
  const { drawer, mount } = useContext(DrawerContext);
  const merged = merge(omit(props, "render", "class", "children"), drawer.contentProps, () => ({
    "data-part": "drawer",
    get "data-side"() {
      return drawer.side();
    },
    get "data-state"() {
      return `${drawer.side()}-${drawer.open() ? "open" : "closed"}`;
    },
    // the panel hides with `visibility` (panelMotion), not with `hidden`: the primitive's attribute would cut the slide and
    // make the panel unfocusable at the moment the focus moves into it
    hidden: false,
    get class() {
      return css.cn(panel({ side: drawer.side() }), panelMotion, props.class);
    },
  }));
  return (
    <Portal mount={mount()}>
      <div data-part="drawer-layer" class={layerClass}>
        <div {...drawer.backdropProps} data-part="drawer-backdrop" class={backdropClass} />
        {renderPart(props, merged, undefined, (part) => (
          <div {...part}>{props.children}</div>
        ))}
      </div>
    </Portal>
  );
};

/** The top of the panel: the title and the close button. */
export const DrawerHeader = (props: DrawerHeaderProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "drawer-header",
      get class() {
        return css.cn(headerClass, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The panel's visible heading, and the name the primitive points `aria-labelledby` at. */
export const DrawerTitle = (props: DrawerTitleProps): JSX.Element => {
  const { titleId } = useContext(DrawerContext);
  return renderPart(
    props,
    {
      id: titleId,
      "data-part": "drawer-title",
      get class() {
        return css.cn(titleClass, props.class);
      },
    },
    undefined,
    (part) => <h2 {...part}>{props.children}</h2>,
  );
};

/** The panel's body: the only part that scrolls when the content is taller than the edges allow. */
export const DrawerBody = (props: DrawerBodyProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "drawer-body",
      get class() {
        return css.cn(bodyClass, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The panel's footer: actions, against the bottom edge. */
export const DrawerFooter = (props: DrawerFooterProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "drawer-footer",
      get class() {
        return css.cn(footerClass, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The close control in the header: a small icon button with an accessible name. */
export const DrawerClose = (props: DrawerCloseProps): JSX.Element => {
  const { drawer } = useContext(DrawerContext);
  return (
    <button
      type="button"
      data-part="drawer-close"
      class={css.cn(closeClass, props.class)}
      aria-label={props.label ?? "Close"}
      onClick={() => {
        // the trigger's handler toggles, which is a close while the drawer is open
        if (drawer.open()) {
          drawer.triggerProps.onClick();
        }
      }}
    >
      {props.children ?? <span aria-hidden="true">×</span>}
    </button>
  );
};
