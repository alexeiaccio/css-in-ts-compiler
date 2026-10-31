import { type Accessor, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

export type TabsOrientation = "horizontal" | "vertical";
export type TabsActivation = "automatic" | "manual";

/**
 * Options are read lazily (getters) so `orientation` / `activation` /
 * `disabled` stay reactive; pass a component's `props`.
 */
export interface TabsOptions {
  /** Number of tabs (needed for wrapping). */
  readonly items?: number;
  /** Controlled: the host owns the selection and this is the only thing that changes it. */
  readonly value?: number | undefined;
  /** Uncontrolled starting selection; ignored while `value` is set. */
  readonly defaultSelected?: number;
  readonly orientation?: TabsOrientation;
  readonly activation?: TabsActivation;
  /** Tab indices that cannot be selected. */
  readonly disabled?: ReadonlyArray<number>;
  /** Panels that already hold focusable content (no `tabindex` needed). */
  readonly focusablePanels?: ReadonlyArray<number>;
  /** Base for the generated ids. */
  readonly id?: string;
  /**
   * A tab's own `id` (default `${id}-tab-<index>`). Use it when the host or a
   * link from outside already names the tab, so `aria-controls` follows.
   */
  readonly tabId?: ((index: number) => string | undefined) | undefined;
  /**
   * A tabpanel's own `id` (default `${id}-tabpanel-<index>`): a host whose
   * markup or deep links name the panel (an `#logs` anchor) sets it, and
   * `aria-controls` / `aria-labelledby` follow.
   */
  readonly panelId?: ((index: number) => string | undefined) | undefined;
  /**
   * A request to change the selection, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (index: number) => void;
  /**
   * Close buttons and the Delete key (default false): the host renders
   * `closeProps` and removes the tab from `onClose`. The last tab is never
   * asked to close.
   */
  readonly closable?: boolean | undefined;
  /**
   * Inline rename (default false): a double click on a tab starts it, Enter /
   * blur commit and Escape reverts; the host renames from `onRename`.
   */
  readonly renamable?: boolean | undefined;
  /**
   * A tab's label: the close / rename button names and the starting draft of a
   * rename, read lazily (a getter is fine) so a rename follows.
   */
  readonly label?: ((index: number) => string | undefined) | undefined;
  /** A request to remove a tab; the primitive does not own the list. */
  readonly onClose?: ((index: number) => void) | undefined;
  /** A request to rename a tab with a non-empty label. */
  readonly onRename?: ((index: number, label: string) => void) | undefined;
}

/** Spread onto the element with `role=tab` (a native `<button>`). */
export interface TabProps {
  readonly id: string;
  readonly role: "tab";
  readonly "aria-selected": "true" | "false";
  readonly "aria-controls": string;
  readonly "aria-disabled": "true" | undefined;
  readonly tabindex: 0 | -1;
  readonly onClick: () => void;
  readonly onMouseDown: (event: MouseEvent) => void;
  readonly onFocus: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/** Spread onto the element with `role=tablist`. */
export interface TablistProps {
  readonly role: "tablist";
  readonly "aria-orientation": "vertical" | undefined;
}

/** Spread onto the element with `role=tabpanel`. */
export interface TabpanelProps {
  readonly id: string;
  readonly role: "tabpanel";
  readonly "aria-labelledby": string;
  readonly tabindex: 0 | undefined;
  readonly hidden: boolean;
}

/**
 * Spread onto the tab's close button. `tabindex=-1` keeps it out of the
 * tablist's tab order (a tablist's stops are its tabs); the Delete key is the
 * keyboard path.
 */
export interface TabCloseProps {
  readonly "aria-label": string;
  readonly tabindex: -1;
  readonly onClick: () => void;
}

/** Spread onto the inline `<input>` a renaming tab renders instead of its label. */
export interface TabRenameInputProps {
  readonly type: "text";
  readonly value: string;
  readonly "aria-label": string;
  readonly onInput: (event: InputEvent) => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onBlur: () => void;
}

/** The rename part of one tab: put `onDblClick` on the tab, `inputProps` in it. */
export interface TabRenameProps {
  readonly onDblClick: () => void;
  /** Whether this tab is the one being renamed. */
  readonly editing: Accessor<boolean>;
  /** Start renaming `index` (e.g. a tab the host has just added). */
  readonly begin: (index: number) => void;
  /** Commit `label` to the tab being edited; an empty label cancels. */
  readonly commit: (label: string) => void;
  readonly cancel: () => void;
  readonly inputProps: TabRenameInputProps;
}

export interface Tabs {
  /** The tab count; read from `items` on every read, so a host that shrinks its list stays in step. */
  readonly items: number;
  readonly selected: Accessor<number>;
  /** Tab holding (or last holding) DOM focus; -1 when focus is outside. */
  readonly focused: Accessor<number>;
  /** The tab being renamed inline, `null` when none. */
  readonly editing: Accessor<number | null>;
  /** Programmatic selection request; ignores disabled tabs. */
  readonly select: (index: number) => void;
  /** Programmatic selection request (may point at a disabled tab, like base-ui). */
  readonly setSelected: (index: number) => void;
  /** Programmatic focus (does not select). */
  readonly focusTab: (index: number) => void;
  /**
   * The tab that takes focus once `onClose(index)`'s removal lands: the tab
   * that slid into `index`, or the previous one when the last tab closed. Call
   * it before the host removes the tab.
   */
  readonly focusAfterClose: (index: number) => number;
  readonly keyDown: (key: string) => void;
  readonly tablistProps: TablistProps;
  readonly tabProps: (index: number) => TabProps;
  readonly tabpanelProps: (index: number) => TabpanelProps;
  readonly closeProps: (index: number) => TabCloseProps;
  readonly renameProps: (index: number) => TabRenameProps;
}

/**
 * APG Tabs (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): state plus prop
 * objects for a tablist, tabs and panels. Roving tabindex, wrapping arrows,
 * Home/End, automatic vs manual activation and disabled-tab skipping; no
 * styling, no elements. Checked against `specs/apg/tabs.qnt` by the scenario
 * bridge, not by running the generated machine here.
 *
 * Platform: **hybrid** — focusgroup `tablist` owns arrows/wrap/tab stop; the
 * library owns selection, activation mode and panel visibility.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default
 * (`defaultSelected`); pass `value` + `onValueChange` to own the selection.
 * Programmatic methods (`select`, `setSelected`, `keyDown`) are requests too.
 *
 * Close and rename are an **extension** (bean `cssints-gdv2`): the APG spec
 * models a `deletable` flavour but neither a callback nor a rename, and this
 * primitive owns no list. `closable` / `renamable` turn on the props; `onClose`
 * / `onRename` ask the host, which removes or renames. Focus after a close goes
 * to the tab that slid into the closed one's place, or to the previous tab when
 * the last one closed; closing the last remaining tab is refused, as the spec
 * refuses an empty tablist.
 */
export const createTabs = (options: TabsOptions = {}): Tabs => {
  /** The live count: the host shrinks its list after a close, and the options are read lazily. */
  const count = (): number => Math.max(1, options.items ?? 4);
  const base = options.id ?? createUniqueId();
  const disabled = new Set<number>(options.disabled ?? []);
  const focusablePanels = new Set<number>(options.focusablePanels ?? []);

  const activation = (): TabsActivation => options.activation ?? "automatic";
  const orientation = (): TabsOrientation => options.orientation ?? "horizontal";
  const closable = (): boolean => options.closable ?? false;
  const renamable = (): boolean => options.renamable ?? false;
  const labelOf = (index: number): string => options.label?.(index) ?? `tab ${index + 1}`;
  const tabIdOf = (index: number): string => options.tabId?.(index) ?? `${base}-tab-${index}`;
  const panelIdOf = (index: number): string =>
    options.panelId?.(index) ?? `${base}-tabpanel-${index}`;

  const firstEnabled = (): number => {
    for (let index = 0; index < count(); index += 1) {
      if (!disabled.has(index)) {
        return index;
      }
    }
    return 0;
  };

  const initial = options.defaultSelected ?? firstEnabled();
  const [selected, request] = createControllable({
    value: () => options.value,
    initial: initial >= 0 && initial < count() && !disabled.has(initial) ? initial : firstEnabled(),
    onChange: () => options.onValueChange,
  });

  /** The tab that carries `tabindex=0`: the selected one, or the first enabled. */
  const roving = (): number => (disabled.has(selected()) ? firstEnabled() : selected());

  const select = (index: number): void => {
    if (index < 0 || index >= count() || disabled.has(index)) {
      return;
    }
    request(index);
  };

  const move = (index: number): void => {
    setFocused(index);
    if (activation() === "automatic") {
      select(index);
    }
  };

  const step = (from: number, delta: 1 | -1): number => {
    for (let offset = 1; offset <= count(); offset += 1) {
      const candidate = (((from + delta * offset) % count()) + count()) % count();
      if (!disabled.has(candidate)) {
        return candidate;
      }
    }
    return from;
  };

  const [focused, setFocused] = createSignal(-1);

  /**
   * The tab that takes focus once `onClose(index)`'s removal lands: the tab at
   * `index` in the shortened list (the following tab slid into it), or the
   * previous one when the last tab closed.
   */
  const focusAfterClose = (index: number): number =>
    index < count() - 1 ? index : Math.max(0, count() - 2);

  const close = (index: number): void => {
    if (!closable() || count() <= 1 || index < 0 || index >= count()) {
      return;
    }
    const next = focusAfterClose(index);
    setFocused(next);
    if (selected() === index) {
      // the spec's "a deleted selected tab hands selection to the tab that receives focus"
      select(next);
    }
    options.onClose?.(index);
  };

  // Unlike a plain signal, the local mirror is fresh in the same tick: the
  // input's Enter/Escape handler and the keydown it bubbles to see one state.
  const [editVersion, setEditVersion] = createSignal(0);
  let editingIndex: number | null = null;
  const editing = (): number | null => {
    editVersion();
    return editingIndex;
  };
  const setEditing = (index: number | null): void => {
    editingIndex = index;
    setEditVersion((version) => version + 1);
  };
  const [draft, setDraft] = createSignal("");

  const begin = (index: number): void => {
    if (!renamable() || disabled.has(index) || index < 0 || index >= count()) {
      return;
    }
    setEditing(index);
    setDraft(options.label?.(index) ?? "");
  };

  const cancel = (): void => {
    if (editing() === null) {
      return;
    }
    setEditing(null);
    setDraft("");
  };

  /** Enter / blur commit; an empty label is not a name, so it cancels. */
  const commit = (label: string): void => {
    const index = editing();
    if (index === null) {
      return;
    }
    setEditing(null);
    setDraft("");
    const trimmed = label.trim();
    if (trimmed === "") {
      return;
    }
    options.onRename?.(index, trimmed);
  };

  const keyDown = (key: string): void => {
    // while editing, the input owns the keys: the tablist's roving must not move
    if (editing() !== null) {
      return;
    }
    const current = focused();
    if (current < 0) {
      return;
    }
    const forward = orientation() === "horizontal" ? "ArrowRight" : "ArrowDown";
    const backward = orientation() === "horizontal" ? "ArrowLeft" : "ArrowUp";
    switch (key) {
      case forward:
        move(step(current, 1));
        break;
      case backward:
        move(step(current, -1));
        break;
      case "Home":
        move(firstEnabled());
        break;
      case "End": {
        let last = count() - 1;
        while (last > 0 && disabled.has(last)) {
          last -= 1;
        }
        move(last);
        break;
      }
      case "Enter":
      case " ":
      case "Space":
        select(current);
        break;
      case "Delete":
        close(current);
        break;
      default:
        break;
    }
  };

  return {
    get items() {
      return count();
    },
    selected,
    focused,
    editing,
    select,
    setSelected: (index) => {
      if (index >= 0 && index < count()) {
        request(index);
      }
    },
    focusTab: (index) => {
      if (index >= 0 && index < count()) {
        setFocused(index);
      }
    },
    focusAfterClose,
    keyDown,
    tablistProps: {
      role: "tablist",
      get "aria-orientation"() {
        return orientation() === "vertical" ? "vertical" : undefined;
      },
    },
    tabProps: (index) => ({
      get id() {
        return tabIdOf(index);
      },
      role: "tab",
      get "aria-selected"() {
        return selected() === index ? "true" : "false";
      },
      get "aria-controls"() {
        return panelIdOf(index);
      },
      get "aria-disabled"() {
        return disabled.has(index) ? "true" : undefined;
      },
      get tabindex() {
        return roving() === index ? 0 : -1;
      },
      onClick: () => {
        if (disabled.has(index)) {
          return;
        }
        setFocused(index);
        select(index);
      },
      onMouseDown: (event) => {
        if (disabled.has(index)) {
          event.preventDefault();
        }
      },
      onFocus: () => {
        setFocused(index);
      },
      onKeyDown: (event) => {
        // the inline input owns the keys while a rename runs
        if (editing() !== null) {
          return;
        }
        if (event.key === "Delete" && closable()) {
          event.preventDefault();
          close(index);
          return;
        }
        const before = focused();
        keyDown(event.key);
        if (focused() !== before || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
        }
      },
    }),
    tabpanelProps: (index) => ({
      get id() {
        return panelIdOf(index);
      },
      role: "tabpanel",
      get "aria-labelledby"() {
        return tabIdOf(index);
      },
      get tabindex() {
        return focusablePanels.has(index) ? undefined : 0;
      },
      get hidden() {
        return selected() !== index;
      },
    }),
    closeProps: (index) => ({
      get "aria-label"() {
        return `Close ${labelOf(index)}`;
      },
      tabindex: -1,
      onClick: () => close(index),
    }),
    renameProps: (index) => ({
      onDblClick: () => begin(index),
      editing: () => editing() === index,
      begin,
      commit,
      cancel,
      inputProps: {
        type: "text",
        get value() {
          return draft();
        },
        get "aria-label"() {
          return `Rename ${labelOf(index)}`;
        },
        onInput: (event) => {
          const target = event.currentTarget as HTMLInputElement | null;
          if (target !== null) {
            setDraft(target.value);
          }
        },
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(draft());
          } else if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        },
        // blur commits: the click that leaves the field is the commit
        onBlur: () => commit(draft()),
      },
    }),
  };
};
