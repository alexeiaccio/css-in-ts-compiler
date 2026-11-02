// The switch's stories. `value` makes it controlled, so a story that wants a control over the state owns a signal and the
// control writes that; a story with `defaultValue` starts in one state and the reader clicks it.
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "../../stories/csf.ts";
import { Switch, type SwitchProps } from "./switch.tsx";

const meta = {
  title: "Switch",
  component: Switch,
  args: { children: "Dark theme", defaultValue: false },
  argTypes: {
    disabled: { type: "boolean" },
    readOnly: { type: "boolean" },
  },
} satisfies Meta<SwitchProps>;
export default meta;

export const Off: Story<SwitchProps> = {};

export const On: Story<SwitchProps> = { args: { defaultValue: true } };

export const Disabled: Story<SwitchProps> = { args: { disabled: true } };

export const ReadOnly: Story<SwitchProps> = { args: { readOnly: true } };

// The controlled form: the host owns the state, so the story needs a signal — and the chip beside it is the page's own,
// which is the point of a headless widget.
export const Controlled: Story<SwitchProps> = {
  render: (): JSX.Element => {
    const [checked, setChecked] = createSignal(true);
    return (
      <div class="demo-row">
        <Switch value={checked()} onValueChange={setChecked}>
          {checked() ? "On" : "Off"}
        </Switch>
        <code>{checked() ? "aria-checked=true" : "aria-checked=false"}</code>
      </div>
    );
  },
};
