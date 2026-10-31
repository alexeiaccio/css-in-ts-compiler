import { userEvent } from "vite-plus/test/browser";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedDiagram, mountDiagram } from "./diagram.fixture";

// No APG pattern and no Quint spec exists for a diagram, so this file is the skin's oracle: it mounts the starter in a real
// Chromium and drives the same graph a reader does. The accessible contract (a named group, one tab stop, the edges of the
// active node, the live region) is only observable through the DOM.
//
// The fixture's flow is laid out on a lattice: cart at (0, 24), paid at (196, 24), shipped at (392, 24), refunded at (196,
// 172), each node 128 x 48. Right from cart is paid, down from paid is refunded, and shipped has no outgoing edge.

/** Solid 2 delivers events through its delegated listener on a later turn. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const live: MountedDiagram[] = [];

const mounted = (): MountedDiagram => {
  const instance = mountDiagram();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const required = <T extends Element>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`diagram: no ${selector}`);
  }
  return element;
};

const node = (root: ParentNode, id: string): HTMLButtonElement =>
  required(root, `[data-part="diagram-node"][data-node="${id}"]`);

const status = (root: ParentNode): HTMLElement => required(root, '[data-part="diagram-status"]');

const tabStops = (root: ParentNode): HTMLButtonElement[] => [
  ...root.querySelectorAll<HTMLButtonElement>('[data-part="diagram-node"][tabindex="0"]'),
];

/** A key on a node, as a reader's would arrive. */
const press = async (element: HTMLElement, key: string): Promise<void> => {
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await settle();
};

