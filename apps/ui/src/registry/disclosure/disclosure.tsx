import {
  type Disclosure as DisclosureController,
  type DisclosureOptions,
  createDisclosure,
} from "@cssints/headless";
import { Show, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

/** APG disclosure, styled: a button and the panel it shows. */
export interface DisclosureProps extends Omit<DisclosureOptions, "id"> {
  /** The trigger's label. */
  readonly summary: JSX.Element;
  readonly children?: JSX.Element;
  /** The primitive, once: a scenario fixture needs its setters; a page rarely does. */
  readonly onReady?: (disclosure: DisclosureController) => void;
}

const root = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._2));

const trigger = css.cn(
  css.group(),
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.padding(t.space._2, 0),
  css.bg("transparent"),
  css.border("none"),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.fontWeight("500"),
  css.cursor("pointer"),
  css.textAlign("left"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);

// the chevron follows the state its trigger announces, through the group
const chevron = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.transition("transform 120ms"),
  css.within(css.attr("aria-expanded", "true"))(css.transform("rotate(90deg)")),
);

const panel = css.cn(css.paddingInlineStart(t.space._4), css.color(t.color.muted));

export const Disclosure = (props: DisclosureProps): JSX.Element => {
  const disclosure = createDisclosure({
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get disabled() {
      return props.disabled;
    },
    onValueChange: props.onValueChange,
  });
  untrack(() => props.onReady)?.(disclosure);
  return (
    <div class={root}>
      <button {...disclosure.triggerProps} data-part="trigger" class={trigger}>
        <span aria-hidden="true" class={chevron}>
          ▸
        </span>
        <span>{props.summary}</span>
      </button>
      <div {...disclosure.panelProps} data-part="panel" class={panel}>
        <Show when={props.children}>{props.children}</Show>
      </div>
    </div>
  );
};
