// The badge's stories: a small label, fully round, in the three tones the skin has.
import type { Meta, Story } from "@cssints/stories";

import { Badge, type BadgeProps } from "./badge.tsx";

const meta = {
  title: "Badge",
  component: Badge,
  args: { children: "Neutral" },
  argTypes: {
    tone: { type: "select", options: ["neutral", "accent", "quiet"] },
  },
} satisfies Meta<BadgeProps>;
export default meta;

export const Neutral: Story<BadgeProps> = {};

export const Accent: Story<BadgeProps> = { args: { tone: "accent", children: "Accent" } };

export const Quiet: Story<BadgeProps> = { args: { tone: "quiet", children: "Quiet" } };

export const All: Story<BadgeProps> = {
  name: "All tones",
  render: () => (
    <div class="demo-row">
      <Badge>Neutral</Badge>
      <Badge tone="accent">Accent</Badge>
      <Badge tone="quiet">Quiet</Badge>
    </div>
  ),
};
