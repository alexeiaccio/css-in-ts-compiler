import { type Accessor, createSignal, createUniqueId, onCleanup, onSettled } from "solid-js";
import {
  type FocusGroupDefinition,
  type FocusGroupHandle,
  focusGroup,
  focusGroupAttribute,
  focusGroupPolyfill,
} from "./focusgroup";

/**
 * APG Toolbar on Solid 2: state plus attribute objects, no elements, no
 * styling. A faithful transcription of `specs/apg/toolbar.qnt`.
 *
 * The roving tabindex is the platform's `focusgroup="toolbar"` contract
 * (`shared/focusgroup.qnt`, `./focusgroup`): arrows, Home / End, wrap and the
 * last-focused memory are the browser's (Chromium 150+) or the
 * `@microsoft/focusgroup-polyfill`'s, and the platform also owns the item
 * `tabindex` — the primitive never renders one. The library owns only the
 * spec's delta: `aria-orientation`, the wrap choice, disabled-but-focusable
 * items, embedded controls that consume keys, Tab stepping out of a native
 * text field, and activation.
 *
 * ponytail: item count and kinds come from the constructor; separators, RTL and
 * the embedded controls' own values are not modelled. Add them when a consumer
 * needs them.
 */

export type ToolbarOrientation = "horizontal" | "vertical";
export type ToolbarItemKind = "button" | "text" | "spin";

export interface ToolbarItemInput {
  readonly label: string;
  readonly kind?: ToolbarItemKind;
  readonly disabled?: boolean;
}

export interface ToolbarOptions {
  readonly items: ReadonlyArray<string | ToolbarItemInput>;
  readonly kinds?: ReadonlyArray<ToolbarItemKind>;
  readonly orientation?: ToolbarOrientation;
  readonly wrap?: boolean;
  readonly defaultFocus?: number;
  /** Item indices disabled at mount (aria-disabled, still focusable). */
  readonly disabled?: ReadonlyArray<number>;
  readonly id?: string;
  readonly onActivate?: (index: number) => void;
  /**
   * `"polyfill"` skips the feature detect and drives
   * `@microsoft/focusgroup-polyfill`'s low-level group even where the engine has
   * `focusgroup` (a test, or a host that knows it needs the polyfill). `"auto"`
   * by default.
   */
  readonly provider?: "auto" | "polyfill";
}

export interface ToolbarItem {
  readonly id: string;
  readonly label: string;
  readonly kind: ToolbarItemKind;
  readonly disabled: boolean;
}

/**
 * Spread onto an item (a `<button>`, or an embedded control). No `tabindex`: the
 * focusgroup provider owns it, and binding it here would fight the platform.
 */
export interface ToolbarItemProps {
  readonly id: string;
  readonly role: "button";
  readonly "aria-disabled": "true" | undefined;
  readonly ref: (element: HTMLElement) => void;
  readonly onClick: () => void;
  readonly onFocus: () => void;
}

export interface Toolbar {
  readonly focus: Accessor<number>;
  readonly tabStop: Accessor<number>;
  readonly orientation: Accessor<ToolbarOrientation>;
  readonly wrap: Accessor<boolean>;
  readonly items: ReadonlyArray<ToolbarItem>;
  readonly focusIn: () => void;
  readonly leave: () => void;
  readonly focusItem: (index: number) => void;
  readonly tab: (back: boolean) => void;
  readonly clickItem: (index: number) => void;
  readonly activate: () => void;
  readonly toggleDisabled: (index: number) => void;
  readonly setOrientation: (orientation: ToolbarOrientation) => void;
  readonly setWrap: (wrap: boolean) => void;
  readonly toolbarProps: {
    readonly role: "toolbar";
    readonly "aria-orientation": ToolbarOrientation;
    /** The definition as the `focusgroup` attribute (`"toolbar block nowrap"`). */
    readonly focusgroup: string;
    readonly ref: (element: HTMLElement) => void;
  };
  readonly itemProps: (index: number) => ToolbarItemProps;
}

const AXIS = (o: ToolbarOrientation): "inline" | "block" =>
  o === "horizontal" ? "inline" : "block";

const delta = (axis: "inline" | "block", key: string): number => {
  if (axis === "inline") {
    if (key === "Right") return 1;
    if (key === "Left") return -1;
    return 0;
  }
  if (key === "Down") return 1;
  if (key === "Up") return -1;
  return 0;
};

const isEdgeKey = (key: string): boolean => key === "Home" || key === "End";

const isNavKey = (axis: "inline" | "block", key: string): boolean =>
  delta(axis, key) !== 0 || isEdgeKey(key);

const escape = (n: number, f: number, back: boolean): number =>
  back ? (f <= 0 ? -1 : f - 1) : f >= n - 1 ? -1 : f + 1;

const normalizeKey = (key: string): string =>
  key.startsWith("Arrow") ? key.slice("Arrow".length) : key;

