import {
  type Accessor,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  onSettled,
} from "solid-js";
import { createControllable } from "./controllable";
import {
  type FocusGroupDefinition,
  type FocusGroupHandle,
  focusGroup,
  focusGroupAttribute,
  focusGroupPolyfill,
} from "./focusgroup";

export type ListboxSelectionMode = "single" | "multiple" | "none";

export interface ListboxItem {
  readonly id: string;
  readonly label: string;
  /** Text matched by type-ahead (defaults to the label). */
  readonly textValue: string;
  readonly disabled: boolean;
}

export type ListboxItemInput =
  | string
  | {
      readonly id?: string;
      readonly label: string;
      readonly textValue?: string;
      readonly disabled?: boolean;
    };

export interface ListboxModifiers {
  readonly shift?: boolean;
  readonly ctrl?: boolean;
  readonly meta?: boolean;
  readonly alt?: boolean;
}

export interface ListboxOptions {
  /**
   * The options, in order. Pass a getter (`() => items()`) when the list
   * arrives later or changes: the primitive reads it at attribute-read time and
   * keeps its active option and selection across the change.
   */
  readonly items: ReadonlyArray<ListboxItemInput> | (() => ReadonlyArray<ListboxItemInput>);
  readonly selectionMode?: ListboxSelectionMode;
  /** Single-select only: moving the active option moves the selection with it. */
  readonly followsFocus?: boolean;
  /** Controlled selection: the host owns it and `value` is the only thing that changes it. */
  readonly value?: ReadonlyArray<number> | undefined;
  /** Uncontrolled starting selection; ignored while `value` is set. */
  readonly defaultValue?: ReadonlyArray<number>;
  /** Alias for `defaultValue` (kept for the existing API). */
  readonly defaultSelected?: ReadonlyArray<number>;
  /** Uncontrolled active option at mount. */
  readonly defaultActive?: number;
  /** Controlled active option: the type-ahead focus move's value. */
  readonly activeValue?: number | undefined;
  /** Option indices that cannot be selected or reached by navigation. */
  readonly disabled?: ReadonlyArray<number>;
  readonly focusOnHover?: boolean;
  /** Base for the generated option ids. */
  readonly id?: string;
  readonly label?: string | undefined;
  /**
   * A request to change the selection, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (selected: ReadonlyArray<number>) => void;
  /** Alias for `onValueChange` (kept for the existing API). */
  readonly onSelectionChange?: (selected: ReadonlyArray<number>) => void;
  /** A request to move the active option (the type-ahead focus move). */
  readonly onActiveChange?: (index: number) => void;
  /**
   * `"polyfill"` skips the feature detect and drives
   * `@microsoft/focusgroup-polyfill`'s low-level group even where the engine has
   * `focusgroup` (a test, or a host that knows it needs the polyfill). `"auto"`
   * by default.
   */
  readonly provider?: "auto" | "polyfill";
}

export interface ListboxProps {
  readonly role: "listbox";
  readonly "aria-multiselectable": "true" | "false" | undefined;
  readonly "aria-activedescendant": string | undefined;
  readonly "aria-label": string | undefined;
  /** The definition as the `focusgroup` attribute (`"listbox block nowrap"`). */
  readonly focusgroup: string;
  readonly ref: (element: HTMLElement) => void;
  readonly onFocusOut: (event: FocusEvent) => void;
}

/**
 * Spread onto an element with `role=option`. `focusgroup` is `"none"` on an
 * option the arrows must not reach, and `tabindex` is the constant focusability
 * value the platform needs, not the roving stop.
 */
export interface ListboxOptionProps {
  readonly id: string;
  readonly role: "option";
  readonly "aria-selected": "true" | "false";
  readonly "aria-disabled": "true" | undefined;
  readonly "aria-posinset": number;
  readonly "aria-setsize": number;
  readonly focusgroup: "none" | undefined;
  /**
   * The constant focusability value (`0`, or `-1` when disabled). The platform
   * owns WHICH option is the group's tab stop; the item only has to be focusable
   * for it to have a stop at all.
   */
  readonly tabindex: 0 | -1;
  readonly ref: (element: HTMLElement) => void;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onMouseEnter: () => void;
}

