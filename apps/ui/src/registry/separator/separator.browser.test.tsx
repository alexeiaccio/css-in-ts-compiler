import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Separator } from "./separator.tsx";

// A separator has no primitive and no APG pattern, so the skin is the whole contract: the role, the orientation it announces
// and one pixel of the border colour. A real Chromium reads both the ARIA and the box back; the decorative variant is the
// interesting one, since `role="none"` is what a copy must keep.

interface Mounted {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

const live: Mounted[] = [];

const mount = (view: () => JSX.Element): Mounted => {
  const root = document.createElement("div");
  // a width to divide, so a horizontal rule has something to be 100% of
  root.style.width = "320px";
  document.body.append(root);
  const dispose = render(view, root);
  flush();
  const mounted = {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
  live.push(mounted);
  return mounted;
};

afterEach(() => {
  for (const mounted of live.splice(0)) {
    mounted.dispose();
  }
});

const part = (root: ParentNode): HTMLElement => {
  const element = root.querySelector<HTMLElement>('[data-part="separator"]');
  if (element === null) {
    throw new Error('separator: no [data-part="separator"]');
  }
  return element;
};

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);

describe("Separator skin", () => {
  it("is a horizontal separator by default and says so", () => {
    const { root } = mount(() => <Separator />);
    const rule = part(root);

    expect(rule.tagName).toBe("DIV");
    expect(rule.getAttribute("role")).toBe("separator");
    expect(rule.getAttribute("aria-orientation")).toBe("horizontal");
    expect(rule.getAttribute("data-orientation")).toBe("horizontal");
    // a horizontal rule is one pixel tall and as wide as what it divides
    expect(style(rule).height).toBe("1px");
    expect(style(rule).width).toBe("320px");
    expect(style(rule).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style(rule).flexShrink).toBe("0");
    // it is not a control: no tab stop and no name of its own
    expect(rule.getAttribute("tabindex")).toBeNull();
    expect(rule.textContent).toBe("");
  });

  it("turns the announcement and the box with the orientation prop", () => {
    const { root } = mount(() => (
      <div style={{ display: "flex", height: "80px" }}>
        <Separator orientation="vertical" />
      </div>
    ));
    const rule = part(root);

    expect(rule.getAttribute("role")).toBe("separator");
    expect(rule.getAttribute("aria-orientation")).toBe("vertical");
    expect(rule.getAttribute("data-orientation")).toBe("vertical");
    // a vertical rule is one pixel wide and stretches with the row it divides
    expect(style(rule).width).toBe("1px");
    expect(style(rule).alignSelf).toBe("stretch");
    expect(style(rule).height).toBe("80px");
  });

  it("draws a decorative rule as role none, with no orientation announced", () => {
    const { root } = mount(() => <Separator decorative />);
    const rule = part(root);

    // the line is still drawn; only the semantics are gone
    expect(rule.tagName).toBe("DIV");
    expect(rule.getAttribute("role")).toBe("none");
    expect(rule.getAttribute("aria-orientation")).toBeNull();
    // the skin does not add `aria-hidden`: a rule with no role is already out of the accessibility tree
    expect(rule.getAttribute("aria-hidden")).toBeNull();
    expect(rule.getAttribute("data-orientation")).toBe("horizontal");
    expect(style(rule).height).toBe("1px");
    expect(style(rule).width).toBe("320px");
    expect(style(rule).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  it("keeps the role and the orientation when render replaces the element", () => {
    const { root } = mount(() => (
      <>
        <Separator render={(props) => <hr {...props} />} />
        <Separator orientation="vertical" render={(props) => <span {...props} />} />
        <Separator decorative render={(props) => <hr {...props} />} />
      </>
    ));

    const [horizontal, vertical, decorative] = [
      ...root.querySelectorAll<HTMLElement>('[data-part="separator"]'),
    ] as [HTMLElement, HTMLElement, HTMLElement];
    // the caller's element, with the part's own ARIA: render replaces the tag, not what the widget announces
    expect(horizontal.tagName).toBe("HR");
    expect(horizontal.getAttribute("role")).toBe("separator");
    expect(horizontal.getAttribute("aria-orientation")).toBe("horizontal");
    expect(vertical.tagName).toBe("SPAN");
    expect(vertical.getAttribute("role")).toBe("separator");
    expect(vertical.getAttribute("aria-orientation")).toBe("vertical");
    expect(style(vertical).width).toBe("1px");
    // a decorative rule stays out of the tree in the caller's element too
    expect(decorative.tagName).toBe("HR");
    expect(decorative.getAttribute("role")).toBe("none");
    expect(decorative.getAttribute("aria-orientation")).toBeNull();
  });
});
