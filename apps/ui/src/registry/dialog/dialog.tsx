import { createDialogModal, type DialogModal } from "@cssints/headless";
import { Portal } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
import {
  createContext,
  createEffect,
  createUniqueId,
  merge,
  omit,
  Show,
  useContext,
} from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface DialogProps {
  /** The dialog's accessible name: `role="dialog"` needs one. */
  readonly label: string;
  /** The description under the panel's first row. An `alert` should have one (APG). */
  readonly description?: string;
  /** Controlled: the host owns the open state. */
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** `role="alertdialog"`: an interrupting message, whose description is read out with its name. */
  readonly alert?: boolean;
  /** `aria-modal` (default `true`): the rest of the page is inert while it is open. */
  readonly modal?: boolean;
  /** A click on the backdrop closes it (default `true`). */
  readonly dismissable?: boolean;
  /** Escape cannot close it. */
  readonly keyboardDismissDisabled?: boolean;
  /** The element the layer is portalled into (default `document.body`), for a host that has its own modal root. */
  readonly mount?: Element;
  readonly id?: string;
  readonly children?: JSX.Element;
}

export type DialogTriggerPartProps = PartProps;

export interface DialogTriggerProps extends Renderable<DialogTriggerPartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DialogContentProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DialogTitleProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DialogCloseProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

const DialogContext = createContext<{
  readonly dialog: DialogModal;
  readonly descriptionId: string;
  readonly label: () => string;
  readonly description: () => string | undefined;
  readonly mount: () => Element | undefined;
}>();

// The layer holds the page still and takes the wash; the backdrop sits in it and takes the dismiss click; the panel floats
// above both (a positioned box paints over a plain one), is a surface and a frame like a card, and scrolls inside itself so a
// long dialog never grows past the viewport.
const layerClass = css.cn(
  css.position("fixed"),
  css.inset("0"),
  // `z-index` takes an `<integer>`, which a `number` token is not: the custom property is the knob
  css.zIndex("var(--z-dialog)"),
  css.display("grid"),
  css.placeItems("center"),
  css.padding(t.space._4),
  css.overflow("auto"),
);

const backdropClass = css.cn(css.position("absolute"), css.inset("0"), css.bg(t.color.scrim));

const panelClass = css.cn(
  frame().radius(t.radius.xl).padding(t.space._4).border("1px"),
  surface().color(t.color.overlayBackground),
  css.borderColor(t.color.overlayBorder),
  css.color(t.color.text),
  css.boxShadow(t.shadow.popover),
  css.position("relative"),
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space._3),
  css.width("min(28rem, 100%)"),
  css.maxHeight("calc(100dvh - 2 * 16px)"),
  css.overflow("auto"),
  // the panel takes focus itself (`tabindex="-1"`): a ring around the whole dialog is noise, the control inside has it
  css.outline("none"),
);

const titleClass = css.cn(
  css.margin("0"),
  css.fontSize(t.font.sizeLg),
  css.fontWeight("600"),
  css.color(t.color.text),
);

const descriptionClass = css.cn(
  css.margin("0"),
  css.fontSize(t.font.size),
  css.color(t.color.muted),
);

/**
 * APG modal dialog, styled: `Dialog.Trigger` opens it, `Dialog.Content` is the panel, and the backdrop closes it unless the
 * host says otherwise. `createDialogModal` owns the open state (controlled by `open`), the ARIA and the Escape; the kit adds
 * the scrim, the surface, focus into the panel and back to whatever opened it, and the page's scroll lock.
 */
