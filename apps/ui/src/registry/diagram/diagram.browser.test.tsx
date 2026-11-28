import { userEvent } from "vite-plus/test/browser";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedDiagram, mountDiagram, mountStarter, STARTER_EDGES } from "./diagram.fixture";

// No APG pattern and no Quint spec exists for a diagram, so this file is the skin's oracle: it mounts the starter in a real
// Chromium and drives the same graph a reader does. The accessible contract (a named group, one tab stop, the edges of the
// active node, the live region) is only observable through the DOM.
//
// The fixture's flow is laid out on a lattice: cart at (0, 24), paid at (196, 24), shipped at (392, 24), refunded at (196,
// 172), each node 128 x 48. Right from cart is paid, down from paid is refunded, and shipped has no outgoing edge.

/** Solid 2 delivers events through its delegated listener on a later turn. */
const settle = (): Promise<void> => Promise.resolve();

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

/** A key goes to whatever has focus, which is the node the tab stop is on: the arrows then move from there. */
const pressFocused = async (key: string): Promise<void> => {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) {
    throw new Error("nothing has focus");
  }
  await press(element, key);
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
    // the transparent wide stroke is the target a pointer finds; it carries the same `d` as the thin line
    const hit = required<SVGPathElement>(instance.root, '[data-edge="pay"] path[class]');

    hit.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
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

  it("draws a path, an arrow and a label per edge, trimmed to the nodes' borders", () => {
    const { root } = mounted();
    const edges = [...root.querySelectorAll<SVGGElement>('[data-part="diagram-edge"]')];

    expect(edges.map((edge) => edge.dataset.edge)).toEqual([
      "pay",
      "cancel",
      "ship",
      "refund",
      "resend",
    ]);
    expect(edges.map((edge) => edge.querySelectorAll("path").length)).toEqual([2, 2, 2, 2, 2]);
    expect(edges.map((edge) => edge.querySelectorAll("polygon").length)).toEqual([1, 1, 1, 1, 1]);
    expect(edges.map((edge) => edge.querySelector("text")?.textContent)).toEqual([
      "pay",
      "cancel",
      "ship",
      "refund",
      "resend",
    ]);

    // pay runs from cart's right border (128) to paid's left border (196), arrow included, at the two centres' y
    const d = required<SVGPathElement>(root, '[data-edge="pay"] path:not([class])').getAttribute(
      "d",
    )!;
    const [, x1, y1, x2, y2] = /^M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+)$/.exec(d)!.map(Number) as [
      string,
      number,
      number,
      number,
      number,
    ];
    expect(x1).toBeGreaterThan(128);
    expect(x2!).toBeLessThan(196);
    expect(y1).toBe(48);
    expect(y2).toBe(48);
  });

  it("draws the same graph in any of the four shapes", () => {
    for (const shape of ["straight", "bezier", "step", "smoothstep"] as const) {
      const { root } = mountDiagram({ edge: shape });
      const d = required<SVGPathElement>(root, '[data-edge="pay"] path:not([class])').getAttribute(
        "d",
      )!;
      expect(d.startsWith("M "), shape).toBe(true);
      if (shape === "bezier") {
        expect(d, shape).toContain(" C ");
      }
      if (shape === "smoothstep") {
        expect(d, shape).toContain(" Q ");
      }
      if (shape === "step" || shape === "smoothstep") {
        // orthogonal: every segment shares an x or a y with the one before it
        const points = d
          .split(/[MLQ]|\s(?=\()/)
          .map((part) => part.trim())
          .filter((part) => /^[\d.]+ [\d.]+$/.test(part))
          .map((part) => part.split(" ").map(Number) as [number, number]);
        const orthogonal = points
          .slice(1)
          .every(
            (p, index) =>
              p[0] === points[index]![0] || p[1] === points[index]![1] || d.includes(" Q "),
          );
        expect(orthogonal, shape).toBe(true);
      }
    }
  });

  it("makes an edge with c and Enter, and the pending line follows the tab stop", async () => {
    const instance = mounted();
    const { root } = instance;
    const cart = node(root, "cart");
    cart.focus();
    await settle();

    await pressFocused("c");
    expect(status(root).textContent).toBe(
      "Payment flow. Link Cart to Cart: not allowed. Escape to cancel.",
    );
    // nothing to draw to itself, so the skin draws no line until a target is chosen

    // the arrows choose the target, and the skin draws the line that Enter would make, dashed
    await pressFocused("ArrowRight");
    expect(status(root).textContent).toBe(
      "Payment flow. Link Cart to Paid. Enter to connect, Escape to cancel.",
    );
    const pending = required<SVGPathElement>(root, '[data-part="diagram-pending"]').getAttribute(
      "d",
    );
    expect(pending).toMatch(/^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
    await pressFocused("ArrowDown");
    expect(
      required<SVGPathElement>(root, '[data-part="diagram-pending"]').getAttribute("d"),
    ).not.toBe(pending);
    await pressFocused("ArrowUp");

    await pressFocused("Enter");
    expect(instance.connected).toEqual([["cart", "paid"]]);
    expect(instance.edges()).toHaveLength(6);
    expect(root.querySelector('[data-edge="new-1"]')).not.toBeNull();
    // no link is pending any more, so no line
    expect(root.querySelector('[data-part="diagram-pending"]')).toBeNull();
    expect(instance.log()).toBe("Link “link 1” made: Cart → Paid.");
  });

  it("makes an edge by dragging from one node to another, and a click is still a click", async () => {
    const instance = mounted();
    const { root } = instance;
    const frame = required<HTMLElement>(root, '[data-part="diagram-frame"]');
    const cart = node(root, "cart");
    const refunded = node(root, "refunded");
    const from = cart.getBoundingClientRect();
    const to = refunded.getBoundingClientRect();
    const send = (target: Element, type: string, x: number, y: number): void => {
      target.dispatchEvent(
        new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      );
    };

    // a press that does not move is a click, and a click is the browser's: the drag starts nothing
    send(cart, "pointerdown", from.left + 10, from.top + 10);
    send(frame, "pointerup", from.left + 12, from.top + 12);
    await settle();
    expect(root.querySelector('[data-part="diagram-pending"]')).toBeNull();
    cart.click();
    await settle();
    expect(instance.activated).toEqual(["cart"]);

    // a press that moves is a drag: the link is pending until the release lands on a node
    send(cart, "pointerdown", from.left + 10, from.top + 10);
    send(frame, "pointermove", from.right + 40, from.top);
    await settle();
    expect(instance.activated).toEqual(["cart"]);
    expect(root.querySelector('[data-part="diagram-pending"]')).not.toBeNull();
    expect(status(root).textContent).toContain("Escape to cancel");

    send(refunded, "pointerup", to.left + 10, to.top + 10);
    await settle();
    expect(instance.connected).toEqual([["cart", "refunded"]]);
    expect(root.querySelector('[data-edge="new-1"]')).not.toBeNull();
    expect(root.querySelector('[data-part="diagram-pending"]')).toBeNull();

    // the click a browser sends after the release is not an activation: the same node does not "press" as well
    cart.click();
    await settle();
    expect(instance.activated).toEqual(["cart"]);
  });

  it("drops the pending link when the release lands on nothing", async () => {
    const instance = mounted();
    const { root } = instance;
    const frame = required<HTMLElement>(root, '[data-part="diagram-frame"]');
    const cart = node(root, "cart");
    const from = cart.getBoundingClientRect();
    const send = (target: Element, type: string, x: number, y: number): void => {
      target.dispatchEvent(
        new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      );
    };
    send(cart, "pointerdown", from.left + 10, from.top + 10);
    send(frame, "pointermove", from.left + 80, from.top + 40);
    send(frame, "pointerup", from.left + 80, from.top + 40);
    await settle();
    expect(instance.connected).toEqual([]);
    expect(root.querySelector('[data-part="diagram-pending"]')).toBeNull();
  });

  it("breaks the later of two edges where they cross", () => {
    // the two diagonals of a square meet in the middle, by construction
    const { root } = mountDiagram({
      nodes: [
        { id: "a", label: "A", x: 0, y: 0, width: 80, height: 40 },
        { id: "b", label: "B", x: 240, y: 0, width: 80, height: 40 },
        { id: "c", label: "C", x: 240, y: 200, width: 80, height: 40 },
        { id: "d", label: "D", x: 0, y: 200, width: 80, height: 40 },
      ],
      edges: [
        { id: "ac", from: "a", to: "c" },
        { id: "bd", from: "b", to: "d" },
      ],
    });
    const over = required<SVGGElement>(root, '[data-edge="bd"]');
    const under = required<SVGGElement>(root, '[data-edge="ac"]');
    expect(over.dataset.crossing).toBe("true");
    expect(over.querySelector('[data-part="diagram-cutout"]')).not.toBeNull();
    // the one underneath is not cut and carries no break of its own
    expect(under.dataset.crossing).toBeUndefined();
    expect(under.querySelector('[data-part="diagram-cutout"]')).toBeNull();
  });
});

