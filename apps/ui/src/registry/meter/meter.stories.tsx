// The meter's stories: a gauge is a track and the fill of the value in it. The fill's width is the one thing CSS cannot read
// off `aria-valuenow`, so it is an inline percentage from the same `percent()` the `aria-valuetext` is made of.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";
import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };
import { Meter, type MeterProps } from "./meter.tsx";

const meta = {
  title: "Meter",
  component: Meter,
  args: { label: "Storage" },
  argTypes: {
    value: { type: "range", min: 0, max: 100, step: 1 },
  },
} satisfies Meta<MeterProps>;
export default meta;

export const Default: Story<MeterProps> = { args: { value: 64 } };

export const Full: Story<MeterProps> = { args: { value: 100 } };

// A value the numbers cannot say: `valueText` is what a reader hears instead of "92 percent".
export const WithValueText: Story<MeterProps> = {
  args: { label: "Upload", value: 92, valueText: "92% of the file sent" },
};

const nativeMeter = css.cn(css.width("100%"), css.accentColor(t.color.highlight));
const nativeLabel = css.cn(css.display("block"), css.fontSize(t.font.sizeSm), css.color(t.color.text));

const NativeMeter = (props: MeterProps): JSX.Element => (
  <div>
    <label class={nativeLabel} for="native-meter">
      {props.label}
    </label>
    <meter
      id="native-meter"
      class={nativeMeter}
      value={props.value ?? 0}
      min={props.min ?? 0}
      max={props.max ?? 100}
    />
  </div>
);

// The recipe (docs/hosts.md): `<meter>` is the meter. The engine draws it, announces `aria-valuenow` and the low/high/
// optimum thresholds, and `accent-color` is the colour. A value a reader must hear differently (`valueText`) keeps the
// primitive: the native element does not produce `aria-valuetext`.
export const Native: Story<MeterProps> = { args: { value: 64 }, render: (args) => <NativeMeter {...args} /> };
