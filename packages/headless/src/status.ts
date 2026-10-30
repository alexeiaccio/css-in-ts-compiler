import { type Accessor, createSignal, createUniqueId } from "solid-js";

export interface StatusOptions {
  /** Rendered on `statusProps`; generated when absent. */
  readonly id?: string | undefined;
}

/** Spread onto the `role=status` live region. Render it once, always. */
export interface StatusProps {
  readonly id: string;
  readonly role: "status";
  readonly "aria-live": "polite";
  readonly "aria-atomic": "true";
}

export interface Status {
  /** The text currently shown, or `undefined` before the first `show`. */
  readonly message: Accessor<string | undefined>;
  /** Writes the message, replacing the previous one; nothing is queued. */
  readonly show: (text: string) => void;
  readonly clear: () => void;
  readonly statusProps: StatusProps;
}

/**
 * APG Alert's polite sibling: one `role=status` live region whose text the host
 * replaces ("Link copied", "Saved"). It is not a queue: a second message shows
 * in place of the first, so a burst reads as the last state, not as N alerts.
 * The region is rendered once and stays mounted, which is what makes a change
 * of its text announced.
 *
 * A status is never for errors: an error that needs attention now is
 * `createAlert` (`role=alert`, assertive), and a message with a title, a
 * description and a timeout is `createToast`.
 */
export const createStatus = (options: StatusOptions = {}): Status => {
  const id = options.id ?? createUniqueId();
  const [message, setMessage] = createSignal<string | undefined>();

  return {
    message,
    show: (text) => {
      setMessage(text);
    },
    clear: () => {
      setMessage(undefined);
    },
    statusProps: {
      id,
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    },
  };
};
