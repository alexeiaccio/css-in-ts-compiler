import {
  type Accordion as AccordionController,
  type AccordionOptions,
  createAccordion,
} from "@cssints/headless";
import { For } from "solid-js";
import type { JSX } from "@solidjs/web";

import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

const rootClass = css.cn(
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.overflow("hidden"),
);
const headingClass = css.cn(css.margin(0), css.fontSize(t.font.size));
const triggerClass = css.cn(
  css.group(),
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.width("100%"),
  css.padding(t.space._3, t.space._4),
  css.bg("transparent"),
  css.border("none"),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.fontWeight("500"),
  css.textAlign("left"),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  css.attr("aria-expanded", "true")(css.bg(t.color.buttonBackground)),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);
const chevronClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.transition("transform 120ms"),
  css.within(css.attr("aria-expanded", "true"))(css.transform("rotate(90deg)")),
);
const panelClass = css.cn(
  css.padding(t.space._3, t.space._4),
  css.color(t.color.muted),
  css.borderTop("1px solid", t.color.border),
  css.fontSize(t.font.size),
);

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
    <div class={rootClass}>
      <For each={Array.from({ length: props.items }, (_, index) => index)}>
        {(index) => (
          <>
            <h3 {...accordion.headingProps(index)} data-part="heading" class={headingClass}>
              <button {...accordion.triggerProps(index)} data-part="trigger" class={triggerClass}>
                <span aria-hidden="true" class={chevronClass} />
                <span>{props.trigger(index)}</span>
              </button>
            </h3>
            <div {...accordion.panelProps(index)} data-part="panel" class={panelClass}>
              {props.panel?.(index)}
            </div>
          </>
        )}
      </For>
    </div>
  );
};
