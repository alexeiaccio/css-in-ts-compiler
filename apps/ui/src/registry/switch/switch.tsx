import {
  type Switch as SwitchController,
  createSwitch,
  type SwitchOptions,
} from "@cssints/headless";
import { Show, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

/** APG switch, styled: a track and a thumb, the behaviour from `@cssints/headless`. */
export interface SwitchProps extends Omit<SwitchOptions, "id"> {
  /** The label; without one, pass `aria-label` through the host's own element. */
  readonly children?: JSX.Element;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (sw: SwitchController) => void;
}

// The track is the group: the thumb reads the state the widget announces on it, so the two never disagree.
const track = css.cn(
  css.group(),
  css.boxSizing("border-box"),
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.width("max-content"),
  css.padding(t.space._1),
  css.borderRadius("999px"),
  css.bg(t.color.border),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.cursor("pointer"),
  css.transition("background-color 120ms"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-checked", "true")(css.bg(t.color.highlight), css.color(t.color.onHighlight)),
  css.attr("aria-disabled", "true")(css.cursor("not-allowed")),
);

const thumb = css.cn(
  css.display("block"),
  css.width("1.25rem"),
  css.height("1.25rem"),
  css.borderRadius("999px"),
  css.bg(t.color.surface),
  css.transition("transform 120ms"),
  css.within(css.attr("aria-checked", "true"))(css.transform("translateX(1.25rem)")),
);

const label = css.cn(css.paddingInline(t.space._2));

/** A switch: a div with role=switch (a button would fire a native click on top of the primitive's activation). */
export const Switch = (props: SwitchProps): JSX.Element => {
  const sw = createSwitch({
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    disabled: props.disabled,
    readOnly: props.readOnly,
    enterToggles: props.enterToggles,
    onValueChange: props.onValueChange,
  });
  untrack(() => props.onReady)?.(sw);
  return (
    <div {...sw.switchProps} data-part="switch" class={track}>
      <span aria-hidden="true" class={thumb} />
      <Show when={props.children}>
        <span class={label}>{props.children}</span>
      </Show>
    </div>
  );
};
