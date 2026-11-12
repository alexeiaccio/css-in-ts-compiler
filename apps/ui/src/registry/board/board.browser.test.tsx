// The board's conformance: the plane is a named figure, the cards are the data (a token states the parts that use it, a part
// the tokens it uses), the current card dims what it does not reach, and the keyboard does what the pointer does — move a
// card with the arrows, pan and zoom the plane, drop the selection with Escape. The lines are decoration: every test here
// reads the DOM, and none of them needs a pointer to learn a relationship.
import type { JSX } from "@solidjs/web";
import { shapePath } from "@cssints/css-grammar/shape";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";

import { connectorBetween } from "../route.ts";
import { Board, type BoardEdge, type BoardNode } from "./board.tsx";

const mount = (element: () => JSX.Element) => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(element, root);
  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const NODES: ReadonlyArray<BoardNode> = [
  {
    id: "accent",
    kind: "token",
    x: 20,
    y: 20,
    width: 160,
    height: 90,
    title: "color.highlight",
    detail: "accent",
    swatch: "var(--color-highlight)",
  },
  {
    id: "radius",
    kind: "token",
    x: 20,
    y: 130,
    width: 160,
    height: 90,
    title: "radius.sm",
    detail: "6px",
  },
  { id: "button", kind: "part", x: 240, y: 20, width: 220, height: 150, title: "Button" },
  { id: "badge", kind: "part", x: 240, y: 190, width: 220, height: 120, title: "Badge" },
];

const EDGES: ReadonlyArray<BoardEdge> = [
  { from: "button", to: "accent" },
  { from: "button", to: "radius" },
  { from: "badge", to: "accent" },
];

const cards = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="board-card"]'),
];

