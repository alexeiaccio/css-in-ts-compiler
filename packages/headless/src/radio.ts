import { type Accessor, createSignal, createUniqueId } from "solid-js";

export type RadioFlavor = "roving" | "activedescendant";

export interface RadioGroupOptions<T = unknown> {
  /** Radio values, one per radio; the observable `value` is the checked one. A getter is fine. */
  readonly values: ReadonlyArray<T> | (() => ReadonlyArray<T>);
  /**
   * Controlled: the host owns the checked value and this is the only thing that
   * changes it. Pass a getter (`() => checked()`) when the check follows a
   * signal, or when "nothing checked" is a real controlled state: an accessor
   * that returns `undefined` is still controlled, while the bare `undefined`
   * prop means uncontrolled.
   */
  readonly value?: T | (() => T | undefined) | undefined;
  /** Uncontrolled starting checked value; ignored while `value` is set. */
  readonly defaultValue?: T | undefined;
  /** Roving tabindex (default) or `aria-activedescendant` on the group. */
  readonly flavor?: RadioFlavor;
  /** Indices that are never focused, checked or the tab stop. */
  readonly disabled?: ReadonlyArray<number>;
  readonly orientation?: "horizontal" | "vertical";
  readonly dir?: "ltr" | "rtl";
  readonly id?: string;
  readonly describedby?: string | undefined;
  /**
   * A request to check a radio, called with its value when the intent differs
   * from the current one. Uncontrolled it is accepted; controlled the host may
   * ignore it.
   */
  readonly onValueChange?: (value: T) => void;
  readonly onFocus?: (target: string) => void;
  readonly onBlur?: (target: string) => void;
}

/** Spread onto the element with `role=radiogroup`. */
export interface RadioGroupProps {
  readonly role: "radiogroup";
  readonly "aria-orientation": "horizontal" | "vertical" | undefined;
  readonly "aria-activedescendant": string | undefined;
  readonly tabindex: 0 | undefined;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onFocus: () => void;
  readonly onBlur: (event: FocusEvent) => void;
}

/** Spread onto an element with `role=radio`. */
export interface RadioProps {
  readonly id: string;
  readonly role: "radio";
  readonly "aria-checked": "true" | "false";
  readonly "aria-disabled": "true" | "false";
  readonly "aria-describedby": string | undefined;
  /** Inert on a `<div role=radio>`; on a `<button role=radio>` it keeps a surrounding form from submitting. */
  readonly type: "button";
  readonly tabindex: 0 | -1 | undefined;
  readonly onClick: () => void;
  readonly onFocus: () => void;
}

export interface RadioGroup<T = unknown> {
  readonly checked: Accessor<number | null>;
  readonly focused: Accessor<number | null>;
  readonly flavor: Accessor<RadioFlavor>;
  readonly values: ReadonlyArray<T>;
  readonly value: () => T | null;
  readonly focus: () => void;
  readonly blur: () => void;
  readonly keyDown: (key: string) => void;
  readonly click: (index: number) => void;
  readonly setDisabled: (indices: ReadonlyArray<number>) => void;
  readonly setFlavor: (flavor: RadioFlavor) => void;
  readonly setPreselect: (index: number | null) => void;
  readonly radiogroupProps: RadioGroupProps;
  readonly radioProps: (index: number) => RadioProps;
}

/**
 * APG Radio Group (https://www.w3.org/WAI/ARIA/apg/patterns/radio/): a
 * `radiogroup` with `role=radio` items. Platform choice (packages/headless/docs/
 * apg-platform-features.md): **native** `<input type=radio name>`; custom
 * `role=radio` needs selection-follows-focus, which this primitive implements —
 * arrows move focus AND check the next/previous enabled radio (wrapping), Space
 * checks the focused radio, Tab enters on the checked radio.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the check. `click`, `keyDown` and Space
 * are requests. Behaviour is checked against `specs/apg/radio.qnt` by the
 * scenario bridge.
 *
 * ponytail: the request/commit split is inlined rather than using
 * `createControllable`, because the config remounts (`setPreselect`,
 * `setDisabled`) must write the uncontrolled local without firing the request
 * callback, which `createControllable` does not expose.
 */
