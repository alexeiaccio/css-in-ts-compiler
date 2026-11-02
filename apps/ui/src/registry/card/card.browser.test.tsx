import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Card, CardBody, CardFooter, CardHeader } from "./card.tsx";

// A card has no primitive and no APG pattern: the skin itself is the contract, so the test mounts the styled parts in a real
// Chromium and reads back what a reader gets. The composition with a page (a card in a mode, a card in a card, other
// starters inside it) is `combos.browser.test.tsx`'s; this file holds the card alone, so the copy a reader receives carries
// its own oracle.

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

const part = (root: ParentNode, name: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`card: no [data-part="${name}"] in ${root.firstElementChild?.outerHTML ?? ""}`);
  }
  return element;
};

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);

describe("Card skin", () => {
  it("renders a card and its header, body and footer as parts", () => {
    const { root } = mount(() => (
      <Card>
        <CardHeader>Monthly report</CardHeader>
        <CardBody>One step off the page, with a frame.</CardBody>
        <CardFooter>Download</CardFooter>
      </Card>
    ));

    const card = part(root, "card");
    expect(card.tagName).toBe("DIV");
    // a surface one step off the page, a frame with padding and a border, and a column of parts
    expect(style(card).display).toBe("flex");
    expect(style(card).flexDirection).toBe("column");
    expect(style(card).padding).toBe("12px");
    expect(style(card).borderRadius).toBe("16px");
    expect(style(card).borderTopWidth).toBe("1px");
    expect(style(card).backgroundColor).not.toBe("transparent");

    const header = part(root, "card-header");
    const body = part(root, "card-body");
    const footer = part(root, "card-footer");
    // the parts are the card's own elements, not a second tree: one card, three children
    expect([header, body, footer].map((element) => element.parentElement)).toEqual([
      card,
      card,
      card,
    ]);
    expect(header.textContent).toBe("Monthly report");
    expect(header.tagName).toBe("DIV");
    // the header is the row that spreads a title and an action, the body a column of text
    expect(style(header).display).toBe("flex");
    expect(style(header).justifyContent).toBe("space-between");
    expect(style(body).display).toBe("flex");
    expect(style(body).flexDirection).toBe("column");
    // the footer is the actions under a rule, right-aligned
    expect(style(footer).display).toBe("flex");
    expect(style(footer).justifyContent).toBe("flex-end");
    expect(style(footer).borderTopWidth).toBe("1px");
    expect(style(footer).borderTopStyle).toBe("solid");
    // the parts carry no role of their own: a card is resolved by its content, not announced as a widget
    for (const element of [card, header, body, footer]) {
      expect(element.getAttribute("role")).toBeNull();
    }
  });

  it("hands its inner radius to a card inside it, through the frame's context", () => {
    const { root } = mount(() => (
      <Card>
        <CardBody>
          <Card>
            <CardBody>Concentric</CardBody>
          </Card>
        </CardBody>
      </Card>
    ));

    const cards = [...root.querySelectorAll<HTMLElement>('[data-part="card"]')];
    expect(cards).toHaveLength(2);
    const [outer, inner] = cards as [HTMLElement, HTMLElement];
    // frame(): the inner radius is the parent frame's inner radius (16 - padding 12 - border 1), with no prop of its own
    expect(style(outer).borderRadius).toBe("16px");
    expect(style(inner).borderRadius).toBe("3px");
    expect(style(inner).padding).toBe("12px");
    // the inner card is nested in the outer one, so the context really travelled through the body part
    expect(outer.contains(inner)).toBe(true);
    expect(inner.parentElement).toBe(part(outer, "card-body"));
  });

  it("keeps a part's props and its state when render replaces the element", () => {
    let receivedClass: string | undefined;
    const receivedState: Array<unknown> = [];
    const { root } = mount(() => (
      <Card>
        <CardHeader>Default</CardHeader>
        <CardHeader
          render={(props, state) => {
            receivedClass = props.class;
            receivedState.push(state);
            return <header {...props}>Rendered</header>;
          }}
        >
          Rendered
        </CardHeader>
      </Card>
    ));

    const defaultHeader = part(root, "card-header");
    const rendered = root.querySelector("header");
    expect(rendered).not.toBeNull();
    // the caller's element, with the part's own props: the marker, the skin's class and the text
    expect(rendered?.getAttribute("data-part")).toBe("card-header");
    expect(rendered?.className).toBe(defaultHeader.className);
    expect(receivedClass).toBe(defaultHeader.className);
    expect(rendered?.textContent).toBe("Rendered");
    // the state is the part's, and a card part has none: render gets it as undefined rather than a dead snapshot
    expect(receivedState).toEqual([undefined]);
    // the caller's element is what renders, and the default div is gone with it
    expect(root.querySelectorAll("header")).toHaveLength(1);
    expect(root.querySelectorAll('[data-part="card-header"]')).toHaveLength(2);
  });

  it("renders the section and heading elements a caller asks for, with the part's class", () => {
    const { root } = mount(() => (
      <Card>
        <CardHeader render={(props) => <h2 {...props}>Title</h2>} />
        <CardBody
          render={(props) => (
            <section {...props} aria-label="Details">
              The contents.
            </section>
          )}
        />
      </Card>
    ));

    const heading = root.querySelector("h2");
    expect(heading).not.toBeNull();
    // the heading is the element the caller named, and it kept the part's marker and layout class
    expect(heading?.tagName).toBe("H2");
    expect(heading?.getAttribute("data-part")).toBe("card-header");
    expect(style(heading as HTMLElement).display).toBe("flex");
    expect(root.querySelectorAll("h2")).toHaveLength(1);
    expect(root.querySelector("h2")?.textContent).toBe("Title");

    const section = root.querySelector("section");
    expect(section).not.toBeNull();
    expect(section?.getAttribute("data-part")).toBe("card-body");
    // the caller's own attribute survives the part's props, and the body still lays out as a column
    expect(section?.getAttribute("aria-label")).toBe("Details");
    expect(style(section as HTMLElement).flexDirection).toBe("column");
    expect(section?.textContent).toBe("The contents.");
  });
});
