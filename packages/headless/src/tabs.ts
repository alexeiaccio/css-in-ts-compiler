import {
  type Accessor,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  onSettled,
} from "solid-js";
import {
  type FocusGroupDefinition,
  type FocusGroupHandle,
  focusGroup,
  focusGroupAttribute,
  focusGroupPolyfill,
} from "./focusgroup";
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
  /**
   * Writing direction (default `ltr`) for a horizontal tablist: `rtl` makes
   * ArrowLeft the forward key, as APG says. The platform reads the direction
   * from the element, so `tablistProps` emits `dir` and the host may also set it
   * on an ancestor. A vertical tablist keeps Up / Down.
   */
  readonly dir?: "ltr" | "rtl" | undefined;
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
  /**
   * `"polyfill"` skips the feature detect and drives
   * `@microsoft/focusgroup-polyfill`'s low-level group even where the engine has
   * `focusgroup` (a test, or a host that knows it needs the polyfill). `"auto"`
   * by default.
   */
  readonly provider?: "auto" | "polyfill";
}

/**
 * Spread onto the element with `role=tab` (a native `<button>`, or any element
 * the host made focusable). No roving `tabindex`: the focusgroup provider owns
 * it, and binding it here would fight the platform. `focusgroupstart` marks the
 * tab the group enters on (the selected one, or the first enabled when the
 * selected tab is disabled) — the platform's entry point with `nomemory`.
 *
 * A disabled tab is not an item of the group: it carries a static
 * `tabindex=-1`, which both providers skip (the native engine skips a
 * `tabindex=-1` item, and the primitive leaves it out of the polyfill's
 * collection). `aria-disabled` alone would still be arrow-reachable, as
 * `shared/focusgroup.qnt` records.
 *
 * `ref` registers the element with the provider; `onFocus` and `onKeyDown` are
 * the library's half (selection, activation, Delete).
 */
export interface TabProps {
  readonly id: string;
  readonly role: "tab";
  readonly "aria-selected": "true" | "false";
  readonly "aria-controls": string;
  readonly "aria-disabled": "true" | undefined;
  readonly focusgroupstart: "" | undefined;
  readonly tabindex: -1 | undefined;
  readonly ref: (element: HTMLElement) => void;
  readonly onClick: () => void;
  readonly onMouseDown: (event: MouseEvent) => void;
  readonly onFocus: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/**
 * Spread onto the element with `role=tablist`. The definition is
 * `tablist nomemory wrap` (the `focusgroup` attribute), with the vertical axis
 * as `block`; `ref` builds the provider, and `dir` is the writing direction the
 * platform reads for the arrows.
 */
export interface TablistProps {
  readonly role: "tablist";
  readonly "aria-orientation": "vertical" | undefined;
  readonly focusgroup: string;
  readonly dir: "ltr" | "rtl" | undefined;
  readonly ref: (element: HTMLElement) => void;
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
 * keyboard path. It is not a focusgroup item either: it is absent from the
 * collection, so the platform neither moves focus to it nor acts on its keys.
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
  /**
   * Ask the host to focus `index`. Under automatic activation the focusin then
   * selects it, as a user's focus would; under manual it only moves focus.
   */
  readonly focusTab: (index: number) => void;
  /**
   * The tab that takes focus once `onClose(index)`'s removal lands: the tab
   * that slid into `index`, or the previous one when the last tab closed. Call
   * it before the host removes the tab.
   */
  readonly focusAfterClose: (index: number) => number;
  readonly tablistProps: TablistProps;
  readonly tabProps: (index: number) => TabProps;
  readonly tabpanelProps: (index: number) => TabpanelProps;
  readonly closeProps: (index: number) => TabCloseProps;
  readonly renameProps: (index: number) => TabRenameProps;
}

/**
 * APG Tabs (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): state plus prop
 * objects for a tablist, tabs and panels. No styling, no elements.
 *
 * Platform: **hybrid** — focusgroup `tablist` owns the tab stop, arrows along
 * the axis, Home / End and wrap (`shared/focusgroup.qnt`, `./focusgroup`); the
 * library owns selection, activation mode, `aria-selected` / `aria-controls`,
 * panel visibility, close and rename.
 *
 * The definition is no memory: the tablist is entered on the **selected** tab
 * (`focusgroupstart`, or the first enabled tab when the selected one is
 * disabled), not on wherever focus was last. The library selects on `focusin`
 * (automatic activation) or on Enter / Space (manual), as the polyfill's tabs
 * recipe says; a click selects in both modes.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default
 * (`defaultSelected`); pass `value` + `onValueChange` to own the selection.
 * Programmatic methods (`select`, `setSelected`) are requests too.
 *
 * Close and rename are an **extension** (bean `cssints-gdv2`): the APG spec
 * models a `deletable` flavour but neither a callback nor a rename, and this
 * primitive owns no list. `closable` / `renamable` turn on the props; `onClose`
 * / `onRename` ask the host, which removes or renames. Focus after a close goes
 * to the tab that slid into the closed one's place, or to the previous tab when
 * the last one closed; closing the last remaining tab is refused, as the spec
 * refuses an empty tablist.
 *
 * Direction: `dir` (default from the element) renders on `tablistProps`; the
 * platform maps ArrowLeft / ArrowRight per direction, so a horizontal rtl
 * tablist puts the next tab to the left and a vertical one keeps Up / Down.
 * `tabs.qnt` models ltr only, so the ported `direction` scenarios stay
 * `Unsupported` in the differential walk until the spec grows a direction
 * variable.
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

  /**
   * The tab the group enters on (`focusgroupstart`): the selected one, or the
   * first enabled tab when a programmatic selection pointed at a disabled tab
   * (base-ui's rule: a disabled tab never takes the tab stop).
   */
  const roving = (): number => (disabled.has(selected()) ? firstEnabled() : selected());

