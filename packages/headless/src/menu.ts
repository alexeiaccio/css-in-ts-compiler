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
import { type Prefs, withPrefs } from "./prefs";

/**
 * APG menu family on Solid 2: `createMenu` (menu button + the checkable /
 * menuitemcheckbox / menuitemradio capability) and `createMenubar` (roving
 * focus, nested submenus, typeahead). Plain Solid signals, zero deps beyond
 * `solid-js`; no elements, no styling.
 *
 * State is a faithful transcription of `specs/apg/menu-button.qnt`,
 * `menu-checkable.qnt` and `menu-menubar.qnt` (the generated models are the
 * differential-test oracle, see `test/menu-button.browser.test.tsx`).
 *
 * Platform: **hybrid** (map ticket `etfq`). `popover` gives top layer, light
 * dismiss and Esc; `focusgroup` gives the roving tab stop and the movement
 * along each level's axis (`shared/focusgroup.qnt`, `./focusgroup`). The
 * library owns the menu keys (activation, Escape, Tab, typeahead, submenu and
 * cross-axis keys), the `aria-haspopup` / `aria-expanded` sync, the checkable
 * state and the light dismiss.
 *
 * One owner per level, because the platform's contract is per segment: the menu
 * list (`menu`, block axis, wrap), the menubar (`menubar`, inline, wrap) and
 * each submenu (`menu`) are separate groups. A popup's list is a segment only
 * while the popup is shown, so a closed one is suspended (`focusgroup="none"`):
 * the platform puts one tab stop in every live group, and a hidden list has
 * none. The item `tabindex` is the platform's while a group is live — the
 * primitive never renders one.
 *
 * Request/commit (map ticket `rt1p`): the open state, and the checked items of
 * the checkable variants, are controllable. Uncontrolled by default
 * (`defaultOpen` / `defaultChecked` + `defaultChoice`); pass `open`, and the
 * checked state as either view — the readable `checked` / `choice` (+
 * `onCheckedValuesChange`) or the packed `value` (+ `onCheckedValueChange`) —
 * to own them. Every opening and closing intent — the
 * trigger's click and keys, Escape, an item's activation, Tab, and the
 * programmatic `openMenu` / `closeMenu` — is a request the host may ignore.
 */

// ---------------------------------------------------------------------------
// menu button / checkable menu
// ---------------------------------------------------------------------------

export type MenuItemKind = "item" | "checkbox" | "radio";

/**
 * A key the platform moves focus on, along a group's axis; Home / End belong to
 * every axis. The library leaves these alone: no state of its own, no
 * `preventDefault`.
 */
const isPlatformKey = (axis: "inline" | "block", key: string): boolean =>
  key === "Home" ||
  key === "End" ||
  (axis === "inline"
    ? key === "ArrowLeft" || key === "ArrowRight"
    : key === "ArrowUp" || key === "ArrowDown");

/** Enter, Space and the DOM's own name for a space. */
const isActivationKey = (key: string): boolean => key === "Enter" || key === " " || key === "Space";

export interface MenuItemInput {
  readonly label: string;
  readonly kind?: MenuItemKind;
  readonly checked?: boolean;
  readonly disabled?: boolean;
}

export type MenuVariant = "plain" | "checkbox-items" | "radio-items" | "mixed";

export interface MenuOptions {
  readonly items: ReadonlyArray<string | MenuItemInput>;
  readonly variant?: MenuVariant;
  /** Controlled: the host owns the open state and this is the only thing that opens or closes it. */
  readonly open?: boolean | undefined;
  /** Uncontrolled starting state; ignored while `open` is set. */
  readonly defaultOpen?: boolean;
  /**
   * `outside` (menu button): focus can sit outside the widget, so keys are
   * inert until the trigger is focused. `held` (checkable menu / menubar item
   * owner): the trigger always holds focus while closed.
   */
  readonly triggerMode?: "outside" | "held";
  /** Checkbox item indices checked at mount (`checkbox-items` / `mixed`). */
  readonly defaultChecked?: ReadonlyArray<number>;
  /** Radio item index selected at mount (`radio-items` / `mixed`). */
  readonly defaultChoice?: number;
  /**
   * Controlled, readable: the checked checkbox item indices. The readable pair
   * (`checked` + `choice`) is the store; the packed `value` is a view of it
   * (`menu-checkable.qnt`'s `checked(wrap, choice)` has one checkbox bit, so
   * only the readable pair names a checkbox beyond item 0). `undefined` leaves
   * the pair uncontrolled.
   */
  readonly checked?: ReadonlyArray<number> | undefined;
  /** Controlled, readable: the chosen radio item index; `-1` for none. */
  readonly choice?: number | undefined;
  /**
   * Controlled: the host owns the checked items, packed as
   * `checkboxItem0 * 5 + radioChoice` (1-based), matching `menu-checkable.qnt`'s
   * `checked(wrap, choice)`; pass `undefined` for uncontrolled. It is the
   * packed view of the same state as `checked` / `choice`, and the readable
   * pair wins where both are given. The open state has its own `open` pair.
   */
  readonly value?: number | undefined;
  /** The uncontrolled packed checked state at mount. */
  readonly defaultValue?: number;
  /** A request to change the checked items (a packed `value` the host may ignore). */
  readonly onCheckedValueChange?: (value: number) => void;
  /**
   * A request to change the readable pair: the packed `onCheckedValueChange`'s
   * readable twin. Uncontrolled it is accepted (the state has committed when it
   * is called); controlled with `checked` / `choice` the host may ignore it.
   */
  readonly onCheckedValuesChange?: (checked: ReadonlyArray<number>, choice: number) => void;
  /** Item indices disabled (focusable, not activatable). */
  readonly disabled?: ReadonlyArray<number>;
  readonly id?: string;
  /**
   * A request to change the open state, called when the intent differs from the
   * current one. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onOpenChange?: (open: boolean) => void;
  readonly onItemClick?: (index: number) => void;
  readonly onCheckedChange?: (checked: boolean, index: number) => void;
  readonly onValueChange?: (index: number) => void;
  /**
   * Structural mirror of `ing.lexicon.ui.prefs` (`./prefs`). Honoured here:
   * `typeaheadDelayMs` (the buffer timeout). Absent prefs keep the default.
   */
  readonly prefs?: Partial<Prefs> | undefined;
  /**
   * While this returns `true`, a DOM `focus` on the trigger/items is ignored, so
   * a fixture applying focus programmatically does not write back into the
   * primitive (bean 209r — the differential walk's focus feedback loop).
   */
  readonly suppressFocusWrite?: (() => boolean) | undefined;
  /**
   * `"polyfill"` skips the feature detect and drives
   * `@microsoft/focusgroup-polyfill`'s low-level group even where the engine has
   * `focusgroup` (a test, or a host that knows it needs the polyfill). `"auto"`
   * by default.
   */
  readonly provider?: "auto" | "polyfill";
}

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly kind: MenuItemKind;
  readonly disabled: boolean;
}

