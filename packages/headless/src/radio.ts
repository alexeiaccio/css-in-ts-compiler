import { type Accessor, createEffect, createSignal, createUniqueId, onCleanup } from "solid-js";
import {
  type FocusGroupDefinition,
  type FocusGroupHandle,
  focusGroup,
  focusGroupAttribute,
  focusGroupPolyfill,
  supportsFocusGroup,
} from "./focusgroup";

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
  /** Forwarded to the DOM as `dir`: the direction the horizontal arrows follow. */
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
  /**
   * `"polyfill"` skips the feature detect and drives
   * `@microsoft/focusgroup-polyfill`'s low-level group even where the engine has
   * `focusgroup` (a test, or a host that knows it needs the polyfill). `"auto"`
   * by default.
   */
  readonly provider?: "auto" | "polyfill";
}

/** Spread onto the element with `role=radiogroup`. */
export interface RadioGroupProps {
  readonly role: "radiogroup";
  readonly "aria-orientation": "horizontal" | "vertical" | undefined;
  readonly "aria-activedescendant": string | undefined;
  /** `0` only in the activedescendant flavor; the roving group is not a tab stop. */
  readonly tabindex: 0 | undefined;
  /** The roving definition as the platform's attribute (`"radiogroup nomemory"`), absent otherwise. */
  readonly focusgroup: string | undefined;
  /** The direction the platform reads for the horizontal arrows. */
  readonly dir: "ltr" | "rtl" | undefined;
  /** Builds the platform's provider; the primitive's keydown and focusin listeners go around it. */
  readonly ref: (element: HTMLElement) => void;
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
  /** Roving only: the platform's start marker, on the radio Tab enters the group on. */
  readonly focusgroupstart: "" | undefined;
  /** Roving only: opts a disabled radio out of the group (arrows and the tab stop skip it). */
  readonly focusgroup: "none" | undefined;
  /**
   * Roving only: `-1` on a disabled radio — out of the tab order and out of the
   * group. Against the native engine every other radio carries `0`, because the
   * engine only navigates items that are focusable at all (`tabIndex > -1`, its
   * eligibility rule: a `<div role=radio>` is not); the controller still gives the
   * group one tab stop, at the start marker. With the polyfill the provider
   * writes `0` / `-1` itself, so the props leave every enabled radio alone.
   */
  readonly tabindex: 0 | -1 | undefined;
  readonly ref: (element: HTMLElement) => void;
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
 * `role=radio` is this primitive, which adds the one thing the platform leaves
 * to the pattern — selection follows focus.
 *
 * Roving (the default) is the platform's `focusgroup="radiogroup"` contract
 * (`shared/focusgroup.qnt`, `./focusgroup`): arrows along both axes, Home / End,
 * wrap and the item `tabindex` are the browser's (Chromium 150+) or the
 * `@microsoft/focusgroup-polyfill`'s, and the primitive never picks the stop. Two
 * deltas stay the library's, because the shared contract explicitly leaves
 * selection, activation and `aria-orientation` to the pattern:
 * - selection follows focus: the owner's `focusin` handler checks the radio the
 *   platform landed on (an arrow, Home or End), while a focus that arrives from
 *   outside (Tab, a click) only moves the focus state;
 * - the tab stop is the checked radio, else the first enabled one, wherever the
 *   focus happens to be. That is the APG rule the platform cannot express (it
 *   makes the focused item the tab stop), so the definition is `nomemory` with
 *   a `focusgroupstart` marker on that radio, re-derived after every focus move.
 * A disabled radio is out of the group's roving set (`focusgroup="none"`, as
 * `shared/focusgroup.qnt` prescribes for an item the platform must skip) and
 * keeps `tabindex="-1"` out of the tab order — the rule this spec has always
 * had for it.
 *
 * activedescendant keeps the whole keyboard in the primitive and does not build
 * a provider: focusgroup models DOM focus moving between items, and this flavor
 * deliberately keeps DOM focus on the group while `aria-activedescendant` names
 * the radio — the adapter's own gap list says `aria-activedescendant` focus
 * models are not a focusgroup.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the check. `click` and Space are
 * requests, and so is the check an arrow causes. Behaviour is checked against
 * `specs/apg/radio.qnt` by the scenario bridge.
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
  const dir = options.dir;

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

  /** The radio Tab enters the group on: the checked one, else the first enabled. */
  const stop = (): number => checked() ?? firstEnabled();

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

  /**
   * Which provider the roving flavor gets, decided once: `"polyfill"` forces the
   * polyfill, otherwise the engine's own where it has `focusgroup`.
   */
  const native = options.provider !== "polyfill" && supportsFocusGroup();

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
    moveFocus(stop());
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

  // --- the platform's half (roving) -----------------------------------------

  /** The elements the provider moves focus between, in index order, minus the disabled radios. */
  const elements = new Map<number, HTMLElement>();
  const itemElements = (): HTMLElement[] =>
    [...elements.entries()]
      .sort(([a], [b]) => a - b)
      .filter(([index]) => !isDisabled(index))
      .map(([, element]) => element);

  const elementIndex = (target: EventTarget | null): number => {
    if (!(target instanceof HTMLElement)) {
      return -1;
    }
    for (const [index, element] of elements) {
      if (element === target) {
        return index;
      }
    }
    return -1;
  };

  /**
   * One source for the attribute and for the polyfill's definition: a
   * `radiogroup` moves on both axes and wraps, and this radio group's tab stop is
   * the start marker rather than the last focused item (`nomemory`). The
   * definition's tokens are stated, not inferred: a definition handed to the
   * polyfill is never parsed from the attribute.
   */
  const definition = (): FocusGroupDefinition => ({
    behavior: "radiogroup",
    wrap: true,
    memory: false,
  });

  /** The definition as the `focusgroup` attribute; the forced polyfill keeps the native engine out. */
  const attribute = (): string | undefined =>
    flavor() !== "roving"
      ? undefined
      : options.provider === "polyfill"
        ? ""
        : focusGroupAttribute(definition());

  let group: FocusGroupHandle | undefined;
  let owner: HTMLElement | undefined;
  /**
   * An arrow / Home / End is about to move focus, so the focusin it causes is a
   * move and not an entry: that is the one that checks the radio it lands on.
   */
  let navigating = false;

  let reconcilePending = false;
  /**
   * A radio that is out of the roving set keeps the stop it had: the platform
   * never touches it again, so the primitive pins it — `-1` in the roving flavor
   * (out of the tab order, per this spec), no tabindex at all in activedescendant.
   */
  const pinDisabled = (): void => {
    for (const [index, element] of elements) {
      if (!isDisabled(index)) {
        continue;
      }
      if (flavor() === "roving") {
        element.setAttribute("tabindex", "-1");
      } else {
        element.removeAttribute("tabindex");
      }
    }
  };

  /** The platform reads the DOM, so re-derive its tab stop after a render. */
  const reconcile = (): void => {
    if (reconcilePending) {
      return;
    }
    reconcilePending = true;
    queueMicrotask(() => {
      reconcilePending = false;
      group?.update();
      pinDisabled();
    });
  };

  const attachGroup = (element: HTMLElement): void => {
    if (group !== undefined) {
      return;
    }
    const provider = native ? focusGroup : focusGroupPolyfill;
    group = provider(element, { definition: definition(), items: itemElements });
  };

  const detachGroup = (): void => {
    group?.destroy();
    group = undefined;
    // the polyfill restores the "authors'" tabindex values it recorded, and a
    // moving roving stop means those are its own: this flavor carries none
    for (const element of elements.values()) {
      element.removeAttribute("tabindex");
    }
  };

  /**
   * Before the provider's own keydown listener: a key the platform will act on is
   * marked here first, because the focusin it causes may arrive before Solid's
   * delegated `onKeyDown` (a document listener) runs.
   */
  const platformKeyDown = (event: KeyboardEvent): void => {
    if (flavor() !== "roving") {
      return;
    }
    if (navigates(event.key)) {
      navigating = true;
    }
  };

  /**
   * After the provider's own focusin listener, so the tab stop it just moved is
   * re-derived from the start marker: the APG tab stop is the checked radio, not
   * the radio the arrow landed on. Deferred to a microtask, because the platform
   * is still inside its own move (it writes the old item's `tabindex` after
   * `focus()` returns, which would overwrite the correction).
   */
  const focusIn = (event: FocusEvent): void => {
    if (flavor() !== "roving") {
      return;
    }
    const index = elementIndex(event.target);
    if (index < 0) {
      return;
    }
    const moved = navigating;
    navigating = false;
    moveFocus(index);
    if (moved) {
      select(index);
    }
    reconcile();
  };

  /**
   * The roving flavor's owner loses the focus by a radio's `focusout` (a `blur`
   * listener on the owner does not see it: the event does not bubble), so the
   * primitive's focus state is cleared here as well as by the props' `onBlur`.
   */
  const focusOut = (event: FocusEvent): void => {
    if (flavor() !== "roving") {
      return;
    }
    const next = event.relatedTarget;
    if (owner === undefined || !(next instanceof Node) || !owner.contains(next)) {
      blur();
    }
  };

  const detach = (): void => {
    owner?.removeEventListener("keydown", platformKeyDown);
    owner?.removeEventListener("focusin", focusIn);
    owner?.removeEventListener("focusout", focusOut);
    detachGroup();
    owner = undefined;
  };

  const attach = (element: HTMLElement): void => {
    if (owner !== undefined) {
      return;
    }
    owner = element;
    element.addEventListener("keydown", platformKeyDown);
    // the provider is built here, between the two listeners: activation, wrap and
    // the item tabindex are its business; the keydown flag precedes it and the
    // focusin correction follows it
    if (flavor() === "roving") {
      attachGroup(element);
    }
    element.addEventListener("focusin", focusIn);
    element.addEventListener("focusout", focusOut);
    onCleanup(detach);
    createEffect(
      () => ({ flavor: flavor(), stop: stop() }),
      (state) => {
        if (state.flavor !== "roving") {
          detachGroup();
          return;
        }
        attachGroup(element);
        // the platform lands Tab on the start marker, so a check that moved it must
        // reach the platform; the host may also write the controlled value
        reconcile();
      },
    );
  };

  // --- the primitive's half (both flavors) ----------------------------------

  const keyDown = (event: KeyboardEvent): void => {
    if (flavor() === "roving") {
      // movement is the platform's; Space is activation, which focusgroup does not provide
      if (event.key === " " || event.key === "Space") {
        const current = focused();
        if (current !== null) {
          select(current);
        }
        event.preventDefault();
      }
      return;
    }
    if (forwardKeys.includes(event.key) || backwardKeys.includes(event.key)) {
      const current = focused();
      if (current === null) {
        return;
      }
      const next = stepIndex(current, forwardKeys.includes(event.key) ? 1 : -1);
      moveFocus(next);
      select(next);
      return;
    }
    if (event.key === " " || event.key === "Space") {
      const current = focused();
      if (current !== null) {
        select(current);
      }
    }
  };

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
    click,
    setDisabled: (indices) => {
      setDisabledSet(new Set(indices));
      const current = checked();
      if (current !== null && indices.includes(current)) {
        commitLocal(-1);
      }
      setFocused(null);
      navigating = false;
      reconcile();
    },
    setFlavor: (next) => {
      setFlavorSignal(next);
      setFocused(null);
      navigating = false;
    },
    setPreselect: (index) => {
      commitLocal(index !== null && !isDisabled(index) ? index : -1);
      setFocused(null);
      navigating = false;
      reconcile();
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
      get focusgroup() {
        return attribute();
      },
      get dir() {
        return dir;
      },
      get ref() {
        return attach;
      },
      onKeyDown: (event) => {
        keyDown(event);
      },
      onFocus: () => {
        if (flavor() === "activedescendant" && focused() === null) {
          moveFocus(stop());
        }
      },
      onBlur: (event) => {
        // focus left the group: a related target inside it is another radio
        const target = event.relatedTarget;
        if (owner === undefined || !(target instanceof Node) || !owner.contains(target)) {
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
      get focusgroupstart() {
        // the roving tab stop, in the platform's own vocabulary
        return flavor() === "roving" && index === stop() ? "" : undefined;
      },
      get focusgroup() {
        return flavor() === "roving" && isDisabled(index) ? "none" : undefined;
      },
      get tabindex() {
        // the activedescendant flavor has no radio tab stop at all
        if (flavor() !== "roving") {
          return undefined;
        }
        // A radio is a `<div>`: only a tabindex makes it focusable, and the
        // polyfill's re-decoration restores this authored value, so a constant -1
        // keeps the focused radio focused. The native engine navigates only items
        // with `tabIndex > -1`, so there the author value is the tab stop's 0; both
        // providers then own the real roving stop (0 on one radio, -1 elsewhere).
        return isDisabled(index) || !native ? -1 : 0;
      },
      ref: (element) => {
        elements.set(index, element);
        reconcile();
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

/** A key the platform moves focus for, on a `radiogroup` (both axes, Home / End). */
const navigates = (key: string): boolean =>
  key === "ArrowDown" ||
  key === "ArrowUp" ||
  key === "ArrowLeft" ||
  key === "ArrowRight" ||
  key === "Home" ||
  key === "End";