describe("the starter lays the graph out on demand", () => {
  const starters: Array<{ readonly dispose: () => void }> = [];

  const started = () => {
    const instance = mountStarter();
    starters.push(instance);
    return instance;
  };

  afterEach(() => {
    for (const instance of starters.splice(0)) instance.dispose();
  });

  interface Box {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }

  const boxes = (root: ParentNode): Readonly<Record<string, Box>> =>
    Object.fromEntries(
      [...root.querySelectorAll<HTMLElement>('[data-part="diagram-node"]')].map((element) => [
        element.dataset["node"] ?? "",
        {
          x: Number.parseFloat(element.style.left),
          y: Number.parseFloat(element.style.top),
          width: element.offsetWidth,
          height: element.offsetHeight,
        },
      ]),
    );

  it("is one labelled button outside the diagram's tab stop", () => {
    const { root } = started();
    const control = required<HTMLButtonElement>(root, '[data-part="starter-lay-out"]');
    expect(control.textContent?.trim()).toBe("Lay out");
    expect(control.type).toBe("button");
    expect(tabStops(root).map((button) => button.dataset["node"])).toEqual(["cart"]);
  });

  it("lays the graph out into layers, and a second press changes nothing", async () => {
    const { root } = started();
    const before = boxes(root);
    required<HTMLButtonElement>(root, '[data-part="starter-lay-out"]').click();
    await settle();
    const after = boxes(root);
    expect(after).not.toEqual(before);

    const ids = Object.keys(after);
    for (let first = 0; first < ids.length; first += 1) {
      for (let second = first + 1; second < ids.length; second += 1) {
        const one = after[ids[first] ?? ""];
        const two = after[ids[second] ?? ""];
        if (one === undefined || two === undefined) continue;
        const overlaps =
          one.x < two.x + two.width &&
          two.x < one.x + one.width &&
          one.y < two.y + two.height &&
          two.y < one.y + one.height;
        expect(overlaps, `${ids[first]} / ${ids[second]}`).toBe(false);
      }
    }
    for (const edge of STARTER_EDGES) {
      const from = after[edge.from];
      const to = after[edge.to];
      expect(from === undefined || to === undefined ? false : from.x < to.x, edge.id).toBe(true);
    }

    required<HTMLButtonElement>(root, '[data-part="starter-lay-out"]').click();
    await settle();
    expect(boxes(root)).toEqual(after);
  });

  it("keeps the arrows working on the laid-out drawing", async () => {
    const { root } = started();
    required<HTMLButtonElement>(root, '[data-part="starter-lay-out"]').click();
    await settle();
    const cart = node(root, "cart");
    cart.focus();
    await press(cart, "ArrowRight");
    const active = document.activeElement;
    expect(active instanceof HTMLElement ? active.dataset["node"] : undefined).toBe("paid");
  });

  it("logs no error while it lays the graph out", async () => {
    const errors: string[] = [];
    const { error } = console;
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(" "));
    };
    try {
      const { root } = started();
      required<HTMLButtonElement>(root, '[data-part="starter-lay-out"]').click();
      await settle();
    } finally {
      console.error = error;
    }
    expect(errors).toEqual([]);
  });
});
