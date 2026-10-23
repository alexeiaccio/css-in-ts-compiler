import { type Accessor, createSignal, createUniqueId } from "solid-js";

/**
 * APG Toolbar on Solid 2: state plus attribute objects, no elements, no
 * styling. A faithful transcription of `specs/apg/toolbar.qnt`.
 *
 * Platform: **polyfill** (map ticket `etfq`). The roving tabindex is the
 * `focusgroup="toolbar"` contract (see `shared/focusgroup.qnt`); ship the
 * `@microsoft/focusgroup-polyfill` first and switch to the native attribute
 * when Chrome/Edge is the floor. The library owns only the spec's delta:
 * `aria-orientation`, the wrap choice, disabled-but-focusable items, embedded
 * controls that consume keys, and activation.
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
}

export interface ToolbarItem {
  readonly id: string;
  readonly label: string;
  readonly kind: ToolbarItemKind;
  readonly disabled: boolean;
}

export interface ToolbarItemProps {
  readonly id: string;
  readonly role: "button";
  readonly "aria-disabled": "true" | undefined;
  readonly tabindex: 0 | -1;
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
  readonly keyDown: (key: string) => void;
  readonly tab: (back: boolean) => void;
  readonly clickItem: (index: number) => void;
  readonly activate: () => void;
  readonly toggleDisabled: (index: number) => void;
  readonly setOrientation: (orientation: ToolbarOrientation) => void;
  readonly setWrap: (wrap: boolean) => void;
  readonly toolbarProps: {
    readonly role: "toolbar";
    readonly "aria-orientation": ToolbarOrientation;
    readonly onKeyDown: (event: KeyboardEvent) => void;
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

const step = (n: number, wrap: boolean, f: number, d: number): number => {
  if (d === 1) {
    return f >= n - 1 ? (wrap ? 0 : f) : f + 1;
  }
  if (d === -1) {
    return f <= 0 ? (wrap ? n - 1 : f) : f - 1;
  }
  return f;
};

const landing = (
  n: number,
  axis: "inline" | "block",
  wrap: boolean,
  f: number,
  key: string,
): number => {
  if (f < 0) {
    return f;
  }
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return n - 1;
  }
  return step(n, wrap, f, delta(axis, key));
};

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

  const kindOf = (i: number): ToolbarItemKind => items[i]?.kind ?? "button";
  const isDisabled = (i: number): boolean => disabledMask.has(i);

  const captures = (kind: ToolbarItemKind, axis: string, key: string): boolean =>
    (kind === "text" && isNavKey(axis as "inline" | "block", key)) ||
    (kind === "spin" && (key === "Up" || key === "Down" || isEdgeKey(key)));

  const swallowed = (key: string): boolean =>
    focus >= 0 && captures(kindOf(focus), AXIS(orientation), key);

  const activates = (i: number): boolean => i >= 0 && kindOf(i) === "button" && !isDisabled(i);

  const keyDown = (rawKey: string): void => {
    const key = normalizeKey(rawKey);
    if (!isNavKey(AXIS(orientation), key)) {
      return;
    }
    const pinned = swallowed(key);
    const next = pinned ? focus : landing(count, AXIS(orientation), wrap, focus, key);
    const previous = focus;
    focus = next;
    if (previous >= 0) {
      tabStop = next;
    }
    if (pinned) {
      // consumed by an embedded control
    }
    bump();
  };

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

  return {
    focus: track(() => focus),
    tabStop: track(() => tabStop),
    orientation: track(() => orientation),
    wrap: track(() => wrap),
    items,
    focusIn,
    leave,
    focusItem,
    keyDown,
    tab,
    clickItem,
    activate,
    toggleDisabled,
    setOrientation: (next) => {
      orientation = next;
      bump();
    },
    setWrap: (next) => {
      wrap = next;
      bump();
    },
    toolbarProps: {
      get role() {
        return "toolbar" as const;
      },
      get "aria-orientation"() {
        version();
        return orientation;
      },
      onKeyDown: (event) => {
        const key = normalizeKey(event.key);
        if (key === "Tab") {
          tab(event.shiftKey);
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
        if (isNavKey(AXIS(orientation), key)) {
          keyDown(key);
          event.preventDefault();
        }
      },
    },
    itemProps: (index) => ({
      id: items[index]?.id ?? `${base}-item-${index}`,
      role: "button",
      get "aria-disabled"() {
        version();
        return isDisabled(index) ? "true" : undefined;
      },
      get tabindex() {
        version();
        return tabStop === index ? 0 : -1;
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
