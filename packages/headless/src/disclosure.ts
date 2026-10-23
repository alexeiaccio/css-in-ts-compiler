import { type Accessor, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

/**
 * Options are read lazily: pass a component's `props` (or an object with
 * getters), never destructured values, so `disabled` stays reactive.
 */
export interface DisclosureOptions {
  /** Controlled: the host owns the state and this is the only thing that changes it. */
  readonly value?: boolean | undefined;
  /** Uncontrolled starting state; ignored while `value` is set. */
  readonly defaultValue?: boolean;
  readonly disabled?: boolean;
  /** Base for the generated trigger/panel ids. */
  readonly id?: string;
  /**
   * A request to change the state, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (expanded: boolean) => void;
}

/** Spread onto the element with `role=button` (a native `<button>`). */
export interface DisclosureTriggerProps {
  readonly id: string;
  readonly type: "button";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string;
  readonly disabled: boolean;
  readonly onClick: () => void;
}

/** Spread onto the element holding the content that is shown or hidden. */
export interface DisclosurePanelProps {
  readonly id: string;
  readonly hidden: boolean;
}

export interface Disclosure {
  readonly expanded: Accessor<boolean>;
  /** Requests; `expand`, `collapse` and `toggle` are requests too. */
  readonly setExpanded: (expanded: boolean) => void;
  readonly expand: () => void;
  readonly collapse: () => void;
  readonly toggle: () => void;
  /** Getter-backed, so spreading it keeps every attribute reactive. */
  readonly triggerProps: DisclosureTriggerProps;
  readonly panelProps: DisclosurePanelProps;
}

/**
 * APG Disclosure (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/):
 * state plus attribute objects for a trigger and a panel. No styling, no
 * elements. Behaviour is checked against `specs/apg/disclosure.qnt` by the
 * scenario bridge, not by running the generated machine here.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the state.
 */
export const createDisclosure = (options: DisclosureOptions = {}): Disclosure => {
  const [expanded, request] = createControllable({
    value: () => options.value,
    initial: options.defaultValue ?? false,
    onChange: () => options.onValueChange,
  });
  const base = options.id ?? createUniqueId();
  const triggerId = `${base}-trigger`;
  const panelId = `${base}-panel`;

  const toggle = () => request(!expanded());

  return {
    expanded,
    setExpanded: request,
    expand: () => request(true),
    collapse: () => request(false),
    toggle,
    triggerProps: {
      id: triggerId,
      type: "button",
      get "aria-expanded"() {
        return expanded() ? "true" : "false";
      },
      "aria-controls": panelId,
      get disabled() {
        return options.disabled ?? false;
      },
      onClick: () => {
        if (!(options.disabled ?? false)) {
          toggle();
        }
      },
    },
    panelProps: {
      id: panelId,
      get hidden() {
        return !expanded();
      },
    },
  };
};
