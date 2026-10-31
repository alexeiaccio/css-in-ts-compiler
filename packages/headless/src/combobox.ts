import { type Accessor, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

/**
 * APG combobox (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): state plus
 * getter-backed attribute objects for a listbox popup. No elements, no styling.
 *
 * The behaviour mirrors `specs/apg/combobox-select-only.qnt`: DOM focus never
 * leaves the combobox, the popup's active option is exposed through
 * `aria-activedescendant`, and navigating never commits — Enter / Space / Tab /
 * blur / Alt+ArrowUp / an option click / `setValue` do. `filter: true` switches
 * typing from typeahead to a prefix filter (the autocomplete variant).
 *
 * `disabled` is a widget-level extension of the pattern (the spec lists it
 * under its deliberate omissions): the combobox keeps its tab stop and
 * announces `aria-disabled`, the trigger announces it too, a key, a click, a
 * typeahead character, a filter input and an option click are dropped before
 * they become a request, and no popup opens. `setOpen` / `setValue` are host
 * requests, so they still apply.
 *
 * Request/commit (map ticket `rt1p`): both the selected value and the popup are
 * controllable. Uncontrolled by default (`defaultSelectedValue` / `defaultOpen`);
 * pass `value` / `open` (+ `onValueChange` / `onOpenChange`) to own them. Every
 * user change is a request the host may ignore; `setValue` / `setOpen` are
 * programmatic requests too.
 *
 * ponytail: `activeIndex` is an index into `options()` (the filtered list), not
 * the full corpus.
 */
export type ComboboxAutoComplete = "none" | "list" | "both";

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
}

export interface ComboboxOptionState {
  readonly value: string;
  readonly label: string;
  readonly selected: boolean;
  readonly id: string;
  readonly props: {
    readonly id: string;
    readonly role: "option";
    readonly "aria-selected": "true" | "false";
    readonly onClick: () => void;
    /** Keep a pointer click from stealing DOM focus away from the combobox. */
    readonly onMouseDown: (event: MouseEvent) => void;
  };
}

export interface ComboboxInputProps {
  readonly id: string;
  readonly role: "combobox";
  readonly value: string;
  readonly "aria-autocomplete": ComboboxAutoComplete;
  readonly "aria-haspopup": "listbox";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string | undefined;
  readonly "aria-activedescendant": string | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly onInput: (event: InputEvent) => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onClick: () => void;
}

export interface ComboboxTriggerProps {
  readonly id: string;
  readonly type: "button";
  readonly tabindex: -1;
  readonly "aria-haspopup": "listbox";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly onClick: () => void;
  /** Keep a pointer click from stealing focus, so DOM focus stays on the combobox. */
  readonly onMouseDown: (event: MouseEvent) => void;
}

export interface ComboboxListboxProps {
  readonly id: string;
  readonly role: "listbox";
  readonly hidden: boolean;
}

export interface Combobox {
  readonly open: Accessor<boolean>;
  /** Index into `options()`; `-1` = visual focus on the combobox. */
  readonly activeIndex: Accessor<number>;
  readonly value: Accessor<string | null>;
  readonly focused: Accessor<boolean>;
  /** The typeahead / filter text (empty until the user types). */
  readonly query: Accessor<string>;
  readonly options: Accessor<ReadonlyArray<ComboboxOptionState>>;
  readonly setOpen: (open: boolean) => void;
  readonly setValue: (value: string | null) => void;
  readonly comboboxProps: ComboboxInputProps;
  readonly triggerProps: ComboboxTriggerProps;
  readonly listboxProps: ComboboxListboxProps;
}

export interface ComboboxOptions {
  readonly options: ReadonlyArray<ComboboxOption | string>;
  /** Controlled: the host owns the selection and this is the only thing that changes it. */
  readonly value?: string | null | undefined;
  /** Uncontrolled starting selection; ignored while `value` is set. */
  readonly defaultSelectedValue?: string | null;
  /** Uncontrolled starting selection (alias for `defaultSelectedValue`). */
  readonly defaultValue?: string | null;
  /** Controlled: the host owns the popup and this is the only thing that opens/closes it. */
  readonly open?: boolean | undefined;
  /** Uncontrolled starting popup state; ignored while `open` is set. */
  readonly defaultOpen?: boolean;
  readonly autoComplete?: ComboboxAutoComplete;
  /** `true` = prefix filtering while typing; `false` = single-letter typeahead. */
  readonly filter?: boolean;
  readonly placeholder?: string;
  /**
   * aria-disabled on the combobox (it keeps its tab stop: the APG pattern's
   * focus contract) and on the trigger. A key, a click, a typeahead character,
   * a filter input and an option click change nothing and no popup opens;
   * `setOpen` / `setValue` stay host requests.
   */
  readonly disabled?: boolean;
  readonly id?: string;
  /**
   * A request to change the popup, called when the intent differs from the
   * current value; uncontrolled it is accepted, controlled the host may ignore it.
   */
  readonly onOpenChange?: (open: boolean) => void;
  /**
   * A request to change the selection, called when the intent differs from the
   * current value; uncontrolled it is accepted, controlled the host may ignore it.
   */
  readonly onValueChange?: (value: string | null) => void;
  /**
   * A host request to move focus off the widget. The primitive has already set
   * its own `focused` false; this only lets a DOM host release native focus (the
   * default host blurs `document.activeElement`). A non-DOM target needs nothing,
   * so the primitive never reads the DOM itself.
   */
  readonly onFocusRelease?: () => void;
}

