import type { Meta, Story } from "@cssints/stories";

import { Switch, type SwitchProps } from "./switch.tsx";

export default {
  title: "DS/Switch",
  component: Switch,
  args: { children: "Wi-Fi" },
  argTypes: {
    children: { type: "text" },
    defaultValue: { type: "boolean" },
    disabled: { type: "boolean" },
    readOnly: { type: "boolean" },
  },
} satisfies Meta<SwitchProps>;

export const Off: Story<SwitchProps> = {};

export const On: Story<SwitchProps> = { args: { defaultValue: true } };

export const Disabled: Story<SwitchProps> = { args: { disabled: true } };