export const Dialog = (props: DialogProps): JSX.Element => {
  // the description's id is the dialog's `aria-describedby`, and its paragraph is always in the panel: `alert` needs a
  // description (APG), and a reference to a missing id is worse than an empty one
  const descriptionId = createUniqueId();
  const dialog = createDialogModal({
    get value() {
      return props.open;
    },
    defaultOpen: props.defaultOpen,
    get modal() {
      return props.modal;
    },
    role: props.alert === true ? "alertdialog" : "dialog",
    describedby: descriptionId,
    id: props.id,
    get dismissable() {
      return props.dismissable;
    },
    get keyboardDismissDisabled() {
      return props.keyboardDismissDisabled;
    },
    get onOpenChange() {
      return props.onOpenChange;
    },
  });
  // the panel names itself with `aria-label`: the label is a prop, and a title part is the visible heading, not the name
  const label = () => props.label;
  const description = () => props.description;
  const mount = () => props.mount;
  return (
    <DialogContext value={{ dialog, descriptionId, label, description, mount }}>
      {props.children}
    </DialogContext>
  );
};

/** The button that opens the dialog: `Button` unless `render` says otherwise. */
export const DialogTrigger = (props: DialogTriggerProps): JSX.Element => {
  const { dialog } = useContext(DialogContext);
  const rest = omit(props, "render", "class", "children");
  // no `data-part` of its own: the part renders a `Button` by default, and the button owns the attribute, as a `Field`'s
  // control renders an `Input`. The trigger is the element with `aria-haspopup="dialog"`.
  const merged = merge(rest, dialog.triggerProps, () => ({
    get class() {
      return css.cn(props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children}</Button>
  ));
};

/**
 * The panel and the wash under it. Nothing is in the DOM while the dialog is closed; focus moves into the panel when it
 * opens and back to whatever had it when it closes, and the page does not scroll while it is open. The layer is portalled
 * into `document.body` (or `Dialog`'s `mount`) so an ancestor's `transform`, `filter`, `contain` or `overflow` can neither
 * clip it nor become the containing block of its `position: fixed`.
 */
export const DialogContent = (props: DialogContentProps): JSX.Element => {
  const { dialog, descriptionId, label, description, mount } = useContext(DialogContext);
  let panel: HTMLDivElement | undefined;
  let restore: HTMLElement | null = null;
  let scroll: string | undefined;
  createEffect(
    () => dialog.open(),
    (open) => {
      if (open) {
        restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        scroll = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        panel?.focus();
      } else {
        if (scroll !== undefined) {
          document.body.style.overflow = scroll;
          scroll = undefined;
        }
        restore?.focus();
        restore = null;
      }
    },
  );
  return (
    <Show when={dialog.open()}>
      <Portal mount={mount()}>
        <div data-part="dialog-layer" class={layerClass}>
          <div {...dialog.backdropProps} data-part="dialog-backdrop" class={backdropClass} />
          {renderPart(
            props,
            merge(omit(props, "render", "class", "children"), dialog.dialogProps, () => ({
              "aria-label": label(),
              "data-part": "dialog",
              get class() {
                return css.cn(panelClass, props.class);
              },
            })),
            undefined,
            (part) => (
              <div
                {...part}
                ref={(element: HTMLDivElement) => {
                  panel = element;
                }}
              >
                <p
                  id={descriptionId}
                  data-part="dialog-description"
                  class={descriptionClass}
                  hidden={description() === undefined}
                >
                  {description()}
                </p>
                {props.children}
              </div>
            ),
          )}
        </div>
      </Portal>
    </Show>
  );
};

/** The visible heading of the panel. */
export const DialogTitle = (props: DialogTitleProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "dialog-title",
      get class() {
        return css.cn(titleClass, props.class);
      },
    },
    undefined,
    (part) => <h2 {...part}>{props.children}</h2>,
  );

/** A button that closes the dialog, inside the panel. */
export const DialogClose = (props: DialogCloseProps): JSX.Element => {
  const { dialog } = useContext(DialogContext);
  const merged = merge(omit(props, "render", "class", "children"), dialog.dismissProps, () => ({
    get class() {
      return css.cn(props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <Button tone="quiet" {...part}>
      {props.children}
    </Button>
  ));
};
