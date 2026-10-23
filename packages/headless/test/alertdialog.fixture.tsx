import { type AlertDialog, createAlertDialog } from "../src/alertdialog";
import { createEffect, createSignal } from "solid-js";
import type { AlertDialogConfig } from "@cssints/apg-specs/src/apg/alertdialog.bridge";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

/**
 * Renders `createAlertDialog` as the spec's page (notes, Save, Discard) plus an
 * alertdialog (No / Yes) and a non-dismissable backdrop. DOM focus tracks the
 * primitive's encoded focus target, so the walk's `focus`/`tab` steps land on
 * the parts the spec names. Controlled, the fixture is the host: it keeps the
 * open state in a signal, passes it as `value`, and writes every request back
 * only when `accepts`.
 */
export const mountAlertDialog = (config: AlertDialogConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal(config.open);
  let api: AlertDialog | undefined;

  const elementOf = (part: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-part="${part}"]`);

  const dispose = render(() => {
    const dialog = createAlertDialog({
      defaultOpen: config.open,
      get value() {
        return config.controlled ? host() : undefined;
      },
      onOpenChange: (next) => {
        events.set("onOpenChange", [...(events.get("onOpenChange") ?? []), next]);
        if (config.accepts) {
          setHost(next);
        }
      },
    });
    api = dialog;
    createEffect(
      () => dialog.focusPart(),
      (part) => {
        if (part !== null) {
          elementOf(part)?.focus();
        }
      },
    );
    return (
      <>
        <textarea data-part="input" {...dialog.inputProps} />
        <button data-part="save" {...dialog.saveProps}>
          Save
        </button>
        <button data-part="trigger" {...dialog.triggerProps}>
          Discard
        </button>
        <div data-part="backdrop" {...dialog.backdropProps} style={{ height: "40px" }} />
        <div data-part="dialog" {...dialog.dialogProps}>
          <h2 id="title">Confirmation</h2>
          <p id="description">Discard your notes?</p>
          <button data-part="cancel" {...dialog.cancelProps}>
            No
          </button>
          <button data-part="confirm" {...dialog.confirmProps}>
            Yes
          </button>
          <button data-part="dismiss" type="button" onClick={() => dialog.escape()}>
            Dismiss
          </button>
        </div>
      </>
    );
  }, root);

  return {
    root,
    events,
    value: () => api?.open() ?? config.open,
    setProp: (name, value) => {
      const sync = (): void => {
        const part = api?.focusPart() ?? null;
        if (part !== null) {
          elementOf(part)?.focus();
        }
      };
      switch (name) {
        case "focusInput":
          api?.focusAt(1);
          break;
        case "focusSave":
          api?.focusAt(2);
          break;
        case "focusTrigger":
          api?.focusAt(3);
          break;
        case "focusCancel":
          api?.focusAt(101);
          break;
        case "focusConfirm":
          api?.focusAt(102);
          break;
        case "activate":
          api?.activate();
          break;
        case "escape":
          api?.escape();
          break;
        case "tab":
          api?.tab();
          break;
        case "shiftTab":
          api?.shiftTab();
          break;
        case "typeText":
          api?.typeText();
          break;
        case "clearText":
          api?.clearText();
          break;
        case "ctrlS":
          api?.ctrlS();
          break;
        case "pointerOutside":
          api?.pointerOutside();
          break;
        case "setValue":
          api?.prepareHostWrite();
          setHost(value === true);
          break;
        case "hostToggle":
          api?.prepareHostWrite();
          setHost(!host());
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
      sync();
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
