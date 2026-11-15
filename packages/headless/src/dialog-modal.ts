import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

export type DialogRole = "dialog" | "alertdialog";

export interface DialogModalOptions {
  /** Controlled: the host owns the open state and this is the only thing that changes it. */
  readonly value?: boolean | undefined;
  /** Uncontrolled starting state; ignored while `value` is set. */
  readonly defaultOpen?: boolean;
  readonly modal?: boolean;
  readonly role?: DialogRole;
  /** Id of the element naming the dialog. */
  readonly labelledby?: string | undefined;
  /** Id of the element describing the dialog (required for alertdialog). */
  readonly describedby?: string | undefined;
  /** A click on the backdrop / outside closes the dialog (`isDismissable`). */
  readonly dismissable?: boolean;
  /** Escape cannot close the dialog (`isKeyboardDismissDisabled`). */
  readonly keyboardDismissDisabled?: boolean;
  readonly id?: string;
  /** A request to change the open state, called when the intent differs. */
  readonly onOpenChange?: (open: boolean) => void;
}

export interface DialogTriggerProps {
  readonly id: string;
  readonly "aria-haspopup": "dialog";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface DialogContentProps {
  readonly id: string;
  readonly role: DialogRole;
  readonly "aria-modal": "true" | undefined;
  readonly "aria-labelledby": string | undefined;
  readonly "aria-describedby": string | undefined;
  readonly tabindex: -1;
  readonly hidden: boolean;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/**
 * The props of a native `<dialog>` host: the platform owns the top layer, focus containment, Escape, focus return and the
 * scroll lock, so none of `dialogProps`' `hidden` / `onKeyDown` machinery is needed. Spread it on the element and hand the
 * element to `attachDialog`.
 */
export interface DialogNativeProps {
  readonly id: string;
  readonly role: DialogRole;
  readonly "aria-labelledby": string | undefined;
  readonly "aria-describedby": string | undefined;
  /** The platform's close policy: `any` is Escape and a click outside, `closerequest` Escape only, `none` the caller's. */
  readonly closedby: "any" | "closerequest" | "none";
  readonly onCancel: (event: Event) => void;
  readonly onClose: () => void;
}

export interface DialogBackdropProps {
  readonly id: string;
  readonly hidden: boolean;
  readonly onClick: () => void;
}

export interface DialogModal {
  readonly open: Accessor<boolean>;
  readonly openDialog: () => void;
  readonly close: () => void;
  readonly triggerProps: DialogTriggerProps;
  readonly dialogProps: DialogContentProps;
  /** For a native `<dialog>` host; `dialogProps` is the element-agnostic fallback. */
  readonly nativeProps: DialogNativeProps;
  /** Wires a native `<dialog>`: `showModal()` / `show()` / `close()` follow `open()`. Call from the element's ref. */
  readonly attachDialog: (dialog: HTMLDialogElement) => () => void;
  readonly backdropProps: DialogBackdropProps;
  readonly dismissProps: {
    readonly id: string;
    readonly type: "button";
    readonly onClick: () => void;
  };
}

/**
 * APG Dialog (Modal) on Solid 2. `modal` adds `aria-modal`. Focus moves into
 * the dialog on open and is the host's to restore on close (the fixture does,
 * for dismiss / Escape). The full stack/focus-trap machine lives in
 * `specs/apg/dialog-modal.qnt`; the generated model is the oracle in tests, not
 * loaded here.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultOpen`);
 * pass `value` + `onOpenChange` to own the open state. `openDialog` / `close`
 * are requests the host may ignore.
 */
export const createDialogModal = (options: DialogModalOptions = {}): DialogModal => {
  const base = options.id ?? createUniqueId();
  const modal = options.modal ?? true;
  const role = options.role ?? "dialog";
  const [open, requestOpen] = createControllable({
    value: () => options.value,
    initial: options.defaultOpen ?? false,
    onChange: () => options.onOpenChange,
  });

  const openDialog = (): void => requestOpen(true);
  const close = (): void => requestOpen(false);

  // The native host: the element arrives from a ref (Solid runs refs in the effect phase, so the primitive is created
  // here, not there), and one effect follows the open state. `modal: false` is `show()`, which a `dialog` also allows.
  const [attachedDialog, setAttachedDialog] = createSignal<HTMLDialogElement | undefined>(
    undefined,
  );
  createEffect(
    () => [open(), attachedDialog()] as const,
    ([isOpen, dialog]) => {
      if (dialog === undefined) {
        return;
      }
      if (isOpen && !dialog.open) {
        if (modal) {
          dialog.showModal();
        } else {
          dialog.show();
        }
      } else if (!isOpen && dialog.open) {
        dialog.close();
      }
    },
  );
  const attachDialog = (dialog: HTMLDialogElement): (() => void) => {
    setAttachedDialog(dialog);
    return () => setAttachedDialog(undefined);
  };

  return {
    open,
    openDialog,
    close,
    triggerProps: {
      id: `${base}-trigger`,
      "aria-haspopup": "dialog",
      get "aria-expanded"() {
        return open() ? "true" : "false";
      },
      "aria-controls": `${base}-dialog`,
      onClick: () => openDialog(),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDialog();
        } else if (event.key === "Escape" && open()) {
          close();
        }
      },
    },
    dialogProps: {
      id: `${base}-dialog`,
      role,
      get "aria-modal"() {
        return modal && open() ? "true" : undefined;
      },
      "aria-labelledby": options.labelledby,
      "aria-describedby":
        options.describedby ?? (role === "alertdialog" ? "description" : undefined),
      tabindex: -1,
      get hidden() {
        return !open();
      },
      onKeyDown: (event) => {
        if (event.key === "Escape" && !options.keyboardDismissDisabled) {
          event.preventDefault();
          close();
        }
      },
    },
    nativeProps: {
      id: `${base}-dialog`,
      role,
      "aria-labelledby": options.labelledby,
      "aria-describedby":
        options.describedby ?? (role === "alertdialog" ? "description" : undefined),
      get closedby() {
        if (options.keyboardDismissDisabled) {
          return "none";
        }
        return (options.dismissable ?? true) ? "any" : "closerequest";
      },
      onCancel: (event) => {
        // the platform closes on cancel; a dialog whose keys may not close it says so
        if (options.keyboardDismissDisabled) {
          event.preventDefault();
        }
      },
      onClose: () => requestOpen(false),
    },
    attachDialog,
    backdropProps: {
      id: `${base}-backdrop`,
      get hidden() {
        return !open();
      },
      onClick: () => {
        if (options.dismissable ?? true) {
          close();
        }
      },
    },
    dismissProps: {
      id: `${base}-dismiss`,
      type: "button",
      onClick: () => close(),
    },
  };
};
