import { type Switch as SwitchController, createSwitch } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { Show, untrack } from "solid-js";

import { t } from "./theme.ts" with { type: "cssints" };

export interface SwitchProps {
  readonly children?: JSX.Element;
  readonly value?: boolean | undefined;
  readonly defaultValue?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly class?: string;
  readonly onValueChange?: (checked: boolean) => void;
  readonly onReady?: (controller: SwitchController) => void;
}

const track = css.cn(
  css.group(),
  css.boxSizing("border-box"),
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space.md),
  css.width("max-content"),
  css.padding(t.space.xs),
  css.borderRadius(t.radius.pill),
  css.bg(t.color.line),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.cursor("pointer"),
  css.transition("background-color 120ms"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-checked", "true")(css.bg(t.color.accent), css.color(t.color.onAccent)),
  css.attr("aria-disabled", "true")(css.cursor("not-allowed"), css.opacity("0.6")),
);

const thumb = css.cn(
  css.display("block"),
  css.inlineSize("1.125rem"),
  css.blockSize("1.125rem"),
  css.borderRadius(t.radius.pill),
  css.bg(t.color.surface),
  css.transition("transform 120ms"),
  css.within(css.attr("aria-checked", "true"))(css.transform("translateX(1.125rem)")),
);

const label = css.cn(css.paddingInline(t.space.md));

/** APG switch on `@cssints/headless`: a track and a thumb; the widget owns `aria-checked`, the keys and the pointer. */
export const Switch = (props: SwitchProps) => {
  const api = createSwitch({
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue ?? false,
    disabled: props.disabled ?? false,
    readOnly: props.readOnly ?? false,
    onValueChange: (checked: boolean) => props.onValueChange?.(checked),
  });
  untrack(() => props.onReady)?.(api);
  return (
    <div {...api.switchProps} class={css.cn(track, props.class)}>
      <span aria-hidden="true" class={thumb} />
      <Show when={props.children}>
        <span class={label}>{props.children}</span>
      </Show>
    </div>
  );
};
