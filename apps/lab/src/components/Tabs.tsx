import { createTabs } from "@cssints/headless";
import * as css from "cssints" with { type: "cssints" };
import { For } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

export interface TabsItem {
  readonly label: string;
  readonly body: string;
}

export interface TabsProps {
  readonly items: ReadonlyArray<TabsItem>;
  /** Indices that cannot be selected; the arrows skip them. */
  readonly disabled?: ReadonlyArray<number>;
}

const tablist = css.cn(
  css.display("flex"),
  css.gap(1),
  css.borderBottom("1px solid", t.color.border),
);

const tab = css.cn(
  css.padding("8px 12px"),
  css.bg("transparent"),
  css.border("none"),
  css.borderBottom("2px solid", "transparent"),
  css.color(t.color.muted),
  css.fontSize(t.fontSize.md),
  css.cursor("pointer"),
  css.marginBottom("-1px"),
  css.hover(css.color(t.color.text)),
  css.attr("aria-selected", "true")(
    css.color(t.color.accent),
    css.borderBottom("2px solid", t.color.accent),
    css.fontWeight("600"),
  ),
  css.attr("aria-disabled", "true")(css.opacity(0.45), css.cursor("not-allowed")),
);

const panel = css.cn(
  css.padding("16px 2px"),
  css.fontSize(t.fontSize.sm),
  css.color(t.color.muted),
);

const body = css.cn(css.margin(0));

// The styled tabs of the lab: `createTabs` owns the selection, the roving tabindex and the arrow keys.
export function Tabs(props: TabsProps) {
  const tabs = createTabs({
    items: props.items.length,
    disabled: props.disabled ?? [],
  });

  return (
    <div>
      <div {...tabs.tablistProps} class={tablist}>
        <For each={props.items}>
          {(item, at) => (
            <button {...tabs.tabProps(at())} class={tab}>
              {item.label}
            </button>
          )}
        </For>
      </div>
      <For each={props.items}>
        {(item, at) => (
          <div {...tabs.tabpanelProps(at())} class={panel}>
            <p class={body}>{item.body}</p>
          </div>
        )}
      </For>
    </div>
  );
}
