import { type Tabs as TabsController, createTabs } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For, untrack } from "solid-js";

import { t } from "./theme.ts" with { type: "cssints" };

export interface TabsProps {
  /** The tab labels, in order; the panel at an index is `panels[index]`. */
  readonly labels: ReadonlyArray<string>;
  readonly panels?: ReadonlyArray<JSX.Element>;
  readonly value?: number | undefined;
  readonly defaultSelected?: number;
  readonly orientation?: "horizontal" | "vertical";
  readonly disabled?: ReadonlyArray<number>;
  readonly class?: string;
  readonly onValueChange?: (index: number) => void;
  readonly onReady?: (controller: TabsController) => void;
}

const root = css.cn(css.display("grid"), css.gap(t.space.md));
const tablist = css.cn(
  css.display("flex"),
  css.gap(t.space.sm),
  css.borderBlockEnd("1px solid", t.color.line),
);
const tab = css.cn(
  css.padding(t.space.md, t.space.lg),
  css.border("none"),
  css.bg("transparent"),
  css.color(t.color.muted),
  css.fontSize(t.font.size),
  css.cursor("pointer"),
  css.boxShadow("inset 0 -2px transparent"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  css.attr("aria-selected", "true")(
    css.color(t.color.text),
    css.boxShadow("inset 0 -3px", t.color.accent),
  ),
  css.attr("aria-disabled", "true")(css.color(t.color.muted), css.opacity("0.6")),
);
const panel = css.cn(
  css.padding(t.space.md, "0"),
  css.color(t.color.text),
  css.fontSize(t.font.size),
);

/**
 * APG tabs on `@cssints/headless`: the tablist is the focusgroup, the selection, the arrow keys, Home/End and the panels are the
 * primitive's. The selected tab is `aria-selected="true"`, so the skin reads the state and never a second copy of it.
 */
export const Tabs = (props: TabsProps) => {
  const api = createTabs({
    get items() {
      return props.labels.length;
    },
    get value() {
      return props.value;
    },
    defaultSelected: props.defaultSelected ?? 0,
    orientation: props.orientation ?? "horizontal",
    disabled: props.disabled ?? [],
    get label() {
      return (index: number) => props.labels[index];
    },
    onValueChange: (index: number) => props.onValueChange?.(index),
  });
  untrack(() => props.onReady)?.(api);
  return (
    <div class={css.cn(root, props.class)}>
      <div {...api.tablistProps} class={tablist}>
        <For each={props.labels}>
          {(text, index) => (
            <button {...api.tabProps(index())} type="button" class={tab}>
              {text}
            </button>
          )}
        </For>
      </div>
      <For each={props.labels}>
        {(_, index) => (
          <div {...api.tabpanelProps(index())} class={panel}>
            {props.panels?.[index()]}
          </div>
        )}
      </For>
    </div>
  );
};