export interface MenuTriggerProps {
  readonly id: string;
  readonly type: "button";
  readonly "aria-haspopup": "menu";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onFocus: () => void;
}

/**
 * Spread onto the menu's list. `focusgroup` states the definition the provider
 * derives from, and `ref` builds that provider and registers the keydown
 * listener before it. No `onKeyDown`: a delegated Solid handler runs at the
 * document, after the polyfill (also on the owner) has moved focus.
 */
export interface MenuProps {
  readonly id: string;
  readonly role: "menu";
  readonly hidden: boolean;
  /** The definition as the `focusgroup` attribute (`"menu"`; `"none"` while hidden). */
  readonly focusgroup: string;
  readonly ref: (element: HTMLElement) => void;
}

/**
 * Spread onto a row. No `tabindex`: the platform owns it, and binding one here
 * would fight it. `onFocus` is how the primitive hears where the platform put
 * the focus.
 */
export interface MenuItemProps {
  readonly id: string;
  readonly role: "menuitem" | "menuitemcheckbox" | "menuitemradio";
  readonly "aria-checked": "true" | "false" | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly ref: (element: HTMLElement) => void;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onMouseEnter: () => void;
}

export interface Menu {
  readonly open: Accessor<boolean>;
  /** 0 outside, 1 on the trigger, 2 on a menu item. */
  readonly focusLevel: Accessor<0 | 1 | 2>;
  readonly focusIndex: Accessor<number>;
  readonly items: ReadonlyArray<MenuItem>;
  /** The checked checkbox items, by index: the readable view of the state. */
  readonly checked: Accessor<ReadonlyArray<number>>;
  /** The chosen radio item, `-1` for none: the readable view of the state. */
  readonly choice: Accessor<number>;
  /** The packed view of the same state: `checkboxItem0 * 5 + radioChoice` (1-based). */
  readonly value: Accessor<number>;
  readonly focusTrigger: () => void;
  readonly leave: () => void;
  readonly clickTrigger: () => void;
  readonly openMenu: () => void;
  readonly closeMenu: () => void;
  /**
   * The keys the library owns: Enter / Space activation, Escape, and Tab (which
   * closes and leaves). The arrows, Home and End are the platform's, so they are
   * not here and not `preventDefault`ed anywhere.
   */
  readonly keyDown: (key: string) => void;
  readonly type: (text: string) => void;
  /** Differential-test hook: typeahead by the spec's letter code. */
  readonly typeaheadCode: (code: number) => void;
  readonly setFocusItem: (index: number) => void;
  readonly triggerProps: MenuTriggerProps;
  readonly menuProps: MenuProps;
  readonly itemProps: (index: number) => MenuItemProps;
}

const toItem = (input: string | MenuItemInput, index: number, base: string) => {
  if (typeof input === "string") {
    return { label: input, disabled: false, id: `${base}-item-${index}` };
  }
  return {
    label: input.label,
    disabled: input.disabled ?? false,
    id: `${base}-item-${index}`,
  };
};

const kindFor = (variant: MenuVariant, index: number): MenuItemKind => {
  if (variant === "mixed") {
    return index === 0 ? "checkbox" : index >= 1 && index <= 3 ? "radio" : "item";
  }
  if (variant === "checkbox-items") {
    return "checkbox";
  }
  if (variant === "radio-items") {
    return "radio";
  }
  return "item";
};

