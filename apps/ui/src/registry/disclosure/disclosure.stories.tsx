// The disclosure's stories: one button and the panel it shows. The trigger announces `aria-expanded` and the chevron turns
// from that attribute, so what a reader sees is what a screen reader hears.
import type { Meta, Story } from "@cssints/stories";
import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };
import { Disclosure, type DisclosureProps } from "./disclosure.tsx";

const meta = {
  title: "Disclosure",
  component: Disclosure,
  args: {
    summary: "Shipping, returns and refunds",
    children:
      "A disclosure is one button and the panel it shows. The chevron turns with `aria-expanded`.",
  },
  argTypes: {
    disabled: { type: "boolean" },
  },
} satisfies Meta<DisclosureProps>;
export default meta;

export const Closed: Story<DisclosureProps> = {};

export const Open: Story<DisclosureProps> = { args: { defaultValue: true } };

export const Disabled: Story<DisclosureProps> = { args: { disabled: true } };

const nativeRoot = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._2));
const nativeSummary = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.padding(t.space._2, 0),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.fontWeight("500"),
  css.cursor("pointer"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);
const nativePanel = css.cn(css.paddingInlineStart(t.space._4), css.color(t.color.muted));

const NativeDetails = (props: DisclosureProps) => (
  <details class={nativeRoot}>
    <summary class={nativeSummary}>{props.summary}</summary>
    <div class={nativePanel}>{props.children}</div>
  </details>
);

// The recipe (docs/hosts.md): `<details>` is the disclosure. The platform toggles it, announces it and hides the panel;
// there is no primitive and no state. The open/close animation is `::details-content` + `interpolate-size`, not JS.
export const Native: Story<DisclosureProps> = { render: (args) => <NativeDetails {...args} /> };
