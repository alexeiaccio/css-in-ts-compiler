import { createToast, type Toast, type ToastOptions } from "@cssints/headless";
import { render } from "@solidjs/web";

import { Toaster } from "./toast.tsx";

/** What a mounted toaster hands the test: the controller, the dismissals it saw, and a teardown. */
export interface MountedToaster {
  readonly api: Toast;
  /** Every id the primitive says left, in order. */
  readonly dismissed: string[];
  readonly dispose: () => void;
}

/**
 * Mounts the styled toaster for the browser test: the page holds the controller, so the fixture plays the page. The stack is
 * portalled, so `host` is only where the `Toaster` itself is rendered (`document.body` by default) and the region lands in
 * `document.body` whatever `host` is.
 *
 * @param {ToastOptions} options what the queue is created with
 * @param {HTMLElement} host the element the `Toaster` is rendered into, for the transformed ancestor the test needs
 * @returns {MountedToaster} the controller, the dismissals and the teardown
 */
export const mountToaster = (
  options: ToastOptions = {},
  host: HTMLElement = document.createElement("div"),
): MountedToaster => {
  document.body.append(host);
  const dismissed: string[] = [];
  let api!: Toast;

  const dispose = render(() => {
    api = createToast({
      ...options,
      onDismiss: (id) => {
        dismissed.push(id);
        options.onDismiss?.(id);
      },
    });
    return <Toaster toast={api} />;
  }, host);

  return {
    api,
    dismissed,
    dispose: () => {
      dispose();
      host.remove();
    },
  };
};
