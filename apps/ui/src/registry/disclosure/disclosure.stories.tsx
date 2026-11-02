// The disclosure's stories: one button and the panel it shows. The trigger announces `aria-expanded` and the chevron turns
// from that attribute, so what a reader sees is what a screen reader hears.
import type { Meta, Story } from "@cssints/stories";

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
