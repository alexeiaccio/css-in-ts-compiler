import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import {
  type DialogBackdropProps,
  type DialogContentProps,
  type DialogTriggerProps,
  createDialogModal,
} from "./dialog-modal";
import { type StatusProps, createStatus } from "./status";
import { type TextControlProps, createTextInput } from "./textbox";

/** One row of a submenu; `run` is optional because a submenu is a filter step first. */
export interface FilterableMenuSubItem {
  readonly id: string;
  readonly label: string;
  readonly run?: (() => void | Promise<void>) | undefined;
}

/** One command the host offers; `group` only picks the heading the host renders. */
export interface FilterableMenuItem {
  readonly id: string;
  readonly label: string;
  readonly group?: string | undefined;
  readonly submenu?: ReadonlyArray<FilterableMenuSubItem> | undefined;
  readonly run: () => void | Promise<void>;
}

/** A row that survived the filter, in host order. */
export interface FilterableMenuResult {
  readonly id: string;
  readonly label: string;
  readonly group: string | undefined;
  readonly hasSubmenu: boolean;
}

/** Every string the host puts on screen; override what you translate. */
export interface FilterableMenuLabels {
  readonly placeholder: string;
  /** The sentence the host renders inside `emptyProps`. */
  readonly empty: string;
  /** The polite announcement, written once per query. */
  readonly count: (count: number) => string;
  /** The clear button's accessible name; the text or icon is the host's. */
  readonly clear: string;
}

export interface FilterableMenuOptions {
  /** An array, or a getter like every list in the package. */
  readonly items: ReadonlyArray<FilterableMenuItem> | (() => ReadonlyArray<FilterableMenuItem>);
  /** Controlled: the host owns the open state and this is the only thing that changes it. */
  readonly open?: boolean | undefined;
  /** A request to change the open state, called when the intent differs. */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly labels?: Partial<FilterableMenuLabels> | undefined;
  readonly id?: string | undefined;
}

export interface FilterableMenuInputProps extends TextControlProps {
  readonly role: "searchbox";
  readonly value: string;
  readonly "aria-controls": string;
  readonly "aria-activedescendant": string | undefined;
  /** Present while the field itself holds the highlight. */
  readonly "data-highlighted": "" | undefined;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onCompositionStart: () => void;
  readonly onCompositionEnd: () => void;
}

export interface FilterableMenuClearProps {
  readonly type: "button";
  readonly tabindex: -1;
  readonly "aria-label": string;
  readonly onMouseDown: (event: MouseEvent) => void;
  readonly onClick: () => void;
}

export interface FilterableMenu {
  readonly open: Accessor<boolean>;
  readonly openMenu: () => void;
  /** Closes the whole menu, every level; Escape pops a level first. */
  readonly closeMenu: () => void;
  readonly query: Accessor<string>;
  readonly setQuery: (text: string) => void;
  /** The highlighted row's id, or `null` while the field holds the highlight. */
  readonly active: Accessor<string | null>;
  readonly setActive: (id: string | null) => void;
  /** The current level's rows; pass a trigger's id for its submenu's rows. */
  readonly results: (submenuId?: string) => ReadonlyArray<FilterableMenuResult>;
  readonly labels: FilterableMenuLabels;
  /** The count, in the polite region. */
  readonly status: Accessor<string | undefined>;
  /** Needs nothing from the field, so the trigger works before it mounts. */
  readonly triggerProps: DialogTriggerProps;
  readonly inputProps: FilterableMenuInputProps;
  readonly menuProps: {
    readonly id: string;
    readonly role: "menu";
    readonly "aria-labelledby": string;
    readonly onMouseDown: (event: MouseEvent) => void;
  };
  readonly groupProps: (name: string) => {
    readonly id: string;
    readonly role: "group";
    readonly "aria-labelledby": string;
  };
  /** `aria-hidden`: the group is already named through `groupProps`. */
  readonly groupLabelProps: (name: string) => {
    readonly id: string;
    readonly "aria-hidden": "true";
  };
  readonly itemProps: (id: string) => {
    readonly id: string;
    readonly role: "menuitem";
    readonly tabindex: -1;
    readonly "data-highlighted": "" | undefined;
    readonly onMouseDown: (event: MouseEvent) => void;
    readonly onMouseEnter: () => void;
    readonly onClick: () => void;
  };
  readonly submenuTriggerProps: (id: string) => {
    readonly id: string;
    readonly role: "menuitem";
    readonly tabindex: -1;
    readonly "aria-haspopup": "menu";
    readonly "aria-expanded": "true" | "false";
    readonly "aria-controls": string;
    readonly "data-highlighted": "" | undefined;
    readonly onMouseDown: (event: MouseEvent) => void;
    readonly onMouseEnter: () => void;
    readonly onClick: () => void;
  };
  readonly submenuProps: (id: string) => {
    readonly id: string;
    readonly role: "menu";
    readonly "aria-labelledby": string;
    readonly hidden: boolean;
    readonly onMouseDown: (event: MouseEvent) => void;
    readonly onMouseEnter: () => void;
  };
  readonly emptyProps: { readonly hidden: boolean; readonly text: string };
  readonly statusProps: StatusProps;
  readonly clearProps: FilterableMenuClearProps;
  readonly dialogProps: DialogContentProps;
  readonly backdropProps: DialogBackdropProps;
  readonly titleProps: { readonly id: string };
}

