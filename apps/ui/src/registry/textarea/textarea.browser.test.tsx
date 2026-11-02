import { createField } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { render } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Textarea, type TextareaProps } from "./textarea.tsx";

// @cssints/headless checks `createTextArea` against its own contract. This file is the skin's oracle: the textarea is the
// control a `Field` puts in with `render`, so the field's wiring is checked on the styled element and compared with the
// wired `<input>` (the same wiring, the same ARIA), and so is the look — the surface, the resize handle, the invalid
// border, the disabled look, and `render` replacing the element.

const live: Array<() => void> = [];

const mount = (view: () => JSX.Element): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(view, root);
  live.push(() => {
    dispose();
    root.remove();
  });
  flush();
  return root;
};

afterEach(() => {
  for (const dispose of live.splice(0)) {
    dispose();
  }
});

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const token = (property: "backgroundColor" | "borderTopColor", name: string): string => {
  const probe = document.createElement("div");
  probe.style[property] = `var(${name})`;
  document.body.append(probe);
  const value = style(probe)[property];
  probe.remove();
  return value;
};

type FieldOptions = Parameters<typeof createField>[0];

/** The control inside the field's own wiring: what `Field.Control` hands it, without the kit's Field component. */
const mountTextarea = (
  options: FieldOptions = {},
  props: TextareaProps = {},
): { readonly root: HTMLElement; readonly textarea: () => HTMLTextAreaElement } => {
  const root = mount(() => {
    const field = createField(options);
    return (
      <form novalidate>
        <label {...field.labelProps}>Message</label>
        <Textarea {...field.controlProps} {...props} />
        <p {...field.hintProps}>Markdown</p>
        <p {...field.errorProps}>Too long</p>
      </form>
    );
  });
  return {
    root,
    textarea: () => {
      const element = root.querySelector("textarea");
      if (element === null) {
        throw new Error("textarea: not mounted");
      }
      return element;
    },
  };
};

describe("Textarea (the kit's DOM)", () => {
  it("is the control the field names, and carries the field's wiring", () => {
    const { root, textarea } = mountTextarea({ id: "notes", hint: "Markdown", required: true });
    const element = textarea();

    expect(element.tagName).toBe("TEXTAREA");
    expect(element.getAttribute("data-part")).toBe("textarea");
    expect(element.id).toBe("notes-control");
    expect(root.querySelector("label")?.getAttribute("for")).toBe("notes-control");
    expect(element.required).toBe(true);
    expect(element.getAttribute("aria-required")).toBe("true");
    expect(element.getAttribute("aria-describedby")).toBe("notes-hint");
    expect(element.hasAttribute("aria-invalid")).toBe(false);

    // it is a textarea, not a one-line control: a floor on the height and a resize handle
    expect(style(element).resize).toBe("vertical");
    expect(style(element).backgroundColor).toBe(token("backgroundColor", "--color-surface"));
    expect(style(element).borderTopWidth).toBe("1px");
    expect(parseFloat(style(element).minHeight)).toBeGreaterThan(0);
  });

  it("wires the textarea exactly as it wires an input", () => {
    const root = mount(() => {
      const input = createField({
        id: "summary",
        hint: "Markdown",
        error: "Too long",
        required: true,
      });
      const area = createField({
        id: "notes",
        hint: "Markdown",
        error: "Too long",
        required: true,
      });
      return (
        <form novalidate>
          <label {...input.labelProps}>Summary</label>
          <input {...input.controlProps} />
          <label {...area.labelProps}>Notes</label>
          <Textarea {...area.controlProps} />
        </form>
      );
    });
    const control = root.querySelector("input")!;
    const area = root.querySelector("textarea")!;

    // the same contract, whatever the element: the field's id, its described-by ids and its invalid state
    const wiring = (element: HTMLElement, base: string): Record<string, string | null> => ({
      id: element.id.replace(base, "f"),
      label: (element.previousElementSibling?.getAttribute("for") ?? "").replace(base, "f"),
      described: (element.getAttribute("aria-describedby") ?? "").replaceAll(base, "f"),
      invalid: element.getAttribute("aria-invalid"),
      required: element.getAttribute("aria-required"),
    });
    expect(wiring(area, "notes")).toEqual(wiring(control, "summary"));
    expect(area.getAttribute("aria-invalid")).toBe("true");
    expect(area.getAttribute("aria-describedby")).toBe("notes-hint notes-error");
  });

  it("paints the invalid border for the error the field announces", () => {
    const { textarea } = mountTextarea({ id: "notes", error: "Too long" });
    const resting = mountTextarea({ id: "summary" }).textarea();

    expect(textarea().getAttribute("aria-invalid")).toBe("true");
    expect(style(textarea()).borderTopColor).toBe(token("borderTopColor", "--color-invalid"));
    expect(style(textarea()).borderTopColor).not.toBe(style(resting).borderTopColor);
  });

  it("takes rows, wrap and the props a textarea has of its own", () => {
    const { textarea } = mountTextarea(
      { id: "notes" },
      { rows: 5, wrap: "hard", placeholder: "Write a note" },
    );

    expect(textarea().rows).toBe(5);
    expect(textarea().getAttribute("wrap")).toBe("hard");
    expect(textarea().placeholder).toBe("Write a note");
    // the skin's resize handle, not an inline style the element carries
    expect(textarea().style.resize).toBe("");
    expect(style(textarea()).resize).toBe("vertical");
  });

  it("keeps a disabled control's look and drops it out of the tab order", async () => {
    const { root, textarea } = mountTextarea({ id: "notes" }, { disabled: true });

    expect(textarea().disabled).toBe(true);
    expect(style(textarea()).backgroundColor).toBe(token("backgroundColor", "--color-page"));
    expect(style(textarea()).borderTopColor).toBe(
      token("borderTopColor", "--color-border-disabled"),
    );
    expect(style(textarea()).cursor).toBe("not-allowed");

    const before = document.createElement("button");
    const after = document.createElement("button");
    root.prepend(before);
    root.append(after);
    textarea().focus();
    expect(document.activeElement).not.toBe(textarea());
    before.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(after);
  });

  it("lets render replace the element and keeps the part's props", () => {
    const { root } = mountTextarea(
      { id: "notes", hint: "Markdown" },
      {
        render: (props) => <textarea {...props} data-part="notes" />,
      },
    );

    expect(root.querySelector('[data-part="textarea"]')).toBeNull();
    const replaced = root.querySelector<HTMLTextAreaElement>('[data-part="notes"]')!;
    expect(replaced.id).toBe("notes-control");
    expect(replaced.getAttribute("aria-describedby")).toBe("notes-hint");
    expect(replaced.tagName).toBe("TEXTAREA");
  });

  it("reports what the element holds", async () => {
    let seen = "";
    const { textarea } = mountTextarea(
      { id: "notes" },
      {
        onInput: (event) => {
          seen = event.currentTarget.value;
        },
      },
    );

    textarea().focus();
    textarea().value = "one\ntwo";
    textarea().dispatchEvent(new Event("input", { bubbles: true }));
    // Solid 2 delivers delegated events on a later turn
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(seen).toBe("one\ntwo");
    expect(textarea().value).toBe("one\ntwo");
  });
});