describe("Diagram", () => {
  it("is a named group of node buttons with one tab stop", () => {
    const { root } = mounted();
    const group = required<HTMLElement>(root, '[data-part="diagram"]');
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-part="diagram-node"]')];

    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-label")).toBe("Payment flow");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Cart",
      "Paid",
      "Shipped",
      "Refunded",
    ]);
    expect(buttons.map((button) => button.getAttribute("aria-roledescription"))).toEqual([
      "node",
      "node",
      "node",
      "node",
    ]);
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Cart",
      "Paid",
      "Shipped",
      "Refunded",
    ]);
    expect(tabStops(root).map((button) => button.dataset.node)).toEqual(["cart"]);
    expect(node(root, "paid").getAttribute("tabindex")).toBe("-1");
  });

  it("paints the active node from the primitive's tab stop", () => {
    const { root } = mounted();
    const active = node(root, "cart");
    const other = node(root, "paid");

    expect(getComputedStyle(active).borderTopColor).not.toBe(
      getComputedStyle(other).borderTopColor,
    );
    expect(getComputedStyle(active).backgroundColor).not.toBe(
      getComputedStyle(other).backgroundColor,
    );
  });

  it("moves the tab stop and the focus along the layout", async () => {
    const { root } = mounted();
    const cart = node(root, "cart");
    cart.focus();

    await press(cart, "ArrowRight");
    expect(tabStops(root).map((button) => button.dataset.node)).toEqual(["paid"]);
    expect(document.activeElement).toBe(node(root, "paid"));

    await press(node(root, "paid"), "ArrowLeft");
    expect(tabStops(root).map((button) => button.dataset.node)).toEqual(["cart"]);
    expect(document.activeElement).toBe(cart);

    await press(cart, "ArrowDown");
    expect(tabStops(root).map((button) => button.dataset.node)).toEqual(["refunded"]);
    expect(document.activeElement).toBe(node(root, "refunded"));

    await press(node(root, "refunded"), "ArrowUp");
    expect(tabStops(root).map((button) => button.dataset.node)).toEqual(["paid"]);
  });

  it("jumps to the first and last node with Home and End", async () => {
    const { root } = mounted();
    const cart = node(root, "cart");
    cart.focus();

    await press(cart, "End");
    expect(tabStops(root).map((button) => button.dataset.node)).toEqual(["refunded"]);
    expect(document.activeElement).toBe(node(root, "refunded"));

    await press(node(root, "refunded"), "Home");
    expect(tabStops(root).map((button) => button.dataset.node)).toEqual(["cart"]);
    expect(document.activeElement).toBe(cart);
  });

  it("activates the node on Enter, and the host shows what it got", async () => {
    const instance = mounted();
    const cart = node(instance.root, "cart");
    cart.focus();

    await press(cart, "Enter");
    expect(instance.activated).toEqual(["cart"]);
    expect(instance.log()).toBe("Node “Cart” activated.");

    node(instance.root, "shipped").click();
    await settle();
    expect(instance.activated).toEqual(["cart", "shipped"]);
    expect(instance.log()).toBe("Node “Shipped” activated.");
  });

  it("lists the active node's edges, moves the cursor and fires the one it is on", async () => {
    const instance = mounted();
    const { root } = instance;
    const cart = node(root, "cart");
    cart.focus();

    await press(cart, "e");
    expect(status(root).textContent).toBe(
      "Payment flow. Edge Cart → Paid (pay). Enter to activate.",
    );
    expect(required(root, '[data-edge="pay"]').getAttribute("data-cursor")).toBe("true");

    await press(cart, "ArrowDown");
    expect(status(root).textContent).toBe(
      "Payment flow. Edge Cart → Refunded (cancel). Enter to activate.",
    );
    expect(required(root, '[data-edge="cancel"]').getAttribute("data-cursor")).toBe("true");
    expect(required(root, '[data-edge="pay"]').hasAttribute("data-cursor")).toBe(false);

    await press(cart, "Enter");
    expect(instance.fired).toEqual(["cancel"]);
    expect(instance.activated).toEqual([]);
    expect(instance.log()).toBe("Edge “cancel”: Cart → Refunded.");

    // Escape leaves the cursor; the node's own announcement comes back
    await press(cart, "e");
    await press(cart, "Escape");
    expect(status(root).textContent).toBe("Payment flow. Cart. 2 edges: to Paid, to Refunded.");
  });

  it("activates an edge from a click on its line", async () => {
    const instance = mounted();
    const line = required<SVGLineElement>(instance.root, '[data-edge="pay"] line');

    line.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await settle();

    expect(instance.fired).toEqual(["pay"]);
    expect(instance.log()).toBe("Edge “pay”: Cart → Paid.");
  });

  it("announces the active node in a polite live region", async () => {
    const { root } = mounted();
    const region = status(root);

    expect(region.getAttribute("role")).toBe("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toBe("Payment flow. Cart. 2 edges: to Paid, to Refunded.");

    await press(node(root, "cart"), "ArrowRight");
    expect(region.textContent).toBe("Payment flow. Paid. 2 edges: to Shipped, to Refunded.");
  });

  it("says a node has no edges, and offers none", async () => {
    const { root } = mounted();
    const shipped = node(root, "shipped");
    shipped.focus();
    await settle();

    expect(status(root).textContent).toBe("Payment flow. Shipped. No edges.");
    await press(shipped, "e");
    expect(status(root).textContent).toBe("Payment flow. Shipped. No edges.");
    expect(root.querySelector('[data-cursor="true"]')).toBeNull();
  });

  it("leaves the diagram on Tab", async () => {
    const { root } = mounted();
    const cart = node(root, "cart");
    cart.focus();

    // the primitive does not handle Tab: the page's tab order is the grid's, one stop and out
    expect(
      cart.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
      ),
    ).toBe(true);
    await settle();
    expect(tabStops(root).map((button) => button.dataset.node)).toEqual(["cart"]);

    await userEvent.tab();
    expect(document.activeElement).toBe(required(root, '[data-part="diagram-after"]'));
  });

  it("draws a line, an arrow and a label per edge, trimmed to the nodes' borders", () => {
    const { root } = mounted();
    const edges = [...root.querySelectorAll<SVGGElement>('[data-part="diagram-edge"]')];

    expect(edges.map((edge) => edge.dataset.edge)).toEqual([
      "pay",
      "cancel",
      "ship",
      "refund",
      "resend",
    ]);
    expect(edges.map((edge) => edge.querySelectorAll("line").length)).toEqual([2, 2, 2, 2, 2]);
    expect(edges.map((edge) => edge.querySelectorAll("polygon").length)).toEqual([1, 1, 1, 1, 1]);
    expect(edges.map((edge) => edge.querySelector("text")?.textContent)).toEqual([
      "pay",
      "cancel",
      "ship",
      "refund",
      "resend",
    ]);

    // pay runs from cart's right border (128) to paid's left border (196), arrow included, at the two centres' y
    const line = required<SVGLineElement>(root, '[data-edge="pay"] line');
    expect(Number(line.getAttribute("x1"))).toBeGreaterThan(128);
    expect(Number(line.getAttribute("x2"))).toBeLessThan(196);
    expect(line.getAttribute("y1")).toBe("48");
    expect(line.getAttribute("y2")).toBe("48");
  });
});