export const createMenu = (options: MenuOptions): Menu => {
  const base = options.id ?? createUniqueId();
  const menuId = `${base}-menu`;
  const items: ReadonlyArray<MenuItem> = options.items.map((input, index) => ({
    ...toItem(input, index, base),
    kind: kindFor(options.variant ?? "plain", index),
  }));
  const count = items.length;
  const prefs = withPrefs(options.prefs);

  const disabled = new Set<number>(options.disabled ?? []);
  for (const [index, item] of items.entries()) {
    if (item.disabled) {
      disabled.add(index);
    }
  }

  // Local state + a version signal: Solid 2 setters apply on the microtask
  // flush, so a signal would lag behind a transition performed in one tick.
  const held = (options.triggerMode ?? "outside") === "held";
  // The open state is a request/commit pair: uncontrolled it commits here,
  // controlled the host's `open` prop is the only thing that changes it.
  // The host's `open` is a JSX prop: reading it creates a computation in Solid 2,
  // which is refused in an effect callback or a ref (both reach this state, and so
  // does a probe during a flush). The read happens in an effect's compute and is
  // snapshotted; every other read is a plain signal read.
  const readOpen = (): { readonly controlled: boolean; readonly open: boolean } => {
    const raw = options.open;
    return { controlled: raw !== undefined, open: raw === true };
  };
  const [hostOpen, setHostOpen] = createSignal(readOpen());
  createEffect(readOpen, (next) => {
    setHostOpen(() => next);
  });
  const [isOpen, requestOpen] = createControllable<boolean>({
    value: () => (hostOpen().controlled ? hostOpen().open : undefined),
    initial: options.defaultOpen === true,
    onChange: () => options.onOpenChange,
  });
  let checked = new Set<number>(options.defaultChecked ?? []);
  const variantChoice = (): number => {
    if (options.variant === "mixed") return 1;
    if (options.variant === "radio-items") return 0;
    return -1;
  };
  let choice = options.defaultChoice ?? variantChoice();
  if (options.defaultValue !== undefined) {
    checked = new Set<number>();
    if (options.defaultValue >= 5) {
      checked.add(0);
    }
    const packedChoice = options.defaultValue % 5;
    choice = packedChoice === 0 ? -1 : packedChoice - 1;
  }

  // One state, two views: the readable pair (`checked` + `choice`) is the store
  // and the packed number (`value`) is derived from it. The pack of
  // `menu-checkable.qnt` is `checked(wrap, choice)` = one checkbox bit * 5 +
  // the radio, so only the readable pair can name a checkbox beyond item 0; the
  // packed pair stays as the spec's and the existing callers' contract. A host
  // may own either view (each field falls back to the packed one, then to the
  // local state); where both are given the readable pair wins.
  const currentChecked = (): Set<number> => {
    if (options.checked !== undefined) {
      return new Set(options.checked);
    }
    if (options.value === undefined) {
      return checked;
    }
    const set = new Set<number>();
    if (options.value >= 5) {
      set.add(0);
    }
    return set;
  };
  const currentChoice = (): number => {
    if (options.choice !== undefined) {
      return options.choice;
    }
    if (options.value === undefined) {
      return choice;
    }
    const packedChoice = options.value % 5;
    return packedChoice === 0 ? -1 : packedChoice - 1;
  };
  const packChecked = (set: Set<number>, radio: number): number =>
    (set.has(0) ? 5 : 0) + (radio >= 0 ? radio + 1 : 0);
  // The packed view of the readable pair, as `menu-checkable.qnt` carries it.
  const packed = (): number => packChecked(currentChecked(), currentChoice());

  // A write from either view is the same commit: the fields the host does not
  // own commit here, the packed request stays controlled-only (as it was), and
  // the readable one fires always.
  const requestChecked = (next: Set<number>, nextChoice: number): void => {
    const checkedOwned = options.checked !== undefined || options.value !== undefined;
    const choiceOwned = options.choice !== undefined || options.value !== undefined;
    if (!checkedOwned) {
      checked = next;
    }
    if (!choiceOwned) {
      choice = nextChoice;
    }
    if (!checkedOwned || !choiceOwned) {
      bump();
    }
    if (options.value !== undefined) {
      options.onCheckedValueChange?.(packChecked(next, nextChoice));
    }
    // Readable requests fire uncontrolled too, like `onOpenChange`: the state
    // has committed, and a host that only listens still hears the change.
    options.onCheckedValuesChange?.(
      [...next].sort((a, b) => a - b),
      nextChoice,
    );
  };
  let buffer = "";
  let bufferTimer: ReturnType<typeof setTimeout> | undefined;
  const [version, setVersion] = createSignal(0);
  const bump = (): void => {
    setVersion((v) => v + 1);
  };
  const track =
    <T>(read: () => T): Accessor<T> =>
    () => {
      version();
      return read();
    };

  // The platform's half: the list is a `menu` segment while its popup is shown,
  // and no segment at all while it is hidden (a `hidden` list has no tab stop,
  // and the platform observes no visibility). The provider owns the item
  // `tabindex` and the movement along the block axis; the primitive collects the
  // rows itself, because a consumer may wrap them.
  const definition = (shown: boolean): FocusGroupDefinition =>
    shown ? { behavior: "menu", axis: "block", wrap: true, memory: true } : { behavior: "none" };
  const elements = new Map<number, HTMLElement>();
  const itemElements = (): HTMLElement[] =>
    [...elements.entries()].sort(([a], [b]) => a - b).map(([, element]) => element);
  let group: FocusGroupHandle | undefined;
  let owner: HTMLElement | undefined;
  let shownGroup: boolean | undefined;

  /** Re-apply the definition the open state asks for (`update()` only when it changed). */
  const syncGroup = (): void => {
    const shown = isOpen();
    if (group === undefined || shown === shownGroup) {
      return;
    }
    shownGroup = shown;
    group.update(definition(shown));
  };

  // The focus follows the open state (`menu-button.qnt`'s
  // `ExpandedIffFocusInMenu`): level 2 exactly while the menu is open, and
  // `closed` (0 outside, 1 on the trigger) while it is not; `index` is the
  // focused item while it is open. A request that opens or closes moves them
  // with the state, and only when the state lands where it was asked, so a
  // rejected request leaves the focus as it found it. The host's `open` prop
  // lands on Solid's microtask flush, so the answer is read there. A host write
  // is not a request: it moves the focus to the default (the first item when it
  // opens, the trigger when it closes), which `sync` applies when the state is
  // next read.
  let closed: 0 | 1 = held ? 1 : 0;
  let index = 0;
  let seenOpen = isOpen();

  const isDisabled = (i: number): boolean => disabled.has(i);

  const sync = (): void => {
    syncGroup();
    const now = isOpen();
    if (now === seenOpen) {
      return;
    }
    seenOpen = now;
    index = now ? 0 : -1;
    closed = now ? closed : 1;
  };

  const level = (): 0 | 1 | 2 => {
    sync();
    return isOpen() ? 2 : closed;
  };

  const focusedIndex = (): number => {
    sync();
    return index;
  };

  const focusItem = (next: number): void => {
    index = next;
    bump();
  };

  const move = (want: boolean, nextIndex: number, nextClosed: 0 | 1): void => {
    const apply = (): void => {
      seenOpen = isOpen();
      index = want ? nextIndex : -1;
      closed = nextClosed;
      syncGroup();
      bump();
    };
    if (isOpen() === want) {
      apply();
      return;
    }
    requestOpen(want);
    if (!hostOpen().controlled) {
      apply();
      return;
    }
    queueMicrotask(() => {
      if (isOpen() === want) {
        apply();
      }
    });
  };

  const openOn = (target: number): void => {
    move(true, target, 1);
  };

  const closeToTrigger = (): void => {
    move(false, -1, 1);
  };

  const focusTrigger = (): void => {
    if (level() === 0) {
      closed = 1;
      bump();
    }
  };

  const leave = (): void => {
    move(false, -1, held ? 1 : 0);
  };

  const clickTrigger = (): void => {
    if (isOpen()) {
      closeToTrigger();
    } else {
      openOn(0);
    }
  };

  const openMenu = (): void => {
    if (!isOpen()) {
      openOn(0);
    }
  };

  const closeMenu = (): void => {
    if (isOpen()) {
      closeToTrigger();
    }
  };

  const activate = (close: boolean): void => {
    if (level() === 1) {
      openOn(0);
      return;
    }
    if (level() !== 2 || index < 0 || isDisabled(index)) {
      return;
    }
    const item = items[index];
    if (item === undefined) {
      return;
    }
    if (item.kind === "checkbox") {
      const current = currentChecked();
      const next = !current.has(index);
      const updated = new Set(current);
      if (next) {
        updated.add(index);
      } else {
        updated.delete(index);
      }
      requestChecked(updated, currentChoice());
      options.onCheckedChange?.(next, index);
      if (close) {
        closeToTrigger();
      }
      return;
    }
    if (item.kind === "radio") {
      requestChecked(currentChecked(), index);
      options.onValueChange?.(index);
      if (close) {
        closeToTrigger();
      }
      return;
    }
    options.onItemClick?.(index);
    closeToTrigger();
  };

  /**
   * The keys the library owns: activation, Escape and Tab. The arrows, Home and
   * End are the platform's (`focusgroup="menu"`), so they are neither here nor
   * `preventDefault`ed.
   */
  const keyDown = (key: string): void => {
    switch (key) {
      case "Enter":
        activate(true);
        break;
      case " ":
      case "Space":
        activate(false);
        break;
      case "Escape":
        if (level() === 2) {
          closeToTrigger();
        }
        break;
      case "Tab":
        if (level() !== 0) {
          leave();
        }
        break;
      default:
        break;
    }
  };

  const search = (from: number, text: string): number | undefined => {
    const needle = text.toLowerCase();
    for (let offset = 1; offset <= count; offset += 1) {
      const candidate = (from + offset) % count;
      if (items[candidate]?.label.toLowerCase().startsWith(needle)) {
        return candidate;
      }
    }
    return undefined;
  };

  const type = (text: string): void => {
    if (!isOpen() || text.length === 0) {
      return;
    }
    buffer += text;
    if (bufferTimer !== undefined) {
      clearTimeout(bufferTimer);
    }
    bufferTimer = setTimeout(() => {
      buffer = "";
    }, prefs.typeaheadDelayMs);
    const from = focusedIndex() >= 0 ? focusedIndex() : 0;
    const match = search(from, buffer);
    if (match !== undefined) {
      focusItem(match);
    }
  };

  // The `menu-button.qnt` fixture's typeahead codes are index-based (items 1
  // and 3 are code 1, items 2 and 4 are code 2), independent of the label.
  const codeOf = (i: number): number => (i % 2 === 0 ? 1 : 2);

  const typeaheadCode = (code: number): void => {
    if (!isOpen()) {
      return;
    }
    const from = focusedIndex() >= 0 ? focusedIndex() : 0;
    for (let offset = 1; offset < count; offset += 1) {
      const candidate = (from + offset) % count;
      if (codeOf(candidate) === code) {
        focusItem(candidate);
        return;
      }
    }
  };

  const setFocusItem = (i: number): void => {
    if (i < 0 || i >= count) {
      return;
    }
    move(true, i, 1);
  };

  /**
   * The list's own keydown, registered on the owner before the provider's
   * listener: the platform moves on the block axis (arrows, Home / End), so only
   * the keys the library owns are read here — and only those are `preventDefault`ed.
   * Letters feed the typeahead buffer, which the platform does not have.
   */
  const keyDownEvent = (event: KeyboardEvent): void => {
    const key = event.key;
    if (isPlatformKey("block", key)) {
      return;
    }
    if (isActivationKey(key)) {
      event.preventDefault();
      keyDown(key === "Enter" ? "Enter" : " ");
      return;
    }
    if (key === "Escape" || key === "Tab") {
      event.preventDefault();
      keyDown(key);
      return;
    }
    if (key.length === 1) {
      type(key);
    }
  };

  /** The owner's ref: the listener first, then the provider (see `./focusgroup`). */
  const attach = (element: HTMLElement): void => {
    if (owner === element) {
      return;
    }
    owner = element;
    element.addEventListener("keydown", keyDownEvent);
    const provider = options.provider === "polyfill" ? focusGroupPolyfill : focusGroup;
    group = provider(element, { definition: definition(isOpen()), items: itemElements });
    shownGroup = isOpen();
  };

  onSettled(() => {
    // the owner's ref may run before its item refs: collect once more after the render.
    // `shownGroup` (not `isOpen()`) is read here: `onSettled` is not a scope a host's
    // reactive getter may be read from
    if (group !== undefined && shownGroup !== undefined) {
      group.update(definition(shownGroup));
    }
  });

  onCleanup(() => {
    owner?.removeEventListener("keydown", keyDownEvent);
    group?.destroy();
    group = undefined;
  });

  return {
    open: track(isOpen),
    focusLevel: track(level),
    focusIndex: track(focusedIndex),
    items,
    checked: track(() => [...currentChecked()].sort((a, b) => a - b)),
    choice: track(() => currentChoice()),
    value: track(packed),
    focusTrigger,
    leave,
    clickTrigger,
    openMenu,
    closeMenu,
    keyDown,
    type,
    typeaheadCode,
    setFocusItem,
    triggerProps: {
      id: `${base}-trigger`,
      type: "button",
      "aria-haspopup": "menu",
      get "aria-expanded"() {
        version();
        return isOpen() ? "true" : "false";
      },
      "aria-controls": menuId,
      get disabled() {
        return false;
      },
      onClick: clickTrigger,
      /**
       * The trigger is no focusgroup owner (it is a single control outside the
       * list), so the menu's own keys are read here: the open keys, activation,
       * Escape and Tab. Its arrow keys are the perpendicular axis, which the
       * platform leaves to the author.
       */
      onKeyDown: (event) => {
        const key = event.key;
        if (isActivationKey(key)) {
          event.preventDefault();
          keyDown(key === "Enter" ? "Enter" : " ");
          return;
        }
        if (key === "ArrowDown") {
          event.preventDefault();
          openOn(0);
          return;
        }
        if (key === "ArrowUp") {
          event.preventDefault();
          openOn(count - 1);
          return;
        }
        if (key === "Escape" || key === "Tab") {
          event.preventDefault();
          keyDown(key);
        }
      },
      onFocus: () => {
        if (options.suppressFocusWrite?.() !== true) {
          focusTrigger();
        }
      },
    },
    menuProps: {
      id: menuId,
      role: "menu",
      get hidden() {
        version();
        return !isOpen();
      },
      get focusgroup() {
        version();
        // the forced polyfill path keeps the native engine out of the group
        return options.provider === "polyfill" ? "" : focusGroupAttribute(definition(isOpen()));
      },
      get ref() {
        return attach;
      },
    },
    itemProps: (i) => ({
      id: items[i]?.id ?? `${base}-item-${i}`,
      get role() {
        const kind = items[i]?.kind ?? "item";
        if (kind === "checkbox") return "menuitemcheckbox";
        if (kind === "radio") return "menuitemradio";
        return "menuitem";
      },
      get "aria-checked"() {
        version();
        const kind = items[i]?.kind ?? "item";
        if (kind === "checkbox") {
          return currentChecked().has(i) ? "true" : "false";
        }
        if (kind === "radio") {
          return currentChoice() === i ? "true" : "false";
        }
        return undefined;
      },
      get "aria-disabled"() {
        return isDisabled(i) ? "true" : undefined;
      },
      ref: (element: HTMLElement) => {
        elements.set(i, element);
      },
      onClick: () => {
        if (isDisabled(i)) {
          return;
        }
        setFocusItem(i);
        // pointer activation toggles a checkbox/radio without closing; a plain
        // item activates and closes
        activate((items[i]?.kind ?? "item") === "item");
      },
      onFocus: () => {
        if (options.suppressFocusWrite?.() !== true) {
          setFocusItem(i);
        }
      },
      onMouseEnter: () => {
        if (!isDisabled(i)) {
          setFocusItem(i);
        }
      },
    }),
  };
};