export interface Listbox {
  readonly active: Accessor<number>;
  readonly selected: Accessor<ReadonlyArray<number>>;
  readonly focused: Accessor<boolean>;
  readonly items: ReadonlyArray<ListboxItem>;
  readonly selectionMode: ListboxSelectionMode;
  /** Focus entry: the first selected option, else the first option. Returns the entry index. */
  readonly focus: () => number;
  readonly blur: () => void;
  /**
   * The keys the library owns (activation, the multi-select range modifiers,
   * type-ahead); the arrows and Home / End are the platform's, so they move
   * nothing here. A host that wants them programmatically focuses the option.
   */
  readonly keyDown: (key: string, modifiers?: ListboxModifiers) => void;
  /** Type-ahead input (one printable char). */
  readonly type: (text: string) => void;
  readonly clearTypeahead: () => void;
  readonly clickOption: (index: number) => void;
  readonly hoverOption: (index: number) => void;
  readonly setFollowsFocus: (value: boolean) => void;
  readonly listboxProps: ListboxProps;
  readonly optionProps: (index: number) => ListboxOptionProps;
}

const normalizeSelected = (indices: ReadonlyArray<number>, count: number): ReadonlyArray<number> =>
  [...new Set(indices)].filter((index) => index >= 0 && index < count).sort((a, b) => a - b);

