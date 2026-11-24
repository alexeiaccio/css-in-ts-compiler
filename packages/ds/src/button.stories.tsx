import type { Meta, Story } from "@cssints/stories";

import { Button, type ButtonProps } from "./button.tsx";

export default {
  title: "DS/Button",
  component: Button,
  args: { children: "Save" },
  argTypes: {
    tone: { type: "select", options: ["neutral", "accent", "quiet"] },
    size: { type: "select", options: ["sm", "md"] },
    isToggle: { type: "boolean" },
    disabled: { type: "boolean" },
  },
} satisfies Meta<ButtonProps>;

export const Neutral: Story<ButtonProps> = {};

export const Accent: Story<ButtonProps> = { args: { tone: "accent" } };

export const Quiet: Story<ButtonProps> = { args: { tone: "quiet" } };

export const Compact: Story<ButtonProps> = { name: "Compact", args: { size: "sm" } };

export const Disabled: Story<ButtonProps> = { args: { disabled: true } };
