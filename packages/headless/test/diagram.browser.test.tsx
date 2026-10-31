import {
  type DiagramEdgeInput,
  type DiagramFocus,
  type DiagramLabels,
  type DiagramNodeInput,
  createDiagramFocus,
} from "../src/diagram";
import { For, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";

interface Mounted {
  readonly api: DiagramFocus;
  readonly activated: string[];
  readonly edgeActivated: string[];
  readonly node: (id: string) => HTMLButtonElement;
  readonly edge: (id: string) => HTMLButtonElement;
  readonly status: () => HTMLElement;
  /** Every rendered node with `tabindex="0"`; a roving tab stop means at most one. */
  readonly tabStops: () => HTMLButtonElement[];
}

const disposers: Array<() => void> = [];

afterEach(() => {
  for (const dispose of disposers.splice(0)) {
    dispose();
  }
  document.body.replaceChildren();
});

const settled = async (): Promise<void> => {
  flush();
  await new Promise((resolve) => setTimeout(resolve, 0));
  flush();
};

const press = async (element: HTMLElement, key: string): Promise<void> => {
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await settled();
};

/** The user's key goes to whatever has focus, as a real one does. */
const pressFocused = async (key: string): Promise<void> => {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) {
    throw new Error("nothing has focus");
  }
  await press(element, key);
};

const mount = (options: {
  readonly nodes: ReadonlyArray<DiagramNodeInput>;
  readonly edges: ReadonlyArray<DiagramEdgeInput>;
  readonly labels?: DiagramLabels | undefined;
  readonly id?: string | undefined;
}): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const activated: string[] = [];
  const edgeActivated: string[] = [];
  let api: DiagramFocus | undefined;
  const dispose = render(() => {
    const diagram = createDiagramFocus({
      nodes: options.nodes,
      edges: options.edges,
      labels: options.labels,
      id: options.id,
      onActivate: (id) => activated.push(id),
      onEdgeActivate: (id) => edgeActivated.push(id),
    });
    api = diagram;
    return (
      <div data-part="diagram">
        <p data-part="status" {...diagram.statusProps}>
          {diagram.status()}
        </p>
        <div data-part="nodes">
          <For each={options.nodes}>
            {(node) => (
              <button type="button" data-node={node.id} {...diagram.nodeProps(node.id)}>
                {node.label}
              </button>
            )}
          </For>
        </div>
        <div data-part="edges">
          <For each={options.edges}>
            {(edge) => (
              <button type="button" data-edge={edge.id} {...diagram.edgeProps(edge.id)}>
                {edge.label ?? edge.id}
              </button>
            )}
          </For>
        </div>
      </div>
    );
  }, root);
  disposers.push(dispose);
  const part = (selector: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element === null) {
      throw new Error(`no element ${selector}`);
    }
    return element;
  };
  const node = (id: string): HTMLButtonElement => {
    const element = root.querySelector<HTMLButtonElement>(`[data-node="${id}"]`);
    if (element === null) {
      throw new Error(`no node ${id}`);
    }
    return element;
  };
  const edge = (id: string): HTMLButtonElement => {
    const element = root.querySelector<HTMLButtonElement>(`[data-edge="${id}"]`);
    if (element === null) {
      throw new Error(`no edge ${id}`);
    }
    return element;
  };
  if (api === undefined) {
    throw new Error("not mounted");
  }
  return {
    api,
    activated,
    edgeActivated,
    node,
    edge,
    status: () => part('[data-part="status"]'),
    tabStops: () =>
      Array.from(root.querySelectorAll<HTMLButtonElement>('[data-node][tabindex="0"]')),
  };
};

/** A 3x3 grid, 80x40 nodes on a 100 px lattice: `a1` is the top-left. */
const GRID: ReadonlyArray<DiagramNodeInput> = ["1", "2", "3"].flatMap((row) =>
  ["a", "b", "c"].map((column) => ({
    id: `${column}${row}`,
    label: `${column.toUpperCase()}${row}`,
    x: (column.charCodeAt(0) - "a".charCodeAt(0)) * 100,
    y: (Number(row) - 1) * 100,
    width: 80,
    height: 40,
  })),
);

