import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

export type SplitterOrientation = "vertical" | "horizontal";
export type SplitterFocus = "none" | "splitter" | "primary" | "secondary";

/** Options are read lazily: pass an object with getters, never destructured values. */
export interface WindowSplitterOptions {
  readonly orientation?: SplitterOrientation;
  readonly fixed?: boolean;
  /** Controlled: the host owns the primary-pane size. */
  readonly value?: number | undefined;
  /** Uncontrolled starting size (`defaultValue`); ignored while `value` is set. */
  readonly defaultValue?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** Base for the generated separator / pane ids. */
  readonly id?: string;
  readonly primaryId?: string;
  /** Accessible name of the separator when no visible primary label exists. */
  readonly label?: string | undefined;
  /** Id of the visible primary-pane label, referenced by `aria-labelledby`. */
  readonly labelledby?: string | undefined;
  /** A request to change the size the host may ignore. */
  readonly onValueChange?: (value: number) => void;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
}

/** Spread onto the focusable `role=separator` bar. */
export interface WindowSplitterSeparatorProps {
  readonly id: string;
  readonly role: "separator";
  readonly "aria-orientation": SplitterOrientation;
  readonly "aria-valuenow": number;
  readonly "aria-valuemin": number;
  readonly "aria-valuemax": number;
  readonly "aria-controls": string;
  readonly "aria-label": string | undefined;
  readonly "aria-labelledby": string | undefined;
  readonly tabindex: 0;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

/** Spread onto a pane the F6 cycle can move focus to. */
export interface WindowSplitterPaneProps {
  readonly tabindex: 0;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

export interface WindowSplitter {
  readonly value: Accessor<number>;
  readonly collapsed: Accessor<boolean>;
  readonly focusPart: Accessor<SplitterFocus>;
  readonly focusSeparator: () => void;
  readonly setFocusPart: (part: SplitterFocus) => void;
  readonly keyDown: (key: string) => void;
  /**
   * Call before the host writes the controlled `value` directly: it pins the
   * derived collapse state so the write does not silently uncollapse (or
   * collapse) the pane.
   */
  readonly freezeCollapse: () => void;
  readonly collapse: () => void;
  readonly expand: () => void;
  readonly separatorProps: WindowSplitterSeparatorProps;
  readonly primaryProps: WindowSplitterPaneProps;
  readonly secondaryProps: WindowSplitterPaneProps;
}

const KEY_TAGS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "Enter",
  "F6",
]);

/**
 * APG Window Splitter (https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/):
 * a focusable `role=separator` resizing the primary pane.
 *
 * Request/commit (map ticket `rt1p`): the primary-pane size is the value.
 * Uncontrolled by default (`defaultValue`); pass `value` + `onValueChange` to
 * own it. Movement keys are requests the host may ignore. While controlled a
 * collapse is only committed once the host's value reaches the target, so
 * `collapsed` is derived from the controlled value plus the last request.
 */
