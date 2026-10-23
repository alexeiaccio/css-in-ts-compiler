import { type DialogModal, createDialogModal } from "../src/dialog-modal";
import { createEffect, createSignal } from "solid-js";
import type { DialogModalConfig } from "@cssints/apg-specs/apg/dialog-modal.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

/**
 * Renders `createDialogModal` as a trigger, a hidden-until-open dialog (with a
 * button and a dismiss), a backdrop and an outside area. Focus moves to the
 * dialog's first focusable on open; a dismiss / Escape close returns it to the
 * trigger, while an outside / backdrop close drops it (ariakit behaviour).
 */
export const mountDialogModal = (config: DialogModalConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal(config.open);
  let api: DialogModal | undefined;
  let restoreOnClose = true;
  let first = true;

  const elementOf = (part: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-part="${part}"]`);

  const dispose = render(() => {
    const dialog = createDialogModal({
      defaultOpen: config.open,
      get value() {
        return config.controlled ? host() : undefined;
      },
      modal: config.modal,
      role: config.role,
      labelledby: "header",
      dismissable: config.dismissable,
      keyboardDismissDisabled: config.keyboardDismissDisabled,
      onOpenChange: (open) => {
        events.set("onOpenChange", [...(events.get("onOpenChange") ?? []), open]);
        if (open) {
          restoreOnClose = true;
        } else {
          events.set("onClose", [1]);
        }
        if (config.accepts) {
          setHost(open);
        }
      },
    });
    api = dialog;
    createEffect(
      () => dialog.open(),
      (open) => {
        if (open) {
          elementOf("button")?.focus();
        } else if (first) {
          // nothing focused at mount
        } else if (restoreOnClose) {
          elementOf("trigger")?.focus();
        } else if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        first = false;
      },
    );
    return (
      <>
        <button data-part="trigger" {...dialog.triggerProps}>
          Open
        </button>
        <div
          data-part="backdrop"
          {...dialog.backdropProps}
          onPointerDown={() => {
            restoreOnClose = false;
          }}
          style={{ height: "40px" }}
        />
        <div data-part="dialog" {...dialog.dialogProps} style={{ height: "40px" }}>
          <h2 id="header">Dialog title</h2>
          <p id="description">Dialog body</p>
          <button data-part="button" type="button">
            Confirm
          </button>
          <button
            data-part="dismiss"
            {...dialog.dismissProps}
            onPointerDown={() => {
              restoreOnClose = true;
            }}
          >
            Dismiss
          </button>
        </div>
        <div
          data-part="outside"
          onPointerDown={() => {
            restoreOnClose = false;
          }}
          onClick={() => {
            if (config.dismissable) {
              api?.close();
            }
          }}
          style={{ height: "40px" }}
        >
          Outside
        </div>
      </>
    );
  }, root);

  return {
    root,
    events,
    value: () => api?.open() ?? config.open,
    setProp: (name, value) => {
      switch (name) {
        case "pressEnter":
          api?.triggerProps.onKeyDown(new KeyboardEvent("keydown", { key: "Enter" }));
          break;
        case "pressSpace":
          api?.triggerProps.onKeyDown(new KeyboardEvent("keydown", { key: " " }));
          break;
        case "escape":
          api?.dialogProps.onKeyDown(new KeyboardEvent("keydown", { key: "Escape" }));
          break;
        case "setValue":
          setHost(value === true);
          break;
        case "hostToggle":
          setHost(!host());
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
