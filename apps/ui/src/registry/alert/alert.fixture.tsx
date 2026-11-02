import type { Alert as AlertController } from "@cssints/headless";
import type { AlertConfig } from "@cssints/apg-specs/apg/alert.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./alert-driver.ts";
import { Alert } from "./alert.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Mounts the styled alert inside the toast shell the ported scenarios describe: a `toast`/`root`
 * container (an alertdialog only while a message is live), the `close` button, and the
 * `add`/`add-high`/`region` page parts. Only the live part is the skin's: it is the styled
 * `Alert`, and its `data-part="alert"` carries the `role=alert` and `aria-atomic` the primitive
 * announces. The fixture tracks "a message is live" in a signal so the container can mirror it.
 */
export const mountAlert = (config: AlertConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [count, setCount] = createSignal(0);
  const [live, setLive] = createSignal(false);
  let api: AlertController | undefined;

  const show = (): void => {
    setCount((value) => value + 1);
    setLive(true);
    api?.show(`message ${count()}`);
  };

  const dismiss = (): void => {
    setLive(false);
    api?.dismiss();
  };

  const dispose = render(
    () => (
      <>
        <div
          data-part="toast"
          role={live() ? "alertdialog" : undefined}
          aria-modal={live() ? "false" : undefined}
          aria-labelledby={config.titleId}
          aria-describedby={config.descriptionId}
        >
          <div
            data-part="root"
            role={live() ? "alertdialog" : undefined}
            aria-modal={live() ? "false" : undefined}
            aria-labelledby={config.titleId}
            aria-describedby={config.descriptionId}
          >
            <Alert
              onReady={(alert) => {
                api = alert;
              }}
            />
            <button data-part="close" type="button" onClick={dismiss}>
              Close
            </button>
          </div>
        </div>
        <div data-part="region" aria-label={`${count()} notification.`} />
        <button data-part="add" type="button" onClick={show}>
          Add
        </button>
        <button data-part="add-high" type="button" onClick={show}>
          Add high
        </button>
      </>
    ),
    root,
  );

  return {
    root,
    events,
    setProp: (name) => {
      switch (name) {
        case "show":
          show();
          break;
        case "dismiss":
          dismiss();
          break;
        case "load":
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