interface Row {
  readonly id: string;
  readonly label: string;
  readonly group: string | undefined;
  readonly submenu: ReadonlyArray<FilterableMenuSubItem> | undefined;
  readonly run: (() => void | Promise<void>) | undefined;
}

interface Level {
  readonly text: Accessor<string>;
  readonly setText: (text: string) => void;
  readonly filter: Accessor<string>;
  readonly setFilter: (text: string) => void;
  readonly active: Accessor<string | null>;
  readonly setActive: (id: string | null) => void;
}

const countLabel = (count: number): string =>
  count === 0 ? "No actions" : count === 1 ? "1 action" : `${count} actions`;

const toRow = (item: FilterableMenuItem): Row => ({
  id: item.id,
  label: item.label,
  group: item.group,
  submenu: item.submenu,
  run: item.run,
});

/**
 * A filterable menu: `createDialogModal` (the popup, announced as a dialog) +
 * `createTextInput` (a `searchbox`, not a combobox: a choice runs a command, it
 * does not complete the field) + `createStatus` (the count), with one filtered
 * menu beside the field. The structure and the keyboard are Base UI's
 * "Building a filterable menu that works for everyone"; the trigger is
 * `aria-haspopup="dialog"` and the field has no `aria-autocomplete`, no
 * `aria-haspopup` and no `aria-expanded`.
 *
 * Focus stays in the field; `aria-activedescendant` names the highlighted row
 * and `data-highlighted` sits on the field while the highlight is there. ↓ on
 * the last row and ↑ on the first return it to the field, and ↓/↑ from the
 * field enter at the first/last row. Home/End are menu keys only while the
 * query is empty and a row is highlighted; otherwise they move the caret.
 *
 * **Tab closes, Escape pops.** Tab is not prevented: the dialog is hidden on
 * the next task and focus moves on, so the menu never traps (Base UI's reason:
 * a touch screen reader leaves with its own cursor). A dialog that wraps a
 * native `showModal()` keeps its own trap and moves focus first; the menu does
 * not add a second one. Escape goes back one submenu level, and closes the
 * dialog at the top level. Backspace on an empty submenu field goes back too.
 *
 * **Submenus are levels, not new widgets.** Each level keeps its own query and
 * highlight, and the field is one element, so entering a level, hovering a
 * trigger and coming back never lose the caret. Hover shows a submenu without
 * moving focus; focus follows the pointer into the submenu (`submenuProps`).
 *
 * The host's: rendering groups (`groupProps` / `groupLabelProps`), the
 * submenu geometry, async commands (a rejected `run` is the host's to report)
 * and any close other than Escape / Tab / a command.
 */
