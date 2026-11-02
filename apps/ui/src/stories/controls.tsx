import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";

import { Field, FieldControl, FieldLabel } from "../registry/field/field.tsx";
import { Input } from "../registry/input/input.tsx";
import { Select, SelectContent, SelectTrigger } from "../registry/select/select.tsx";
import { Slider } from "../registry/slider/slider.tsx";
import { Switch } from "../registry/switch/switch.tsx";
import type { Args, ArgTypes } from "@cssints/stories";

export interface ControlsProps {
  readonly argTypes: ArgTypes;
  readonly values: Args;
  readonly onChange: (name: string, value: unknown) => void;
}

// The label of a control is the arg's own name: `tone`, `size`, `disabled`. A story may rename what it shows, not the arg.
const labelOf = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();

/**
 * A value as a field shows it: strings and numbers as themselves, anything else as nothing.
 *
 * @param {unknown} value the arg's value
 * @returns {string} its text
 */
const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

/**
 * A text or number field, labelled by the arg's name.
 *
 * @param {{ readonly name: string, readonly type: "text" | "number", readonly value: unknown, readonly min?: number,
 *   readonly max?: number, readonly step?: number, readonly onChange: (value: unknown) => void }} props the field
 * @returns {JSX.Element} the field
 */
const TextControl = (props: {
  readonly name: string;
  readonly type: "text" | "number";
  readonly value: unknown;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly onChange: (value: unknown) => void;
}): JSX.Element => (
  <Field id={`control-${props.name}`}>
    <FieldLabel>{labelOf(props.name)}</FieldLabel>
    <FieldControl
      render={(control) => (
        <Input
          {...control}
          type={props.type}
          value={text(props.value)}
          min={props.min}
          max={props.max}
          step={props.step}
          onInput={(event) => {
            const raw = event.currentTarget.value;
            props.onChange(props.type === "number" ? (raw === "" ? undefined : Number(raw)) : raw);
          }}
        />
      )}
    />
  </Field>
);

/**
 * The controls a story declares, one row each: a switch, a select, a field or a slider, all of them the registry's own
 * components. `argTypes` is the model (see `csf.ts`), so a story without one gets no panel, and a type Storybook infers from
 * props is written out by hand instead of guessed at run time.
 *
 * @param {ControlsProps} props the declared controls and the args they read
 * @returns {JSX.Element} the panel
 */
export const Controls = (props: ControlsProps): JSX.Element => (
  <div class="controls">
    <For each={Object.entries(props.argTypes)}>
      {([name, control]) => (
        <div class="controls__row">
          <Show when={control.type === "boolean"}>
            <Switch
              value={Boolean(props.values[name])}
              onValueChange={(next) => props.onChange(name, next)}
            >
              {labelOf(name)}
            </Switch>
          </Show>
          <Show when={control.type === "select"}>
            <Select
              label={labelOf(name)}
              items={"options" in control ? control.options : []}
              value={Math.max(
                0,
                ("options" in control ? control.options : []).indexOf(String(props.values[name])),
              )}
              onValueChange={(index) =>
                props.onChange(name, "options" in control ? control.options[index] : undefined)
              }
            >
              <SelectTrigger />
              <SelectContent />
            </Select>
          </Show>
          <Show when={control.type === "range"}>
            <Slider
              label={labelOf(name)}
              min={"min" in control ? control.min : 0}
              max={"max" in control ? control.max : 100}
              step={"step" in control ? control.step : undefined}
              value={Number(props.values[name] ?? 0)}
              onValueChange={(next) => props.onChange(name, next)}
            />
          </Show>
          <Show when={control.type === "text" || control.type === "number"}>
            <TextControl
              name={name}
              type={control.type === "number" ? "number" : "text"}
              value={props.values[name]}
              min={"min" in control ? control.min : undefined}
              max={"max" in control ? control.max : undefined}
              step={"step" in control ? control.step : undefined}
              onChange={(next) => props.onChange(name, next)}
            />
          </Show>
        </div>
      )}
    </For>
  </div>
);
