// The composition contracts of the kit, in a real Chromium: `render` on a part, a state accessor that stays live, the mode a
// card sits in, the radius it hands to a card inside it, the size an ancestor sets, and a field that owns its control's
// ARIA — the things a component cannot prove alone, which is why they are one test. The views live in combos.fixture.tsx: a
// module with cssints sites is evaluated at build time, and this file has to run in the browser.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import { Fields, Mode, Nesting, Renders, Sizes } from "./combos.fixture.tsx";

// The sheet is loaded once every view is transformed: its content is the CSS of the modules transformed so far, and a static
// import could be resolved before the components (vitest transforms the graph as it goes).
beforeAll(async () => {
  await import("./sheet.ts");
});

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
