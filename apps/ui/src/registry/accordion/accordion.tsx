import {
  type Accordion as AccordionController,
  type AccordionOptions,
  createAccordion,
} from "@cssints/headless";
import { For } from "solid-js";
import type { JSX } from "@solidjs/web";

import "./accordion.css";

/**
 * APG accordion, styled: headed triggers and the regions they expand.
 *
 * The primitive owns which panels are open, `multiple` and `collapsible`; the host owns the
 * elements — the heading is a real `h3` so the triggers land in a screen reader's heading list,
 * and the trigger is a native button.
 *
 * `value` makes it controlled; without it the accordion owns the expanded set. `onValueChange`
 * is a request — a controlled host may ignore it.
 */
export interface AccordionProps extends Omit<AccordionOptions, "id"> {
  /** How many sections; `trigger` and `panel` are called per index. */
  readonly items: number;
  readonly trigger: (index: number) => JSX.Element;
  readonly panel?: (index: number) => JSX.Element;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (accordion: AccordionController) => void;
}

export const Accordion = (props: AccordionProps): JSX.Element => {
  const accordion = createAccordion({
    items: props.items,
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get multiple() {
      return props.multiple;
    },
    get collapsible() {
      return props.collapsible;
    },
    headingLevel: props.headingLevel,
    get disabled() {
      return props.disabled;
    },
    disabledItems: props.disabledItems,
    get onValueChange() {
      return props.onValueChange;
    },
  });
  props.onReady?.(accordion);

  return (
    <div class="ui-accordion">
      <For each={Array.from({ length: props.items }, (_, index) => index)}>
        {(index) => (
          <>
            <h3
              {...accordion.headingProps(index)}
              data-part="heading"
              class="ui-accordion__heading"
            >
              <button
                {...accordion.triggerProps(index)}
                data-part="trigger"
                class="ui-accordion__trigger"
              >
                <span aria-hidden="true" class="ui-accordion__chevron" />
                <span>{props.trigger(index)}</span>
              </button>
            </h3>
            <div {...accordion.panelProps(index)} data-part="panel" class="ui-accordion__panel">
              {props.panel?.(index)}
            </div>
          </>
        )}
      </For>
    </div>
  );
};