const PAGE_SIZE = 4;

const toOption = (input: ComboboxOption | string): ComboboxOption =>
  typeof input === "string" ? { value: input, label: input } : input;

const firstLetter = (option: ComboboxOption): string => option.label.charAt(0).toLowerCase();

export const createCombobox = (options: ComboboxOptions): Combobox => {
  const corpus = options.options.map(toOption);
  const readonlyFilter = options.filter === true;
  const base = options.id ?? createUniqueId();
  const listboxId = `${base}-listbox`;
  const optionId = (index: number): string => `${base}-option-${index}`;
  const disabled = (): boolean => options.disabled === true;

  const indexOfValue = (value: string | null): number =>
    value === null ? -1 : corpus.findIndex((option) => option.value === value);

  const [query, setQuery] = createSignal("");
  const [open, requestOpen] = createControllable<boolean>({
    value: () => options.open,
    initial: options.defaultOpen ?? false,
    onChange: () => options.onOpenChange,
  });
  const [value, requestValue] = createControllable<string | null>({
    value: () => options.value,
    initial: options.defaultSelectedValue ?? options.defaultValue ?? null,
    onChange: () => options.onValueChange,
  });
  const [focused, setFocused] = createSignal(false);
  // Tab commits and closes, then blurs the input; the blur handler must not
  // commit a second time (its reads lag the request made in the same tick).
  let suppressBlur = false;

  const matches = (): ReadonlyArray<ComboboxOption> => {
    const text = query().toLowerCase();
    if (!readonlyFilter || text === "") {
      return corpus;
    }
    return corpus.filter((option) => option.label.toLowerCase().startsWith(text));
  };

  const options_ = (): ReadonlyArray<ComboboxOption> => matches();

  const openActive = (): number => {
    const list = options_();
    if (list.length === 0) {
      return -1;
    }
    const selected = indexOfValue(value());
    return selected >= 0 && selected < list.length ? selected : 0;
  };

  const [active, setActive] = createSignal<number>(open() ? openActive() : -1);

  const optionStates = (): ReadonlyArray<ComboboxOptionState> => {
    const list = options_();
    const isOpen = open();
    const current = active();
    return list.map((option, index) => {
      const id = optionId(index);
      return {
        value: option.value,
        label: option.label,
        selected: isOpen && index === current,
        id,
        props: {
          id,
          role: "option",
          get "aria-selected"() {
            return open() && active() === index ? "true" : "false";
          },
          onClick: () => {
            if (open()) {
              commit(index);
            }
          },
          onMouseDown: (event: MouseEvent) => event.preventDefault(),
        },
      };
    });
  };

  const count = (): number => options_().length;

  const clamp = (index: number): number => {
    const max = count() - 1;
    if (max < 0) {
      return -1;
    }
    return index < 0 ? 0 : index > max ? max : index;
  };

  const commit = (index: number): void => {
    if (disabled()) {
      return;
    }
    const option = options_()[index];
    if (option === undefined) {
      return;
    }
    requestValue(option.value);
    requestOpen(false);
    setActive(-1);
    setQuery("");
  };

  const openOn = (index: number): void => {
    requestOpen(true);
    setActive(clamp(index));
  };

  const firstMatch = (char: string): number =>
    corpus.findIndex((option) => firstLetter(option) === char);

  const onFocus = (): void => {
    setFocused(true);
  };

  const onBlur = (): void => {
    if (suppressBlur || !focused()) {
      return;
    }
    // an open popup commits its active option when focus leaves
    if (!disabled() && open() && active() >= 0) {
      const option = options_()[active()];
      if (option !== undefined) {
        requestValue(option.value);
      }
    }
    setFocused(false);
    requestOpen(false);
    setActive(-1);
    setQuery("");
  };

  const onClick = (): void => {
    if (disabled()) {
      return;
    }
    setFocused(true);
    if (open()) {
      requestOpen(false);
      setActive(-1);
    } else {
      openOn(openActive());
    }
  };

  const type = (char: string): void => {
    if (disabled()) {
      return;
    }
    if (readonlyFilter) {
      setQuery((text) => text + char);
      requestOpen(true);
      setActive(count() > 0 ? 0 : -1);
      return;
    }
    // typeahead: jump to the first option starting with the letter. Same-letter
    // cycling is a spec behaviour the bridge never reaches (each walk key is
    // preceded by a focus, which resets the buffer), so this stays single-char.
    const baseIndex = open() ? active() : openActive();
    const found = firstMatch(char);
    setQuery(char);
    requestOpen(true);
    setActive(found === -1 ? (baseIndex < 0 ? -1 : clamp(baseIndex)) : found);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (disabled()) {
      return;
    }
    const key = event.key;
    const alt = event.altKey;
    const isOpen = open();
    const isFocused = focused();

    if (key === "ArrowDown" || key === "ArrowUp") {
      if (!isFocused) {
        return;
      }
      event.preventDefault();
      if (alt) {
        if (key === "ArrowDown") {
          // Alt+ArrowDown opens without moving the visual focus
          if (!isOpen) {
            openOn(openActive());
          }
        } else {
          // Alt+ArrowUp closes and commits
          if (isOpen && active() >= 0) {
            commit(active());
          } else {
            requestOpen(false);
            setActive(-1);
          }
        }
        return;
      }
      if (key === "ArrowDown") {
        if (isOpen) {
          setActive(clamp(active() + 1));
        } else {
          openOn(openActive());
        }
      } else if (isOpen) {
        setActive(clamp(active() - 1));
      } else {
        openOn(0);
      }
      return;
    }

    switch (key) {
      case "Enter":
      case " ":
      case "Spacebar": {
        if (!isFocused) {
          return;
        }
        event.preventDefault();
        if (isOpen) {
          if (active() >= 0) {
            commit(active());
          } else {
            requestOpen(false);
            setActive(-1);
          }
        } else {
          openOn(openActive());
        }
        return;
      }
      case "Escape": {
        if (!isFocused) {
          return;
        }
        event.preventDefault();
        requestOpen(false);
        setActive(-1);
        setQuery("");
        return;
      }
      case "Tab": {
        if (!isFocused) {
          return;
        }
        event.preventDefault();
        if (isOpen && active() >= 0) {
          commit(active());
        } else {
          requestOpen(false);
          setActive(-1);
        }
        setFocused(false);
        setQuery("");
        suppressBlur = true;
        options.onFocusRelease?.();
        suppressBlur = false;
        return;
      }
      case "Home": {
        if (isFocused) {
          event.preventDefault();
          openOn(0);
        }
        return;
      }
      case "End": {
        if (isFocused) {
          event.preventDefault();
          openOn(count() - 1);
        }
        return;
      }
      case "PageDown": {
        if (isFocused && isOpen) {
          event.preventDefault();
          setActive(clamp(active() + PAGE_SIZE));
        }
        return;
      }
      case "PageUp": {
        if (isFocused && isOpen) {
          event.preventDefault();
          setActive(clamp(active() - PAGE_SIZE));
        }
        return;
      }
      case "Backspace": {
        if (isFocused && readonlyFilter) {
          event.preventDefault();
          setQuery((text) => text.slice(0, -1));
          setActive(0);
        }
        return;
      }
      default: {
        if (!isFocused || key.length !== 1 || key === " ") {
          return;
        }
        event.preventDefault();
        type(key.toLowerCase());
      }
    }
  };

  const onInput = (event: InputEvent): void => {
    if (!readonlyFilter || disabled()) {
      return;
    }
    const target = event.currentTarget;
    if (target instanceof HTMLInputElement) {
      const text = target.value;
      setQuery(text);
      requestOpen(text.length > 0 || open());
      setActive(count() > 0 ? 0 : -1);
    }
  };

  return {
    open,
    activeIndex: active,
    value,
    focused,
    query,
    options: optionStates,
    setOpen: (next) => {
      if (next) {
        openOn(openActive());
      } else {
        requestOpen(false);
        setActive(-1);
      }
    },
    setValue: (next) => requestValue(next),
    comboboxProps: {
      id: `${base}-input`,
      role: "combobox",
      get value() {
        return readonlyFilter ? query() : (value() ?? "");
      },
      get "aria-autocomplete"() {
        return options.autoComplete ?? "list";
      },
      "aria-haspopup": "listbox",
      get "aria-expanded"() {
        return open() ? "true" : "false";
      },
      get "aria-controls"() {
        return open() ? listboxId : undefined;
      },
      get "aria-activedescendant"() {
        return open() && active() >= 0 ? optionId(active()) : undefined;
      },
      get "aria-disabled"() {
        return disabled() ? "true" : undefined;
      },
      onInput,
      onKeyDown,
      onFocus,
      onBlur,
      onClick,
    },
    triggerProps: {
      id: `${base}-trigger`,
      type: "button",
      tabindex: -1,
      "aria-haspopup": "listbox",
      get "aria-expanded"() {
        return open() ? "true" : "false";
      },
      get "aria-controls"() {
        return open() ? listboxId : undefined;
      },
      get "aria-disabled"() {
        return disabled() ? "true" : undefined;
      },
      onClick,
      onMouseDown: (event) => event.preventDefault(),
    },
    listboxProps: {
      id: listboxId,
      role: "listbox",
      get hidden() {
        return !open();
      },
    },
  };
};
