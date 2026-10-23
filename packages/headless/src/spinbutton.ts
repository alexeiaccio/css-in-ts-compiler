import { type Accessor, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

export interface SpinbuttonOptions {
  readonly min?: number;
  readonly max?: number;
  /** Small step: Up / Down Arrow and the buttons. */
  readonly step?: number;
  /** Large step: Page Up / Page Down. */
  readonly largeStep?: number;
  /** Controlled: the host owns the value and this is the only thing that changes it. */
  readonly value?: number | undefined;
  /** Starting value when uncontrolled; ignored while `value` is set. */
  readonly defaultValue?: number;
  /** Wrap around at the bounds instead of clamping. */
  readonly wrap?: boolean;
  /** Base for the generated input / button ids. */
  readonly id?: string;
  /**
   * A request to change the value, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (value: number) => void;
}

export interface SpinbuttonInputProps {
  readonly id: string;
  readonly role: "spinbutton";
  readonly "aria-valuenow": string;
  readonly "aria-valuemin": string;
  readonly "aria-valuemax": string;
  readonly "aria-valuetext": string;
  readonly "aria-invalid": "true" | undefined;
  readonly tabindex: number;
  readonly value: string;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onInput: (event: InputEvent) => void;
}

export interface SpinbuttonButtonProps {
  readonly role: "button";
  readonly tabindex: number;
  readonly "aria-label": string;
  readonly "aria-disabled": "true" | undefined;
  readonly onMouseDown: (event: MouseEvent) => void;
  readonly onClick: () => void;
}

export interface Spinbutton {
  readonly value: Accessor<number>;
  readonly focused: Accessor<boolean>;
  readonly editing: Accessor<boolean>;
  readonly draft: Accessor<string>;
  /** What the text field shows: the draft while editing, else the value. */
  readonly displayed: Accessor<string>;
  readonly setValue: (value: number) => void;
  readonly focus: () => void;
  readonly blur: () => void;
  /** Returns whether the key was consumed (the caller preventDefaults it). */
  readonly keyDown: (key: string) => boolean;
  /** Replaces the uncommitted draft (Base UI's "change"); needs focus. */
  readonly typeInput: (text: string) => void;
  readonly commit: () => void;
  readonly revert: () => void;
  readonly increment: () => void;
  readonly decrement: () => void;
  readonly setWrap: (wrap: boolean) => void;
  readonly inputProps: SpinbuttonInputProps;
  readonly incrementProps: SpinbuttonButtonProps;
  readonly decrementProps: SpinbuttonButtonProps;
}

/**
 * APG Spinbutton (https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/): a text
 * field plus increase / decrease buttons. Plain Solid signals, no elements, no
 * styling; verified against `specs/apg/spinbutton.qnt` by the differential walk
 * in `test/spinbutton.browser.test.tsx`.
 *
 * Native / polyfill / hybrid / library: **native** (`<input type=number>`) for
 * the clamping model; this primitive is the **hybrid** `role=spinbutton` text
 * field for the APG extras the native control lacks — Home/End jump to the
 * bounds, Page Up/Down use the large step, and a typed draft commits on
 * Enter/blur or reverts on Escape.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the committed value. Spin keys, the
 * stepper buttons, Enter and blur are requests the host may ignore; typing and
 * Escape change no committed value.
 *
 * ponytail: commit/revert on Enter/blur/Escape is the common convention, not
 * APG text.
 */
export const createSpinbutton = (options: SpinbuttonOptions = {}): Spinbutton => {
  const min = options.min ?? 1;
  const max = options.max ?? 12;
  const step = options.step ?? 1;
  const largeStep = options.largeStep ?? 3;
  const span = max - min + 1;
  const base = options.id ?? createUniqueId();

  const clamp = (value: number): number => Math.max(min, Math.min(max, value));
  const [value, request] = createControllable({
    value: () => options.value,
    initial: clamp(options.defaultValue ?? 5),
    onChange: () => options.onValueChange,
  });
  const [focused, setFocused] = createSignal(false);
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal("");
  const [wrap, setWrapSignal] = createSignal(options.wrap ?? false);

  const draftInRange = (text: string): boolean => {
    const number = Number(text);
    return text.trim() !== "" && number >= min && number <= max;
  };

  const commitValue = (next: number): void => request(clamp(next));

  const clearDraft = (): void => {
    setEditing(false);
    setDraft("");
  };

  const baseValue = (): number => (editing() && draftInRange(draft()) ? Number(draft()) : value());

  const up = (from: number, distance: number): number => {
    const candidate = from + distance;
    if (candidate <= max) {
      return candidate;
    }
    return wrap() ? candidate - span : max;
  };

  const down = (from: number, distance: number): number => {
    const candidate = from - distance;
    if (candidate >= min) {
      return candidate;
    }
    return wrap() ? candidate + span : min;
  };

  const applyStep = (direction: 1 | -1, distance: number): void => {
    const from = baseValue();
    const next = direction === 1 ? up(from, distance) : down(from, distance);
    clearDraft();
    commitValue(next);
  };

  const keyDown = (key: string): boolean => {
    if (!focused()) {
      return false;
    }
    switch (key) {
      case "ArrowUp":
        applyStep(1, step);
        return true;
      case "ArrowDown":
        applyStep(-1, step);
        return true;
      case "PageUp":
        applyStep(1, largeStep);
        return true;
      case "PageDown":
        applyStep(-1, largeStep);
        return true;
      case "Home":
        clearDraft();
        commitValue(min);
        return true;
      case "End":
        clearDraft();
        commitValue(max);
        return true;
      case "Enter":
        commit();
        return true;
      case "Escape":
        revert();
        return true;
      default:
        return false;
    }
  };

  const commit = (): void => {
    if (!focused()) {
      return;
    }
    const next = baseValue();
    clearDraft();
    commitValue(next);
  };

  const revert = (): void => {
    clearDraft();
  };

  const displayed = (): string => (editing() ? draft() : String(value()));

  const ariaDisabled = (atBound: boolean): "true" | undefined =>
    !wrap() && atBound ? "true" : undefined;

  return {
    value,
    focused,
    editing,
    draft,
    displayed,
    setValue: commitValue,
    focus: () => setFocused(true),
    blur: () => {
      const next = baseValue();
      clearDraft();
      setFocused(false);
      commitValue(next);
    },
    keyDown,
    typeInput: (text) => {
      if (!focused()) {
        return;
      }
      setEditing(true);
      setDraft(text);
    },
    commit,
    revert,
    increment: () => {
      setFocused(true);
      applyStep(1, step);
    },
    decrement: () => {
      setFocused(true);
      applyStep(-1, step);
    },
    setWrap: (next) => setWrapSignal(next),
    inputProps: {
      id: `${base}-input`,
      role: "spinbutton",
      get "aria-valuenow"() {
        return String(value());
      },
      "aria-valuemin": String(min),
      "aria-valuemax": String(max),
      get "aria-valuetext"() {
        return String(value());
      },
      get "aria-invalid"() {
        return editing() && !draftInRange(draft()) ? "true" : undefined;
      },
      get tabindex() {
        return 0;
      },
      get value() {
        return displayed();
      },
      onFocus: () => setFocused(true),
      onBlur: () => {
        const next = baseValue();
        clearDraft();
        setFocused(false);
        commitValue(next);
      },
      onKeyDown: (event) => {
        if (keyDown(event.key)) {
          event.preventDefault();
        }
      },
      onInput: (event) => {
        const target = event.currentTarget as HTMLInputElement | null;
        if (target !== null) {
          // a fresh typed value is a draft, mirroring `setDraft(text)`
          setEditing(true);
          setDraft(target.value);
        }
      },
    },
    incrementProps: {
      role: "button",
      tabindex: -1,
      "aria-label": "Increase",
      get "aria-disabled"() {
        return ariaDisabled(value() === max);
      },
      // keep focus on the text field: the steppers are not tab stops
      onMouseDown: (event) => event.preventDefault(),
      onClick: () => {
        setFocused(true);
        applyStep(1, step);
      },
    },
    decrementProps: {
      role: "button",
      tabindex: -1,
      "aria-label": "Decrease",
      get "aria-disabled"() {
        return ariaDisabled(value() === min);
      },
      onMouseDown: (event) => event.preventDefault(),
      onClick: () => {
        setFocused(true);
        applyStep(-1, step);
      },
    },
  };
};