const STATE: ReadonlyArray<DiagramNodeInput> = [
  { id: "payment", label: "Payment", x: 0, y: 0 },
  { id: "pending", label: "Pending", x: 200, y: 0 },
  { id: "failed", label: "Failed", x: 200, y: 120 },
];

const TRANSITIONS: ReadonlyArray<DiagramEdgeInput> = [
  { id: "e-submit", from: "payment", to: "pending", label: "submit" },
  { id: "e-fail", from: "payment", to: "failed" },
  { id: "e-retry", from: "failed", to: "pending" },
];

describe("createDiagramFocus", () => {
  it("renders each node as a described button with exactly one tab stop, the first node", async () => {
    const { api, node, tabStops } = mount({ nodes: GRID, edges: [] });
    await settled();
    expect(api.active()).toBe("a1");
    expect(tabStops().map((element) => element.dataset.node)).toEqual(["a1"]);
    const first = node("a1");
    expect(first.getAttribute("role")).toBe("button");
    expect(first.getAttribute("aria-roledescription")).toBe("node");
    expect(first.getAttribute("aria-label")).toBe("A1");
    expect(node("b2").getAttribute("tabindex")).toBe("-1");
    expect(api.statusProps).toEqual({ role: "status", "aria-live": "polite" });
  });

  it("moves the tab stop to the node that takes focus", async () => {
    const { api, node, tabStops } = mount({ nodes: GRID, edges: [] });
    await settled();
    node("b2").focus();
    await settled();
    expect(api.active()).toBe("b2");
    expect(tabStops().map((element) => element.dataset.node)).toEqual(["b2"]);
  });

  it("a keyboard move takes DOM focus with it", async () => {
    const { api, node, tabStops } = mount({ nodes: GRID, edges: [] });
    await settled();
    expect(node("a1").id).toMatch(/-node-a1$/);
    node("a1").focus();
    await settled();
    await pressFocused("ArrowRight");
    expect(api.active()).toBe("b1");
    expect(document.activeElement).toBe(node("b1"));
    expect(tabStops()[0]).toBe(document.activeElement);
    await pressFocused("ArrowDown");
    expect(api.active()).toBe("b2");
    expect(document.activeElement).toBe(node("b2"));
    expect(tabStops()[0]).toBe(document.activeElement);
  });

  it("a wrap and Home / End take DOM focus too", async () => {
    const { api, node } = mount({ nodes: GRID, edges: [] });
    await settled();
    node("a1").focus();
    await settled();
    await pressFocused("ArrowUp");
    expect(api.active()).toBe("a3");
    expect(document.activeElement).toBe(node("a3"));
    await pressFocused("End");
    expect(api.active()).toBe("c3");
    expect(document.activeElement).toBe(node("c3"));
    await pressFocused("Home");
    expect(api.active()).toBe("a1");
    expect(document.activeElement).toBe(node("a1"));
  });

  it("focus(id) moves DOM focus, and an unknown id moves nothing", async () => {
    const { api, node } = mount({ nodes: STATE, edges: TRANSITIONS });
    await settled();
    node("payment").focus();
    await settled();
    expect(api.focus("nowhere")).toBe("payment");
    expect(document.activeElement).toBe(node("payment"));
    expect(api.focus("failed")).toBe("failed");
    await settled();
    expect(document.activeElement).toBe(node("failed"));
    expect(node("failed").getAttribute("tabindex")).toBe("0");
    expect(node("payment").getAttribute("tabindex")).toBe("-1");
  });

  it("an explicit id base names the node elements", async () => {
    const { node } = mount({ nodes: STATE, edges: TRANSITIONS, id: "chart" });
    await settled();
    expect(node("payment").id).toBe("chart-node-payment");
    expect(node("failed").id).toBe("chart-node-failed");
  });

  it("the edge cursor leaves DOM focus where it was", async () => {
    const { api, node } = mount({ nodes: STATE, edges: TRANSITIONS });
    await settled();
    node("payment").focus();
    await settled();
    await pressFocused("e");
    expect(api.edgeCursor()).toBe(0);
    expect(document.activeElement).toBe(node("payment"));
    await pressFocused("ArrowDown");
    expect(api.edgeCursor()).toBe(1);
    expect(document.activeElement).toBe(node("payment"));
    await pressFocused("Enter");
    expect(document.activeElement).toBe(node("payment"));
    await pressFocused("Escape");
    expect(api.edgeCursor()).toBe(-1);
    expect(document.activeElement).toBe(node("payment"));
  });

  it("follows the layout: the arrows land on the nearest node in that direction", async () => {
    const { api, node, tabStops } = mount({ nodes: GRID, edges: [] });
    await settled();
    await press(node("a1"), "ArrowRight");
    expect(api.active()).toBe("b1");
    expect(tabStops().map((element) => element.dataset.node)).toEqual(["b1"]);
    await press(node("a1"), "ArrowDown");
    expect(api.active()).toBe("a2");
    await press(node("a2"), "ArrowRight");
    expect(api.active()).toBe("b2");
    await press(node("b2"), "ArrowLeft");
    expect(api.active()).toBe("a2");
    await press(node("a2"), "ArrowUp");
    expect(api.active()).toBe("a1");
  });

  it("wraps to the opposite end when nothing lies in that direction", async () => {
    const { api, node } = mount({ nodes: GRID, edges: [] });
    await settled();
    // nothing above the top row: the bottom row, first node by id
    await press(node("a1"), "ArrowUp");
    expect(api.active()).toBe("a3");
    // nothing left of the first column: the right column, first node by id
    await press(node("a3"), "ArrowLeft");
    expect(api.active()).toBe("c1");
    // nothing right of the right column: the left column, first node by id
    await press(node("c1"), "ArrowRight");
    expect(api.active()).toBe("a1");
    // nothing below the bottom row: the top row, first node by id
    await press(node("a1"), "ArrowDown");
    await press(node("a2"), "ArrowDown");
    expect(api.active()).toBe("a3");
    await press(node("a3"), "ArrowDown");
    expect(api.active()).toBe("a1");
  });

  it("Home and End go to the first and last node in option order", async () => {
    const { api, node } = mount({ nodes: GRID, edges: [] });
    await settled();
    await press(node("a1"), "End");
    expect(api.active()).toBe("c3");
    await press(node("c3"), "Home");
    expect(api.active()).toBe("a1");
  });

  it("Enter and Space activate the active node", async () => {
    const { activated, node } = mount({ nodes: GRID, edges: [] });
    await settled();
    await press(node("a1"), "Enter");
    expect(activated).toEqual(["a1"]);
    await press(node("a1"), "ArrowRight");
    await press(node("b1"), " ");
    expect(activated).toEqual(["a1", "b1"]);
    node("c1").click();
    await settled();
    expect(activated).toEqual(["a1", "b1", "c1"]);
  });

  it("e opens the outgoing edges, the arrows move the cursor and Enter fires one", async () => {
    const { api, edgeActivated, node } = mount({
      nodes: STATE,
      edges: TRANSITIONS,
    });
    await settled();
    expect(api.edgesOf("payment").map((edge) => edge.id)).toEqual(["e-submit", "e-fail"]);
    await press(node("payment"), "e");
    expect(api.edgeCursor()).toBe(0);
    const first = api.status();
    expect(first).toContain("Edge Payment \u2192 Pending (submit). Enter to activate.");
    await press(node("payment"), "ArrowDown");
    expect(api.edgeCursor()).toBe(1);
    expect(api.status()).not.toBe(first);
    expect(api.status()).toContain("Edge Payment \u2192 Failed. Enter to activate.");
    await press(node("payment"), "Enter");
    expect(edgeActivated).toEqual(["e-fail"]);
  });

  it("wraps the edge cursor and leaves it on Escape", async () => {
    const { api, node } = mount({ nodes: STATE, edges: TRANSITIONS });
    await settled();
    await press(node("payment"), "e");
    await press(node("payment"), "ArrowUp");
    expect(api.edgeCursor()).toBe(1);
    await press(node("payment"), "Escape");
    expect(api.edgeCursor()).toBe(-1);
    expect(api.status()).toBe("Payment. 2 edges: to Pending, to Failed.");
  });

  it("any other navigation key leaves the edge cursor", async () => {
    const { api, node } = mount({ nodes: STATE, edges: TRANSITIONS });
    await settled();
    await press(node("payment"), "e");
    expect(api.edgeCursor()).toBe(0);
    await press(node("payment"), "Home");
    expect(api.edgeCursor()).toBe(-1);
    expect(api.active()).toBe("payment");
  });

  it("the live region says where the user is, and changes on every move", async () => {
    const { api, node, status } = mount({ nodes: GRID, edges: [] });
    await settled();
    expect(status().textContent).toBe("A1. No edges.");
    await press(node("a1"), "ArrowRight");
    expect(status().textContent).toBe("B1. No edges.");
    expect(api.status()).toBe("B1. No edges.");
    await press(node("b1"), "ArrowDown");
    expect(status().textContent).toBe("B2. No edges.");
  });

  it("names the diagram and the edge noun when the host passes labels", async () => {
    const { api, node } = mount({
      nodes: STATE,
      edges: TRANSITIONS,
      labels: { diagram: "State chart", edges: "transitions" },
    });
    await settled();
    expect(api.status()).toBe("State chart. Payment. 2 transitions: to Pending, to Failed.");
    await press(node("payment"), "ArrowDown");
    expect(api.status()).toBe("State chart. Failed. 1 transition: to Pending.");
  });

  it("ignores edges whose endpoints are missing", async () => {
    const { api } = mount({
      nodes: STATE,
      edges: [...TRANSITIONS, { id: "e-ghost", from: "payment", to: "nowhere" }],
    });
    await settled();
    expect(api.edgesOf("payment").map((edge) => edge.id)).toEqual(["e-submit", "e-fail"]);
    expect(api.edgeProps("e-ghost").tabindex).toBe(-1);
    expect(api.edgeProps("e-submit")["aria-label"]).toBe("submit: Payment \u2192 Pending");
    expect(api.edgeProps("e-fail")["aria-label"]).toBe("Payment \u2192 Failed");
  });

  it("a node that is not in nodes is a no-op", async () => {
    const { api } = mount({ nodes: STATE, edges: TRANSITIONS });
    await settled();
    expect(api.focus("nowhere")).toBe("payment");
    expect(api.active()).toBe("payment");
    expect(api.nodeProps("nowhere").tabindex).toBe(-1);
    expect(api.focus("failed")).toBe("failed");
    await settled();
    expect(api.active()).toBe("failed");
  });

  it("an empty diagram is inert", async () => {
    const { api, tabStops } = mount({ nodes: [], edges: [] });
    await settled();
    expect(api.active()).toBeUndefined();
    expect(api.status()).toBe("");
    expect(api.focus("a1")).toBeUndefined();
    expect(api.edgesOf("a1")).toEqual([]);
    expect(api.edgeCursor()).toBe(-1);
    expect(tabStops()).toEqual([]);
  });

  it("never puts two nodes in the tab order", async () => {
    const { api, node, tabStops } = mount({ nodes: GRID, edges: [] });
    await settled();
    node("a1").focus();
    await settled();
    for (const key of ["ArrowRight", "ArrowDown", "ArrowRight", "End", "Home", "ArrowUp"]) {
      await pressFocused(key);
      expect(api.active()).toBeDefined();
      const stops = tabStops();
      expect(stops).toHaveLength(1);
      expect(stops[0]?.dataset.node).toBe(api.active());
      expect(stops[0]).toBe(document.activeElement);
    }
  });
});
