import { createField } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { createSignal, flush } from "solid-js";
import { render } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Input, type InputProps } from "./input.tsx";

// @cssints/headless checks `createTextInput` against its own contract. This file is the skin's oracle: the starter is the
// control a `Field` puts in, so the field's wiring (the label, the described-by ids, the invalid state) is checked on the
// styled `<input>`, and so is the look — the theme's surface and border, the invalid border, the disabled look, and
// `render` replacing the element the part is.

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

/** Solid 2 delivers delegated events on a later turn. */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

type FieldOptions = Parameters<typeof createField>[0];

/** The control inside the field's own wiring: what `Field.Control` hands it, without the kit's Field component. */
const mountInput = (
  options: FieldOptions = {},
  props: InputProps = {},
): { readonly root: HTMLElement; readonly input: () => HTMLInputElement } => {
  const root = mount(() => {
    const field = createField(options);
    return (
      <form novalidate>
        <label {...field.labelProps}>Email</label>
        <Input {...field.controlProps} {...props} />
        <p {...field.hintProps}>Hint</p>
        <p {...field.errorProps}>Required</p>
      </form>
    );
  });
  return {
    root,
    input: () => {
      const element = root.querySelector("input");
      if (element === null) {
        throw new Error("input: not mounted");
      }
      return element;
    },
  };
};

describe("Input (the kit's DOM)", () => {
  it("is the control the field names, and carries the field's wiring", () => {
    const { root, input } = mountInput({ id: "email", hint: "Hint", required: true });
    const element = input();

    // one part, a text input, on the theme's surface
    expect(element.tagName).toBe("INPUT");
    expect(element.getAttribute("data-part")).toBe("input");
    expect(element.type).toBe("text");
    expect(style(element).backgroundColor).toBe(token("backgroundColor", "--color-surface"));
    expect(style(element).borderTopWidth).toBe("1px");
    expect(style(element).borderTopLeftRadius).not.toBe("0px");
    expect(style(element).boxSizing).toBe("border-box");

    // the field owns the name and the description, and the control follows
    const label = root.querySelector("label")!;
    expect(label.getAttribute("for")).toBe(element.id);
    expect(element.id).toBe("email-control");
    expect(element.required).toBe(true);
    expect(element.getAttribute("aria-required")).toBe("true");
    expect(element.getAttribute("aria-describedby")).toBe("email-hint");
    expect(element.hasAttribute("aria-invalid")).toBe(false);
  });

  it("announces the error and paints the invalid border", () => {
    const { root, input } = mountInput({ id: "email", hint: "Hint", error: "Required" });
    // a field that is not invalid, as the resting look
    const resting = mountInput({ id: "plain" }).input();

    const described = (input().getAttribute("aria-describedby") ?? "").split(" ");
    expect(described).toEqual(["email-hint", "email-error"]);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector('[role="alert"]')?.textContent).toBe("Required");
    // the invalid border is the theme's, not the resting one
    expect(style(input()).borderTopColor).toBe(token("borderTopColor", "--color-invalid"));
    expect(style(input()).borderTopColor).not.toBe(style(resting).borderTopColor);
  });

  it("passes the autofill and input props through", () => {
    const { input } = mountInput(
      { id: "email" },
      {
        type: "email",
        autocomplete: "email",
        inputmode: "email",
        spellcheck: "false",
        autocapitalize: "none",
        maxlength: 4,
        name: "email",
        dir: "ltr",
      },
    );

    expect(input().type).toBe("email");
    expect(input().autocomplete).toBe("email");
    expect(input().inputMode).toBe("email");
    expect(input().getAttribute("spellcheck")).toBe("false");
    expect(input().getAttribute("autocapitalize")).toBe("none");
    expect(input().maxLength).toBe(4);
    expect(input().name).toBe("email");
    expect(input().dir).toBe("ltr");
  });

  it("keeps a disabled control's look and drops it out of the tab order, and a readOnly one in it", async () => {
    const { root, input } = mountInput({ id: "email" }, { disabled: true });

    expect(input().disabled).toBe(true);
    // the disabled look is the theme's page and disabled border, not the resting surface
    expect(style(input()).backgroundColor).toBe(token("backgroundColor", "--color-page"));
    expect(style(input()).borderTopColor).toBe(token("borderTopColor", "--color-border-disabled"));
    expect(style(input()).cursor).toBe("not-allowed");

    // the browser's tab order: a disabled control is skipped, a readOnly one is a stop
    const before = document.createElement("button");
    const after = document.createElement("button");
    root.prepend(before);
    root.append(after);
    input().focus();
    expect(document.activeElement).not.toBe(input());
    before.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(after);
    const readOnly = mountInput({ id: "plain" }, { readonly: true }).input();
    readOnly.focus();
    expect(document.activeElement).toBe(readOnly);
    expect(readOnly.readOnly).toBe(true);
  });

  it("reports what the element holds, and leaves maxLength to the browser", async () => {
    const [value, setValue] = createSignal("");
    const { input } = mountInput(
      { id: "email" },
      {
        maxlength: 3,
        onInput: (event) => setValue(event.currentTarget.value),
      },
    );

    expect(input().maxLength).toBe(3);
    input().focus();
    input().value = "abc";
    input().dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(value()).toBe("abc");
    // uncontrolled: the browser keeps what the reader typed
    expect(input().value).toBe("abc");
  });

  it("lets render replace the element and keeps the part's props", () => {
    const { root } = mountInput(
      { id: "email", hint: "Hint" },
      {
        render: (props) => <input {...props} data-part="email" />,
      },
    );

    expect(root.querySelector('[data-part="input"]')).toBeNull();
    const replaced = root.querySelector<HTMLInputElement>('[data-part="email"]')!;
    // the caller replaces the element, not the props the part owns
    expect(replaced.id).toBe("email-control");
    expect(replaced.getAttribute("aria-describedby")).toBe("email-hint");
    expect(replaced.type).toBe("text");
  });

  it("paints the focus ring on the control, not on a wrapper", () => {
    const { input } = mountInput({ id: "email" });
    input().focus();
    // the ring is the skin's focus-visible rule on the control itself
    expect(style(input()).outlineWidth).toBe("2px");
    expect(style(input()).outlineStyle).toBe("solid");
  });
});
