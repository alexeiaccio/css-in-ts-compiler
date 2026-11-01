import { type Accessor, createSignal } from "solid-js";

export interface ControllableOptions<T> {
  /** The controlled value prop; `undefined` means uncontrolled. Read lazily. */
  readonly value: () => T | undefined;
  /** The uncontrolled starting value (`defaultValue`). */
  readonly initial: T;
  /** The request callback (`onValueChange`): the host may ignore it. */
  readonly onChange: () => ((value: T) => void) | undefined;
  /** Equality for values that are not primitives (a layout array). */
  readonly same?: (a: T, b: T) => boolean;
}

/**
 * The request/commit split (map ticket `rt1p`): `request` is what a user
 * event does. A change of intent calls `onChange`; uncontrolled it also
 * commits, controlled it commits nothing and the `value` prop stays the only
 * thing that moves the state.
 */
export const createControllable = <T>(
  options: ControllableOptions<T>,
): readonly [value: Accessor<T>, request: (next: T) => void] => {
  const [version, setVersion] = createSignal(0);
  // Solid 2 applies setters on the next flush, so a signal can lag behind a
  // request made in the same tick. `local` is always fresh; `version` only notifies.
  let local = options.initial;
  const current = (): T => {
    version();
    return options.value() ?? local;
  };
  const same = options.same ?? Object.is;
  // The intent the host has not answered yet. A controlled host's `value` still
  // reads its old state until the flush, so `current()` cannot tell a repeated
  // request from a new one: a backdrop click and an Escape in the same frame
  // would ask the host for the state it was already asked for. One frame is one
  // intent; after the flush the host's value decides again.
  let inFlight: T | undefined;
  const request = (next: T): void => {
    if (same(next, current())) {
      return;
    }
    if (inFlight !== undefined && same(inFlight, next)) {
      return;
    }
    inFlight = next;
    queueMicrotask(() => {
      if (inFlight !== undefined && same(inFlight, next)) {
        inFlight = undefined;
      }
    });
    if (options.value() === undefined) {
      local = next;
      setVersion((count) => count + 1);
    }
    options.onChange()?.(next);
  };
  return [current, request];
};
