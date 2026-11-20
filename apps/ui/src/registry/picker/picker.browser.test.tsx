// The picker is the browser's own select with rich options, so what is worth checking is what the platform does with it:
// the options still read as a sentence when the rich layout is not drawn, the grid is what makes a comparison a glance, and
// the value and the closed control are the select's.
import { render } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Picker, type PickerOption } from "./picker.tsx";

const OPTIONS: ReadonlyArray<PickerOption> = [
  { value: "same-day", label: "Same-day courier", detail: "Today by 9 pm", note: "$14.00" },
  { value: "express", label: "Express", detail: "Tomorrow", note: "$8.50" },
  { value: "pickup", label: "Pickup point", detail: "2–3 days", note: "Free", disabled: true },
];

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const dispose of mounted.splice(0)) {
    dispose();
  }
});

const mount = (
  props: { readonly value?: string; readonly onValueChange?: (v: string) => void } = {},
) => {
  const host = document.createElement("div");
  document.body.append(host);
  const dispose = render(
    () => (
      <Picker
        label="Delivery"
        name="delivery"
        options={OPTIONS}
        columns="1fr 7rem 4.5rem"
        {...props}
      />
    ),
    host,
  );
  mounted.push(() => {
    dispose();
    host.remove();
  });
  return host;
};

const part = <T extends Element>(host: ParentNode, selector: string): T => {
  const element = host.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`picker: no ${selector}`);
  }
  return element;
};

/** Whether this browser draws a customizable select at all (Chrome 135 and Safari 27 do; Firefox does not yet). */
const rich = (): boolean =>
  CSS.supports("appearance", "base-select") && CSS.supports("selector(::picker(select))");

describe("Picker", () => {
  it("is a labelled select with a button and one option per value", () => {
    const host = mount();
    const field = part<HTMLElement>(host, '[data-part="picker"]');
    const label = part<HTMLLabelElement>(field, "label");
    const select = part<HTMLSelectElement>(field, "select");

    expect(label.textContent).toBe("Delivery");
    expect(label.getAttribute("for")).toBe(select.id);
    expect(select.name).toBe("delivery");
    // the platform's control, with the browser's own button and mirror inside it
    expect(select.querySelector("button")).not.toBeNull();
    expect(select.querySelector("selectedcontent")).not.toBeNull();
    expect([...select.options].map((option) => option.value)).toEqual([
      "same-day",
      "express",
      "pickup",
    ]);
    expect(select.options[2]?.disabled).toBe(true);
  });

  it("keeps every option readable as a sentence, which is the whole of the plain control", () => {
    const host = mount();
    const select = part<HTMLSelectElement>(host, "select");
    const text = select.options[0]?.textContent?.replace(/\s+/g, " ").trim();
    // the name, the fact and the note survive as text — the rich layout is an addition, not the content
    expect(text).toContain("Same-day courier");
    expect(text).toContain("Today by 9 pm");
    expect(text).toContain("$14.00");
  });

  it("draws the rich layout where the browser has it: base-select and the option grid", () => {
    if (!rich()) {
      return;
    }
    const host = mount();
    const select = part<HTMLSelectElement>(host, "select");
    expect(getComputedStyle(select).appearance).toBe("base-select");

    const option = part<HTMLOptionElement>(host, "option");
    const grid = getComputedStyle(option);
    expect(grid.display).toBe("grid");
    // three columns: the name takes what is left, then the detail and the note
    expect(grid.gridTemplateColumns.split(" ").length).toBe(3);
  });

  it("reports the value the browser committed, and the mirror follows it", async () => {
    const seen: string[] = [];
    const host = mount({ onValueChange: (value) => seen.push(value) });
    const select = part<HTMLSelectElement>(host, "select");

    select.value = "express";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(seen).toEqual(["express"]);
    expect(select.value).toBe("express");

    if (rich()) {
      // the closed control shows the chosen row, which is what `selectedcontent` is for — on the frame after the commit
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const button = part<HTMLElement>(host, "select button");
      expect(button.textContent).toContain("Express");
      expect(button.textContent).toContain("Tomorrow");
    }
  });

  it("takes a controlled value from the host", () => {
    const host = mount({ value: "pickup" });
    expect(part<HTMLSelectElement>(host, "select").value).toBe("pickup");
  });
});