export const createWindowSplitter = (options: WindowSplitterOptions = {}): WindowSplitter => {
  const min = (): number => options.min ?? 0;
  const max = (): number => options.max ?? 6;
  const step = (): number => options.step ?? 2;
  const orientation = (): SplitterOrientation => options.orientation ?? "vertical";
  const fixed = (): boolean => options.fixed ?? false;
  const base = options.id ?? createUniqueId();
  const primaryId = options.primaryId ?? `${base}-primary`;
  const isControlled = (): boolean => options.value !== undefined;

  const clamp = (next: number): number => Math.min(max(), Math.max(min(), next));

  const [value, request] = createControllable({
    value: () => options.value,
    initial: clamp(options.defaultValue ?? 4),
    onChange: () => options.onValueChange,
  });
  const [collapsedLocal, setCollapsedLocal] = createSignal(false);
  const [prev, setPrev] = createSignal(0);
  // controlled: the host owns `value`, so a collapse is committed only once the
  // value reaches its target. `collapseIntent` remembers the wanted direction.
  const [collapseIntent, setCollapseIntent] = createSignal(false);
  const [focusPart, setFocusPart] = createSignal<SplitterFocus>("none");

  // ponytail: in controlled mode `collapsed` is derived from the host value plus
  // the last collapse request, so a direct host write of MIN while a collapse is
  // pending is indistinguishable from an accepted collapse. Good enough while the
  // host steers only through the primitive; add a collapse prop when it matters.
  const collapsed = (): boolean =>
    isControlled() ? collapseIntent() && value() === min() : collapsedLocal();

  const movable = (): boolean => focusPart() === "splitter" && !fixed() && !collapsed();

  const commitValue = (next: number): void => {
    request(clamp(next));
  };

  const arrow = (axis: SplitterOrientation, delta: number): void => {
    if (!movable() || orientation() !== axis) {
      return;
    }
    commitValue(value() + delta);
  };

  const toggleCollapse = (): void => {
    if (focusPart() !== "splitter") {
      return;
    }
    if (!collapsed()) {
      setPrev(value());
      if (isControlled()) {
        setCollapseIntent(true);
      } else {
        setCollapsedLocal(true);
      }
      commitValue(min());
    } else {
      if (isControlled()) {
        setCollapseIntent(false);
      } else {
        setCollapsedLocal(false);
      }
      commitValue(prev());
    }
  };

  const cycleFocus = (): void => {
    const current = focusPart();
    if (current === "splitter") {
      setFocusPart("secondary");
    } else if (current === "secondary") {
      setFocusPart("primary");
    } else if (current === "primary") {
      setFocusPart("splitter");
    }
  };

  const keyDown = (key: string): void => {
    if (!KEY_TAGS.has(key)) {
      return;
    }
    switch (key) {
      case "ArrowLeft":
        arrow("vertical", -step());
        break;
      case "ArrowRight":
        arrow("vertical", step());
        break;
      case "ArrowUp":
        arrow("horizontal", -step());
        break;
      case "ArrowDown":
        arrow("horizontal", step());
        break;
      case "Home":
        if (movable()) {
          commitValue(min());
        }
        break;
      case "End":
        if (movable()) {
          commitValue(max());
        }
        break;
      case "Enter":
        toggleCollapse();
        break;
      default:
        cycleFocus();
        break;
    }
  };

  const paneProps = (part: "primary" | "secondary"): WindowSplitterPaneProps => ({
    tabindex: 0,
    onKeyDown: (event) => {
      if (KEY_TAGS.has(event.key)) {
        event.preventDefault();
      }
      keyDown(event.key);
    },
    onFocus: () => setFocusPart(part),
    onBlur: () => setFocusPart("none"),
  });

  let lastCollapsed = false;
  createEffect(
    () => collapsed(),
    (now) => {
      if (now !== lastCollapsed) {
        lastCollapsed = now;
        options.onCollapsedChange?.(now);
      }
    },
  );

  return {
    value,
    collapsed,
    focusPart,
    focusSeparator: () => setFocusPart("splitter"),
    setFocusPart,
    keyDown,
    freezeCollapse: () => {
      if (isControlled()) {
        setCollapseIntent(collapsed());
      }
    },
    collapse: () => {
      if (!collapsed() && focusPart() === "splitter") {
        toggleCollapse();
      }
    },
    expand: () => {
      if (collapsed() && focusPart() === "splitter") {
        toggleCollapse();
      }
    },
    separatorProps: {
      id: `${base}-separator`,
      role: "separator",
      get "aria-orientation"() {
        return orientation();
      },
      get "aria-valuenow"() {
        return value();
      },
      get "aria-valuemin"() {
        return min();
      },
      get "aria-valuemax"() {
        return max();
      },
      "aria-controls": primaryId,
      get "aria-label"() {
        return options.label;
      },
      get "aria-labelledby"() {
        return options.labelledby;
      },
      tabindex: 0,
      onKeyDown: (event) => {
        if (KEY_TAGS.has(event.key)) {
          event.preventDefault();
        }
        keyDown(event.key);
      },
      onFocus: () => setFocusPart("splitter"),
      onBlur: () => setFocusPart("none"),
    },
    primaryProps: paneProps("primary"),
    secondaryProps: paneProps("secondary"),
  };
};