// ---------------------------------------------------------------------------
// menubar
// ---------------------------------------------------------------------------

export interface MenubarMenuItemInput {
  readonly label: string;
  readonly submenu?: ReadonlyArray<MenubarMenuItemInput>;
  readonly disabled?: boolean;
}

export interface MenubarItemInput {
  readonly label: string;
  readonly menu?: ReadonlyArray<MenubarMenuItemInput>;
  readonly disabled?: boolean;
}

export interface MenubarOptions {
  readonly items: ReadonlyArray<string | MenubarItemInput>;
  readonly orientation?: "horizontal" | "vertical";
  readonly wrap?: boolean;
  readonly id?: string;
  /**
   * Structural mirror of `ing.lexicon.ui.prefs` (`./prefs`). Honoured here:
   * `typeaheadDelayMs` (the buffer timeout). Absent prefs keep the default.
   */
  readonly prefs?: Partial<Prefs> | undefined;
  /**
   * While this returns `true`, a DOM `focus` on the trigger/items is ignored, so
   * a fixture applying focus programmatically does not write back into the
   * primitive (bean 209r — the differential walk's focus feedback loop).
   */
  readonly suppressFocusWrite?: (() => boolean) | undefined;
  /**
   * `"polyfill"` skips the feature detect and drives
   * `@microsoft/focusgroup-polyfill`'s low-level group even where the engine has
   * `focusgroup` (a test, or a host that knows it needs the polyfill). `"auto"`
   * by default.
   */
  readonly provider?: "auto" | "polyfill";
}

