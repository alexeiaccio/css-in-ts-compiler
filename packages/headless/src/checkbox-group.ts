import { type Accessor, createSignal } from "solid-js";
import { createControllable } from "./controllable";
import { createField, type FieldErrorProps } from "./field";

export type CheckboxGroupFocus = "none" | "parent" | "c0" | "c1" | "c2";
export type ParentChecked = "true" | "false" | "mixed";

export interface CheckboxGroupOptions<T = unknown> {
  /** Exactly three child values; the observable value is the checked subset. */
  readonly values: ReadonlyArray<T>;
  /** Controlled: the host owns the checked subset and this is the only thing that changes it. */
  readonly value?: ReadonlyArray<T> | undefined;
  /** Uncontrolled starting checked subset; ignored while `value` is set. */
  readonly defaultValue?: ReadonlyArray<T>;
  /** Controller participates in focus order (its `aria-checked` is always derived). */
  readonly parent?: boolean;
  /** Remember the last mixed combination for the controller's third activation. */
  readonly remember?: boolean;
  /** Base of the group's ids (`<id>-control`, `-error`); a unique one when absent. */
  readonly id?: string;
  /** The group's name, as `aria-label`: a `role="group"` needs one. */
  readonly label?: string | undefined;
  /** The id of the element that names the group (`aria-labelledby`); wins over `label`. */
  readonly labelledby?: string | undefined;
  /** Ids of elements the host owns that describe the group, after the group's own error id. */
  readonly describedby?: string | undefined;
  /**
   * `true` marks the group invalid; a string does too and is the error message
   * (unless `error` is set). `false` forces valid. Left out, the group is invalid
   * exactly when it has an error message. Same contract as `createField`.
   */
  readonly invalid?: boolean | string | undefined;
  /** The error message; absent (or empty) means no error element. */
  readonly error?: string | undefined;
  /**
   * A request to change the checked subset, called when the intent differs from
   * the current value. Uncontrolled it is accepted; controlled the host may
   * ignore it.
   */
  readonly onValueChange?: (checked: ReadonlyArray<T>) => void;
  readonly onFocus?: (target: string) => void;
  readonly onBlur?: () => void;
}

/** Spread onto the controller element with `role=checkbox`. */
export interface CheckboxGroupParentProps {
  readonly role: "checkbox";
  readonly "aria-checked": ParentChecked;
  readonly tabindex: 0;
  readonly onClick: () => void;
  readonly onFocus: () => void;
}

/** Spread onto a child element with `role=checkbox`. */
export interface CheckboxGroupChildProps {
  readonly id: string;
  readonly role: "checkbox";
  readonly "aria-checked": "true" | "false";
  readonly tabindex: 0;
  readonly onClick: () => void;
  readonly onFocus: () => void;
}