export const createFilterableMenu = (options: FilterableMenuOptions): FilterableMenu => {
  const source = (): ReadonlyArray<FilterableMenuItem> =>
    typeof options.items === "function" ? options.items() : options.items;
  const base = options.id ?? createUniqueId();
  const titleId = `${base}-title`;
  const inputId = `${base}-control`;
  const labels: FilterableMenuLabels = {
    placeholder: options.labels?.placeholder ?? "Filter actions",
    empty: options.labels?.empty ?? "No actions found",
    count: options.labels?.count ?? countLabel,
    clear: options.labels?.clear ?? "Clear",
  };

  const rowsAt = (at: readonly string[]): ReadonlyArray<Row> => {
    let rows = source().map(toRow);
    for (const id of at) {
      const parent = rows.find((row) => row.id === id);
      if (parent?.submenu === undefined) {
        return [];
      }
      rows = parent.submenu.map((item) => ({
        id: item.id,
        label: item.label,
        group: undefined,
        submenu: undefined,
        run: item.run,
      }));
    }
    return rows;
  };
  const matching = (at: readonly string[], text: string): ReadonlyArray<Row> => {
    const needle = text.toLowerCase();
    return rowsAt(at).filter((row) => row.label.toLowerCase().includes(needle));
  };

  const [path, setPath] = createSignal<ReadonlyArray<string>>([]);
  // A plain flag, not a signal: compositionstart and the first input can share a
  // task, and Solid 2 applies signal writes on the microtask.
  let composing = false;
  const keyOf = (at: readonly string[]): string =>
    at.length === 0 ? "root" : at.map(encodeURIComponent).join("/");
  const levels = new Map<string, Level>();
  const levelFor = (at: readonly string[]): Level => {
    const key = keyOf(at);
    const found = levels.get(key);
    if (found !== undefined) {
      return found;
    }
    const [text, setText] = createSignal("");
    const [filter, setFilter] = createSignal("");
    const [active, setActive] = createSignal<string | null>(null);
    const level: Level = { text, setText, filter, setFilter, active, setActive };
    levels.set(key, level);
    return level;
  };

  const dialog = createDialogModal({
    id: base,
    role: "dialog",
    labelledby: titleId,
    value: options.open,
    onOpenChange: (open) => options.onOpenChange?.(open),
  });
  const status = createStatus();

  const results = (submenuId?: string): ReadonlyArray<FilterableMenuResult> => {
    const at = submenuId === undefined ? path() : [...path(), submenuId];
    return matching(at, levelFor(at).filter()).map((row) => ({
      id: row.id,
      label: row.label,
      group: row.group,
      hasSubmenu: row.submenu !== undefined,
    }));
  };
  // Solid 2 flushes on the microtask: read the new text directly.
  const show = (text: string): void => {
    const level = levelFor(path());
    level.setFilter(text);
    level.setActive(matching(path(), text)[0]?.id ?? null);
  };
  const setQuery = (text: string): void => {
    levelFor(path()).setText(text);
    show(text);
  };
  const onValue = (text: string): void => {
    levelFor(path()).setText(text);
    if (!composing) {
      show(text);
    }
  };

  const groupIds = new Map<string, string>();
  const groupId = (name: string): string => {
    const found = groupIds.get(name);
    if (found !== undefined) {
      return found;
    }
    const id = `${base}-group-${groupIds.size}`;
    groupIds.set(name, id);
    return id;
  };
  const levelKey = (): string => keyOf(path());
  const menuId = (): string => `${base}-menu-${levelKey()}`;
  const itemId = (id: string): string => `${base}-item-${levelKey()}-${encodeURIComponent(id)}`;
  const submenuId = (id: string): string => `${base}-sub-${levelKey()}-${encodeURIComponent(id)}`;
  const active = (): string | null => levelFor(path()).active();
  const highlighted = (id: string): "" | undefined => (active() === id ? "" : undefined);
  const focusField = (): void => {
    queueMicrotask(() => document.getElementById(inputId)?.focus());
  };

  const closeAll = (): void => {
    setPath([]);
    dialog.close();
  };
  const openSub = (id: string, focus: boolean): void => {
    if (rowsAt(path()).find((row) => row.id === id)?.submenu === undefined) {
      return;
    }
    if (!path().includes(id)) {
      setPath((previous) => [...previous, id]);
    }
    if (focus) {
      focusField();
    }
  };
  const back = (): void => {
    if (path().length > 0) {
      setPath((previous) => previous.slice(0, -1));
      focusField();
    }
  };
  const choose = (id: string): void | Promise<void> => {
    const row = rowsAt(path()).find((candidate) => candidate.id === id);
    if (row === undefined) {
      return;
    }
    if (row.submenu !== undefined) {
      openSub(id, true);
      return;
    }
    closeAll();
    return row.run?.();
  };
  const setActive = (id: string | null): void => {
    const level = levelFor(path());
    level.setActive(id !== null && results().some((row) => row.id === id) ? id : null);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.isComposing || composing) {
      return;
    }
    const level = levelFor(path());
    const ids = results().map((row) => row.id);
    const last = ids.length - 1;
    const current = level.active();
    const index = current === null ? -1 : ids.indexOf(current);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        level.setActive(index < last ? (ids[index + 1] ?? null) : null);
        return;
      case "ArrowUp":
        event.preventDefault();
        level.setActive(
          index <= 0 ? (index === -1 ? (ids[last] ?? null) : null) : (ids[index - 1] ?? null),
        );
        return;
      case "Home":
      case "End":
        // With text the caret keeps the key; empty and highlighted, it is a menu key.
        if (level.text() !== "" || current === null) {
          return;
        }
        event.preventDefault();
        level.setActive(event.key === "Home" ? (ids[0] ?? null) : (ids[last] ?? null));
        return;
      case "Enter":
        event.preventDefault();
        if (current !== null) {
          void choose(current);
        }
        return;
      case "Escape":
        if (path().length > 0) {
          event.preventDefault();
          event.stopPropagation();
          back();
        }
        return;
      case "Backspace":
        if (level.text() === "" && path().length > 0) {
          event.preventDefault();
          back();
        }
        return;
      case "Tab":
        // Not prevented: the task after this keydown closes the dialog, once the
        // browser has moved focus, so the menu never traps it.
        returnFocus = null;
        setTimeout(() => dialog.close(), 0);
        return;
      default:
        return;
    }
  };

  let returnFocus: HTMLElement | null = null;
  createEffect(
    () => dialog.open(),
    (isOpen) => {
      if (isOpen) {
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        focusField();
        return;
      }
      setPath([]);
      for (const level of levels.values()) {
        level.setText("");
        level.setFilter("");
        level.setActive(null);
      }
      const backTo = returnFocus;
      returnFocus = null;
      if (backTo !== null && backTo.isConnected) {
        backTo.focus();
      }
    },
  );
  // One write per change: arrows move the highlight, not the count.
  createEffect(
    () => [dialog.open(), path().length, results().length] as const,
    ([isOpen, , count]) => {
      if (isOpen) {
        status.show(labels.count(count));
      } else {
        status.clear();
      }
    },
  );

  const input = createTextInput({
    id: base,
    type: "text",
    autoComplete: "off",
    spellCheck: false,
    placeholder: labels.placeholder,
    onValueChange: onValue,
  });

  return {
    open: dialog.open,
    openMenu: dialog.openDialog,
    closeMenu: closeAll,
    query: () => levelFor(path()).text(),
    setQuery,
    active,
    setActive,
    results,
    labels,
    status: status.message,
    triggerProps: dialog.triggerProps,
    inputProps: {
      ...input.controlProps,
      role: "searchbox",
      get value() {
        return levelFor(path()).text();
      },
      get "aria-controls"() {
        return menuId();
      },
      get "aria-activedescendant"() {
        const id = active();
        return id === null ? undefined : itemId(id);
      },
      get "data-highlighted"() {
        return active() === null ? "" : undefined;
      },
      onKeyDown,
      onCompositionStart: () => {
        composing = true;
      },
      onCompositionEnd: () => {
        composing = false;
        show(levelFor(path()).text());
      },
    },
    menuProps: {
      get id() {
        return menuId();
      },
      role: "menu",
      "aria-labelledby": titleId,
      onMouseDown: (event) => event.preventDefault(),
    },
    groupProps: (name) => ({
      id: groupId(name),
      role: "group",
      "aria-labelledby": `${groupId(name)}-label`,
    }),
    groupLabelProps: (name) => ({ id: `${groupId(name)}-label`, "aria-hidden": "true" }),
    itemProps: (id) => ({
      id: itemId(id),
      role: "menuitem",
      tabindex: -1,
      get "data-highlighted"() {
        return highlighted(id);
      },
      onMouseDown: (event) => event.preventDefault(),
      onMouseEnter: () => setActive(id),
      onClick: () => {
        void choose(id);
      },
    }),
    submenuTriggerProps: (id) => ({
      id: itemId(id),
      role: "menuitem",
      tabindex: -1,
      "aria-haspopup": "menu",
      get "aria-expanded"() {
        return path().includes(id) ? "true" : "false";
      },
      "aria-controls": submenuId(id),
      get "data-highlighted"() {
        return highlighted(id);
      },
      onMouseDown: (event) => event.preventDefault(),
      onMouseEnter: () => {
        setActive(id);
        openSub(id, false);
      },
      onClick: () => openSub(id, true),
    }),
    submenuProps: (id) => ({
      id: submenuId(id),
      role: "menu",
      "aria-labelledby": itemId(id),
      get hidden() {
        return !path().includes(id);
      },
      onMouseDown: (event) => event.preventDefault(),
      onMouseEnter: () => {
        if (path().includes(id)) {
          focusField();
        }
      },
    }),
    emptyProps: {
      get hidden() {
        return results().length > 0;
      },
      text: labels.empty,
    },
    statusProps: status.statusProps,
    clearProps: {
      type: "button",
      tabindex: -1,
      "aria-label": labels.clear,
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: () => {
        setQuery("");
        focusField();
      },
    },
    dialogProps: dialog.dialogProps,
    backdropProps: dialog.backdropProps,
    titleProps: { id: titleId },
  };
};
