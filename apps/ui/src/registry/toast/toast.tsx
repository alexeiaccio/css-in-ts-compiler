import { type Toast as ToastController, type ToastItem as ToastMessage } from "@cssints/headless";
import { Portal } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For, merge, Show } from "solid-js";

import { type PartProps, renderPart, type Render, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What the region's `render` gets: the landmark's props, `data-part` and the caller's class merged in. */
export type ToasterPartProps = PartProps;

/** What one row's `render` gets: the live region's props, `data-part`, the tone, and the caller's class. */
export type ToastPartProps = PartProps;

export interface ToasterProps extends Renderable<ToasterPartProps, void> {
  /** The queue the page holds: `createToast()` from `@cssints/headless`. */
  readonly toast: ToastController;
  /** The element the stack is portalled into (default `document.body`), for a host with its own overlay root. */
  readonly mount?: Element;
  /** One row's element, for every toast: the item part's `render`, passed down. */
  readonly renderItem?: Render<ToastPartProps, ToastMessage> | undefined;
  readonly class?: string;
}

export interface ToastProps extends Renderable<ToastPartProps, ToastMessage> {
  readonly toast: ToastController;
  /** The toast the primitive queued: its title, description, tone and id. */
  readonly item: ToastMessage;
  readonly class?: string;
}

// The stack sits in the viewport's bottom end corner and never takes a click of its own: with nothing in the queue it is an
// empty, still box over the page, so it is transparent to the pointer and each row turns it back on. The corner is the
// inline end of the writing mode, and the inset is a token so a dense screen grows it with everything else.
const regionClass = css.cn(
  css.position("fixed"),
  css.insetBlockEnd(t.space._4),
  css.insetInlineEnd(t.space._4),
  // `z-index` takes an `<integer>`, which a `number` token is not: the class reads the token by hand, as the dialog's layer
  css.zIndex("var(--z-toast)"),
  css.display("flex"),
  css.flexDirection("column"),
  css.alignItems("stretch"),
  css.gap(t.space._2),
  css.width("min(24rem, calc(100vw - 2 * 16px))"),
  css.pointerEvents("none"),
);

// The row enters by fading in a step down; it leaves by not being in the queue any more, so there is no exit to paint. The
// motion reads the preference, as the skeleton's pulse does.
const enter = css.keyframes({ from: css.opacity(0), to: css.opacity(1) });

// The tone is one rule on the leading edge: the theme has an invalid colour and one accent, so `success` takes the accent
// and `info` the plain border. The row names the tone it was queued with (`data-tone`), which is the primitive's own
// `item.tone`; the `error` row is also `role="alert"`, and the title follows it through `within()`.
const toast = css.cv({
  base: css.cn(
    // the marker `within()` reads, so a part inside the row can follow the tone without a prop of its own
    css.group("toast"),
    css.pointerEvents("auto"),
    css.display("grid"),
    css.gridTemplateColumns("minmax(0, 1fr) auto"),
    css.gridTemplateAreas('"title close" "description close"'),
    css.columnGap(t.space._2),
    css.alignItems("start"),
    css.boxSizing("border-box"),
    css.padding(t.space._3),
    css.border("1px solid", "transparent"),
    css.borderInlineStartWidth(t.space._1),
    css.borderRadius(t.radius.lg),
    css.bg(t.color.overlayBackground),
    css.color(t.color.text),
    css.boxShadow(t.shadow.popover),
    css.fontSize(t.font.size),
    css.media("(prefers-reduced-motion: no-preference)")(css.animation(enter, "160ms", "ease-out")),
  ),
  variants: {
    tone: {
      info: css.cn(css.borderInlineStartColor(t.color.border)),
      success: css.cn(css.borderInlineStartColor(t.color.highlight)),
      error: css.cn(css.borderInlineStartColor(t.color.invalid)),
    },
  },
  defaultVariants: { tone: "info" },
});

const titleClass = css.cn(
  css.gridArea("title"),
  css.margin("0"),
  css.fontWeight("500"),
  css.lineHeight(1.4),
  css.overflowWrap("anywhere"),
  css.within(css.attr("data-tone", "error"), "toast")(css.color(t.color.invalid)),
);

const descriptionClass = css.cn(
  css.gridArea("description"),
  css.margin("0"),
  css.color(t.color.muted),
  css.lineHeight(1.5),
  css.overflowWrap("anywhere"),
);

// A glyph with a label, as the primitive's docs ask: `aria-atomic` reads the row's whole text, and a whole word here would
// be announced with every message. The label stays short for the same reason.
const closeClass = css.cn(
  css.gridArea("close"),
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

/**
 * APG alert / status, styled as a stack: `createToast` owns the queue, one timer per toast, the hover and focus pause, the
 * ceiling and the live region each row is; `Toaster` is the `role="region"` landmark those rows live in, portalled into
 * `document.body` (or `mount`) so a `transform` or `overflow` ancestor can neither clip the stack nor become the
 * containing block of its `position: fixed`.
 *
 * The page holds the controller (`const toast = createToast()`), pushes with `toast.show(...)` and renders one
 * `<Toaster toast={toast} />`; the stack is always in the DOM and empty when there is nothing to say. Everything that
 * leaves the queue leaves the DOM: there is no leaving animation to paint, and the primitive announces no lingering
 * state, so a paused countdown is the row's `:hover` / `:focus-within`, not a class.
 */
export const Toaster = (props: ToasterProps): JSX.Element => {
  // `tabindex="-1"`: the region is the F6 target the primitive's docs describe, focusable by the host's handler and not a
  // stop of the page's tab order.
  const own = {
    "data-part": "toast-region",
    tabindex: "-1",
    get class() {
      return css.cn(regionClass, props.class);
    },
  } as PartProps;
  return renderPart(props, merge(props.toast.regionProps, own), undefined, (part) => (
    <Portal mount={props.mount}>
      <div {...part}>
        <For each={props.toast.toasts()}>
          {(item) => <Toast toast={props.toast} item={item} render={props.renderItem} />}
        </For>
      </div>
    </Portal>
  ));
};

/**
 * One toast: the `role` and `aria-atomic` the primitive gives it (`role="alert"` for `error`, `status` otherwise), the
 * `data-tone` it was queued with, and the title, the optional description and a close button. Hover and focus pause the
 * countdown through the handlers `toastProps` hands over.
 */
export const Toast = (props: ToastProps): JSX.Element => {
  const own = {
    "data-part": "toast",
    "data-tone": props.item.tone,
    get class() {
      return css.cn(toast({ tone: props.item.tone }), props.class);
    },
  } as PartProps;
  return renderPart(
    props,
    merge(props.toast.toastProps(props.item.id), own),
    props.item,
    (part) => (
      <div {...part}>
        <p data-part="toast-title" class={titleClass}>
          {props.item.title}
        </p>
        <Show when={props.item.description !== undefined}>
          <p data-part="toast-description" class={descriptionClass}>
            {props.item.description}
          </p>
        </Show>
        <button
          type="button"
          data-part="toast-close"
          class={closeClass}
          aria-label="Dismiss"
          onClick={() => props.toast.dismiss(props.item.id)}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    ),
  );
};