const sameSelection = (a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * APG Listbox on Solid 2: state plus attribute objects, no elements, no
 * styling. One widget serves the three spec machines the scenarios use —
 * single-select (with optional selection-follows-focus), multi-select
 * (recommended model) and type-ahead — and is verified against each generated
 * model by a differential walk in `test/listbox.browser.test.tsx`.
 *
 * The roving tabindex is the platform's `focusgroup="listbox"` contract
 * (`shared/focusgroup.qnt`, `./focusgroup`): arrows along the block axis (no
 * wrap), Home / End, the last-focused memory and WHICH option is the tab stop
 * are the browser's (Chromium 150+) or `@microsoft/focusgroup-polyfill`'s, and
 * the primitive renders only the constant focusability value an item needs to be
 * in a group at all. `focus` / `active` are readings of the DOM: an option's
 * `focus` is the move, so a platform arrow (and a host's own `element.focus()`)
 * lands in the same state. The library owns only the spec's delta — the
 * selection model, `aria-selected`, range selection, type-ahead, and the
 * eligibility of a disabled option: the listbox's contract makes it unreachable,
 * so it is excluded from the item collection and wears `focusgroup="none"`,
 * because the platform reads only `aria-disabled` and would still move focus onto
 * it.
 *
 * `aria-activedescendant` is still emitted while the widget holds focus: it is
 * what the spec's bridge probes, and it is the focus model of a host that keeps
 * DOM focus on the container (a combobox popup, `createRearrangeableListbox`).
 * The adapter does NOT apply there — a focusgroup is a roving model that moves
 * real focus between items, an activedescendant listbox moves a highlight — so
 * that mode keeps its own arrow handling, as `listbox-rearrangeable.ts` does.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default
 * (`defaultValue` / `defaultSelected`); pass `value` + `onValueChange` to own
 * the selection, or `activeValue` + `onActiveChange` to own the active option
 * (the type-ahead value). Every user-intent selection change and every focus
 * move is a request the host may ignore.
 */
export const createListbox = (options: ListboxOptions): Listbox => {
  const base = options.id ?? createUniqueId();
  const source = (): ReadonlyArray<ListboxItemInput> =>
    typeof options.items === "function" ? options.items() : options.items;
  // The host re-renders one option at a time and each read walks every item, so
  // the normalized list is cached by the identity of the array it came from.
  let cachedSource: ReadonlyArray<ListboxItemInput> | undefined;
  let cachedItems: ReadonlyArray<ListboxItem> = [];
  const itemList = (): ReadonlyArray<ListboxItem> => {
    const next = source();
    if (next === cachedSource) {
      return cachedItems;
    }
    cachedSource = next;
    cachedItems = next.map((input, index) => {
      const label = typeof input === "string" ? input : input.label;
      const textValue = typeof input === "string" ? input : (input.textValue ?? input.label);
      const disabled = typeof input === "string" ? false : (input.disabled ?? false);
      const id =
        typeof input === "string"
          ? `${base}-option-${index}`
          : (input.id ?? `${base}-option-${index}`);
      return { id, label, textValue, disabled };
    });
    return cachedItems;
  };
  const count = (): number => itemList().length;
  const mode = options.selectionMode ?? "single";
  const focusOnHover = options.focusOnHover ?? false;
  /** `options.disabled` (fixed indices) or an item that says so itself. */
  const disabledIndices = new Set<number>(options.disabled ?? []);
  const isDisabled = (index: number): boolean =>
    disabledIndices.has(index) || (itemList()[index]?.disabled ?? false);
  const clamp = (index: number): number => Math.max(0, Math.min(index, Math.max(count() - 1, 0)));

  const [active, requestActive] = createControllable<number>({
    value: () => options.activeValue,
    initial: clamp(options.defaultActive ?? 0),
    onChange: () => options.onActiveChange,
  });
  const [rawSelected, requestSelection] = createControllable<ReadonlyArray<number>>({
    value: () => options.value,
    // Kept as given: `selected()` normalizes against the live count, so a
    // default chosen before the items arrived still lands once they do.
    initial: options.defaultValue ?? options.defaultSelected ?? [],
    onChange: () => options.onValueChange ?? options.onSelectionChange,
  });
  // The controlled host may hand back any order; the selection is a set.
  const selected = (): ReadonlyArray<number> => normalizeSelected(rawSelected(), count());
  let focusedFlag = false;
  let followsFlag = options.followsFocus ?? false;
  let anchorIndex: number | null = null;
  let buffer = "";
  const [focused, setFocused] = createSignal(false);
  const setFocusedValue = (value: boolean): void => {
    focusedFlag = value;
    setFocused(value);
  };

  const optionId = (index: number): string => itemList()[index]?.id ?? `${base}-option-${index}`;

  /** The option elements the provider moves focus between, in index order. */
  const elements = new Map<number, HTMLElement>();
  const itemElements = (): HTMLElement[] =>
    [...elements.entries()]
      .sort(([a], [b]) => a - b)
      // a removed option and a disabled one leave the group: the listbox's own
      // contract says the arrows cannot reach a disabled option, and the platform
      // sees only `aria-disabled` on it (a native `disabled` control it would skip)
      .filter(([index, element]) => element.isConnected && !isDisabled(index))
      .map(([, element]) => element);

  /** One source for the attribute and for the polyfill's definition. */
  const definition = (): FocusGroupDefinition => ({
    behavior: "listbox",
    axis: "block",
    wrap: false,
  });

  let group: FocusGroupHandle | undefined;
  let owner: HTMLElement | undefined;
  /**
   * A pointer press is in progress: the browser focuses the row before its click,
   * and the click is the gesture's one intent. Set by the owner's `pointerdown`,
   * cleared by any key, by the click and on leaving the list.
   */
  let pointerDown = false;
  const onPointerDown = (): void => {
    pointerDown = true;
  };

  /**
   * The owner's ref: the keydown listener goes on before the provider, so a key
   * the primitive consumes is already `preventDefault`ed when the polyfill's own
   * listener (also on the owner) reads it. A delegated Solid `onKeyDown` would run
   * at the document, after the polyfill has moved focus.
   */
  const attach = (element: HTMLElement): void => {
    if (owner === element) {
      return;
    }
    owner = element;
    element.addEventListener("keydown", keyDown);
    element.addEventListener("pointerdown", onPointerDown);
    const provider = options.provider === "polyfill" ? focusGroupPolyfill : focusGroup;
    group = provider(element, { definition: definition(), items: itemElements });
  };

  // the item set (a getter-backed list) or a disabled flag changed: re-collect
  createEffect(
    () => itemList(),
    () => {
      group?.update();
    },
  );

  onSettled(() => {
    // the owner's ref may run before its options' refs, so collect once more after the render
    group?.update();
  });

  onCleanup(() => {
    owner?.removeEventListener("keydown", keyDown);
    owner?.removeEventListener("pointerdown", onPointerDown);
    group?.destroy();
    group = undefined;
  });

  function clampActive(index: number): void {
    requestActive(clamp(index));
  }

  function firstEnabled(): number {
    let index = 0;
    while (index < count() && isDisabled(index)) {
      index += 1;
    }
    return index < count() ? index : 0;
  }

  function lastEnabled(): number {
    let index = count() - 1;
    while (index >= 0 && isDisabled(index)) {
      index -= 1;
    }
    return index >= 0 ? index : 0;
  }

  function stepIndex(from: number, delta: 1 | -1): number {
    let index = from;
    for (;;) {
      const next = index + delta;
      if (next < 0 || next >= count()) {
        return from;
      }
      index = next;
      if (!isDisabled(index)) {
        return index;
      }
    }
  }

  function clearTypeahead(): void {
    buffer = "";
  }

  function commit(next: ReadonlyArray<number>): void {
    const sorted = normalizeSelected(next, count());
    if (sameSelection(selected(), sorted)) {
      return;
    }
    requestSelection(sorted);
  }

  function entryIndex(): number {
    const current = selected();
    return current.length > 0 ? (current[0] ?? 0) : 0;
  }

  function toggle(index: number): void {
    const current = new Set(selected());
    if (current.has(index)) {
      current.delete(index);
      if (anchorIndex === index) {
        anchorIndex = null;
      }
    } else {
      current.add(index);
      anchorIndex = index;
    }
    commit([...current]);
  }

  function moveActive(index: number): void {
    clampActive(index);
    if (mode === "single" && followsFlag) {
      commit([index]);
    }
  }

  function rangeToEdge(edge: number): void {
    const current = active();
    const lo = edge === 0 ? 0 : current;
    const hi = edge === 0 ? current : count() - 1;
    const next = new Set(selected());
    for (let index = lo; index <= hi; index += 1) {
      next.add(index);
    }
    clampActive(edge);
    commit([...next]);
  }

  function shiftArrow(delta: 1 | -1): void {
    const target = stepIndex(active(), delta);
    if (target === active()) {
      return;
    }
    clampActive(target);
    toggle(target);
  }

  function shiftSpace(): void {
    const anchorValue = anchorIndex ?? active();
    const lo = Math.min(anchorValue, active());
    const hi = Math.max(anchorValue, active());
    const next = new Set(selected());
    for (let index = lo; index <= hi; index += 1) {
      next.add(index);
    }
    anchorIndex = anchorValue;
    commit([...next]);
  }

  function selectAllOrClear(): void {
    if (selected().length === count()) {
      commit([]);
      return;
    }
    commit(itemList().map((_, index) => index));
  }

  function findMatch(start: number, text: string): number | null {
    const needle = text.toLowerCase();
    for (let offset = 0; offset < count(); offset += 1) {
      const index = (start + offset) % count();
      const item = itemList()[index];
      if (item !== undefined && item.textValue.toLowerCase().startsWith(needle)) {
        return index;
      }
    }
    return null;
  }

  function type(text: string): void {
    if (!focusedFlag) {
      return;
    }
    const fresh = buffer.length === 0;
    const next = buffer + text;
    buffer = next;
    const start = fresh ? (active() + 1) % count() : active();
    const match = findMatch(start, next);
    if (match !== null) {
      clampActive(match);
    }
  }

  function handleKey(key: string, modifiers: ListboxModifiers): boolean {
    const shift = modifiers.shift === true;
    const ctrl = modifiers.ctrl === true || modifiers.meta === true;
    const alt = modifiers.alt === true;

    if (mode === "single" || mode === "none") {
      if (key.length === 1 && key !== " " && !ctrl && !alt) {
        type(key);
        return true;
      }
      if (key === " " && buffer.length > 0 && !ctrl && !alt) {
        type(" ");
        return true;
      }
      if (!focusedFlag) {
        return false;
      }
      clearTypeahead();
      switch (key) {
        case " ":
        case "Space":
        case "Enter":
          if (mode !== "single") {
            return false;
          }
          commit([active()]);
          break;
        default:
          return false;
      }
      return true;
    }

    if (!focusedFlag) {
      return false;
    }
    clearTypeahead();
    if (ctrl && shift) {
      if (key === "Home") {
        rangeToEdge(0);
        return true;
      }
      if (key === "End") {
        rangeToEdge(count() - 1);
        return true;
      }
      return false;
    }
    if (ctrl) {
      if (key === "a" || key === "A") {
        selectAllOrClear();
        return true;
      }
      // Ctrl+Arrow / Ctrl+Space are not handled in the recommended model
      return key === " " || key === "ArrowDown" || key === "ArrowUp";
    }
    if (shift) {
      if (key === " ") {
        shiftSpace();
        return true;
      }
      if (key === "ArrowDown" || key === "ArrowUp") {
        shiftArrow(key === "ArrowDown" ? 1 : -1);
        return true;
      }
      return false;
    }
    switch (key) {
      case " ":
      case "Space":
        toggle(active());
        break;
      default:
        return false;
    }
    return true;
  }

  /** Where a plain navigation key lands, by the platform's own item set (the enabled options). */
  function navTarget(key: string): number | null {
    switch (key) {
      case "ArrowDown":
        return stepIndex(active(), 1);
      case "ArrowUp":
        return stepIndex(active(), -1);
      case "Home":
        return firstEnabled();
      case "End":
        return lastEnabled();
      default:
        return null;
    }
  }

  /**
   * The DOM half: the primitive prevents the keys it owns — activation, the
   * selection modifiers and type-ahead — so they never reach the provider, which
   * owns the movement (arrows, Home / End). Shift / Ctrl / Meta + arrow are
   * ignored by the platform, so the multi-select range keys move the active
   * option themselves and the host's focus mirror follows (see the docs).
   *
   * One movement the provider cannot report: a key that lands on the active
   * option already (an edge, or a run of disabled options) fires no `focus`, so
   * the selection-follows-focus intent for that option is committed here.
   */
  function keyDown(event: KeyboardEvent): void {
    pointerDown = false;
    const plain = !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (plain && mode === "single" && followsFlag) {
      const target = navTarget(event.key);
      if (target !== null && target === active()) {
        commit([target]);
      }
    }
    const handled = handleKey(event.key, {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      alt: event.altKey,
    });
    if (handled) {
      event.preventDefault();
    }
  }

  return {
    active,
    selected,
    focused,
    get items() {
      return itemList();
    },
    selectionMode: mode,
    focus: () => {
      if (focusedFlag) {
        return active();
      }
      setFocusedValue(true);
      if (mode === "none") {
        return active();
      }
      const target = entryIndex();
      clampActive(target);
      if (mode === "single" && followsFlag) {
        commit([target]);
      }
      return target;
    },
    blur: () => {
      if (!focusedFlag) {
        return;
      }
      setFocusedValue(false);
      clearTypeahead();
    },
    keyDown: (key, modifiers = {}) => {
      handleKey(key, modifiers);
    },
    type,
    clearTypeahead,
    clickOption: (index) => {
      if (isDisabled(index)) {
        return;
      }
      setFocusedValue(true);
      clampActive(index);
      if (mode === "single") {
        commit([index]);
      } else if (mode === "multiple") {
        toggle(index);
      }
    },
    hoverOption: (index) => {
      if (!focusOnHover || isDisabled(index)) {
        return;
      }
      setFocusedValue(true);
      clampActive(index);
    },
    setFollowsFocus: (value) => {
      followsFlag = value;
      if (value && focusedFlag && mode === "single") {
        commit([active()]);
      }
    },
    listboxProps: {
      role: "listbox",
      get "aria-multiselectable"() {
        if (mode === "multiple") {
          return "true";
        }
        return mode === "single" ? "false" : undefined;
      },
      get "aria-activedescendant"() {
        return focused() ? optionId(active()) : undefined;
      },
      get "aria-label"() {
        return options.label;
      },
      get focusgroup() {
        // the forced polyfill path keeps the native engine out of the group
        return options.provider === "polyfill" ? "" : focusGroupAttribute(definition());
      },
      get ref() {
        return attach;
      },
      onFocusOut: (event) => {
        const current = event.currentTarget;
        const next = event.relatedTarget;
        if (current instanceof Node && next instanceof Node && current.contains(next)) {
          return;
        }
        pointerDown = false;
        if (focusedFlag) {
          setFocusedValue(false);
          clearTypeahead();
        }
      },
    },
    optionProps: (index) => ({
      id: optionId(index),
      role: "option",
      get "aria-selected"() {
        return selected().includes(index) ? "true" : "false";
      },
      get "aria-disabled"() {
        return isDisabled(index) ? "true" : undefined;
      },
      "aria-posinset": index + 1,
      get "aria-setsize"() {
        return count();
      },
      get focusgroup() {
        return isDisabled(index) ? ("none" as const) : undefined;
      },
      // the platform owns WHICH option is the tab stop; the item must be
      // focusable for it to own a stop at all (the polyfill's own recipe is
      // tabindex="0" on every item), and a disabled option stays out of the
      // sequential order as well as out of the group
      get tabindex(): 0 | -1 {
        return isDisabled(index) ? -1 : 0;
      },
      ref: (element: HTMLElement) => {
        elements.set(index, element);
      },
      onClick: () => {
        pointerDown = false;
        if (isDisabled(index)) {
          return;
        }
        setFocusedValue(true);
        clampActive(index);
        if (mode === "single") {
          commit([index]);
        } else if (mode === "multiple") {
          toggle(index);
        }
      },
      onFocus: () => {
        setFocusedValue(true);
        if (pointerDown) {
          // the browser focuses the row before its click: the click is the intent,
          // so this move must not also commit the follows-focus selection
          clampActive(index);
          return;
        }
        // DOM focus is the move: the platform's arrow already moved it here
        moveActive(index);
        // a controlled active may refuse the move; the DOM focus has already
        // moved, so put it back on the option the state names
        const held = active();
        if (held !== index) {
          elements.get(held)?.focus();
        }
      },
      onMouseEnter: () => {
        if (!focusOnHover || isDisabled(index)) {
          return;
        }
        setFocusedValue(true);
        clampActive(index);
      },
    }),
  };
};
