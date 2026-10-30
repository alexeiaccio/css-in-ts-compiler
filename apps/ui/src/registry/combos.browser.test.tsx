// The composition contracts of the kit, in a real Chromium: `render` on a part, a state accessor that stays live, the mode a
// card sits in, the radius it hands to a card inside it, the size an ancestor sets, and a field that owns its control's
// ARIA — the things a component cannot prove alone, which is why they are one test. The views live in combos.fixture.tsx: a
// module with cssints sites is evaluated at build time, and this file has to run in the browser.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";

import {
  Dialogs,
  Fields,
  Groups,
  Mode,
  Nesting,
  Renders,
  Sizes,
  Toolbars,
} from "./combos.fixture.tsx";

const mount = (view: () => JSX.Element): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  render(view, root);
  flush();
  return root;
};

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const part = (root: HTMLElement, name: string): HTMLElement => {
  const found = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (found === null) {
    throw new Error(`no [data-part="${name}"] in ${root.innerHTML}`);
  }
  return found;
};

describe("the kit composes", () => {
  it("hands a card's radius to a card inside it, through a wrapper", () => {
    const root = mount(() => <Nesting />);
    const cards = root.querySelectorAll<HTMLElement>('[data-part="card"]');
    expect(style(cards[0]!).borderRadius).toBe("16px");
    // frame(): the inner radius is the parent's inner radius (16 - padding 12 - border 1) less its own margin (none)
    expect(style(cards[1]!).borderRadius).toBe("3px");
    expect(style(cards[1]!).padding).toBe("12px");
  });

  it("follows the mode the card sits in, without a prop", () => {
    const root = mount(() => <Mode />);
    const cards = root.querySelectorAll<HTMLElement>('[data-part="card"]');
    expect(style(cards[0]!).backgroundColor).not.toBe(style(cards[1]!).backgroundColor);
    expect(style(cards[0]!).color).not.toBe(style(cards[1]!).color);
  });

  it("takes its size from the container and its tone from a variant", () => {
    const root = mount(() => <Sizes />);
    const buttons = root.querySelectorAll<HTMLElement>('[data-part="button"]');
    expect(style(buttons[0]!).paddingTop).toBe("8px");
    expect(style(buttons[0]!).paddingLeft).toBe("16px");
    expect(style(buttons[1]!).paddingTop).toBe("4px");
    expect(style(buttons[1]!).paddingLeft).toBe("8px");
    expect(style(buttons[1]!).fontSize).toBe("12px");
    expect(style(buttons[2]!).backgroundColor).not.toBe(style(buttons[0]!).backgroundColor);
  });

  it("sizes the controls a toolbar holds, through the context and not a prop", () => {
    const root = mount(() => <Toolbars />);
    const buttons = root.querySelectorAll<HTMLElement>('[data-part="button"]');
    expect(style(buttons[0]!).paddingTop).toBe("8px");
    expect(style(buttons[1]!).paddingTop).toBe("4px");
    expect(style(buttons[1]!).paddingLeft).toBe("8px");
  });

  it("collapses the corners and the borders two buttons in a group share", () => {
    const root = mount(() => <Groups />);
    expect(part(root, "button-group").getAttribute("role")).toBe("group");
    expect(part(root, "button-group").getAttribute("aria-label")).toBe("Text alignment");
    const buttons = root.querySelectorAll<HTMLElement>('[data-part="button"]');
    // a row: the first keeps its left corners, the middle is square, the last keeps its right ones
    expect(style(buttons[0]!).borderStartStartRadius).toBe("8px");
    expect(style(buttons[1]!).borderStartStartRadius).toBe("0px");
    expect(style(buttons[1]!).borderStartEndRadius).toBe("0px");
    expect(style(buttons[2]!).borderStartEndRadius).toBe("8px");
    // every button after the first slides 1px into its neighbour: the two 1px borders between them are one line
    const first = buttons[0]!.getBoundingClientRect();
    const second = buttons[1]!.getBoundingClientRect();
    const third = buttons[2]!.getBoundingClientRect();
    expect(Math.round(second.left)).toBe(Math.round(first.right) - 1);
    expect(Math.round(third.left)).toBe(Math.round(second.right) - 1);
    // a column squares the top and the bottom instead, and a compact group sizes what it holds
    expect(style(buttons[3]!).borderStartStartRadius).toBe("8px");
    expect(style(buttons[3]!).borderEndStartRadius).toBe("0px");
    expect(style(buttons[4]!).borderEndEndRadius).toBe("8px");
    expect(style(buttons[4]!).paddingTop).toBe("4px");
  });

  it("puts a modal above the page, names it, keeps focus and gives it back", () => {
    const root = mount(() => <Dialogs />);
    const trigger = root.querySelector<HTMLElement>('[aria-haspopup="dialog"]')!;
    expect(root.querySelector('[data-part="dialog"]')).toBeNull();
    // a real pointer click focuses the button first; `click()` does not, and the dialog gives focus back to what had it
    trigger.focus();
    trigger.click();
    flush();
    const panel = root.querySelector<HTMLElement>('[data-part="dialog"]')!;
    const backdrop = root.querySelector<HTMLElement>('[data-part="dialog-backdrop"]')!;
    // the panel is the dialog: a role and a name from the prop, the description it renders, and the modal state
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-label")).toBe("Rename file");
    expect(panel.getAttribute("aria-modal")).toBe("true");
    const described = panel.getAttribute("aria-describedby")!;
    expect(document.getElementById(described)?.getAttribute("data-part")).toBe(
      "dialog-description",
    );
    // above the page, behind a wash, and the page does not scroll under it
    expect(style(root.querySelector<HTMLElement>('[data-part="dialog-layer"]')!).zIndex).toBe("20");
    expect(style(panel).position).toBe("relative");
    expect(style(backdrop).position).toBe("absolute");
    expect(style(backdrop).backgroundColor).not.toBe(style(panel).backgroundColor);
    expect(document.body.style.overflow).toBe("hidden");
    // focus went into the panel: a screen reader's reader starts where the message is
    expect(document.activeElement).toBe(panel);
    panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    flush();
    expect(root.querySelector('[data-part="dialog"]')).toBeNull();
    expect(root.querySelector('[data-part="dialog-backdrop"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    // and the backdrop is a way out too
    trigger.click();
    flush();
    root.querySelector<HTMLElement>('[data-part="dialog-backdrop"]')!.click();
    flush();
    expect(root.querySelector('[data-part="dialog"]')).toBeNull();
  });

  it("lets render replace a part and keeps the props and the state live", () => {
    const root = mount(() => <Renders />);
    // the button's own props carry role="button": the caller replaces the element, not the semantics the widget owns
    const link = root.querySelector("a")!;
    expect(link.getAttribute("aria-pressed")).toBe("true");
    expect(link.getAttribute("data-part")).toBe("button");
    const live = root.querySelector<HTMLElement>("[data-live]")!;
    expect(live.getAttribute("data-live")).toBe("pressed");
    live.click();
    flush();
    expect(live.getAttribute("aria-pressed")).toBe("false");
    expect(live.getAttribute("data-live")).toBe("idle");
    expect(root.querySelector("header")?.getAttribute("data-part")).toBe("card-header");
  });

  it("gives the control its own id, its described-by ids and the invalid state", () => {
    const root = mount(() => <Fields />);
    const input = root.querySelector<HTMLInputElement>('[id="email-control"]')!;
    expect(input.id).toBe("email-control");
    expect(root.querySelector<HTMLLabelElement>('label[for="email-control"]')?.id).toBe(
      "email-label",
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("email-hint email-error");
    expect(part(root, "hint").textContent).toBe("We never share it");
    expect(part(root, "error").getAttribute("role")).toBe("alert");
    // the invalid border is the theme's, and not the resting one the second field's input has
    const resting = root.querySelector<HTMLInputElement>('[id="plain-control"]')!;
    expect(style(input).borderTopColor).not.toBe(style(resting).borderTopColor);
    // a control that is not an Input: the field hands its ids and ARIA to the caller's element
    const pick = root.querySelector<HTMLElement>('[id="pick-control"]')!;
    expect(pick.getAttribute("data-part")).toBe("textarea");
    expect(pick.getAttribute("aria-invalid")).toBe("true");
  });
});