  const select = (index: number): void => {
    if (index < 0 || index >= count() || disabled.has(index)) {
      return;
    }
    request(index);
  };

  /** The platform's tab stop is the selected tab whenever focus is outside. */
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

  /**
   * The library's half of the keyboard. Arrows, Home / End, the axis and wrap
   * are the platform's, so nothing here prevents them: only the keys the
   * platform does not own are handled, and only the ones the primitive owns are
   * prevented (Enter / Space would otherwise synthesize a click on a `<button>`,
   * and Delete would reach the page).
   */
  const keyDown = (event: KeyboardEvent, index: number): void => {
    // the inline input owns the keys while a rename runs
    if (editing() !== null) {
      return;
    }
    if (event.key === "Enter" || event.key === " " || event.key === "Space") {
      select(index);
      event.preventDefault();
      return;
    }
    if (event.key === "Delete" && closable()) {
      event.preventDefault();
      close(index);
    }
  };

  /** The item elements the provider moves focus between, in index order. */
  const elements = new Map<number, HTMLElement>();
  const itemElements = (): HTMLElement[] =>
    [...elements.entries()]
      .sort(([a], [b]) => a - b)
      .filter(([index]) => !disabled.has(index))
      .map(([, element]) => element);

  /** One source for the attribute, the polyfill's definition and `dir`. */
  const definition = (): FocusGroupDefinition => ({
    behavior: "tablist",
    wrap: true,
    axis: orientation() === "vertical" ? "block" : "inline",
    memory: false,
  });

  let group: FocusGroupHandle | undefined;
  let owner: HTMLElement | undefined;

  /**
   * The owner's ref builds the provider. No keydown listener goes on the owner:
   * the library's keys (Enter / Space / Delete) are listened for on the tab
   * itself, and the platform owns every key it acts on.
   */
  const attach = (element: HTMLElement): void => {
    if (owner === element) {
      return;
    }
    owner = element;
    const provider = options.provider === "polyfill" ? focusGroupPolyfill : focusGroup;
    group = provider(element, { definition: definition(), items: itemElements });
  };

  onSettled(() => {
    // the owner's ref may run before its item refs, so collect once more after the render
    group?.update();
  });

  // The host's list and the selection move the entry point (`focusgroupstart`),
  // which the polyfill renders as the tab stop: it does not observe either, so
  // the primitive re-reconciles. The native engine reads the attribute itself.
  createEffect(
    () => [count(), roving()] as const,
    () => {
      group?.update();
    },
  );

  // A definition change (the axis) is the one update that also carries it.
  createEffect(
    () => orientation(),
    () => {
      group?.update(definition());
    },
  );

  onCleanup(() => {
    group?.destroy();
    group = undefined;
    owner = undefined;
  });

  /**
   * Automatic activation selects on the focusin a gesture causes. A pointer
   * press on the already-focused tab causes none, so that click has to select
   * itself: `pressSelects` records it at mousedown, before the browser moves
   * focus (a press that does move focus leaves the selection to the focusin, so
   * a controlled host is asked once, not twice).
   */
  let pressSelects = false;

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
      if (index >= 0 && index < count() && !disabled.has(index)) {
        setFocused(index);
      }
    },
    focusAfterClose,
    tablistProps: {
      role: "tablist",
      get "aria-orientation"() {
        return orientation() === "vertical" ? "vertical" : undefined;
      },
      get focusgroup() {
        // the forced polyfill path keeps the native engine out of the group
        return options.provider === "polyfill" ? "" : focusGroupAttribute(definition());
      },
      get dir() {
        return options.dir;
      },
      get ref() {
        return attach;
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
      get focusgroupstart() {
        return roving() === index ? "" : undefined;
      },
      get tabindex() {
        // a disabled tab is not an item of the group; this static opt-out is the
        // only tabindex the primitive renders
        return disabled.has(index) ? -1 : undefined;
      },
      ref: (element) => {
        elements.set(index, element);
      },
      onClick: () => {
        if (disabled.has(index)) {
          return;
        }
        // a press that moved focus already selected on its focusin; one on the
        // focused tab, or a programmatic click, has to select here
        const selects =
          pressSelects ||
          activation() === "manual" ||
          document.activeElement !== elements.get(index);
        pressSelects = false;
        setFocused(index);
        if (selects) {
          select(index);
        }
      },
      onMouseDown: (event) => {
        if (disabled.has(index)) {
          event.preventDefault();
          return;
        }
        pressSelects = document.activeElement === event.currentTarget;
      },
      onFocus: () => {
        if (disabled.has(index)) {
          return;
        }
        setFocused(index);
        // automatic activation: selection follows focus, as the model's
        // AutomaticSelectionFollowsFocus says
        if (activation() === "automatic") {
          select(index);
        }
      },
      onKeyDown: (event) => {
        keyDown(event, index);
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