export const createRadioGroup = <T = unknown>(options: RadioGroupOptions<T>): RadioGroup<T> => {
  const valueList = (): ReadonlyArray<T> =>
    typeof options.values === "function" ? options.values() : options.values;
  const count = (): number => valueList().length;
  const base = options.id ?? createUniqueId();
  const dir = options.dir ?? "ltr";

  const indexOfValue = (value: T | undefined): number => {
    if (value === undefined) {
      return -1;
    }
    const index = valueList().indexOf(value);
    return index >= 0 ? index : -1;
  };

  const initial = indexOfValue(options.defaultValue);
  const [localChecked, setLocalChecked] = createSignal<number>(
    initial >= 0 && initial < count() ? initial : -1,
  );
  const [focused, setFocused] = createSignal<number | null>(null);
  const [disabledSet, setDisabledSet] = createSignal<ReadonlySet<number>>(
    new Set(options.disabled ?? []),
  );
  const [flavor, setFlavorSignal] = createSignal<RadioFlavor>(options.flavor ?? "roving");

  // the controlled value prop wins; the bare `undefined` prop is uncontrolled,
  // while a getter may return `undefined` for "nothing checked"
  const controlled = (): boolean => options.value !== undefined;
  const controlledIndex = (): number => {
    const value = options.value;
    const current = typeof value === "function" ? (value as () => T | undefined)() : value;
    return indexOfValue(current);
  };
  const checkedIndex = (): number => (controlled() ? controlledIndex() : localChecked());
  const checked = (): number | null => {
    const index = checkedIndex();
    return index >= 0 ? index : null;
  };

  /** A request: fires onValueChange when the intent differs, commits only uncontrolled. */
  const request = (next: number): void => {
    if (next === checkedIndex()) {
      return;
    }
    if (!controlled()) {
      setLocalChecked(next);
    }
    const value = valueList()[next];
    if (value !== undefined) {
      options.onValueChange?.(value);
    }
  };

  /** A config remount writes the uncontrolled local directly (no request). */
  const commitLocal = (index: number): void => {
    setLocalChecked(index);
  };

  const isDisabled = (index: number): boolean => disabledSet().has(index);

  const firstEnabled = (): number => {
    for (let index = 0; index < count(); index += 1) {
      if (!isDisabled(index)) {
        return index;
      }
    }
    return 0;
  };

  const tabStop = (): number => checked() ?? firstEnabled();

  const stepIndex = (from: number, delta: 1 | -1): number => {
    for (let offset = 1; offset <= count(); offset += 1) {
      const index = (((from + delta * offset) % count()) + count()) % count();
      if (!isDisabled(index)) {
        return index;
      }
    }
    return from;
  };

  const label = (index: number): string => `radio:${index}`;

  const value = (): T | null => {
    const index = checked();
    return index === null ? null : (valueList()[index] ?? null);
  };

  const select = (index: number): void => {
    if (index < 0 || index >= count() || isDisabled(index)) {
      return;
    }
    request(index);
  };

  const moveFocus = (next: number): void => {
    const previous = focused();
    if (previous === next) {
      return;
    }
    setFocused(next);
    if (previous !== null) {
      options.onBlur?.(label(previous));
    }
    options.onFocus?.(label(next));
  };

  const focus = (): void => {
    if (focused() !== null) {
      return;
    }
    moveFocus(tabStop());
  };

  const blur = (): void => {
    const previous = focused();
    if (previous === null) {
      return;
    }
    setFocused(null);
    options.onBlur?.(label(previous));
  };

  const click = (index: number): void => {
    if (isDisabled(index)) {
      return;
    }
    moveFocus(index);
    select(index);
  };

  const forwardKeys = dir === "rtl" ? ["ArrowDown", "ArrowLeft"] : ["ArrowDown", "ArrowRight"];
  const backwardKeys = dir === "rtl" ? ["ArrowUp", "ArrowRight"] : ["ArrowUp", "ArrowLeft"];

  const keyDown = (key: string): void => {
    if (forwardKeys.includes(key) || backwardKeys.includes(key)) {
      const current = focused();
      if (current === null) {
        return;
      }
      const next = stepIndex(current, forwardKeys.includes(key) ? 1 : -1);
      moveFocus(next);
      select(next);
      return;
    }
    if (key === " " || key === "Space") {
      const current = focused();
      if (current !== null) {
        select(current);
      }
    }
  };

  const groupContains = (target: EventTarget | null): boolean => target instanceof Node;

  return {
    checked,
    focused,
    flavor,
    get values() {
      return valueList();
    },
    value,
    focus,
    blur,
    keyDown,
    click,
    setDisabled: (indices) => {
      setDisabledSet(new Set(indices));
      const current = checked();
      if (current !== null && indices.includes(current)) {
        commitLocal(-1);
      }
      setFocused(null);
    },
    setFlavor: (next) => {
      setFlavorSignal(next);
      setFocused(null);
    },
    setPreselect: (index) => {
      commitLocal(index !== null && !isDisabled(index) ? index : -1);
      setFocused(null);
    },
    radiogroupProps: {
      role: "radiogroup",
      get "aria-orientation"() {
        return options.orientation;
      },
      get "aria-activedescendant"() {
        const current = focused();
        return flavor() === "activedescendant" && current !== null
          ? `${base}-radio-${current}`
          : undefined;
      },
      get tabindex() {
        return flavor() === "activedescendant" ? 0 : undefined;
      },
      onKeyDown: (event) => {
        keyDown(event.key);
      },
      onFocus: () => {
        if (flavor() === "activedescendant" && focused() === null) {
          moveFocus(tabStop());
        }
      },
      onBlur: (event) => {
        if (!groupContains(event.relatedTarget)) {
          blur();
        }
      },
    },
    radioProps: (index) => ({
      id: `${base}-radio-${index}`,
      role: "radio",
      get "aria-checked"() {
        return checked() === index ? "true" : "false";
      },
      get "aria-disabled"() {
        return isDisabled(index) ? "true" : "false";
      },
      get "aria-describedby"() {
        return options.describedby;
      },
      type: "button",
      get tabindex() {
        return flavor() === "roving" ? (index === tabStop() ? 0 : -1) : undefined;
      },
      onClick: () => {
        click(index);
      },
      onFocus: () => {
        if (focused() !== index) {
          moveFocus(index);
        }
      },
    }),
  };
};