export interface MenubarItem {
  readonly id: string;
  readonly label: string;
  readonly menu: ReadonlyArray<MenubarMenuItem>;
  readonly disabled: boolean;
}

export interface MenubarMenuItem {
  readonly id: string;
  readonly label: string;
  readonly submenu: ReadonlyArray<MenubarMenuItem>;
  readonly disabled: boolean;
}

export interface Menubar {
  /** 0 outside, 1 menubar, 2 top-level menu, 3 submenu. */
  readonly focusLevel: Accessor<0 | 1 | 2 | 3>;
  readonly focusIndex: Accessor<number>;
  readonly barStop: Accessor<number>;
  readonly openTop: Accessor<number>;
  readonly openSub: Accessor<number>;
  readonly items: ReadonlyArray<MenubarItem>;
  readonly focusIn: () => void;
  readonly leave: () => void;
  /**
   * The keys the library owns: activation, Escape, Tab, and the cross-axis keys
   * (the bar's own axis and each menu's are the platform's). On the bar it also
   * opens the focused item's menu on the first / last row (`ArrowDown` /
   * `ArrowUp`), which is the perpendicular pair of a horizontal bar.
   */
  readonly keyDown: (key: string) => void;
  readonly type: (text: string) => void;
  /** Differential-test hook: typeahead by the spec's letter code. */
  readonly typeaheadCode: (code: number) => void;
  /** The bar's owner: `focusgroup="menubar"` and the listener the `ref` registers first. */
  readonly menubarProps: {
    readonly role: "menubar";
    readonly "aria-orientation": "horizontal" | "vertical";
    /** The definition as the `focusgroup` attribute (`"menubar inline wrap"`). */
    readonly focusgroup: string;
    readonly ref: (element: HTMLElement) => void;
  };
  readonly barItemProps: (index: number) => {
    readonly id: string;
    readonly role: "menuitem";
    readonly "aria-haspopup": "menu" | undefined;
    readonly "aria-expanded": "true" | "false" | undefined;
    readonly ref: (element: HTMLElement) => void;
    readonly onClick: () => void;
    readonly onFocus: () => void;
  };
  readonly menuProps: (index: number) => {
    readonly id: string;
    readonly role: "menu";
    readonly hidden: boolean;
    /** `"menu"` while the menu is shown, `"none"` while it is hidden. */
    readonly focusgroup: string;
    readonly ref: (element: HTMLElement) => void;
  };
  readonly menuItemProps: (
    bar: number,
    item: number,
  ) => {
    readonly id: string;
    readonly role: "menuitem";
    readonly "aria-haspopup": "menu" | undefined;
    readonly "aria-expanded": "true" | "false" | undefined;
    readonly ref: (element: HTMLElement) => void;
    readonly onClick: () => void;
    readonly onMouseEnter: () => void;
    readonly onFocus: () => void;
  };
  readonly submenuProps: (
    bar: number,
    item: number,
  ) => {
    readonly id: string;
    readonly role: "menu";
    readonly hidden: boolean;
    readonly focusgroup: string;
    readonly ref: (element: HTMLElement) => void;
  };
  readonly submenuItemProps: (
    bar: number,
    item: number,
    sub: number,
  ) => {
    readonly id: string;
    readonly role: "menuitem";
    readonly ref: (element: HTMLElement) => void;
    readonly onClick: () => void;
    readonly onMouseEnter: () => void;
    readonly onFocus: () => void;
  };
}

const toMenubarItem = (input: string | MenubarItemInput): MenubarItemInput & { label: string } => {
  if (typeof input === "string") {
    return { label: input };
  }
  return input;
};

const toMenuItems = (
  inputs: ReadonlyArray<MenubarMenuItemInput> | undefined,
  path: string,
): ReadonlyArray<MenubarMenuItem> =>
  (inputs ?? []).map((input, index): MenubarMenuItem => {
    const id = `${path}-${index}`;
    return {
      id,
      label: input.label,
      disabled: input.disabled ?? false,
      submenu: toMenuItems(input.submenu, `${id}-sub`),
    };
  });

