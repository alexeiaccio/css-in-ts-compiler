// The switch's stories. `value` makes it controlled, so a story that wants a control over the state owns a signal and the
// control writes that; a story with `defaultValue` starts in one state and the reader clicks it.
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "@cssints/stories";
import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };
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

const nativeRow = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.fontSize(t.font.size),
);
const nativeBox = css.cn(
  css.width("1.5rem"),
  css.height("1.5rem"),
  css.accentColor(t.color.highlight),
  css.cursor("pointer"),
);

const NativeSwitch = () => {
  const [on, setOn] = createSignal(false);
  return (
    <label class={nativeRow}>
      <input
        type="checkbox"
        role="switch"
        class={nativeBox}
        checked={on()}
        onChange={(event) => setOn(event.currentTarget.checked)}
        {...({ switch: "" } as Record<string, string>)}
      />
      Wi-Fi
    </label>
  );
};

// The recipe (docs/hosts.md): a checkbox with `role=switch` and, where the engine has it (Safari 17.4+), the `switch`
// attribute for the look. Chrome, Edge and Firefox ignore the attribute and render a checkbox — the baseline is the
// element, the attribute is the enhancement.
export const Native: Story = { render: () => <NativeSwitch /> };
