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
   * A request to change the selection, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (index: number) => void;
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

export interface Tabs {
  readonly items: number;
  readonly selected: Accessor<number>;
  /** Tab holding (or last holding) DOM focus; -1 when focus is outside. */
  readonly focused: Accessor<number>;
  /** Programmatic selection request; ignores disabled tabs. */
  readonly select: (index: number) => void;
  /** Programmatic selection request (may point at a disabled tab, like base-ui). */
  readonly setSelected: (index: number) => void;
  /** Programmatic focus (does not select). */
  readonly focusTab: (index: number) => void;
  readonly keyDown: (key: string) => void;
  readonly tablistProps: TablistProps;
  readonly tabProps: (index: number) => TabProps;
  readonly tabpanelProps: (index: number) => TabpanelProps;
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
 */
export const createTabs = (options: TabsOptions = {}): Tabs => {
  const items = Math.max(1, options.items ?? 4);
  const base = options.id ?? createUniqueId();
  const disabled = new Set<number>(options.disabled ?? []);
  const focusablePanels = new Set<number>(options.focusablePanels ?? []);

  const activation = (): TabsActivation => options.activation ?? "automatic";
  const orientation = (): TabsOrientation => options.orientation ?? "horizontal";

  const firstEnabled = (): number => {
    for (let index = 0; index < items; index += 1) {
      if (!disabled.has(index)) {
        return index;
      }
    }
    return 0;
  };

  const initial = options.defaultSelected ?? firstEnabled();
  const [selected, request] = createControllable({
    value: () => options.value,
    initial: initial >= 0 && initial < items && !disabled.has(initial) ? initial : firstEnabled(),
    onChange: () => options.onValueChange,
  });

  /** The tab that carries `tabindex=0`: the selected one, or the first enabled. */
  const roving = (): number => (disabled.has(selected()) ? firstEnabled() : selected());

  const select = (index: number): void => {
    if (index < 0 || index >= items || disabled.has(index)) {
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
    for (let offset = 1; offset <= items; offset += 1) {
      const candidate = (((from + delta * offset) % items) + items) % items;
      if (!disabled.has(candidate)) {
        return candidate;
      }
    }
    return from;
  };

  const [focused, setFocused] = createSignal(-1);

  const keyDown = (key: string): void => {
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
        let last = items - 1;
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
      default:
        break;
    }
  };

  return {
    items,
    selected,
    focused,
    select,
    setSelected: (index) => {
      if (index >= 0 && index < items) {
        request(index);
      }
    },
    focusTab: (index) => {
      if (index >= 0 && index < items) {
        setFocused(index);
      }
    },
    keyDown,
    tablistProps: {
      role: "tablist",
      get "aria-orientation"() {
        return orientation() === "vertical" ? "vertical" : undefined;
      },
    },
    tabProps: (index) => ({
      id: `${base}-tab-${index}`,
      role: "tab",
      get "aria-selected"() {
        return selected() === index ? "true" : "false";
      },
      "aria-controls": `${base}-tabpanel-${index}`,
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
        const before = focused();
        keyDown(event.key);
        if (focused() !== before || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
        }
      },
    }),
    tabpanelProps: (index) => ({
      id: `${base}-tabpanel-${index}`,
      role: "tabpanel",
      "aria-labelledby": `${base}-tab-${index}`,
      get tabindex() {
        return focusablePanels.has(index) ? undefined : 0;
      },
      get hidden() {
        return selected() !== index;
      },
    }),
  };
};
