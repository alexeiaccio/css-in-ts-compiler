import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Button } from "../button/button.tsx";
import { ButtonGroup } from "./button-group.tsx";

// A button group has no primitive and no APG pattern: it is a context, and the corners and the border two neighbours share
// are the skin's contract. This file mounts the group with the kit's buttons in a real Chromium and reads the computed
// result back; `combos.browser.test.tsx` checks the same rule among the other starters, and a copy carries this file alone.

interface Mounted {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

const live: Mounted[] = [];

const mount = (view: () => JSX.Element): Mounted => {
  const root = document.createElement("div");
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

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const part = (root: ParentNode, name: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`button-group: no [data-part="${name}"]`);
  }
  return element;
};
const buttonsIn = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="button"]'),
];

// The four corners in logical order, so a row and a column read the same way.
const CORNERS = [
  "borderStartStartRadius",
  "borderStartEndRadius",
  "borderEndStartRadius",
  "borderEndEndRadius",
] as const;

const corners = (element: HTMLElement): string[] => CORNERS.map((corner) => style(element)[corner]);

describe("ButtonGroup skin", () => {
  it("is a named group of buttons in one row", () => {
    const { root } = mount(() => (
      <ButtonGroup label="Text alignment">
        <Button>Left</Button>
        <Button>Center</Button>
        <Button>Right</Button>
      </ButtonGroup>
    ));

    const group = part(root, "button-group");
    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-label")).toBe("Text alignment");
    expect(group.getAttribute("data-orientation")).toBe("horizontal");
    expect(group.getAttribute("data-size")).toBe("md");
    expect(style(group).display).toBe("inline-flex");
    expect(style(group).flexDirection).toBe("row");
    // max-content: the row is as wide as its buttons, not the page
    expect(group.getBoundingClientRect().width).toBeLessThan(root.getBoundingClientRect().width);
    // the group draws nothing: the buttons keep their own surface and border
    expect(style(group).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style(group).borderTopWidth).toBe("0px");
    // the group's role is its own and is not copied onto the buttons it holds
    expect(root.querySelectorAll('[role="group"]')).toHaveLength(1);
    expect(buttonsIn(root)).toHaveLength(3);
  });

  it("collapses the corners and the border two neighbours share in a row", () => {
    const { root } = mount(() => (
      <ButtonGroup label="Text alignment">
        <Button>Left</Button>
        <Button>Center</Button>
        <Button>Right</Button>
      </ButtonGroup>
    ));

    const [first, middle, last] = buttonsIn(root) as [HTMLElement, HTMLElement, HTMLElement];
    // the first keeps the corners on the outer (start) side of the row, the last the outer (end) side
    expect(style(first).borderStartStartRadius).toBe("8px");
    expect(style(first).borderEndStartRadius).toBe("8px");
    expect(style(first).borderStartEndRadius).toBe("0px");
    expect(style(first).borderEndEndRadius).toBe("0px");
    expect(style(last).borderStartStartRadius).toBe("0px");
    expect(style(last).borderEndStartRadius).toBe("0px");
    expect(style(last).borderStartEndRadius).toBe("8px");
    expect(style(last).borderEndEndRadius).toBe("8px");
    // the child that touches both neighbours squares every corner
    expect(corners(middle)).toEqual(["0px", "0px", "0px", "0px"]);
    // and it slides 1px into the previous one, so their two 1px borders are a single line
    expect(style(middle).marginInlineStart).toBe("-1px");
    const firstBox = first.getBoundingClientRect();
    const middleBox = middle.getBoundingClientRect();
    const lastBox = last.getBoundingClientRect();
    expect(Math.round(middleBox.left)).toBe(Math.round(firstBox.right) - 1);
    expect(Math.round(lastBox.left)).toBe(Math.round(middleBox.right) - 1);
  });

  it("squares the shared corners top to bottom in a column", () => {
    const { root } = mount(() => (
      <ButtonGroup label="Share" orientation="vertical">
        <Button>Copy</Button>
        <Button>Move</Button>
        <Button>Delete</Button>
      </ButtonGroup>
    ));

    const group = part(root, "button-group");
    expect(group.getAttribute("data-orientation")).toBe("vertical");
    expect(style(group).flexDirection).toBe("column");
    const [first, middle, last] = buttonsIn(root) as [HTMLElement, HTMLElement, HTMLElement];
    // the corners on the outer top and bottom stay round; the ones two neighbours share are square
    expect(style(first).borderStartStartRadius).toBe("8px");
    expect(style(first).borderStartEndRadius).toBe("8px");
    expect(style(first).borderEndStartRadius).toBe("0px");
    expect(style(first).borderEndEndRadius).toBe("0px");
    expect(corners(middle)).toEqual(["0px", "0px", "0px", "0px"]);
    expect(style(last).borderStartStartRadius).toBe("0px");
    expect(style(last).borderStartEndRadius).toBe("0px");
    expect(style(last).borderEndStartRadius).toBe("8px");
    expect(style(last).borderEndEndRadius).toBe("8px");
    // the same 1px collapse, along the block axis this time
    expect(style(middle).marginBlockStart).toBe("-1px");
    const firstBox = first.getBoundingClientRect();
    const middleBox = middle.getBoundingClientRect();
    expect(Math.round(middleBox.top)).toBe(Math.round(firstBox.bottom) - 1);
  });

  it("keeps the group's classes on a child that render replaces with another element", () => {
    const { root } = mount(() => (
      <ButtonGroup label="Text alignment">
        <Button>Left</Button>
        <Button render={(props) => <a {...props} href="#center" />}>Center</Button>
        <Button>Right</Button>
      </ButtonGroup>
    ));

    const [first, middle, last] = buttonsIn(root) as [HTMLElement, HTMLElement, HTMLElement];
    expect(middle.tagName).toBe("A");
    // the primitive's props travel with the element: the marker, the role and the tab stop
    expect(middle.getAttribute("data-part")).toBe("button");
    expect(middle.getAttribute("role")).toBe("button");
    expect(middle.getAttribute("tabindex")).toBe("0");
    expect(middle.getAttribute("href")).toBe("#center");
    // the group is the context, not a prop: the replaced child is squared and pulled over its neighbour like the others
    expect(corners(middle)).toEqual(["0px", "0px", "0px", "0px"]);
    expect(style(middle).marginInlineStart).toBe("-1px");
    const firstBox = first.getBoundingClientRect();
    const middleBox = middle.getBoundingClientRect();
    const lastBox = last.getBoundingClientRect();
    expect(Math.round(middleBox.left)).toBe(Math.round(firstBox.right) - 1);
    expect(Math.round(lastBox.left)).toBe(Math.round(middleBox.right) - 1);
  });

  it("does not invent a role for a group whose element is the caller's", () => {
    const { root } = mount(() => (
      <>
        <ButtonGroup label="Default">
          <Button>Left</Button>
        </ButtonGroup>
        <ButtonGroup label="Rendered" render={(props) => <nav {...props} />} />
      </>
    ));

    const fallbackGroup = part(root, "button-group");
    const rendered = root.querySelector("nav");
    expect(rendered).not.toBeNull();
    // render keeps what the group owns: its marker, its name and its classes, the same skin as the default group
    expect(rendered?.getAttribute("data-part")).toBe("button-group");
    expect(rendered?.getAttribute("aria-label")).toBe("Rendered");
    expect(rendered?.className).toBe(fallbackGroup.className);
    expect(rendered?.className).not.toBe("");
    // the role belongs to the group's own div: an element the caller supplies gets no role the group did not declare
    expect(fallbackGroup.getAttribute("role")).toBe("group");
    expect(rendered?.getAttribute("role")).toBeNull();
  });
});
