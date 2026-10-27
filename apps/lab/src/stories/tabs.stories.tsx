import { Tabs, type TabsItem, type TabsProps } from "../components/Tabs.tsx";
import type { Meta, Story } from "../csf.ts";

const PANELS: ReadonlyArray<TabsItem> = [
  {
    label: "Overview",
    body: "createTabs owns the selection, the roving tabindex and the arrow keys; each button is aria-selected, and the class reads that.",
  },
  {
    label: "Spec",
    body: "The behaviour is checked in Chromium against specs/apg/tabs.qnt and the ported scenarios, not by running the machine here.",
  },
  {
    label: "Disabled",
    body: "This tab is disabled: it announces aria-disabled, cannot be selected, and the arrows skip it.",
  },
];

const meta = {
  title: "Tabs",
  component: Tabs,
  args: { items: PANELS },
} satisfies Meta<TabsProps>;

export default meta;

export const Three: Story<TabsProps> = {};

export const WithDisabled: Story<TabsProps> = { args: { disabled: [2] } };
