import { render } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { createListbox, type Listbox, type ListboxIntent } from "../src/listbox";

interface Mounted {
  readonly api: Listbox;
  readonly changed: ReadonlyArray<ReadonlyArray<number>>;
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const dispose of mounted.splice(0)) {
    dispose();
  }
  document.body.replaceChildren();
});

const mount = (
  options: { readonly multiple?: boolean; readonly disabled?: number[] } = {},
): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const changed: Array<ReadonlyArray<number>> = [];
  let api: Listbox | undefined;

  const dispose = render(() => {
    const list = createListbox({
      items: ["Apple", "Avocado", "Banana", "Cherry", "Date"],
      ...(options.multiple === true ? { selectionMode: "multiple" as const } : {}),
      disabled: options.disabled ?? [2],
      onValueChange: (selected) => changed.push(selected),
    });
    api = list;
    return (
      <div {...list.listboxProps}>
        {["Apple", "Avocado", "Banana", "Cherry", "Date"].map((label, index) => (
          <div {...list.optionProps(index)} data-option={label}>
            {label}
          </div>
        ))}
      </div>
    );
  }, root);
  mounted.push(dispose);

  if (api === undefined) {
    throw new Error("not mounted");
  }
  return { api, changed, root, dispose };
};

const act = (instance: Mounted, intent: ListboxIntent): void => {
  instance.api.act(intent);
  flush();
};

describe("createListbox, act and snapshot", () => {
  it("snapshots what the ARIA already says, as JSON", () => {
    const instance = mount();
    flush();
    const snapshot = instance.api.snapshot();
    expect(snapshot).toEqual({
      selected: [],
      active: 0,
      focused: false,
      count: 5,
      disabled: [2],
      selectionMode: "single",
    });
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it("moves by focus, the way the platform's arrows do", () => {
    const instance = mount();
    act(instance, { type: "next" });
    expect(instance.api.snapshot()).toMatchObject({ active: 1, focused: true });
    expect(document.activeElement?.getAttribute("data-option")).toBe("Avocado");

    act(instance, { type: "next" });
    expect(instance.api.snapshot().active).toBe(3);
    act(instance, { type: "previous" });
    expect(instance.api.snapshot().active).toBe(1);

    act(instance, { type: "last" });
    expect(instance.api.snapshot().active).toBe(4);
    act(instance, { type: "first" });
    expect(instance.api.snapshot().active).toBe(0);
  });

  it("activates the active option, which is a request like Space", () => {
    const instance = mount();
    act(instance, { type: "next" });
    act(instance, { type: "activate" });
    expect(instance.api.snapshot().selected).toEqual([1]);
    expect(instance.changed).toEqual([[1]]);
  });

  it("clicks an option and toggles one where the mode says so", () => {
    const single = mount();
    act(single, { type: "click", index: 3 });
    expect(single.api.snapshot()).toMatchObject({ selected: [3], active: 3, focused: true });

    const multiple = mount({ multiple: true });
    act(multiple, { type: "click", index: 1 });
    act(multiple, { type: "click", index: 3 });
    expect(multiple.api.snapshot().selected).toEqual([1, 3]);
    act(multiple, { type: "click", index: 1 });
    expect(multiple.api.snapshot().selected).toEqual([3]);
  });

  it("types ahead from the active option, and refuses a disabled one", () => {
    const instance = mount();
    act(instance, { type: "focus", index: 0 });
    act(instance, { type: "type", text: "c" });
    expect(instance.api.snapshot().active).toBe(3);

    act(instance, { type: "focus", index: 2 });
    expect(instance.api.snapshot().active).toBe(3);
    act(instance, { type: "click", index: 2 });
    expect(instance.api.snapshot().selected).toEqual([]);
  });
});
