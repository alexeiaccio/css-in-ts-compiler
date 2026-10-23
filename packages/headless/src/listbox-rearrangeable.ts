import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import type { ListboxModifiers } from "./listbox";
import { createControllable } from "./controllable";

export type RearrangeableList = "a" | "b";

export interface RearrangeableListboxOptions {
  /** Option labels; the option id is the index, and every option starts in list A. */
  readonly items: ReadonlyArray<string>;
  /** Multi-select (APG example 2): Space toggles, Enter/Delete transfer the selected. */
  readonly multi?: boolean;
  /** Controlled selection (option ids); the host owns it. */
  readonly value?: ReadonlyArray<number> | undefined;
  readonly defaultValue?: ReadonlyArray<number>;
  readonly id?: string;
  readonly labels?: Readonly<Record<RearrangeableList, string>>;
  /** A request to change the selection; uncontrolled it is accepted. */
  readonly onValueChange?: (selected: ReadonlyArray<number>) => void;
}

export interface RearrangeableListProps {
  readonly role: "listbox";
  readonly tabindex: 0;
  readonly "aria-multiselectable": "true" | "false";
  readonly "aria-activedescendant": string | undefined;
  readonly "aria-label": string | undefined;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface RearrangeableOptionProps {
  readonly id: string;
  readonly role: "option";
  readonly "aria-selected": "true" | "false";
  readonly onClick: () => void;
}

export interface RearrangeableListbox {
  readonly items: ReadonlyArray<string>;
  /** The option ids a list holds, in order. */
  readonly order: (list: RearrangeableList) => ReadonlyArray<number>;
  /** A list's active option id, `null` when the list is empty. */
  readonly active: (list: RearrangeableList) => number | null;
  readonly focusedList: Accessor<RearrangeableList | null>;
  readonly selected: Accessor<ReadonlyArray<number>>;
  readonly multi: Accessor<boolean>;
  readonly focus: (list: RearrangeableList) => void;
  readonly blur: () => void;
  readonly keyDown: (key: string, modifiers?: ListboxModifiers) => void;
  /** Single-select: swap the focused list's active option with its neighbour. */
  readonly move: (direction: "up" | "down") => void;
  /** Move the focused list's selected options to the other list (deselected). */
  readonly transfer: () => void;
  readonly setMulti: (flag: boolean) => void;
  readonly listProps: (list: RearrangeableList) => RearrangeableListProps;
  readonly optionProps: (optionId: number) => RearrangeableOptionProps;
}

const other = (list: RearrangeableList): RearrangeableList => (list === "a" ? "b" : "a");

const normalize = (indices: ReadonlyArray<number>, count: number): ReadonlyArray<number> =>
  [...new Set(indices)].filter((index) => index >= 0 && index < count).sort((x, y) => x - y);

const same = (a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * APG rearrangeable listbox (two lists sharing one option set) on Solid 2,
 * verified against `specs/apg/listbox-rearrangeable.qnt` by a differential
 * walk. Single-select: selection follows focus, Alt+Up/Down reorder, Delete
 * moves the focused option across. Multi-select: Space toggles, Enter/Delete
 * move every selected option of the focused list across. A transferred option
 * arrives deselected.
 *
 * Controlled, the list surgery of a transfer is gated on the request landing:
 * it is applied when the `value` prop comes back equal to the intent, so a
 * host that holds the value moves nothing.
 */
export const createRearrangeableListbox = (
  options: RearrangeableListboxOptions,
): RearrangeableListbox => {
  const base = options.id ?? createUniqueId();
  const items = options.items;
  const count = items.length;

  // Solid 2 applies setters on the next flush; the structure is a plain record
  // read through `version` so every handler sees the state it just wrote.
  const [version, setVersion] = createSignal(0);
  const bump = (): void => {
    setVersion((n) => n + 1);
  };
  const order: Record<RearrangeableList, number[]> = {
    a: items.map((_, index) => index),
    b: [],
  };
  const active: Record<RearrangeableList, number | null> = {
    a: count > 0 ? 0 : null,
    b: null,
  };
  let focusList: RearrangeableList | null = null;
  let multi = options.multi ?? false;
  let pending: { intent: ReadonlyArray<number>; apply: () => void } | null = null;

  const [rawSelected, requestSelection] = createControllable<ReadonlyArray<number>>({
    value: () => options.value,
    initial: normalize(options.defaultValue ?? [], count),
    onChange: () => options.onValueChange,
  });
  const selected = (): ReadonlyArray<number> => normalize(rawSelected(), count);

  createEffect(
    () => selected().join(","),
    (key) => {
      const request = pending;
      pending = null;
      if (request !== null && key === request.intent.join(",")) {
        request.apply();
      }
    },
  );

  const commit = (intent: ReadonlyArray<number>): void => {
    const next = normalize(intent, count);
    if (!same(selected(), next)) {
      requestSelection(next);
    }
  };

  const selectedIn = (list: RearrangeableList): number[] =>
    selected().filter((id) => order[list].includes(id));

  /** Single-select: the focused list's selection is its active option. */
  const followFocus = (list: RearrangeableList): void => {
    if (multi) {
      return;
    }
    const act = active[list];
    commit([...selectedIn(other(list)), ...(act === null ? [] : [act])]);
  };

  const setActive = (list: RearrangeableList, id: number | null): void => {
    active[list] = id;
    bump();
    followFocus(list);
  };

  const step = (delta: 1 | -1): void => {
    const list = focusList;
    const act = list === null ? null : active[list];
    if (list === null || act === null) {
      return;
    }
    const next = order[list][order[list].indexOf(act) + delta];
    setActive(list, next ?? act);
  };

  const edge = (which: "first" | "last"): void => {
    const list = focusList;
    if (list === null || active[list] === null) {
      return;
    }
    const ids = order[list];
    setActive(list, (which === "first" ? ids[0] : ids.at(-1)) ?? null);
  };

  const space = (): void => {
    const list = focusList;
    const id = list === null ? null : active[list];
    if (!multi || id === null) {
      return;
    }
    const current = selected();
    commit(current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const focus = (list: RearrangeableList): void => {
    pending = null;
    if (focusList === list) {
      return;
    }
    focusList = list;
    const ids = order[list];
    const entry = ids.find((id) => selected().includes(id)) ?? ids[0] ?? null;
    setActive(list, entry);
  };

  const blur = (): void => {
    pending = null;
    if (focusList === null) {
      return;
    }
    focusList = null;
    bump();
  };

  const move = (direction: "up" | "down"): void => {
    pending = null;
    const list = focusList;
    const act = list === null ? null : active[list];
    if (multi || list === null || act === null) {
      return;
    }
    const ids = order[list];
    const position = ids.indexOf(act);
    const target = position + (direction === "up" ? -1 : 1);
    const neighbour = ids[target];
    if (neighbour === undefined) {
      return;
    }
    ids[target] = act;
    ids[position] = neighbour;
    bump();
  };

  const transfer = (): void => {
    pending = null;
    const list = focusList;
    if (list === null) {
      return;
    }
    const sel = selected();
    const source = order[list];
    const moved = source.filter((id) => sel.includes(id));
    if (moved.length === 0) {
      return;
    }
    const kept = source.filter((id) => !sel.includes(id));
    const act = active[list];
    let nextActive = act;
    if (act !== null && sel.includes(act)) {
      const position = source.indexOf(act);
      nextActive =
        source.slice(position + 1).find((id) => !sel.includes(id)) ??
        source
          .slice(0, position)
          .reverse()
          .find((id) => !sel.includes(id)) ??
        null;
    }
    const destination = other(list);
    const intent = [
      ...selectedIn(destination),
      ...(multi || nextActive === null ? [] : [nextActive]),
    ];
    const apply = (): void => {
      order[list] = kept;
      order[destination] = [...order[destination], ...moved];
      active[list] = nextActive;
      if (active[destination] === null) {
        active[destination] = moved[0] ?? null;
      }
      bump();
    };
    if (options.value === undefined) {
      apply();
    } else {
      pending = { intent: normalize(intent, count), apply };
    }
    commit(intent);
  };

  const setMulti = (flag: boolean): void => {
    pending = null;
    multi = flag;
    bump();
    if (!flag) {
      commit([active.a, active.b].filter((id) => id !== null));
    }
  };

  const keyDown = (key: string, modifiers: ListboxModifiers = {}): boolean => {
    if (focusList === null) {
      return false;
    }
    if (modifiers.alt === true) {
      if (key === "ArrowUp" || key === "ArrowDown") {
        move(key === "ArrowUp" ? "up" : "down");
        return true;
      }
      return false;
    }
    pending = null;
    switch (key) {
      case "ArrowDown":
        step(1);
        return true;
      case "ArrowUp":
        step(-1);
        return true;
      case "Home":
        edge("first");
        return true;
      case "End":
        edge("last");
        return true;
      case " ":
      case "Space":
        space();
        return true;
      case "Enter":
      case "Delete":
        transfer();
        return true;
      default:
        return false;
    }
  };

  const optionId = (id: number): string => `${base}-option-${id}`;

  return {
    items,
    order: (list) => {
      version();
      return order[list];
    },
    active: (list) => {
      version();
      return active[list];
    },
    focusedList: () => {
      version();
      return focusList;
    },
    selected,
    multi: () => {
      version();
      return multi;
    },
    focus,
    blur,
    keyDown: (key, modifiers) => {
      keyDown(key, modifiers);
    },
    move,
    transfer,
    setMulti,
    listProps: (list) => ({
      role: "listbox",
      tabindex: 0,
      get "aria-multiselectable"() {
        version();
        return multi ? "true" : "false";
      },
      get "aria-activedescendant"() {
        version();
        const act = active[list];
        return focusList === list && act !== null ? optionId(act) : undefined;
      },
      get "aria-label"() {
        return options.labels?.[list];
      },
      onFocus: () => focus(list),
      onBlur: () => {
        if (focusList === list) {
          blur();
        }
      },
      onKeyDown: (event) => {
        if (keyDown(event.key, { alt: event.altKey })) {
          event.preventDefault();
        }
      },
    }),
    optionProps: (id) => ({
      id: optionId(id),
      role: "option",
      get "aria-selected"() {
        return selected().includes(id) ? "true" : "false";
      },
      onClick: () => {
        const list = order.a.includes(id) ? "a" : "b";
        focus(list);
        if (multi) {
          setActive(list, id);
          space();
        } else {
          setActive(list, id);
        }
      },
    }),
  };
};
