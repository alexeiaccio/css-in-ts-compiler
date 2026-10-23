import { type Accessor, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

/**
 * Options are read lazily (getters) so `multiple` / `disabled` stay reactive;
 * pass a component's `props`, never destructured values.
 */
export interface AccordionOptions {
  /** Number of panels (the docs' fixed three unless a page renders fewer). */
  readonly items?: number;
  /** Controlled: the host owns the expanded set and this is the only thing that changes it. */
  readonly value?: ReadonlyArray<number> | undefined;
  /** Uncontrolled starting expanded set; ignored while `value` is set. */
  readonly defaultValue?: ReadonlyArray<number>;
  /** Allow more than one panel expanded at once. */
  readonly multiple?: boolean;
  /** Allow the last expanded panel to collapse (default true). */
  readonly collapsible?: boolean;
  /** `aria-level` of the heading wrapping each trigger (default 3). */
  readonly headingLevel?: number;
  /** Disable every trigger. */
  readonly disabled?: boolean;
  /** Disable specific triggers by index. */
  readonly disabledItems?: ReadonlyArray<number>;
  /** Base for the generated ids. */
  readonly id?: string;
  /**
   * A request to change the expanded set, called when the intent differs from
   * the current value. Uncontrolled it is accepted; controlled the host may
   * ignore it.
   */
  readonly onValueChange?: (expanded: ReadonlyArray<number>) => void;
}

/** Spread onto the element with `role=button` (a native `<button>`). */
export interface AccordionTriggerProps {
  readonly id: string;
  readonly type: "button";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string;
  readonly "aria-disabled": "true" | undefined;
  readonly disabled: boolean;
  readonly onClick: () => void;
}

/** Spread onto the element with `role=region` holding the panel. */
export interface AccordionPanelProps {
  readonly id: string;
  readonly role: "region";
  readonly "aria-labelledby": string;
  readonly tabindex: 0;
  readonly hidden: boolean;
}

/** Spread onto the heading element wrapping a trigger. */
export interface AccordionHeadingProps {
  readonly id: string;
  readonly role: "heading";
  readonly "aria-level": number;
}

export interface Accordion {
  readonly items: number;
  readonly expanded: Accessor<ReadonlyArray<boolean>>;
  readonly isExpanded: (index: number) => boolean;
  /** Requests a toggle of one panel; refused panels leave state untouched. */
  readonly toggle: (index: number) => void;
  readonly setMultiple: (value: boolean) => void;
  readonly setCollapsible: (value: boolean) => void;
  readonly setHeadingLevel: (level: number) => void;
  /** Getter-backed, so spreading keeps every attribute reactive. */
  readonly triggerProps: (index: number) => AccordionTriggerProps;
  readonly panelProps: (index: number) => AccordionPanelProps;
  readonly headingProps: (index: number) => AccordionHeadingProps;
}

const HEADING_LEVELS = 6;

const count = (expanded: ReadonlyArray<boolean>): number => expanded.filter(Boolean).length;

/** Re-establish the mode's constraints, exactly as the spec's `normExpanded`. */
const normalize = (
  expanded: ReadonlyArray<boolean>,
  multiple: boolean,
  collapsible: boolean,
): ReadonlyArray<boolean> => {
  if (!collapsible && count(expanded) === 0) {
    return expanded.map((_, index) => index === 0);
  }
  if (multiple) {
    return expanded;
  }
  const first = expanded.findIndex(Boolean);
  return expanded.map((_, index) => index === first);
};

const indicesOf = (expanded: ReadonlyArray<boolean>): ReadonlyArray<number> =>
  expanded.flatMap((open, index) => (open ? [index] : []));

/**
 * APG Accordion (https://www.w3.org/WAI/ARIA/apg/patterns/accordion/): state
 * plus prop objects for headings, triggers and panels. No styling, no elements.
 * Behaviour is checked against `specs/apg/accordion.qnt` by the scenario bridge,
 * not by running the generated machine here.
 *
 * Platform: **native** (`<details name>` / `:open`, Baseline newly) — this
 * primitive only wires the markup and ARIA; exclusivity is the platform's.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the expanded set. A controlled host
 * owns the set verbatim, so `setMultiple` / `setCollapsible` only re-normalize
 * while uncontrolled.
 */
export const createAccordion = (options: AccordionOptions = {}): Accordion => {
  const items = Math.max(1, options.items ?? 3);
  const base = options.id ?? createUniqueId();
  const [multipleOverride, setMultipleOverride] = createSignal<boolean | undefined>(undefined);
  const [collapsibleOverride, setCollapsibleOverride] = createSignal<boolean | undefined>(
    undefined,
  );
  const multiple = (): boolean => multipleOverride() ?? options.multiple ?? false;
  const collapsible = (): boolean => collapsibleOverride() ?? options.collapsible ?? true;
  const disabledItems = new Set<number>(options.disabledItems ?? []);
  const controlled = (): boolean => options.value !== undefined;

  const [indices, request] = createControllable<ReadonlyArray<number>>({
    value: () => options.value,
    initial: indicesOf(
      normalize(
        Array.from({ length: items }, (_, index) => (options.defaultValue ?? []).includes(index)),
        multiple(),
        collapsible(),
      ),
    ),
    onChange: () => options.onValueChange,
  });

  const expanded = (): ReadonlyArray<boolean> =>
    Array.from({ length: items }, (_, index) => indices().includes(index));

  const [headingLevel, setHeadingLevelSignal] = createSignal(
    Math.min(Math.max(options.headingLevel ?? 3, 1), HEADING_LEVELS),
  );

  const triggerId = (index: number): string => `${base}-trigger-${index}`;
  const panelId = (index: number): string => `${base}-panel-${index}`;
  const headingId = (index: number): string => `${base}-heading-${index}`;

  const isDisabled = (index: number): boolean =>
    options.disabled === true || disabledItems.has(index);

  const commit = (next: ReadonlyArray<boolean>): void => {
    if (JSON.stringify(next) === JSON.stringify(expanded())) {
      return;
    }
    request(indicesOf(next));
  };

  const toggle = (index: number): void => {
    if (isDisabled(index)) {
      return;
    }
    const current = expanded();
    const next = [...current];
    if (current[index] === true) {
      if (collapsible() || count(current) >= 2) {
        next[index] = false;
      }
    } else if (multiple()) {
      next[index] = true;
    } else {
      next.fill(false);
      next[index] = true;
    }
    commit(next);
  };

  return {
    items,
    expanded,
    isExpanded: (index) => expanded()[index] === true,
    toggle,
    setMultiple: (value) => {
      setMultipleOverride(value);
      if (!controlled()) {
        commit(normalize(expanded(), value, collapsible()));
      }
    },
    setCollapsible: (value) => {
      setCollapsibleOverride(value);
      if (!controlled()) {
        commit(normalize(expanded(), multiple(), value));
      }
    },
    setHeadingLevel: (level) => {
      setHeadingLevelSignal(Math.min(Math.max(level, 1), HEADING_LEVELS));
    },
    triggerProps: (index) => ({
      id: triggerId(index),
      type: "button",
      get "aria-expanded"() {
        return expanded()[index] === true ? "true" : "false";
      },
      "aria-controls": panelId(index),
      get "aria-disabled"() {
        return expanded()[index] === true && !(collapsible() || count(expanded()) >= 2)
          ? "true"
          : undefined;
      },
      get disabled() {
        return isDisabled(index);
      },
      onClick: () => toggle(index),
    }),
    panelProps: (index) => ({
      id: panelId(index),
      role: "region",
      "aria-labelledby": triggerId(index),
      tabindex: 0,
      get hidden() {
        return expanded()[index] !== true;
      },
    }),
    headingProps: (index) => ({
      id: headingId(index),
      role: "heading",
      get "aria-level"() {
        return headingLevel();
      },
    }),
  };
};
