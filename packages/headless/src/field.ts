import { createUniqueId } from "solid-js";

export interface FieldOptions {
  /** Base of every id the field makes (`<id>-control`, `-label`, `-hint`, `-error`). */
  readonly id?: string;
  readonly required?: boolean;
  /**
   * `true` marks the control invalid; a string does too and is the error message
   * (unless `error` is set). `false` forces valid: an `error` is then not shown,
   * so a host can pass `touched() && failed()` and keep the message ready.
   * Left out, the field is invalid exactly when it has an error message.
   */
  readonly invalid?: boolean | string | undefined;
  /** Help text; absent (or empty) means the hint element is hidden and not referenced. */
  readonly hint?: string | undefined;
  /** The error message; absent (or empty) means no error element. */
  readonly error?: string | undefined;
}

/** Spread onto the form control (`input`, `textarea`, `select`, or a custom widget). */
export interface FieldControlProps {
  readonly id: string;
  /** The ids of the hint and the error that are shown, hint first; absent when neither is. */
  readonly "aria-describedby": string | undefined;
  readonly "aria-invalid": "true" | undefined;
  /** For a control that is not native (a native one has `required`). */
  readonly "aria-required": "true" | undefined;
  readonly required: true | undefined;
}

export interface FieldLabelProps {
  readonly id: string;
  readonly for: string;
}

/** Spread onto the hint and the error element; render both, always. */
export interface FieldMessageProps {
  readonly id: string;
  readonly hidden: boolean;
}

export interface Field {
  readonly invalid: () => boolean;
  /** The hint, or `undefined` when there is none. */
  readonly hint: () => string | undefined;
  /** The error shown: `undefined` unless the field is invalid and has a message. */
  readonly error: () => string | undefined;
  /** The ids `aria-describedby` lists now: hint, then error; never an id that is hidden. */
  readonly describedIds: () => readonly string[];
  readonly controlProps: FieldControlProps;
  readonly labelProps: FieldLabelProps;
  readonly hintProps: FieldMessageProps;
  readonly errorProps: FieldMessageProps;
}

const text = (value: string | undefined): string | undefined =>
  value === undefined || value === "" ? undefined : value;

/**
 * The ARIA contract of a form field: a label, a control, a hint and an error.
 * There is no APG pattern for it (APG has no "form field"; the nearest is the
 * label and description rules of the accessible name computation), so the
 * contract comes from WAI-ARIA 1.2 (`aria-describedby`, `aria-invalid`,
 * `aria-required`) and HTML (`label[for]`, `required`), and from the
 * majority of Base UI Field, react-aria TextField and ariakit FormControl,
 * which list the description and the error message together. It is not checked
 * against a Quint spec; `test/field.browser.test.tsx` is its oracle.
 *
 * Decisions: the error does not replace the hint, both are listed, hint first
 * (the hint is what tells the user how to fix the error); an error implies
 * invalid and `invalid: false` overrides it; a hidden message is never
 * referenced, so `aria-describedby` has no dangling id. The error has no
 * `role=alert`: announcing it is the host's (compose `createAlert`).
 *
 * Options are read when an attribute is read: pass getters, never destructure.
 */
export const createField = (options: FieldOptions = {}): Field => {
  const base = options.id ?? createUniqueId();
  const controlId = `${base}-control`;
  const labelId = `${base}-label`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;

  const hint = (): string | undefined => text(options.hint);
  const message = (): string | undefined =>
    text(options.error) ??
    (typeof options.invalid === "string" ? text(options.invalid) : undefined);
  const invalid = (): boolean =>
    options.invalid === false ? false : options.invalid === true || message() !== undefined;
  const error = (): string | undefined => (invalid() ? message() : undefined);
  const describedIds = (): readonly string[] => [
    ...(hint() === undefined ? [] : [hintId]),
    ...(error() === undefined ? [] : [errorId]),
  ];

  return {
    invalid,
    hint,
    error,
    describedIds,
    controlProps: {
      id: controlId,
      get "aria-describedby"() {
        const ids = describedIds();
        return ids.length === 0 ? undefined : ids.join(" ");
      },
      get "aria-invalid"() {
        return invalid() ? "true" : undefined;
      },
      get "aria-required"() {
        return options.required === true ? "true" : undefined;
      },
      get required() {
        return options.required === true ? true : undefined;
      },
    },
    labelProps: { id: labelId, for: controlId },
    hintProps: {
      id: hintId,
      get hidden() {
        return hint() === undefined;
      },
    },
    errorProps: {
      id: errorId,
      get hidden() {
        return error() === undefined;
      },
    },
  };
};
