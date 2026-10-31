import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import { Combobox, type ComboboxItem } from "./combobox.tsx";

/**
 * Twelve names from a component library, the corpus the demo filters. The value is the slug a page would save; the label
 * is what the field shows and what the reader types against.
 */
export const COMBOBOX_ITEMS: ReadonlyArray<ComboboxItem> = [
  { value: "accordion", label: "Accordion" },
  { value: "button", label: "Button" },
  { value: "checkbox", label: "Checkbox" },
  { value: "combobox", label: "Combobox" },
  { value: "dialog", label: "Dialog" },
  { value: "drawer", label: "Drawer" },
  { value: "field", label: "Field" },
  { value: "menu", label: "Menu" },
  { value: "radio", label: "Radio group" },
  { value: "select", label: "Select" },
  { value: "slider", label: "Slider" },
  { value: "switch", label: "Switch" },
];

/** The field's accessible name: what the searchable list is of. */
export const COMBOBOX_LABEL = "Component";

/** The one sentence the demo says about typing and the keys. */
export const COMBOBOX_HINT =
  "Type to filter the list, then press ↑ or ↓ to move the highlight, Enter or Space to choose, and Escape to close it.";

export interface ComboboxExampleProps {
  readonly class?: string | undefined;
  readonly disabled?: boolean | undefined;
  /** What a page would save: the chosen slug, or `null` while nothing is chosen. */
  readonly onValueChange?: ((value: string | null) => void) | undefined;
}

/**
 * The starter in ordinary use: a searchable picker of component names, the chosen one shown in the field, and a sentence
 * about typing and the keys. A page copies this and swaps `COMBOBOX_ITEMS` for its own list and `onValueChange` for its
 * own save.
 */
export const ComboboxExample = (props: ComboboxExampleProps): JSX.Element => {
  const [value, setValue] = createSignal<string | null>(null);
  return (
    <div class={props.class === undefined ? "demo-column" : `demo-column ${props.class}`}>
      <Combobox
        items={COMBOBOX_ITEMS}
        label={COMBOBOX_LABEL}
        placeholder="Search components"
        value={value()}
        disabled={props.disabled}
        onValueChange={(next) => {
          setValue(next);
          props.onValueChange?.(next);
        }}
      />
      <p class="demo-text">{COMBOBOX_HINT}</p>
    </div>
  );
};

/** What a mounted demo hands the test: where it lives, the values the host heard, and a teardown. */
export interface MountedCombobox {
  readonly root: HTMLElement;
  /** Every `onValueChange` the host received, oldest first. */
  readonly changes: () => ReadonlyArray<string | null>;
  readonly dispose: () => void;
}

/** Mounts the styled picker at the demo's width. The primitive owns the filter, the highlight and the keys. */
export const mountCombobox = (config: { readonly disabled?: boolean } = {}): MountedCombobox => {
  const root = document.createElement("div");
  root.style.width = "24rem";
  document.body.append(root);
  const changes: Array<string | null> = [];
  const dispose = render(
    () => (
      <ComboboxExample
        disabled={config.disabled}
        onValueChange={(value) => {
          changes.push(value);
        }}
      />
    ),
    root,
  );
  return {
    root,
    changes: () => changes,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