export const createMenubar = (options: MenubarOptions): Menubar => {
  const base = options.id ?? createUniqueId();
  const orientation = options.orientation ?? "horizontal";
  const items: ReadonlyArray<MenubarItem> = options.items.map((input, index) => {
    const normalized = toMenubarItem(input);
    return {
      id: `${base}-bar-${index}`,
      label: normalized.label,
      disabled: normalized.disabled ?? false,
      menu: toMenuItems(normalized.menu, `${base}-menu-${index}`),
    };
  });
  const bar = items.length;
  const prefs = withPrefs(options.prefs);

  let level: 0 | 1 | 2 | 3 = 0;
  let focusIdx = -1;
  let barStop = 0;
  let openTop = -1;
  let openSub = -1;
  let buffer = "";
  let bufferTimer: ReturnType<typeof setTimeout> | undefined;
  const [version, setVersion] = createSignal(0);
  const bump = (): void => {
    syncGroups();
    setVersion((v) => v + 1);
  };
  const track =
    <T>(read: () => T): Accessor<T> =>
    () => {
      version();
      return read();
    };

  // The platform's half, one owner per level because its contract is per
  // segment: the bar (`menubar`, the declared axis and wrap), every top-level
  // menu and every submenu (`menu`, the block axis, wrap). A popup's list is a
  // segment only while the popup is shown — the platform observes no visibility,
  // and a hidden list has no tab stop — so a closed one is suspended with
  // `focusgroup="none"`. The item `tabindex` is the platform's while a level is
  // live; the primitive never renders one.
  interface LevelOwner {
    readonly key: string;
    readonly shown: () => boolean;
    readonly definition: () => FocusGroupDefinition;
    readonly rows: () => HTMLElement[];
    /** The keys the library reads on this level (the platform's axis is not among them). */
    readonly keys: (event: KeyboardEvent) => void;
  }
  interface LevelGroup {
    readonly element: HTMLElement;
    readonly handle: FocusGroupHandle;
    readonly listener: (event: KeyboardEvent) => void;
    readonly owner: LevelOwner;
    shown: boolean;
  }

  const rowStore = new Map<string, Map<number, HTMLElement>>();
  const rowMap = (key: string): Map<number, HTMLElement> => {
    let map = rowStore.get(key);
    if (map === undefined) {
      map = new Map();
      rowStore.set(key, map);
    }
    return map;
  };
  const rowElements = (key: string): HTMLElement[] =>
    [...rowMap(key).entries()].sort(([a], [b]) => a - b).map(([, element]) => element);

  const axis: "inline" | "block" = orientation === "horizontal" ? "inline" : "block";
  const wrap = options.wrap ?? true;
  const listDefinition = (shown: boolean): FocusGroupDefinition =>
    shown ? { behavior: "menu", axis: "block", wrap: true, memory: true } : { behavior: "none" };
  const barDefinition = (): FocusGroupDefinition => ({
    behavior: "menubar",
    axis,
    wrap,
    memory: true,
  });

  const groups = new Map<string, LevelGroup>();
  const provider = options.provider === "polyfill" ? focusGroupPolyfill : focusGroup;

  const detach = (key: string): void => {
    const group = groups.get(key);
    if (group === undefined) {
      return;
    }
    group.element.removeEventListener("keydown", group.listener);
    group.handle.destroy();
    groups.delete(key);
  };

  /** An owner's ref: the listener first, then the provider (see `./focusgroup`). */
  const attach = (owner: LevelOwner, element: HTMLElement): void => {
    const existing = groups.get(owner.key);
    if (existing?.element === element) {
      return;
    }
    if (existing !== undefined) {
      detach(owner.key);
    }
    const listener = (event: KeyboardEvent): void => {
      // a key inside a submenu bubbles through its ancestors' owners: only the
      // level that holds the pressed row reads it
      const target = event.target;
      if (!(target instanceof HTMLElement) || !owner.rows().includes(target)) {
        return;
      }
      owner.keys(event);
    };
    element.addEventListener("keydown", listener);
    groups.set(owner.key, {
      element,
      listener,
      owner,
      shown: owner.shown(),
      handle: provider(element, { definition: owner.definition(), items: owner.rows }),
    });
  };

  /** Re-apply a definition only where a level appeared or disappeared. */
  const syncGroups = (): void => {
    for (const group of groups.values()) {
      const shown = group.owner.shown();
      if (shown === group.shown) {
        continue;
      }
      group.shown = shown;
      group.handle.update(group.owner.definition());
    }
  };

  onSettled(() => {
    // an owner's ref may run before its rows' refs: collect once more after the render
    for (const group of groups.values()) {
      group.handle.update(group.owner.definition());
    }
  });

  onCleanup(() => {
    for (const key of [...groups.keys()]) {
      detach(key);
    }
  });

  const barOwner = (): LevelOwner => ({
    key: "bar",
    shown: () => true,
    definition: barDefinition,
    rows: () => rowElements("bar"),
    keys: barKey,
  });
  const menuOwner = (b: number): LevelOwner => {
    const key = `menu:${b}`;
    const shown = (): boolean => openTop === b;
    return {
      key,
      shown,
      definition: () => listDefinition(shown()),
      rows: () => rowElements(key),
      keys: listKey,
    };
  };
  const subOwner = (b: number, item: number): LevelOwner => {
    const key = `sub:${b}/${item}`;
    const shown = (): boolean => openTop === b && openSub === item;
    return {
      key,
      shown,
      definition: () => listDefinition(shown()),
      rows: () => rowElements(key),
      keys: listKey,
    };
  };

  const menuSize = (b: number): number => items[b]?.menu.length ?? 0;
  const hasMenu = (b: number): boolean => b >= 0 && b < bar && menuSize(b) > 0;
  const hasSub = (b: number, item: number): boolean =>
    (items[b]?.menu[item]?.submenu.length ?? 0) > 0;
  const subSize = (b: number, item: number): number => items[b]?.menu[item]?.submenu.length ?? 0;

  const containerSize = (): number => {
    if (level === 1) {
      return bar;
    }
    if (level === 2) {
      return menuSize(openTop);
    }
    if (level === 3) {
      return subSize(openTop, openSub);
    }
    return 0;
  };

  const wrapNext = (i: number, n: number): number => (n <= 0 ? 0 : i + 1 >= n ? 0 : i + 1);
  /** The bar's own step: the definition's `wrap` is what the platform does, so it is what the state does. */
  const stepBar = (i: number, delta: 1 | -1): number => {
    const next = i + delta;
    if (next >= 0 && next < bar) {
      return next;
    }
    return wrap ? (next < 0 ? bar - 1 : 0) : i;
  };
  const barNext = (i: number): number => stepBar(i, 1);
  const barPrev = (i: number): number => stepBar(i, -1);
  const follow = (wasOpen: number, next: number): number =>
    wasOpen >= 0 && hasMenu(next) ? next : -1;
  const opensMenu = (): boolean => level === 1 && hasMenu(barStop);
  const entersSub = (): boolean => level === 2 && hasSub(openTop, focusIdx);

  const letterOf = (l: number, b: number, i: number): number => {
    if (l === 1) {
      return i + 1;
    }
    if (l === 2) {
      if (b === 0) {
        return i === 1 ? 2 : 1;
      }
      return i === 0 ? 2 : 3;
    }
    return i === 0 ? 3 : 1;
  };

  const typeTarget = (ch: number): number => {
    const n = containerSize();
    if (n <= 0) {
      return focusIdx;
    }
    for (let offset = 1; offset <= n - 1; offset += 1) {
      let candidate = focusIdx;
      for (let step = 0; step < offset; step += 1) {
        candidate = wrapNext(candidate, n);
      }
      if (letterOf(level, openTop, candidate) === ch) {
        return candidate;
      }
    }
    return focusIdx;
  };

  const focusIn = (): void => {
    if (level === 0) {
      level = 1;
      focusIdx = barStop;
      bump();
    }
  };

  const leave = (): void => {
    level = 0;
    focusIdx = -1;
    openTop = -1;
    openSub = -1;
    bump();
  };

  const activate = (): void => {
    if (opensMenu()) {
      level = 2;
      focusIdx = 0;
      openTop = barStop;
      openSub = -1;
      bump();
      return;
    }
    if (entersSub()) {
      const parent = focusIdx;
      level = 3;
      openSub = parent;
      focusIdx = 0;
      bump();
      return;
    }
    if (level === 0) {
      return;
    }
    if (level >= 2) {
      focusIdx = openTop;
      openTop = -1;
      openSub = -1;
    }
    level = 1;
    bump();
  };

  /**
   * A cross-axis move from a menu back onto the bar: the new item's menu follows
   * the focus, as `menu-menubar.qnt`'s `arrow_right` / `arrow_left` have it.
   */
  const moveToBar = (next: number): void => {
    barStop = next;
    focusIdx = next;
    openTop = follow(openTop, next);
    openSub = -1;
    level = 1;
    bump();
  };

  /**
   * The keys the library owns, in the model's spelling: activation, Escape, Tab,
   * the cross-axis pair out of a menu, and the bar's open keys. The bar's own
   * axis and every menu's are the platform's, so those keys are not here and are
   * never `preventDefault`ed.
   */
  const keyDown = (key: string): void => {
    switch (key) {
      case "ArrowRight":
        if (level < 2) {
          // on the bar this is the platform's own step
          return;
        }
        if (entersSub()) {
          level = 3;
          openSub = focusIdx;
          focusIdx = 0;
          bump();
          return;
        }
        moveToBar(barNext(barStop));
        return;
      case "ArrowLeft":
        if (level === 3) {
          level = 2;
          focusIdx = openSub;
          openSub = -1;
          bump();
          return;
        }
        if (level === 2) {
          moveToBar(barPrev(barStop));
        }
        return;
      case "ArrowDown":
        // on the bar this is the perpendicular key: open the menu on its first row
        if (opensMenu()) {
          level = 2;
          focusIdx = 0;
          openTop = barStop;
          bump();
        }
        return;
      case "ArrowUp":
        if (opensMenu()) {
          level = 2;
          focusIdx = menuSize(barStop) - 1;
          openTop = barStop;
          bump();
        }
        return;
      case "Home":
      case "End":
        // every level's Home / End is the platform's
        return;
      case "Enter":
      case " ":
      case "Space":
        activate();
        return;
      case "Escape":
        if (level === 3) {
          level = 2;
          focusIdx = openSub;
          openSub = -1;
        } else if (level === 2) {
          level = 1;
          focusIdx = openTop;
          openTop = -1;
          openSub = -1;
        } else if (level === 1) {
          openTop = -1;
          openSub = -1;
        }
        bump();
        return;
      case "Tab":
        // focus leaves the widget: everything closes, the memory stays
        level = 0;
        focusIdx = -1;
        openTop = -1;
        openSub = -1;
        bump();
        return;
      default:
        return;
    }
  };

  const type = (text: string): void => {
    if (level === 0 || text.length === 0) {
      return;
    }
    buffer += text;
    if (bufferTimer !== undefined) {
      clearTimeout(bufferTimer);
    }
    bufferTimer = setTimeout(() => {
      buffer = "";
    }, prefs.typeaheadDelayMs);
    searchBuffer();
  };

  const searchBuffer = (): void => {
    if (level !== 1) {
      return;
    }
    const needle = buffer.toLowerCase();
    const n = bar;
    for (let offset = 1; offset <= n; offset += 1) {
      const candidate = (focusIdx + offset) % n;
      if (items[candidate]?.label.toLowerCase().startsWith(needle)) {
        focusIdx = candidate;
        barStop = candidate;
        openTop = follow(openTop, candidate);
        bump();
        return;
      }
    }
  };

  /** The perpendicular open keys of the bar's own axis: the pair the platform leaves alone. */
  const barKeys =
    axis === "inline"
      ? {
          forward: "ArrowRight",
          backward: "ArrowLeft",
          openFirst: "ArrowDown",
          openLast: "ArrowUp",
        }
      : {
          forward: "ArrowDown",
          backward: "ArrowUp",
          openFirst: "ArrowRight",
          openLast: "ArrowLeft",
        };

  /**
   * The bar's half: the platform moves the focus along its axis (and does not
   * know which menu follows it, so the model's `follow` is read here from the
   * landing the platform will make), the perpendicular pair opens the menu on its
   * first / last row, and the rest is the library's.
   */
  const barKey = (event: KeyboardEvent): void => {
    const key = event.key;
    if (isPlatformKey(axis, key)) {
      const landing =
        key === "Home"
          ? 0
          : key === "End"
            ? bar - 1
            : key === barKeys.forward
              ? barNext(barStop)
              : barPrev(barStop);
      const next = follow(openTop, landing);
      if (next !== openTop) {
        openTop = next;
        openSub = -1;
        bump();
      }
      return;
    }
    if (key === barKeys.openFirst || key === barKeys.openLast) {
      event.preventDefault();
      keyDown(key === barKeys.openFirst ? "ArrowDown" : "ArrowUp");
      return;
    }
    libraryKey(event);
  };

  /**
   * A menu's half: its own axis is the platform's, so only the cross-axis pair
   * (which `menu-menubar.qnt` gives a meaning: a submenu, or the next / previous
   * bar item) and the library's keys are read here.
   */
  const listKey = (event: KeyboardEvent): void => {
    const key = event.key;
    if (isPlatformKey("block", key)) {
      return;
    }
    if (key === "ArrowRight" || key === "ArrowLeft") {
      event.preventDefault();
      keyDown(key);
      return;
    }
    libraryKey(event);
  };

  /** Activation, Escape, Tab and typeahead: no level's platform axis covers them. */
  const libraryKey = (event: KeyboardEvent): void => {
    const key = event.key;
    if (isActivationKey(key)) {
      event.preventDefault();
      keyDown("Enter");
      return;
    }
    if (key === "Escape" || key === "Tab") {
      event.preventDefault();
      keyDown(key);
      return;
    }
    if (key.length === 1) {
      type(key);
    }
  };

  return {
    focusLevel: track(() => level),
    focusIndex: track(() => focusIdx),
    barStop: track(() => barStop),
    openTop: track(() => openTop),
    openSub: track(() => openSub),
    items,
    focusIn,
    leave,
    keyDown,
    type,
    typeaheadCode: (ch) => {
      if (level === 0) {
        return;
      }
      const next = typeTarget(ch);
      focusIdx = next;
      if (level === 1) {
        barStop = next;
        openTop = follow(openTop, next);
      }
      bump();
    },
    menubarProps: {
      role: "menubar",
      "aria-orientation": orientation,
      get focusgroup() {
        // the forced polyfill path keeps the native engine out of the group
        return options.provider === "polyfill" ? "" : focusGroupAttribute(barDefinition());
      },
      get ref() {
        return (element: HTMLElement) => {
          attach(barOwner(), element);
        };
      },
    },
    barItemProps: (i) => ({
      id: items[i]?.id ?? `${base}-bar-${i}`,
      role: "menuitem",
      get "aria-haspopup"() {
        return hasMenu(i) ? "menu" : undefined;
      },
      get "aria-expanded"() {
        version();
        if (!hasMenu(i)) {
          return undefined;
        }
        return openTop === i ? "true" : "false";
      },
      ref: (element: HTMLElement) => {
        rowMap("bar").set(i, element);
      },
      onClick: () => {
        if (hasMenu(i)) {
          openTop = openTop === i ? -1 : i;
          level = 1;
          focusIdx = i;
          barStop = i;
          openSub = -1;
          bump();
        }
      },
      onFocus: () => {
        if (options.suppressFocusWrite?.() !== true) {
          level = 1;
          focusIdx = i;
          barStop = i;
          bump();
        }
      },
    }),
    menuProps: (i) => ({
      id: `${base}-menu-${i}`,
      role: "menu",
      get hidden() {
        version();
        return openTop !== i;
      },
      get focusgroup() {
        version();
        return options.provider === "polyfill"
          ? ""
          : focusGroupAttribute(listDefinition(openTop === i));
      },
      get ref() {
        return (element: HTMLElement) => {
          attach(menuOwner(i), element);
        };
      },
    }),
    menuItemProps: (b, item) => ({
      id: items[b]?.menu[item]?.id ?? `${base}-menu-${b}-${item}`,
      role: "menuitem",
      get "aria-haspopup"() {
        return hasSub(b, item) ? "menu" : undefined;
      },
      get "aria-expanded"() {
        version();
        if (!hasSub(b, item)) {
          return undefined;
        }
        return openTop === b && openSub === item ? "true" : "false";
      },
      ref: (element: HTMLElement) => {
        rowMap(`menu:${b}`).set(item, element);
      },
      onClick: () => {
        if (hasSub(b, item)) {
          level = 3;
          openTop = b;
          openSub = item;
          focusIdx = 0;
          bump();
          return;
        }
        // activating a leaf closes every menu and returns to the bar item
        level = 1;
        focusIdx = b;
        barStop = b;
        openTop = -1;
        openSub = -1;
        bump();
      },
      onMouseEnter: () => {
        // hover only opens once a menu is already open (APG recommended)
        if (openTop >= 0 && hasSub(b, item)) {
          level = 3;
          openTop = b;
          openSub = item;
          focusIdx = 0;
          bump();
        }
      },
      onFocus: () => {
        if (options.suppressFocusWrite?.() !== true) {
          level = 2;
          openTop = b;
          openSub = -1;
          focusIdx = item;
          bump();
        }
      },
    }),
    submenuProps: (b, item) => ({
      id: `${base}-submenu-${b}-${item}`,
      role: "menu",
      get hidden() {
        version();
        return !(openTop === b && openSub === item);
      },
      get focusgroup() {
        version();
        return options.provider === "polyfill"
          ? ""
          : focusGroupAttribute(listDefinition(openTop === b && openSub === item));
      },
      get ref() {
        return (element: HTMLElement) => {
          attach(subOwner(b, item), element);
        };
      },
    }),
    submenuItemProps: (b, item, sub) => ({
      id: items[b]?.menu[item]?.submenu[sub]?.id ?? `${base}-sub-${b}-${item}-${sub}`,
      role: "menuitem",
      ref: (element: HTMLElement) => {
        rowMap(`sub:${b}/${item}`).set(sub, element);
      },
      onClick: () => {
        level = 1;
        focusIdx = openTop >= 0 ? openTop : 0;
        barStop = focusIdx;
        openTop = -1;
        openSub = -1;
        bump();
      },
      onMouseEnter: () => {
        level = 3;
        focusIdx = sub;
        bump();
      },
      onFocus: () => {
        if (options.suppressFocusWrite?.() !== true) {
          level = 3;
          focusIdx = sub;
          bump();
        }
      },
    }),
  };
};