export interface CheckboxGroupProps {
  /** The group element: a host's label can name it, and a controller can `aria-controls` it. */
  readonly id: string;
  readonly role: "group";
  readonly "aria-label": string | undefined;
  readonly "aria-labelledby": string | undefined;
  /** The error id while one is shown, then the host's `describedby`. */
  readonly "aria-describedby": string | undefined;
  readonly "aria-invalid": "true" | undefined;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/** The error element: render it always, it is `hidden` while there is no error. */
export type CheckboxGroupErrorProps = FieldErrorProps;

export interface CheckboxGroup<T = unknown> {
  readonly children: Accessor<ReadonlyArray<boolean>>;
  readonly memory: Accessor<ReadonlyArray<boolean>>;
  readonly remember: Accessor<boolean>;
  readonly focused: Accessor<CheckboxGroupFocus>;
  readonly parentChecked: Accessor<ParentChecked>;
  readonly checkedValues: () => ReadonlyArray<T>;
  /** The error shown: `undefined` unless the group is invalid and has a message. */
  readonly error: () => string | undefined;
  readonly invalid: () => boolean;
  /**
   * The ids `aria-describedby` lists now: the error (never while it is hidden),
   * then the host's `describedby`.
   */
  readonly describedIds: () => readonly string[];
  readonly click: (target: CheckboxGroupFocus) => void;
  readonly keySpace: () => void;
  readonly keyTab: () => void;
  readonly focusOn: (target: CheckboxGroupFocus) => void;
  readonly blur: () => void;
  readonly setRemember: (value: boolean) => void;
  readonly setChildren: (children: ReadonlyArray<boolean>) => void;
  readonly groupProps: CheckboxGroupProps;
  readonly errorProps: CheckboxGroupErrorProps;
  readonly parentProps: CheckboxGroupParentProps;
  readonly childProps: (index: 0 | 1 | 2) => CheckboxGroupChildProps;
}

const CHILDREN: ReadonlyArray<"c0" | "c1" | "c2"> = ["c0", "c1", "c2"];

const isAll = (values: ReadonlyArray<boolean>): boolean => values.every((value) => value);
const isNone = (values: ReadonlyArray<boolean>): boolean => values.every((value) => !value);
const isMixed = (values: ReadonlyArray<boolean>): boolean => !isAll(values) && !isNone(values);

const normalizeChildren = (values: ReadonlyArray<boolean>): ReadonlyArray<boolean> => [
  values[0] === true,
  values[1] === true,
  values[2] === true,
];

const b2i = (value: boolean): number => (value ? 1 : 0);
const packed = (children: ReadonlyArray<boolean>): number =>
  b2i(children[0] === true) + 2 * b2i(children[1] === true) + 4 * b2i(children[2] === true);
const bitAt = (packedValue: number, index: number): boolean =>
  Math.floor(packedValue / 2 ** index) % 2 === 1;

const nextFocus = (focus: CheckboxGroupFocus): CheckboxGroupFocus => {
  switch (focus) {
    case "none":
      return "parent";
    case "parent":
      return "c0";
    case "c0":
      return "c1";
    case "c1":
      return "c2";
    default:
      return "none";
  }
};

/**
 * APG Checkbox pattern's tri-state group controller
 * (https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/): a controller whose
 * `aria-checked` is derived from three children (all/none/mixed), plus the
 * optional "remember the last mixed combination" cycle. Platform choice
 * (packages/headless/docs/apg-platform-features.md): **native** checkboxes; the
 * controller is a third checkbox with `aria-checked=mixed`.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the checked subset. The checked set is
 * packed internally so it rides the scalar `createControllable`.
 *
 * The name, the description and the error are `createField`'s contract on the
 * `role="group"` element (`aria-label` / `aria-labelledby`, `aria-describedby`,
 * `aria-invalid`, an error element that is `role="alert"` while it is shown), so
 * a group reads like the fields around it. The group is not a `<label for>`
 * target: a host names a visible label element's id with `labelledby`, or passes
 * `label` without one.
 *
 * Behaviour is checked against `specs/apg/checkbox-group.qnt` by the bridge. That
 * model leaves labelling out on purpose ("shift+Tab, accessible names,
 * fieldset/legend or role=group labelling" in its header), so the field contract
 * is checked by plain assertions in `test/checkbox-group.browser.test.tsx`.
 */
export const createCheckboxGroup = <T = unknown>(
  options: CheckboxGroupOptions<T>,
): CheckboxGroup<T> => {
  const values = options.values;
  const packedOf = (labels: ReadonlyArray<T>): number =>
    packed(values.map((value) => labels.includes(value)));
  const labelsOf = (packedValue: number): ReadonlyArray<T> =>
    values.filter((_, index) => bitAt(packedValue, index));

  const [packedChildren, requestPacked] = createControllable<number>({
    value: () => (options.value === undefined ? undefined : packedOf(options.value)),
    initial: packedOf(options.defaultValue ?? []),
    onChange: () => (next: number) => options.onValueChange?.(labelsOf(next)),
  });
  const field = createField({
    id: options.id,
    get invalid() {
      return options.invalid;
    },
    get error() {
      return options.error;
    },
    get describedby() {
      return options.describedby;
    },
  });
  const [memory, setMemory] = createSignal<ReadonlyArray<boolean>>(normalizeChildren([]));
  const [remember, setRememberSignal] = createSignal(options.remember === true);
  const [focused, setFocused] = createSignal<CheckboxGroupFocus>("none");

  const children = (): ReadonlyArray<boolean> =>
    [0, 1, 2].map((index) => bitAt(packedChildren(), index));

  const label = (focus: CheckboxGroupFocus): string =>
    focus === "parent" ? "checkbox:parent" : `checkbox:${focus.slice(1)}`;

  const selectedValues = (state: ReadonlyArray<boolean>): ReadonlyArray<T> => {
    const result: T[] = [];
    for (const index of [0, 1, 2]) {
      if (state[index] === true) {
        const value = values[index];
        if (value !== undefined) {
          result.push(value);
        }
      }
    }
    return result;
  };

  const parentChecked = (): ParentChecked => {
    const current = children();
    return isAll(current) ? "true" : isNone(current) ? "false" : "mixed";
  };

  const moveFocus = (next: CheckboxGroupFocus): void => {
    const previous = focused();
    if (previous === next) {
      return;
    }
    setFocused(next);
    if (previous !== "none") {
      options.onBlur?.();
    }
    if (next !== "none") {
      options.onFocus?.(label(next));
    }
  };

  const activate = (target: CheckboxGroupFocus): void => {
    if (target === "none") {
      return;
    }
    const current = children();
    const saved = memory();
    const allChecked = isAll(current);
    const restore = remember() && isNone(current) && isMixed(saved) && target === "parent";
    const next = current.map((value, index) => {
      if (target === CHILDREN[index]) {
        return !value;
      }
      if (target === "parent") {
        return allChecked ? false : restore ? (saved[index] ?? false) : true;
      }
      return value;
    });
    const mixedNow = isMixed(current);
    const nextMemory = current.map((value, index) => (mixedNow ? value : (saved[index] ?? false)));
    setMemory(nextMemory);
    moveFocus(target);
    const nextPacked = packed(next);
    if (nextPacked !== packedChildren()) {
      requestPacked(nextPacked);
    }
  };

  return {
    children,
    memory,
    remember,
    focused,
    parentChecked,
    checkedValues: () => selectedValues(children()),
    error: field.error,
    invalid: field.invalid,
    describedIds: field.describedIds,
    click: (target) => {
      activate(target);
    },
    keySpace: () => {
      activate(focused());
    },
    keyTab: () => {
      moveFocus(nextFocus(focused()));
    },
    focusOn: (target) => {
      moveFocus(target);
    },
    blur: () => {
      moveFocus("none");
    },
    setRemember: (value) => {
      setRememberSignal(value);
    },
    setChildren: (next) => {
      requestPacked(packed(normalizeChildren(next)));
    },
    groupProps: {
      id: field.controlProps.id,
      role: "group",
      get "aria-label"() {
        return options.label;
      },
      get "aria-labelledby"() {
        return options.labelledby;
      },
      get "aria-describedby"() {
        return field.controlProps["aria-describedby"];
      },
      get "aria-invalid"() {
        return field.controlProps["aria-invalid"];
      },
      onKeyDown: (event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          moveFocus(nextFocus(focused()));
        } else if (event.key === " ") {
          event.preventDefault();
          activate(focused());
        }
      },
    },
    errorProps: field.errorProps,
    parentProps: {
      role: "checkbox",
      get "aria-checked"() {
        return parentChecked();
      },
      tabindex: 0,
      onClick: () => {
        activate("parent");
      },
      onFocus: () => {
        moveFocus("parent");
      },
    },
    childProps: (index) => ({
      id: `${index}`,
      role: "checkbox",
      get "aria-checked"() {
        return children()[index] === true ? "true" : "false";
      },
      tabindex: 0,
      onClick: () => {
        activate(CHILDREN[index] ?? "c0");
      },
      onFocus: () => {
        moveFocus(CHILDREN[index] ?? "c0");
      },
    }),
  };
};
