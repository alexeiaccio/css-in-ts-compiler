import { render } from "@solidjs/web";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { createRadioGroup, type RadioGroup, type RadioIntent } from "../src/radio";

interface Mounted {
  readonly api: RadioGroup<string>;
  readonly changed: string[];
  readonly focusEvents: string[];
  readonly root: HTMLElement;
  readonly checked: () => string | null;
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
  options: { readonly controlled?: boolean; readonly disabled?: ReadonlyArray<number> } = {},
): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const changed: string[] = [];
  const focusEvents: string[] = [];
  const [host, setHost] = createSignal("b");
  let api: RadioGroup<string> | undefined;

  const dispose = render(() => {
    const group = createRadioGroup<string>({
      values: ["a", "b", "c", "d"],
      ...(options.controlled === true ? { value: () => host() } : { defaultValue: "b" }),
      disabled: options.disabled ?? [],
      onValueChange: (value) => {
        changed.push(value);
        if (options.controlled === true) {
          setHost(value);
        }
      },
      onFocus: (target) => focusEvents.push(target),
    });
    api = group;
    return (
      <div {...group.radiogroupProps}>
        {["a", "b", "c", "d"].map((label, index) => (
          <button {...group.radioProps(index)} data-radio={label}>
            {label}
          </button>
        ))}
      </div>
    );
  }, root);
  mounted.push(dispose);

  if (api === undefined) {
    throw new Error("not mounted");
  }
  return {
    api,
    changed,
    focusEvents,
    root,
    checked: () =>
      root.querySelector('[data-radio][aria-checked="true"]')?.getAttribute("data-radio") ?? null,
    dispose,
  };
};

const act = (instance: Mounted, intent: RadioIntent): void => {
  instance.api.act(intent);
  flush();
};

describe("createRadioGroup, act and snapshot", () => {
  it("snapshots what the ARIA already says, as JSON", () => {
    const instance = mount({ disabled: [2] });
    flush();
    const snapshot = instance.api.snapshot();
    expect(snapshot).toEqual({
      checked: 1,
      focused: null,
      count: 4,
      disabled: [2],
      flavor: "roving",
      orientation: null,
    });
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it("moves like the arrows do: focus and the check follow the intent", () => {
    const instance = mount({ disabled: [2] });
    act(instance, { type: "next" });
    expect(instance.api.snapshot().checked).toBe(3);
    expect(instance.checked()).toBe("d");
    expect(instance.changed).toEqual(["d"]);

    act(instance, { type: "previous" });
    expect(instance.api.snapshot().checked).toBe(1);
    expect(instance.checked()).toBe("b");

    act(instance, { type: "first" });
    expect(instance.api.snapshot()).toMatchObject({ checked: 0, focused: 0 });
    act(instance, { type: "last" });
    expect(instance.api.snapshot()).toMatchObject({ checked: 3, focused: 3 });
  });

  it("focuses without checking, and checks only an index the pattern would", () => {
    const instance = mount({ disabled: [2] });
    act(instance, { type: "focus", index: 3 });
    expect(instance.api.snapshot()).toMatchObject({ checked: 1, focused: 3 });
    expect(instance.checked()).toBe("b");

    act(instance, { type: "check", index: 2 });
    expect(instance.api.snapshot().checked).toBe(1);
    act(instance, { type: "check", index: 9 });
    expect(instance.api.snapshot().checked).toBe(1);

    act(instance, { type: "check", index: 0 });
    expect(instance.api.snapshot().checked).toBe(0);
    expect(instance.changed).toEqual(["a"]);
  });

  it("asks a controlled host and waits for it, exactly like a key does", () => {
    const instance = mount({ controlled: true });
    flush();
    expect(instance.api.snapshot().checked).toBe(1);

    act(instance, { type: "check", index: 0 });
    expect(instance.changed).toEqual(["a"]);
    expect(instance.api.snapshot().checked).toBe(0);

    act(instance, { type: "next" });
    expect(instance.changed).toEqual(["a", "b"]);
    expect(instance.api.snapshot().checked).toBe(1);
  });

  it("is inert on an empty group", () => {
    const instance = mount();
    instance.api.setDisabled([0, 1, 2, 3]);
    flush();
    for (const intent of [
      { type: "next" },
      { type: "previous" },
      { type: "first" },
      { type: "last" },
      { type: "check", index: 0 },
      { type: "focus", index: 1 },
    ] satisfies ReadonlyArray<RadioIntent>) {
      instance.api.act(intent);
      flush();
    }
    expect(instance.changed).toEqual([]);
    expect(instance.api.snapshot()).toMatchObject({ checked: null, focused: null });
  });
});
