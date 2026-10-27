import { createAccordion } from "@cssints/headless";
import * as css from "cssints" with { type: "cssints" };
import { For } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

export interface AccordionItem {
  readonly title: string;
  readonly body: string;
}

export interface AccordionProps {
  readonly items: ReadonlyArray<AccordionItem>;
  /** More than one panel open at once. */
  readonly multiple?: boolean;
  /** The panels open at mount. */
  readonly open?: ReadonlyArray<number>;
}

const card = css.cn(
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.overflow("hidden"),
);

const heading = css.cn(css.margin(0), css.fontSize(t.fontSize.md));

const trigger = css.cn(
  css.group(),
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(3),
  css.width("100%"),
  css.padding("12px 14px"),
  css.bg("transparent"),
  css.color(t.color.text),
  css.fontSize(t.fontSize.md),
  css.fontWeight("600"),
  css.textAlign("left"),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.accentSoft)),
  css.attr("aria-expanded", "true")(css.bg(t.color.accentSoft)),
  css.attr("aria-disabled", "true")(css.opacity(0.45), css.cursor("not-allowed")),
);

const chevron = css.cn(
  css.fontSize(t.fontSize.sm),
  css.color(t.color.muted),
  css.transition("transform 150ms"),
  // group()/within(): a child reads the attribute its trigger announced
  css.within(css.attr("aria-expanded", "true"))(css.transform("rotate(180deg)")),
);

const panel = css.cn(
  css.padding("0 14px 12px"),
  css.fontSize(t.fontSize.sm),
  css.color(t.color.muted),
);

const body = css.cn(css.margin(0));

// The styled accordion of the lab: `createAccordion` over a list of panels.
export function Accordion(props: AccordionProps) {
  const accordion = createAccordion({
    items: props.items.length,
    multiple: props.multiple ?? false,
    defaultValue: props.open ?? [0],
  });

  return (
    <div class={card}>
      <For each={props.items}>
        {(item, at) => (
          <>
            <h3 {...accordion.headingProps(at())} class={heading}>
              <button {...accordion.triggerProps(at())} class={trigger}>
                {item.title}
                <span class={chevron} aria-hidden="true">
                  ▾
                </span>
              </button>
            </h3>
            <div {...accordion.panelProps(at())} class={panel}>
              <p class={body}>{item.body}</p>
            </div>
          </>
        )}
      </For>
    </div>
  );
}
