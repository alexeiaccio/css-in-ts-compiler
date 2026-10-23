import { type Alert, createAlert } from "../src/alert";
import type { AlertConfig } from "@cssints/apg-specs/apg/alert.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Renders `createAlert` as the library's toast shell: a `toast`/`root` container
 * (role=alertdialog), the live `content`/`alert` regions, a `close` button and
 * the `add`/`add-high`/`region` page parts the ported scenarios use. Only
 * `alert` and `close` carry spec meaning; the rest are static page structure.
 */
export const mountAlert = (config: AlertConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [count, setCount] = createSignal(0);
  let api: Alert | undefined;

  const show = (): void => {
    setCount((value) => value + 1);
    api?.show(`message ${count()}`);
  };

  const dispose = render(() => {
    const alert = createAlert();
    api = alert;
    return (
      <>
        <div
          data-part="toast"
          role={alert.mounted() ? "alertdialog" : undefined}
          aria-modal={alert.mounted() ? "false" : undefined}
          aria-labelledby={config.titleId}
          aria-describedby={config.descriptionId}
        >
          <div
            data-part="root"
            role={alert.mounted() ? "alertdialog" : undefined}
            aria-modal={alert.mounted() ? "false" : undefined}
            aria-labelledby={config.titleId}
            aria-describedby={config.descriptionId}
          >
            <div
              data-part="content"
              role={alert.mounted() ? "alert" : undefined}
              aria-atomic={alert.mounted() ? "true" : undefined}
            >
              {alert.message()}
            </div>
            <div
              data-part="alert"
              role={alert.mounted() ? "alert" : undefined}
              aria-atomic={alert.mounted() ? "true" : undefined}
            >
              {alert.message()}
            </div>
            <button data-part="close" type="button" {...alert.dismissProps}>
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
    );
  }, root);

  return {
    root,
    events,
    setProp: (name) => {
      switch (name) {
        case "show":
          show();
          break;
        case "dismiss":
          api?.dismiss();
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
