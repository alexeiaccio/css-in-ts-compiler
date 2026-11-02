import type { JSX } from "@solidjs/web";
import { createSignal, flush } from "solid-js";
import { render } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Field, FieldControl, FieldLabel, FieldMessage } from "./field.tsx";
import { Input } from "../input/input.tsx";

// @cssints/headless checks `createField` against its own contract. This file is the skin's oracle: the starter composes
// the primitive with `Input`, and what a reader meets — the label, the hint and the error, the invalid paint, the disabled
// look, and `render` replacing the control — is only observable through the DOM.

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
const token = (property: "backgroundColor" | "borderTopColor" | "color", name: string): string => {
  const probe = document.createElement("div");
  probe.style[property] = `var(${name})`;
  document.body.append(probe);
  const value = style(probe)[property];
  probe.remove();
  return value;
};

const part = <T extends Element>(root: ParentNode, name: string): T => {
  const element = root.querySelector<T>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`field: no [data-part="${name}"]`);
  }
  return element;
};

describe("Field (the kit's DOM)", () => {
  it("names the control and describes it with the hint and the error", async () => {
    const root = mount(() => (
      <Field id="email" hint="We never share it" error="Enter an address">
        <FieldLabel>Email</FieldLabel>
        <FieldControl render={(props) => <Input {...props} type="email" />} />
        <FieldMessage />
      </Field>
    ));

    expect(part(root, "field").tagName).toBe("DIV");
    const input = part<HTMLInputElement>(root, "input");
    const label = part<HTMLLabelElement>(root, "label");
    // the label is the control's name, through the id the primitive makes
    expect(input.id).toBe("email-control");
    expect(label.getAttribute("for")).toBe("email-control");
    expect(label.textContent).toBe("Email");

    // the hint and the error are the ids the control is described by, in that order
    const described = (input.getAttribute("aria-describedby") ?? "").split(" ");
    expect(described).toEqual(["email-hint", "email-error"]);
    const [hint, error] = described.map((id) => root.querySelector<HTMLElement>(`#${id}`)!);
    expect(hint?.getAttribute("data-part")).toBe("hint");
    expect(hint?.textContent).toBe("We never share it");
    expect(error?.getAttribute("data-part")).toBe("error");
    expect(error?.textContent).toBe("Enter an address");
    // a shown error is an alert; the hint never is
    expect(error?.getAttribute("role")).toBe("alert");
    expect(hint?.hasAttribute("role")).toBe(false);
    expect(hint?.checkVisibility()).toBe(true);
    expect(error?.checkVisibility()).toBe(true);

    // a control with a label of its own: a click on the label puts the focus in the input
    await userEvent.click(label);
    expect(document.activeElement).toBe(input);
  });

  it("follows the error with aria-invalid and the described-by list", () => {
    const [error, setError] = createSignal<string>();
    const root = mount(() => (
      <Field id="name" hint="As it appears on the card" error={error()}>
        <FieldLabel>Name</FieldLabel>
        <FieldControl />
        <FieldMessage />
      </Field>
    ));
    const input = part<HTMLInputElement>(root, "input");
    const resting = style(input).borderTopColor;

    // a plain field references nothing it does not show, and is not invalid
    expect(input.getAttribute("aria-describedby")).toBe("name-hint");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(part(root, "error").checkVisibility()).toBe(false);
    expect(style(input).borderTopColor).toBe(resting);

    setError("Too short");
    flush();

    // the hint stays; the error joins it and marks the control invalid, which the skin paints
    expect(input.getAttribute("aria-describedby")).toBe("name-hint name-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(part(root, "error").textContent).toBe("Too short");
    expect(part(root, "error").checkVisibility()).toBe(true);
    expect(style(input).borderTopColor).toBe(token("borderTopColor", "--color-invalid"));

    setError(undefined);
    flush();

    // the state the field announces is the only copy: clearing it clears the paint
    expect(input.getAttribute("aria-describedby")).toBe("name-hint");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(part(root, "error").checkVisibility()).toBe(false);
    expect(style(input).borderTopColor).toBe(resting);
  });

  it("keeps a disabled control's look and drops it out of the tab order", async () => {
    const root = mount(() => (
      <>
        <button data-part="before">Before</button>
        <Field id="locked">
          <FieldLabel>Locked</FieldLabel>
          <FieldControl render={(props) => <Input {...props} disabled />} />
        </Field>
        <button data-part="after">After</button>
      </>
    ));
    const input = part<HTMLInputElement>(root, "input");
    const before = part<HTMLElement>(root, "before");
    const after = part<HTMLElement>(root, "after");

    expect(input.disabled).toBe(true);
    // the disabled look is the skin's: the theme's page and disabled border, not the resting surface
    expect(style(input).backgroundColor).toBe(token("backgroundColor", "--color-page"));
    expect(style(input).borderTopColor).toBe(token("borderTopColor", "--color-border-disabled"));
    expect(style(input).cursor).toBe("not-allowed");

    // and it is not a tab stop: the focus goes from what precedes it to what follows it
    before.focus();
    expect(document.activeElement).toBe(before);
    await userEvent.tab();
    expect(document.activeElement).toBe(after);
    input.focus();
    expect(document.activeElement).not.toBe(input);
  });

  it("lets render replace the control and keeps the state live", () => {
    const [error, setError] = createSignal<string>();
    const root = mount(() => (
      <Field id="notes" error={error()}>
        <FieldLabel>Notes</FieldLabel>
        <FieldControl
          render={(props, state) => (
            <textarea
              {...props}
              data-part="control"
              data-live={state.invalid() ? "invalid" : "valid"}
            />
          )}
        />
        <FieldMessage />
      </Field>
    ));
    const control = part<HTMLTextAreaElement>(root, "control");

    // the field hands its ids and ARIA to whatever element the caller renders
    expect(control.tagName).toBe("TEXTAREA");
    expect(control.id).toBe("notes-control");
    expect(control.dataset["live"]).toBe("valid");
    expect(control.hasAttribute("aria-invalid")).toBe(false);

    setError("Too short");
    flush();

    // the state the kit reads is an accessor, so a replaced part follows without a re-render
    expect(control.dataset["live"]).toBe("invalid");
    expect(control.getAttribute("aria-invalid")).toBe("true");
    expect(control.getAttribute("aria-describedby")).toBe("notes-error");
  });
});
