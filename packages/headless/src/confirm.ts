import { type Accessor, createEffect, createSignal, createUniqueId, onCleanup } from "solid-js";
import {
  type DialogBackdropProps,
  type DialogContentProps,
  type DialogTriggerProps,
  createDialogModal,
} from "./dialog-modal";
import { claimOverlay, cycleFocus, isTopOverlay, lockScroll } from "./overlay-shell";

export interface ConfirmOptions {
  readonly id?: string | undefined;
  /** Called with `true` when a request opens the dialog and `false` when it settles. */
  readonly onOpenChange?: (open: boolean) => void;
}

export interface ConfirmRequest {
  readonly title: string;
  readonly description?: string | undefined;
  /**
   * Default `"Confirm"`. The defaults are English and stay so: a host that
   * translates passes both labels (and the title) with every request.
   */
  readonly confirmLabel?: string | undefined;
  /** Default `"Cancel"`; see `confirmLabel`. */
  readonly cancelLabel?: string | undefined;
  /** The confirm action destroys something: the host styles it so. */
  readonly destructive?: boolean | undefined;
}

/** The request being shown (or shown last), with the defaults applied. */
export interface ConfirmView {
  readonly title: string;
  readonly description: string | undefined;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly destructive: boolean;
}

/** The attributes of dialog-modal's trigger; the click that calls `confirm()` is the host's. */
export type ConfirmTriggerProps = Omit<DialogTriggerProps, "onClick" | "onKeyDown">;

export interface ConfirmTextProps {
  readonly id: string;
  readonly hidden?: boolean;
}

export interface ConfirmButtonProps {
  readonly id: string;
  readonly type: "button";
  readonly onClick: () => void;
}

export interface Confirm {
  /**
   * Opens the dialog and resolves with the answer: `true` on confirm, `false`
   * on cancel, Escape or a backdrop click. A request made while one is pending
   * rejects with `ConfirmPendingError` and leaves the pending one alone.
   */
  readonly confirm: (request: ConfirmRequest) => Promise<boolean>;
  readonly open: Accessor<boolean>;
  readonly request: Accessor<ConfirmView | undefined>;
  readonly triggerProps: ConfirmTriggerProps;
  readonly dialogProps: DialogContentProps;
  readonly backdropProps: DialogBackdropProps;
  readonly titleProps: ConfirmTextProps;
  /** Render this element always: `aria-describedby` points at it. Hidden when there is no description. */
  readonly descriptionProps: ConfirmTextProps;
  readonly cancelProps: ConfirmButtonProps;
  readonly confirmProps: ConfirmButtonProps;
}

export class ConfirmPendingError extends Error {
  override readonly name = "ConfirmPendingError";
  constructor() {
    super("a confirmation is already pending");
  }
}

interface Pending {
  readonly resolve: (answer: boolean) => void;
  readonly invoker: HTMLElement | null;
}

/**
 * A promise-based confirmation over `createDialogModal({ role: "alertdialog" })`
 * (APG Alert Dialog: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/).
 * Not checked against a Quint spec: the dialog is, the promise around it is
 * covered by `test/confirm.browser.test.tsx`.
 *
 * Focus: the cancel button, the least destructive action, takes focus when the
 * dialog opens; when the request settles, focus goes back to the element that
 * had it when `confirm()` was called, before the promise resolves, so the
 * caller's continuation may move it again.
 *
 * The shell, while open: Tab and Shift+Tab cycle inside the dialog (and pull
 * focus back in if it escaped), `overflow: hidden` on the document element, and
 * Escape is read from the document in the capture phase, so it answers `false`
 * wherever focus is. The backdrop click is `backdropProps`; keep the backdrop
 * and the dialog siblings, or a click in the dialog reaches the backdrop. Hiding
 * the rest of the page (`inert`) stays the host's.
 *
 * Nesting: confirms from different `createConfirm` calls may be open together;
 * only the last one opened gets Escape and Tab (and Escape does not reach a
 * dialog it sits in), and the scroll lock is counted: the first takes it, the
 * last to close restores what `overflow` was. `createDrawer` claims the same
 * page-wide stack and lock, so a confirm over a drawer (or the reverse) nests
 * the same way. One confirm still has one request.
 *
 * One request at a time: a second `confirm()` while one is pending is rejected,
 * not queued. Queued, a double click on "Delete" would ask twice and a stale
 * question could outlive the screen that asked it. A pending request is
 * answered `false` when the owner is disposed.
 */
export const createConfirm = (options: ConfirmOptions = {}): Confirm => {
  const base = options.id ?? createUniqueId();
  const titleId = `${base}-title`;
  const descriptionId = `${base}-description`;
  const cancelId = `${base}-cancel`;
  const [request, setRequest] = createSignal<ConfirmView | undefined>(undefined);
  let pending: Pending | undefined;

  const settle = (answer: boolean): void => {
    const current = pending;
    if (current === undefined) {
      return;
    }
    pending = undefined;
    dialog.close();
    current.invoker?.focus();
    current.resolve(answer);
  };

  const dialog = createDialogModal({
    id: base,
    role: "alertdialog",
    labelledby: titleId,
    describedby: descriptionId,
    onOpenChange: (open) => {
      if (!open) {
        settle(false);
      }
      options.onOpenChange?.(open);
    },
  });

  const self = Symbol(base);
  const onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (!isTopOverlay(self)) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      settle(false);
      return;
    }
    const root = document.getElementById(dialog.dialogProps.id);
    if (event.key !== "Tab" || root === null) {
      return;
    }
    cycleFocus(event, root);
  };

  createEffect(
    () => dialog.open(),
    (isOpen) => {
      if (!isOpen) {
        return;
      }
      document.getElementById(cancelId)?.focus();
      const unlock = lockScroll();
      const release = claimOverlay(self);
      document.addEventListener("keydown", onDocumentKeyDown, true);
      return () => {
        document.removeEventListener("keydown", onDocumentKeyDown, true);
        release();
        unlock();
      };
    },
  );
  onCleanup(() => {
    pending?.resolve(false);
    pending = undefined;
  });

  const confirm = (next: ConfirmRequest): Promise<boolean> => {
    if (pending !== undefined) {
      return Promise.reject(new ConfirmPendingError());
    }
    return new Promise<boolean>((resolve) => {
      pending = {
        resolve,
        invoker: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      };
      setRequest({
        title: next.title,
        description: next.description,
        confirmLabel: next.confirmLabel ?? "Confirm",
        cancelLabel: next.cancelLabel ?? "Cancel",
        destructive: next.destructive === true,
      });
      dialog.openDialog();
    });
  };

  return {
    confirm,
    open: dialog.open,
    request,
    triggerProps: {
      id: dialog.triggerProps.id,
      "aria-haspopup": "dialog",
      get "aria-expanded"() {
        return dialog.triggerProps["aria-expanded"];
      },
      "aria-controls": dialog.triggerProps["aria-controls"],
    },
    dialogProps: dialog.dialogProps,
    backdropProps: dialog.backdropProps,
    titleProps: { id: titleId },
    descriptionProps: {
      id: descriptionId,
      get hidden() {
        return request()?.description === undefined;
      },
    },
    cancelProps: { id: cancelId, type: "button", onClick: () => settle(false) },
    confirmProps: { id: `${base}-confirm`, type: "button", onClick: () => settle(true) },
  };
};
