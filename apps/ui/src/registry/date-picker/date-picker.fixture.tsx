import { type DatePicker as DatePickerController } from "@cssints/headless";
import { render } from "@solidjs/web";

import { DatePicker, DatePickerContent, DatePickerTrigger } from "./date-picker.tsx";

/** A fixed "today", so a test never depends on when it runs: 2026-10-15, a Thursday. */
export const TODAY = "2026-10-15";

export interface DatePickerFixtureOptions {
  /** Controlled: the host owns the value. */
  readonly value?: string | undefined;
  /** Uncontrolled starting value. */
  readonly defaultValue?: string | undefined;
  readonly min?: string | undefined;
  readonly max?: string | undefined;
  /** The trigger's text; the ISO day by default, so an assertion does not depend on the locale. */
  readonly format?: (iso: string) => string;
}

export interface DatePickerMounted {
  readonly root: HTMLElement;
  readonly picker: DatePickerController;
  readonly dispose: () => void;
}

/**
 * Mounts the styled date picker in ordinary use: the trigger and the panel's default parts (header, nav, grid), with today
 * pinned and the trigger showing the ISO day. The panel is portalled, so the driver finds its parts on the document.
 */
export const mountDatePicker = (options: DatePickerFixtureOptions = {}): DatePickerMounted => {
  const root = document.createElement("div");
  document.body.append(root);
  let picker: DatePickerController | undefined;

  const dispose = render(
    () => (
      <DatePicker
        value={options.value}
        defaultValue={options.defaultValue}
        today={TODAY}
        min={options.min}
        max={options.max}
        format={options.format ?? ((iso) => iso)}
        onReady={(created) => {
          picker = created;
        }}
      >
        <DatePickerTrigger />
        <DatePickerContent />
      </DatePicker>
    ),
    root,
  );

  if (picker === undefined) {
    throw new Error("mountDatePicker: the picker did not render");
  }
  return {
    root,
    picker,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
