// The date picker's stories: the trigger opens a calendar in a popover, so the panel is portalled and the preview shows the
// button. `today` is pinned, as the conformance fixture pins it, so the month every reader opens is the same; the chosen day
// is a host value, which is the second mode (`Picked` owns it in a signal).
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "@cssints/stories";
import { DatePicker, DatePickerContent, DatePickerTrigger } from "./date-picker.tsx";

/** 2026-10-15, a Thursday: "today" for every story, so nothing depends on when the page is read. */
const TODAY = "2026-10-15";

const meta = { title: "Date picker" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <DatePicker today={TODAY}>
      <DatePickerTrigger />
      <DatePickerContent />
    </DatePicker>
  ),
};

// A controlled picker: the host owns the value, so the trigger shows the day it was given and a choice writes it back.
export const Picked: Story = {
  render: (): JSX.Element => {
    const [value, setValue] = createSignal("2026-10-20");
    return (
      <div class="demo-column">
        <DatePicker today={TODAY} value={value()} onValueChange={setValue}>
          <DatePickerTrigger />
          <DatePickerContent />
        </DatePicker>
        <p class="demo-text">The host holds the value: {value()}.</p>
      </div>
    );
  },
};
