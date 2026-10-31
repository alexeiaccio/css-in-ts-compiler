import { type Accessor, createSignal } from "solid-js";

export interface AlertOptions {
  /** Rendered at mount; `undefined` starts with no live region. */
  readonly message?: string | undefined;
  /**
   * Controlled: the text is read from this accessor on every read, so a host
   * with a signal passes `() => error()` and clears it in `onDismiss`. Absent,
   * the alert is uncontrolled and `show` writes it.
   */
  readonly from?: (() => string | undefined) | undefined;
  /** The user closed the alert; the host may unmount it. */
  readonly onDismiss?: () => void;
}

/** Spread onto the `role=alert` live region. */
export interface AlertProps {
  readonly role: "alert" | undefined;
  readonly "aria-atomic": "true" | undefined;
  readonly hidden: boolean;
}

export interface AlertDismissProps {
  readonly "aria-label": "Close";
  readonly onClick: () => void;
}

export interface Alert {
  readonly mounted: Accessor<boolean>;
  readonly message: Accessor<string | undefined>;
  /** Render or replace the message: a fresh message is announced after load. */
  readonly show: (message: string) => void;
  readonly dismiss: () => void;
  readonly alertProps: AlertProps;
  readonly dismissProps: AlertDismissProps;
}

/**
 * APG Alert (https://www.w3.org/WAI/ARIA/apg/patterns/alert/): a brief message
 * in a `role=alert` live region. Platform: native live-region markup
 * (`ariaNotify` for imperative announcements). The machine only decides when the
 * region is live; the primitive keeps the region mounted and unhides it.
 */
export const createAlert = (options: AlertOptions = {}): Alert => {
  const [local, setLocal] = createSignal<string | undefined>(options.message);
  const message = (): string | undefined => options.from?.() ?? local();
  const mounted = (): boolean => message() !== undefined;

  const show = (next: string): void => {
    setLocal(next);
  };
  const dismiss = (): void => {
    if (!mounted()) {
      return;
    }
    setLocal(undefined);
    options.onDismiss?.();
  };

  return {
    mounted,
    message,
    show,
    dismiss,
    alertProps: {
      get role() {
        return mounted() ? "alert" : undefined;
      },
      get "aria-atomic"() {
        return mounted() ? "true" : undefined;
      },
      get hidden() {
        return !mounted();
      },
    },
    dismissProps: {
      "aria-label": "Close",
      onClick: dismiss,
    },
  };
};
