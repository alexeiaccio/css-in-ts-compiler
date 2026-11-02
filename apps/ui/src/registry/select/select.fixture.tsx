import { Select, SelectContent, SelectTrigger } from "./select.tsx";
import { render } from "@solidjs/web";

/** The six fruits the primitive's select-only walk uses: the typeahead has two `b`s and two `c`s to choose from. */
export const SELECT_ITEMS: ReadonlyArray<string> = [
  "Apple",
  "Banana",
  "Blueberry",
  "Cherry",
  "Cranberry",
  "Durian",
];

/** The trigger's and the listbox's accessible name. */
export const SELECT_LABEL = "Fruit";

export interface MountSelectConfig {
  readonly disabled?: boolean;
  /** A controlled value (the chosen index); the host never writes it back, so every request is ignored. */
  readonly value?: number;
}

/** What a mounted select hands the test: where it lives, the choices the host heard, and a teardown. */
export interface MountedSelect {
  readonly root: HTMLElement;
  /** Every `onValueChange` the host received, oldest first. */
  readonly changes: () => ReadonlyArray<number>;
  readonly dispose: () => void;
}

/**
 * Mounts the styled select-only combobox. Nothing filters and nothing is typed into a field: the button that shows
 * the chosen label is the combobox, and the letters a reader presses are its typeahead (`filter: false`).
 */
export const mountSelect = (config: MountSelectConfig = {}): MountedSelect => {
  const root = document.createElement("div");
  document.body.append(root);
  const changes: number[] = [];
  const dispose = render(
    () => (
      <Select
        items={SELECT_ITEMS}
        label={SELECT_LABEL}
        placeholder="Pick a fruit"
        value={config.value}
        disabled={config.disabled}
        onValueChange={(index) => {
          changes.push(index);
        }}
      >
        <SelectTrigger />
        <SelectContent />
      </Select>
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
