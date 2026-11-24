import type { Meta, Story } from "@cssints/stories";

import { Tabs, type TabsProps } from "./tabs.tsx";

export default {
  title: "DS/Tabs",
  component: Tabs,
  args: {
    labels: ["Overview", "Activity", "Settings"],
    panels: ["What this is.", "What happened lately.", "What you can change."],
  },
  argTypes: {
    defaultSelected: { type: "number", min: 0, max: 2, step: 1 },
  },
} satisfies Meta<TabsProps>;

export const Default: Story<TabsProps> = {};

export const Second: Story<TabsProps> = {
  name: "Opened on the second",
  args: { defaultSelected: 1 },
};
