import { type Accessor, createSignal, createUniqueId } from "solid-js";

export interface StatusOptions {
  /** Rendered on `statusProps`; generated when absent. */
  readonly id?: string | undefined;
  /**
   * Controlled: the text is read from this accessor on every read, so a host
   * with a signal passes `{ from: () => message() }` and drops `show`/`clear`.
   * Absent, the region is uncontrolled and `show` writes it.
   */
  readonly from?: (() => string | undefined) | undefined;
}

/** Spread onto the `role=status` live region. Render it once, always. */
export interface StatusProps {
  readonly id: string;
  readonly role: "status";
  readonly "aria-live": "polite";
  readonly "aria-atomic": "true";
}

export interface Status {
  /**
   * The text currently shown: `from()` when the host controls it, else the last
   * `show` (or `undefined` before the first).
   */
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
  const [local, setLocal] = createSignal<string | undefined>();
  const message = (): string | undefined => options.from?.() ?? local();

  return {
    message,
    show: (text) => {
      setLocal(text);
    },
    clear: () => {
      setLocal(undefined);
    },
    statusProps: {
      id,
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    },
  };
};