const card = (root: HTMLElement, id: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-node="${id}"]`)!;

const head = (root: HTMLElement, id: string): HTMLButtonElement =>
  card(root, id).querySelector<HTMLButtonElement>('[data-part="board-head"]')!;

const viewport = (root: HTMLElement): HTMLElement =>
  root.querySelector<HTMLElement>('[data-part="board-viewport"]')!;

const plane = (root: HTMLElement): HTMLElement =>
  root.querySelector<HTMLElement>('[data-part="board-plane"]')!;

const key = (element: HTMLElement, init: KeyboardEventInit): void => {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
};

const pointer = (type: string, init: PointerEventInit): PointerEvent =>
  new PointerEvent(type, { bubbles: true, button: 0, ...init });

/** Solid 2 applies setters on the next flush, and the card's left/top follow it: two frames settle both. */
const settle = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const board = () => <Board label="Design system" nodes={NODES} edges={EDGES} />;

/** A button of the board by its text: the settings bar's own controls. */
const control = (root: HTMLElement, label: string): HTMLButtonElement => {
  const found = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
    (element) => element.textContent?.trim() === label,
  );
  if (found === undefined) {
    throw new Error(`board: no button "${label}"`);
  }
  return found;
};

describe("Board", () => {
  it("is a named figure whose cards are the data, in reading order", () => {
    const { root, dispose } = mount(board);
    expect(root.querySelector("figcaption")?.textContent).toContain("Design system");
    expect(cards(root).map((item) => item.getAttribute("data-node"))).toEqual([
      "accent",
      "radius",
      "button",
      "badge",
    ]);
    // the plane is the primitive's group, named by the board and described as a board rather than an image
    expect(viewport(root).getAttribute("role")).toBe("group");
    expect(viewport(root).getAttribute("aria-label")).toBe("Design system");
    expect(viewport(root).getAttribute("aria-roledescription")).toBe("board");
    dispose();
  });

  it("states every relationship as text, so the lines only repeat what the cards say", () => {
    const { root, dispose } = mount(board);
    expect(card(root, "button").textContent).toContain("Uses color.highlight, radius.sm");
    expect(card(root, "badge").textContent).toContain("Uses color.highlight");
    expect(card(root, "accent").textContent).toContain("Used by Button, Badge");
    expect(card(root, "radius").textContent).toContain("Used by Button");
    // the drawing is decoration over that text
    expect(root.querySelector('[data-part="board-edges"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(root.querySelectorAll('[data-part="board-edge"]')).toHaveLength(EDGES.length);
    dispose();
  });

  it("makes a card current, dims what it does not reach, and drops it with Escape", async () => {
    const { root, dispose } = mount(board);
    head(root, "accent").click();
    await settle();
    expect(head(root, "accent").getAttribute("aria-current")).toBe("true");
    // the parts that use the token stay in, the token that does not is dimmed
    expect(card(root, "button").getAttribute("data-dim")).toBeNull();
    expect(card(root, "badge").getAttribute("data-dim")).toBeNull();
    expect(card(root, "radius").getAttribute("data-dim")).toBe("true");
    expect(root.querySelector('[data-part="board-status"]')?.textContent).toContain(
      "Used by Button, Badge",
    );

    key(viewport(root), { key: "Escape" });
    await settle();
    expect(head(root, "accent").getAttribute("aria-current")).toBeNull();
    expect(card(root, "radius").getAttribute("data-dim")).toBeNull();
    expect(root.querySelector('[data-part="board-status"]')?.textContent).toBe("");
    dispose();
  });

  it("moves a card with the pointer and keeps it whole on the plane", async () => {
    const { root, dispose } = mount(board);
    const item = card(root, "button");
    item.dispatchEvent(pointer("pointerdown", { pointerId: 1, clientX: 300, clientY: 100 }));
    item.dispatchEvent(pointer("pointermove", { pointerId: 1, clientX: 340, clientY: 130 }));
    await settle();
    expect(item.style.left).toBe("280px");
    expect(item.style.top).toBe("50px");

    // dragged far past the corner, the card stops at the edge instead of leaving the plane
    item.dispatchEvent(pointer("pointermove", { pointerId: 1, clientX: 5000, clientY: 5000 }));
    await settle();
    expect(Number.parseFloat(item.style.left)).toBeLessThanOrEqual(plane(root).clientWidth - 220);
    expect(Number.parseFloat(item.style.top)).toBeLessThanOrEqual(plane(root).clientHeight - 150);
    item.dispatchEvent(pointer("pointerup", { pointerId: 1 }));
    dispose();
  });

  it("nudges the focused card with the arrows, and pans the plane with the same keys", async () => {
    const { root, dispose } = mount(board);
    const item = card(root, "button");
    const button = head(root, "button");

    key(button, { key: "ArrowRight" });
    await settle();
    expect(item.style.left).toBe("248px");
    key(button, { key: "ArrowRight", shiftKey: true });
    await settle();
    expect(item.style.left).toBe("272px");
    // the card took the keys: the plane did not move with them
    expect(plane(root).style.transform).toContain("translate(0px, 0px)");

    key(viewport(root), { key: "ArrowRight" });
    await settle();
    expect(plane(root).style.transform).toContain("translate(24px, 0px)");
    dispose();
  });

  it("puts the plane under the theme's dark look, and takes it back", async () => {
    const { root, dispose } = mount(board);
    expect(viewport(root).getAttribute("data-mode")).toBe("light");
    const toggle = control(root, "Dark mode");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    toggle.click();
    await settle();
    // the mode is the theme's `data-mode` scope over the plane, not a second palette
    expect(viewport(root).getAttribute("data-mode")).toBe("dark");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    toggle.click();
    await settle();
    expect(viewport(root).getAttribute("data-mode")).toBe("light");
    dispose();
  });

  it("fits the whole map with the Fit button", async () => {
    const { root, dispose } = mount(board);
    const zoom = root.querySelector('[data-part="board-zoom"]')!;
    control(root, "Fit").click();
    await settle();
    // a map bigger than the frame: Fit is the smallest scale the plane allows
    expect(zoom.textContent).toBe("50%");
    expect(plane(root).style.transform).toContain("scale(0.5)");
    dispose();
  });

  it("zooms with the keys and says the scale", async () => {
    const { root, dispose } = mount(board);
    const zoom = root.querySelector('[data-part="board-zoom"]')!;
    expect(zoom.textContent).toBe("100%");

    key(viewport(root), { key: "+" });
    await settle();
    expect(zoom.textContent).toBe("125%");
    expect(plane(root).style.transform).toContain("scale(1.25)");

    // `0` is the overview: the smallest scale the plane allows, which is Fit
    key(viewport(root), { key: "0" });
    await settle();
    expect(zoom.textContent).toBe("50%");
    dispose();
  });
});

// A `line: "shape"` edge is one description in two surfaces: a border-shape (the CSS connector) and, where the property
// is missing, the same shape() as an SVG path. The test reads the shape and the path, so it holds in a browser without
// the property too, and it never assumes the Chrome that runs it has it.
it("draws a shape line as a border-shape, and the same curve as a path without it", () => {
  const nodes = [
    { id: "colour", kind: "token", x: 20, y: 20, width: 160, height: 90, title: "color.highlight" },
    { id: "button", kind: "part", x: 240, y: 20, width: 220, height: 150, title: "Button" },
  ] satisfies ReadonlyArray<BoardNode>;
  const edges = [
    { from: "colour", to: "button", line: "shape" },
  ] satisfies ReadonlyArray<BoardEdge>;
  const mounted = mount(() => <Board label="Connector" nodes={nodes} edges={edges} />);
  const element = mounted.root.querySelector<HTMLElement>('[data-part="board-connector"]');
  expect(element).not.toBeNull();
  const shape = element!.style.getPropertyValue("--_shape");
  const expected = connectorBetween(nodes[0]!, nodes[1]!);
  expect(shape).toBe(expected!.shape);
  expect(shape.startsWith("shape(from ")).toBe(true);
  // the box is the union of the two cards, which is what the percentages are against
  expect(element!.style.left).toBe(`${expected!.left}px`);
  expect(element!.style.width).toBe(`${expected!.width}px`);
  // the fallback is the same value: one description, two surfaces
  const fallback = element!.querySelector<HTMLElement>('[data-part="board-connector-fallback"]')!;
  expect(fallback.querySelector("path")!.getAttribute("d")).toBe(shapePath(shape).d);
  const native = element!.querySelector<HTMLElement>('[data-part="board-connector-native"]')!;
  const supports = CSS.supports("border-shape", "shape(from 0 0, line to 1px 1px)");
  // one of the two paints: the border where the property is there, the path where it is not
  expect(getComputedStyle(fallback).display === "none").toBe(supports);
  expect(getComputedStyle(native).borderTopWidth).toBe(supports ? "2px" : "0px");
  mounted.dispose();
});
