import { type Accessor, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";
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
 * dismiss and Esc; `focusgroup` gives the menubar's roving tabindex. The
 * library owns the menu keys, typeahead, submenus and checkable state.
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
  /** A request to change the readable pair: the packed `onCheckedValueChange`'s twin. */
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

export interface MenuProps {
  readonly id: string;
  readonly role: "menu";
  readonly hidden: boolean;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface MenuItemProps {
  readonly id: string;
  readonly role: "menuitem" | "menuitemcheckbox" | "menuitemradio";
  readonly "aria-checked": "true" | "false" | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly tabindex: 0 | -1;
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
  const [isOpen, requestOpen] = createControllable<boolean>({
    value: () => options.open,
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
  // own commit here, and each view the host owns hears a request.
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
    if (options.checked !== undefined || options.choice !== undefined) {
      options.onCheckedValuesChange?.(
        [...next].sort((a, b) => a - b),
        nextChoice,
      );
    }
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
      bump();
    };
    if (isOpen() === want) {
      apply();
      return;
    }
    requestOpen(want);
    if (options.open === undefined) {
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

  const wrapNext = (i: number): number => (i + 1 >= count ? 0 : i + 1);
  const wrapPrev = (i: number): number => (i <= 0 ? count - 1 : i - 1);

  const keyDown = (key: string): void => {
    switch (key) {
      case "Enter":
        activate(true);
        break;
      case " ":
      case "Space":
        activate(false);
        break;
      case "ArrowDown":
        if (level() === 1) {
          openOn(0);
        } else if (level() === 2) {
          focusItem(wrapNext(focusedIndex()));
        }
        break;
      case "ArrowUp":
        if (level() === 1) {
          openOn(count - 1);
        } else if (level() === 2) {
          focusItem(wrapPrev(focusedIndex()));
        }
        break;
      case "Home":
        if (level() === 2) {
          focusItem(0);
        }
        break;
      case "End":
        if (level() === 2) {
          focusItem(count - 1);
        }
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
      onKeyDown: (event) => {
        if (
          event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "Space"
        ) {
          event.preventDefault();
          keyDown(event.key);
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
      onKeyDown: (event) => {
        if (
          event.key === "Tab" ||
          event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "Home" ||
          event.key === "End"
        ) {
          event.preventDefault();
        }
        keyDown(event.key);
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
      get tabindex() {
        version();
        return level() === 2 && index === i ? 0 : -1;
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
  readonly keyDown: (key: string) => void;
  readonly type: (text: string) => void;
  /** Differential-test hook: typeahead by the spec's letter code. */
  readonly typeaheadCode: (code: number) => void;
  readonly menubarProps: {
    readonly role: "menubar";
    readonly "aria-orientation": "horizontal" | "vertical";
    readonly onKeyDown: (event: KeyboardEvent) => void;
  };
  readonly barItemProps: (index: number) => {
    readonly id: string;
    readonly role: "menuitem";
    readonly "aria-haspopup": "menu" | undefined;
    readonly "aria-expanded": "true" | "false" | undefined;
    readonly tabindex: 0 | -1;
    readonly onClick: () => void;
    readonly onFocus: () => void;
  };
  readonly menuProps: (index: number) => {
    readonly id: string;
    readonly role: "menu";
    readonly hidden: boolean;
  };
  readonly menuItemProps: (
    bar: number,
    item: number,
  ) => {
    readonly id: string;
    readonly role: "menuitem";
    readonly "aria-haspopup": "menu" | undefined;
    readonly "aria-expanded": "true" | "false" | undefined;
    readonly tabindex: 0 | -1;
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
  };
  readonly submenuItemProps: (
    bar: number,
    item: number,
    sub: number,
  ) => {
    readonly id: string;
    readonly role: "menuitem";
    readonly tabindex: 0 | -1;
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
    setVersion((v) => v + 1);
  };
  const track =
    <T>(read: () => T): Accessor<T> =>
    () => {
      version();
      return read();
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
  const wrapPrev = (i: number, n: number): number => (n <= 0 ? 0 : i <= 0 ? n - 1 : i - 1);
  const barNext = (i: number): number => wrapNext(i, bar);
  const barPrev = (i: number): number => wrapPrev(i, bar);
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

  const keyDown = (key: string): void => {
    switch (key) {
      case "ArrowRight":
        if (level === 0) {
          return;
        }
        if (entersSub()) {
          level = 3;
          openSub = focusIdx;
          focusIdx = 0;
          bump();
          return;
        }
        barStop = barNext(barStop);
        focusIdx = barStop;
        openTop = follow(openTop, barStop);
        openSub = -1;
        level = 1;
        bump();
        return;
      case "ArrowLeft":
        if (level === 0) {
          return;
        }
        if (level === 3) {
          level = 2;
          focusIdx = openSub;
          openSub = -1;
          bump();
          return;
        }
        barStop = barPrev(barStop);
        focusIdx = barStop;
        openTop = follow(openTop, barStop);
        openSub = -1;
        level = 1;
        bump();
        return;
      case "ArrowDown":
        if (opensMenu()) {
          level = 2;
          focusIdx = 0;
          openTop = barStop;
          bump();
        } else if (level >= 2) {
          focusIdx = wrapNext(focusIdx, containerSize());
          bump();
        }
        return;
      case "ArrowUp":
        if (opensMenu()) {
          level = 2;
          focusIdx = menuSize(barStop) - 1;
          openTop = barStop;
          bump();
        } else if (level >= 2) {
          focusIdx = wrapPrev(focusIdx, containerSize());
          bump();
        }
        return;
      case "Home":
        if (level === 0) {
          return;
        }
        focusIdx = 0;
        if (level === 1) {
          barStop = 0;
          openTop = follow(openTop, 0);
        }
        bump();
        return;
      case "End":
        if (level === 0) {
          return;
        }
        focusIdx = containerSize() - 1;
        if (level === 1) {
          barStop = bar - 1;
          openTop = follow(openTop, bar - 1);
        }
        bump();
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
      onKeyDown: (event) => {
        if (event.key !== "Tab" && event.key !== "Shift+Tab" && event.key !== " ") {
          event.preventDefault();
        }
        keyDown(event.key);
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
      get tabindex() {
        version();
        return barStop === i ? 0 : -1;
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
      get tabindex() {
        version();
        return level === 2 && openTop === b && focusIdx === item ? 0 : -1;
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
    }),
    submenuItemProps: (b, item, sub) => ({
      id: items[b]?.menu[item]?.submenu[sub]?.id ?? `${base}-sub-${b}-${item}-${sub}`,
      role: "menuitem",
      get tabindex() {
        version();
        return level === 3 && openTop === b && openSub === item && focusIdx === sub ? 0 : -1;
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