export const createToolbar = (options: ToolbarOptions): Toolbar => {
  const base = options.id ?? createUniqueId();
  const items: ReadonlyArray<ToolbarItem> = options.items.map((input, index) => {
    const label = typeof input === "string" ? input : input.label;
    const kind: ToolbarItemKind =
      (typeof input === "string" ? undefined : input.kind) ?? options.kinds?.[index] ?? "button";
    const disabled = (typeof input === "string" ? false : (input.disabled ?? false)) || false;
    return { id: `${base}-item-${index}`, label, kind, disabled };
  });
  const count = items.length;

  let orientation: ToolbarOrientation = options.orientation ?? "horizontal";
  let wrap = options.wrap ?? false;
  let focus = options.defaultFocus ?? -1;
  let tabStop = focus >= 0 ? focus : 0;
  const disabledMask = new Set<number>();
  for (const index of options.disabled ?? []) {
    disabledMask.add(index);
  }
  for (const [index, item] of items.entries()) {
    if (item.disabled) {
      disabledMask.add(index);
    }
  }
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

  /** The item elements the provider moves focus between, in index order. */
  const elements = new Map<number, HTMLElement>();
  const itemElements = (): HTMLElement[] =>
    [...elements.entries()].sort(([a], [b]) => a - b).map(([, element]) => element);

  /** One source for the attribute and for the polyfill's definition. */
  const definition = (): FocusGroupDefinition => ({
    behavior: "toolbar",
    wrap,
    axis: AXIS(orientation),
    memory: true,
  });

  let group: FocusGroupHandle | undefined;
  let owner: HTMLElement | undefined;

  const kindOf = (i: number): ToolbarItemKind => items[i]?.kind ?? "button";
  const isDisabled = (i: number): boolean => disabledMask.has(i);

  const captures = (kind: ToolbarItemKind, axis: string, key: string): boolean =>
    (kind === "text" && isNavKey(axis as "inline" | "block", key)) ||
    (kind === "spin" && (key === "Up" || key === "Down" || isEdgeKey(key)));

  const swallowed = (key: string): boolean =>
    focus >= 0 && captures(kindOf(focus), AXIS(orientation), key);

  const activates = (i: number): boolean => i >= 0 && kindOf(i) === "button" && !isDisabled(i);

  const tab = (back: boolean): void => {
    if (focus < 0) {
      focus = tabStop;
    } else if (kindOf(focus) === "text") {
      const next = escape(count, focus, back);
      focus = next;
      if (next >= 0) {
        tabStop = next;
      }
    } else {
      focus = -1;
    }
    bump();
  };

  /**
   * The primitive's half of the keyboard: the platform moves focus along the
   * axis, Home / End and Tab-escape out of a native key-conflict control, so only
   * the keys it must not act on are prevented here.
   */
  const keyDown = (event: KeyboardEvent): void => {
    const key = normalizeKey(event.key);
    if (key === "Tab") {
      tab(event.shiftKey);
      // at the edge focus is -1: let the browser leave the toolbar
      if (focus >= 0) {
        event.preventDefault();
      }
      return;
    }
    if (key === "Enter" || event.key === " " || event.key === "Space") {
      activate();
      event.preventDefault();
      return;
    }
    // an embedded control consumes its keys, so the platform must not move focus
    if (swallowed(key)) {
      event.preventDefault();
    }
  };

  const focusIn = (): void => {
    if (focus < 0) {
      focus = tabStop;
      bump();
    }
  };

  const leave = (): void => {
    focus = -1;
    bump();
  };

  const focusItem = (index: number): void => {
    if (index < 0 || index >= count) {
      return;
    }
    focus = index;
    tabStop = index;
    bump();
  };

  const clickItem = (index: number): void => {
    if (index < 0 || index >= count) {
      return;
    }
    focus = index;
    tabStop = index;
    if (activates(index)) {
      options.onActivate?.(index);
    }
    bump();
  };

  const activate = (): void => {
    if (activates(focus)) {
      options.onActivate?.(focus);
    }
  };

  const toggleDisabled = (index: number): void => {
    if (disabledMask.has(index)) {
      disabledMask.delete(index);
    } else {
      disabledMask.add(index);
    }
    bump();
  };

  const setOrientation = (next: ToolbarOrientation): void => {
    orientation = next;
    bump();
    group?.update(definition());
  };

  const setWrap = (next: boolean): void => {
    wrap = next;
    bump();
    group?.update(definition());
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
    const provider = options.provider === "polyfill" ? focusGroupPolyfill : focusGroup;
    group = provider(element, { definition: definition(), items: itemElements });
  };

  onSettled(() => {
    // the owner's ref may run before its item refs, so collect once more after the render
    group?.update();
  });

  onCleanup(() => {
    owner?.removeEventListener("keydown", keyDown);
    group?.destroy();
    group = undefined;
  });

  return {
    focus: track(() => focus),
    tabStop: track(() => tabStop),
    orientation: track(() => orientation),
    wrap: track(() => wrap),
    items,
    focusIn,
    leave,
    focusItem,
    tab,
    clickItem,
    activate,
    toggleDisabled,
    setOrientation,
    setWrap,
    toolbarProps: {
      get role() {
        return "toolbar" as const;
      },
      get "aria-orientation"() {
        version();
        return orientation;
      },
      get focusgroup() {
        version();
        // the forced polyfill path keeps the native engine out of the group
        return options.provider === "polyfill" ? "" : focusGroupAttribute(definition());
      },
      get ref() {
        return attach;
      },
    },
    itemProps: (index) => ({
      id: items[index]?.id ?? `${base}-item-${index}`,
      role: "button",
      get "aria-disabled"() {
        version();
        return isDisabled(index) ? "true" : undefined;
      },
      ref: (element) => {
        elements.set(index, element);
      },
      onClick: () => {
        clickItem(index);
      },
      onFocus: () => {
        focusItem(index);
      },
    }),
  };
};
