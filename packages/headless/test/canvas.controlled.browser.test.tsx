import { type CanvasMounted, mountCanvas } from "./canvas.fixture";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

// effects-of-atmosphere-l87v: node geometry and paint order can come from the host (an auto-layout,
// a node that grows to its text). Positions are in the Quint model (`host_move`) and are replayed
// through the contract scenarios and the differential walk; sizes and z-order are not modelled, so
// they are tested here, on the real DOM.

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const node = (id: string, x: number, y: number, label: string) => ({
  id,
  x,
  y,
  width: 100,
  height: 60,
  label,
});

const part = (mounted: CanvasMounted, name: string): HTMLElement => {
  const element = mounted.root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`no part ${name}`);
  }
  return element;
};
const domOrder = (mounted: CanvasMounted): string[] =>
  [...mounted.root.querySelectorAll<HTMLElement>('[data-part^="node"]')].map(
    (element) => element.dataset["part"] ?? "",
  );
const style = (mounted: CanvasMounted, id: string, name: string): string =>
  part(mounted, `node${id}`).style.getPropertyValue(name);

const withMounted = async (
  mounted: CanvasMounted,
  body: (mounted: CanvasMounted) => Promise<void>,
): Promise<void> => {
  try {
    await settle();
    await body(mounted);
  } finally {
    mounted.dispose();
  }
};

describe("createCanvas setGeometry (host-controlled geometry)", () => {
  it("moves and resizes nodes in the DOM, and hit testing follows", async () => {
    const mounted = mountCanvas({
      kind: "camera",
      nodes: [node("a", 100, 100, "Alpha"), node("b", 400, 100, "Beta")],
    });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      canvas.setGeometry([{ id: "a", width: 150, height: 90 }]);
      await settle();
      expect(part(mounted, "nodea").style.width).toBe("150px");
      expect(part(mounted, "nodea").style.height).toBe("90px");
      expect(part(mounted, "nodea").style.containIntrinsicSize).toContain("150px 90px");
      // (230, 170) was outside Alpha (100..200 x 100..160); it is inside the grown node
      canvas.pointerDown({ id: 1, x: 230, y: 170 });
      canvas.pointerUp(1);
      expect(canvas.peek().selection).toEqual(["a"]);

      canvas.setGeometry([{ id: "b", x: 10, y: 20 }]);
      await settle();
      expect(style(mounted, "b", "--node-x")).toBe("10");
      expect(style(mounted, "b", "--node-y")).toBe("20");
      // omitted fields keep their value
      expect(part(mounted, "nodeb").style.width).toBe("100px");
    });
  });

  it("clamps into the world bound with the new size, and rounds fractions half up", async () => {
    const mounted = mountCanvas({
      kind: "camera",
      nodes: [node("a", 999_900, 0, "Alpha")],
    });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      // growing keeps the node inside the bound: x moves left to 1e6 - 300
      canvas.setGeometry([{ id: "a", width: 300 }]);
      await settle();
      expect(style(mounted, "a", "--node-x")).toBe("999700");
      canvas.setGeometry([{ id: "a", x: 10.5, y: -2.4, height: 40.5 }]);
      await settle();
      expect(style(mounted, "a", "--node-x")).toBe("11");
      expect(style(mounted, "a", "--node-y")).toBe("-2");
      expect(part(mounted, "nodea").style.height).toBe("41px");
      // a size is never negative
      canvas.setGeometry([{ id: "a", width: -5 }]);
      await settle();
      expect(part(mounted, "nodea").style.width).toBe("0px");
    });
  });

  it("reports moved nodes (after the clamp) through onNodesMove, size-only changes are silent", async () => {
    const mounted = mountCanvas({
      kind: "camera",
      nodes: [node("a", 0, 0, "Alpha"), node("b", 300, 0, "Beta")],
    });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      canvas.setGeometry([{ id: "a", width: 200 }]);
      await settle();
      expect(mounted.events.get("onNodesMove")).toBeUndefined();
      canvas.setGeometry([
        { id: "a", x: 5_000_000 },
        { id: "b", x: 300 },
      ]);
      await settle();
      expect(mounted.events.get("onNodesMove")).toEqual([[{ id: "a", x: 999_800, y: 0 }]]);
    });
  });

  it("throws on an unknown id or a non-finite number before changing anything", async () => {
    const mounted = mountCanvas({
      kind: "camera",
      nodes: [node("a", 100, 100, "Alpha")],
    });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      expect(() =>
        canvas.setGeometry([
          { id: "a", x: 500 },
          { id: "ghost", x: 1 },
        ]),
      ).toThrow("ghost");
      expect(() =>
        canvas.setGeometry([
          { id: "a", x: 500 },
          { id: "a", y: Number.NaN },
        ]),
      ).toThrow("finite");
      await settle();
      expect(style(mounted, "a", "--node-x")).toBe("100");
    });
  });

  it("re-derives a running drag: the delta is kept over the new base", async () => {
    const mounted = mountCanvas({
      kind: "camera",
      nodes: [node("a", 100, 100, "Alpha")],
    });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      canvas.pointerDown({ id: 1, x: 110, y: 110 });
      canvas.pointerMove({ id: 1, x: 130, y: 110 });
      await settle();
      expect(canvas.position("a")).toEqual({ x: 120, y: 100 });
      canvas.setGeometry([{ id: "a", x: 400, y: 300 }]);
      await settle();
      expect(canvas.peek().mode).toBe("dragging");
      expect(canvas.position("a")).toEqual({ x: 420, y: 300 });
      canvas.pointerUp(1);
      await settle();
      expect(mounted.events.get("onNodesMove")).toEqual([
        [{ id: "a", x: 400, y: 300 }],
        [{ id: "a", x: 420, y: 300 }],
      ]);
    });
  });

  // Chromium drops focus when a focused element is re-inserted; the primitive gives it back after
  // a commit that reorders the nodes. A host move takes the same path as a key press, so run
  // several reorders and require that one physically moved the focused element.
  it("focus survives a host move that reorders the DOM", async () => {
    let focusedWasMoved = false;
    for (const target of ["a", "b", "c"]) {
      const mounted = mountCanvas({
        kind: "camera",
        nodes: [
          node("a", 100, 100, "Alpha"),
          node("b", 100, 200, "Beta"),
          node("c", 100, 300, "Gamma"),
        ],
      });
      await withMounted(mounted, async () => {
        const element = part(mounted, `node${target}`);
        const observer = new MutationObserver((records) => {
          if (records.some((record) => [...record.removedNodes].includes(element))) {
            focusedWasMoved = true;
          }
        });
        observer.observe(part(mounted, "layer"), { childList: true });
        element.focus();
        // reverse the rows: whichever node is focused changes its place
        mounted.canvas.setGeometry([
          { id: "a", y: 300 },
          { id: "c", y: 100 },
        ]);
        await settle();
        observer.disconnect();
        expect(domOrder(mounted)).toEqual(["nodec", "nodeb", "nodea"]);
        expect(document.activeElement).toBe(element);
      });
    }
    expect(focusedWasMoved).toBe(true);
  });

  // The auto-grow half of yvdy: the node being edited grows and the layout shifts it past a
  // neighbour. The focused element is the host's editor INSIDE the node, so the restore must give
  // the focus back to it (and not to the node, which would end the edit).
  it("a host move while editing keeps the editor focused and editing on", async () => {
    let editorWasMoved = false;
    for (const [target, y, expected] of [
      ["a", 500, ["nodeb", "nodec", "nodea"]],
      ["b", 500, ["nodea", "nodec", "nodeb"]],
      ["c", 50, ["nodec", "nodea", "nodeb"]],
    ] as const) {
      const mounted = mountCanvas({
        kind: "camera",
        editor: true,
        nodes: [
          node("a", 100, 100, "Alpha"),
          node("b", 100, 200, "Beta"),
          node("c", 100, 300, "Gamma"),
        ],
      });
      await withMounted(mounted, async () => {
        part(mounted, `node${target}`).focus();
        await userEvent.keyboard("{Enter}{F2}");
        await settle();
        expect(mounted.canvas.peek().editing).toBe(target);
        const editor = part(mounted, `editor${target}`);
        expect(document.activeElement).toBe(editor);
        const observer = new MutationObserver((records) => {
          if (
            records.some((record) =>
              [...record.removedNodes].includes(part(mounted, `node${target}`)),
            )
          ) {
            editorWasMoved = true;
          }
        });
        observer.observe(part(mounted, "layer"), { childList: true });
        // the edited node grows and the layout moves it past its neighbours
        mounted.canvas.setGeometry([{ id: target, y, height: 120 }]);
        await settle();
        observer.disconnect();
        expect(domOrder(mounted)).toEqual(expected);
        expect(mounted.canvas.peek().editing).toBe(target);
        expect(document.activeElement).toBe(editor);
      });
    }
    expect(editorWasMoved).toBe(true);
  });
});

describe("createCanvas setOrder (host-controlled paint order)", () => {
  const stacked = [
    node("a", 100, 100, "Alpha"),
    node("b", 100, 100, "Beta"),
    node("c", 400, 400, "Gamma"),
  ];

  it("decides z-index, the topmost hit and the DOM tie-break", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: stacked });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      expect(domOrder(mounted)).toEqual(["nodea", "nodeb", "nodec"]);
      expect(style(mounted, "b", "z-index")).toBe("1");
      canvas.pointerDown({ id: 1, x: 120, y: 120 });
      canvas.pointerUp(1);
      expect(canvas.peek().selection).toEqual(["b"]);

      canvas.setOrder(["c", "b", "a"]);
      await settle();
      expect(style(mounted, "a", "z-index")).toBe("2");
      expect(style(mounted, "b", "z-index")).toBe("1");
      expect(style(mounted, "c", "z-index")).toBe("0");
      // a and b share their place: the tie now resolves by paint order, bottom first
      expect(domOrder(mounted)).toEqual(["nodeb", "nodea", "nodec"]);
      canvas.pointerDown({ id: 1, x: 120, y: 120 });
      canvas.pointerUp(1);
      expect(canvas.peek().selection).toEqual(["a"]);
      // the selection, cursor and element identity are by node, not by position in the order
      expect(canvas.nodeProps("a").id).toBe(part(mounted, "nodea").id);
    });
  });

  it("keeps focus when the reorder moves the focused element", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: stacked });
    await withMounted(mounted, async () => {
      const element = part(mounted, "nodea");
      element.focus();
      mounted.canvas.setOrder(["b", "c", "a"]);
      await settle();
      expect(domOrder(mounted)).toEqual(["nodeb", "nodea", "nodec"]);
      expect(document.activeElement).toBe(element);
      expect(mounted.canvas.peek().cursor).toBe("a");
    });
  });

  it("throws unless the ids are every node exactly once, and changes nothing", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: stacked });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      expect(() => canvas.setOrder(["a", "b"])).toThrow("2 of 3");
      expect(() => canvas.setOrder(["a", "a", "b"])).toThrow("twice");
      expect(() => canvas.setOrder(["a", "b", "ghost"])).toThrow("ghost");
      await settle();
      expect(style(mounted, "a", "z-index")).toBe("0");
      expect(domOrder(mounted)).toEqual(["nodea", "nodeb", "nodec"]);
    });
  });
});

// effects-of-atmosphere-lcd8: membership is host-side and not in `pointer.qnt` (its node set is
// fixed at three), so insertion and removal are tested here, on the real DOM, and never replayed
// against the model.
describe("createCanvas addNodes / removeNodes (host-controlled membership)", () => {
  const trio = [
    node("a", 100, 100, "Alpha"),
    node("b", 100, 200, "Beta"),
    node("c", 100, 300, "Gamma"),
  ];

  const click = (mounted: CanvasMounted, x: number, y: number): void => {
    mounted.canvas.pointerDown({ id: 1, x, y });
    mounted.canvas.pointerUp(1);
  };
  const selectAB = (mounted: CanvasMounted): void => {
    click(mounted, 110, 110);
    mounted.canvas.setShift(true);
    click(mounted, 110, 210);
    mounted.canvas.setShift(false);
  };

  it("inserts on top, in spatial order, and leaves the others alone", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      const before = trio.map(({ id }) => part(mounted, `node${id}`).id);
      canvas.setGeometry([{ id: "b", x: 400 }]);
      canvas.addNodes([node("d", 100, 150, "Delta"), node("e", 700, 50, "Eps")]);
      await settle();
      // rows by y, then x
      expect(domOrder(mounted)).toEqual(["nodee", "nodea", "noded", "nodeb", "nodec"]);
      expect(canvas.nodeIds()).toEqual(["e", "a", "d", "b", "c"]);
      expect(style(mounted, "d", "z-index")).toBe("3");
      expect(style(mounted, "e", "z-index")).toBe("4");
      expect(style(mounted, "a", "z-index")).toBe("0");
      // the survivors are the same elements, with the same DOM ids and the position they had
      expect(trio.map(({ id }) => part(mounted, `node${id}`).id)).toEqual(before);
      expect(new Set([...before, part(mounted, "noded").id]).size).toBe(4);
      expect(style(mounted, "b", "--node-x")).toBe("400");
      expect(canvas.position("d")).toEqual({ x: 100, y: 150 });
      expect(part(mounted, "noded").getAttribute("aria-label")).toBe("Delta");
      // hit testing and paint order know the new node: d overlaps a/b rows and wins the topmost hit
      click(mounted, 110, 160);
      expect(canvas.peek().selection).toEqual(["d"]);
      expect(canvas.peek().cursor).toBe("d");
    });
  });

  it("takes role and role description from the input, with the defaults", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      mounted.canvas.addNodes([
        {
          ...node("d", 500, 100, "Delta"),
          role: "option",
          roleDescription: "card",
        },
        node("e", 500, 200, "Eps"),
      ]);
      await settle();
      expect(part(mounted, "noded").getAttribute("role")).toBe("option");
      expect(part(mounted, "noded").getAttribute("aria-roledescription")).toBe("card");
      expect(part(mounted, "nodee").getAttribute("role")).toBe("group");
      expect(part(mounted, "nodee").getAttribute("aria-roledescription")).toBe("canvas node");
    });
  });

  it("clamps an inserted node into the world bound and reports the clamp", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      canvas.addNodes([node("d", 5_000_000, -5_000_000, "Delta"), node("e", 10.5, 20, "Eps")]);
      await settle();
      expect(canvas.position("d")).toEqual({ x: 999_900, y: -1_000_000 });
      expect(canvas.position("e")).toEqual({ x: 11, y: 20 });
      // only the clamped one is reported: e moved only by the half-up rounding of its input
      expect(mounted.events.get("onNodesMove")).toEqual([
        [
          { id: "d", x: 999_900, y: -1_000_000 },
          { id: "e", x: 11, y: 20 },
        ],
      ]);
      // a later size change keeps it inside the bound, like any node
      canvas.setGeometry([{ id: "d", width: 400 }]);
      await settle();
      expect(canvas.position("d").x).toBe(999_600);
    });
  });

  it("throws on a bad insert before changing anything", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      expect(() => canvas.addNodes([node("d", 1, 1, "Delta"), node("a", 2, 2, "again")])).toThrow(
        '"a"',
      );
      expect(() => canvas.addNodes([node("d", 1, 1, "Delta"), node("d", 2, 2, "twice")])).toThrow(
        '"d"',
      );
      expect(() =>
        canvas.addNodes([node("d", 1, 1, "Delta"), node("e", Number.NaN, 2, "Eps")]),
      ).toThrow("finite");
      await settle();
      expect(domOrder(mounted)).toEqual(["nodea", "nodeb", "nodec"]);
      expect(() => canvas.position("d")).toThrow('"d"');
      // nothing was half-added: the id is still free
      canvas.addNodes([node("d", 1, 1, "Delta")]);
      await settle();
      expect(domOrder(mounted)).toContain("noded");
    });
  });

  it("removes nodes: the elements go, the survivors keep their ids and the order closes up", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      const kept = [part(mounted, "nodea"), part(mounted, "nodec")];
      const ids = kept.map((element) => element.id);
      canvas.removeNodes(["b"]);
      await settle();
      expect(domOrder(mounted)).toEqual(["nodea", "nodec"]);
      expect(canvas.nodeIds()).toEqual(["a", "c"]);
      expect(kept.map((element) => element.id)).toEqual(ids);
      expect(kept.every((element) => element.isConnected)).toBe(true);
      expect(style(mounted, "a", "z-index")).toBe("0");
      expect(style(mounted, "c", "z-index")).toBe("1");
      expect(style(mounted, "c", "--node-y")).toBe("300");
      // the place b had is empty now
      click(mounted, 110, 210);
      expect(canvas.peek().selection).toEqual([]);
      expect(() => canvas.position("b")).toThrow('"b"');
      expect(() => canvas.isSelected("b")).toThrow('"b"');
      // and the survivors still work
      click(mounted, 110, 310);
      expect(canvas.peek().selection).toEqual(["c"]);
      canvas.setGeometry([{ id: "c", x: 50 }]);
      await settle();
      expect(style(mounted, "c", "--node-x")).toBe("50");
    });
  });

  it("keeps the paint order of the survivors when it was reordered", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      mounted.canvas.setOrder(["c", "a", "b"]);
      mounted.canvas.removeNodes(["a"]);
      await settle();
      expect(style(mounted, "c", "z-index")).toBe("0");
      expect(style(mounted, "b", "z-index")).toBe("1");
      mounted.canvas.addNodes([node("d", 600, 100, "Delta")]);
      await settle();
      expect(style(mounted, "d", "z-index")).toBe("2");
    });
  });

  it("throws on a bad removal before changing anything", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      expect(() => canvas.removeNodes(["a", "ghost"])).toThrow("ghost");
      expect(() => canvas.removeNodes(["a", "a"])).toThrow("twice");
      await settle();
      expect(domOrder(mounted)).toEqual(["nodea", "nodeb", "nodec"]);
      // removing nothing is not an error
      canvas.removeNodes([]);
      canvas.addNodes([]);
      expect(canvas.nodeIds()).toEqual(["a", "b", "c"]);
    });
  });

  it("a removed id leaves the selection, which is announced and reported once", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      selectAB(mounted);
      await settle();
      expect(canvas.peek().selection).toEqual(["a", "b"]);
      const announced = canvas.peek().announcements;
      canvas.removeNodes(["a"]);
      await settle();
      expect(canvas.peek().selection).toEqual(["b"]);
      expect(canvas.isSelected("b")).toBe(true);
      expect(part(mounted, "nodeb").getAttribute("aria-selected")).toBe("true");
      expect(canvas.peek().announcements).toBe(announced + 1);
      expect(part(mounted, "live").textContent).toBe("Beta selected");
      expect(mounted.events.get("onSelectionChange")?.at(-1)).toEqual(["b"]);
      // a node that was not selected going away says nothing
      canvas.removeNodes(["c"]);
      await settle();
      expect(canvas.peek().announcements).toBe(announced + 1);
      expect(canvas.peek().selection).toEqual(["b"]);
    });
  });

  it("survivors keep their selection when nodes are inserted before them", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      selectAB(mounted);
      const announced = canvas.peek().announcements;
      canvas.addNodes([node("z", 600, 0, "Zed")]);
      await settle();
      expect(canvas.peek().selection).toEqual(["a", "b"]);
      expect(canvas.isSelected("z")).toBe(false);
      expect(canvas.peek().announcements).toBe(announced);
      // a removed id that comes back is a new node: not selected
      canvas.removeNodes(["a"]);
      canvas.addNodes([node("a", 100, 100, "Alpha")]);
      await settle();
      expect(canvas.peek().selection).toEqual(["b"]);
      expect(canvas.isSelected("a")).toBe(false);
    });
  });

  it("clears the cursor when its node is removed, and keeps it otherwise", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      click(mounted, 110, 210);
      expect(canvas.peek().cursor).toBe("b");
      canvas.removeNodes(["a"]);
      await settle();
      expect(canvas.peek().cursor).toBe("b");
      canvas.removeNodes(["b"]);
      await settle();
      expect(canvas.peek().cursor).toBeNull();
      expect(canvas.peek().selection).toEqual([]);
    });
  });

  it("clears editing when the edited node is removed, and keeps the editor focused otherwise", async () => {
    const mounted = mountCanvas({ kind: "camera", editor: true, nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      part(mounted, "nodeb").focus();
      await userEvent.keyboard("{Enter}{F2}");
      await settle();
      expect(canvas.peek().editing).toBe("b");
      const editor = part(mounted, "editorb");
      expect(document.activeElement).toBe(editor);
      // a node before the edited one goes away and another is inserted before it
      canvas.removeNodes(["a"]);
      canvas.addNodes([node("z", 100, 0, "Zed")]);
      await settle();
      expect(canvas.peek().editing).toBe("b");
      expect(document.activeElement).toBe(editor);
      canvas.removeNodes(["b"]);
      await settle();
      expect(canvas.peek().editing).toBeNull();
      expect(canvas.peek().cursor).toBeNull();
      expect(mounted.root.querySelector('[data-part="editorb"]')).toBeNull();
    });
  });

  // Chromium drops focus when a focused element is re-inserted; the commit gives it back. Insertion
  // and removal go through the same path as a reorder, so several targets are tried.
  it("a surviving focused node keeps focus through an insert and a remove", async () => {
    for (const target of ["a", "b", "c"]) {
      const mounted = mountCanvas({ kind: "camera", nodes: trio });
      await withMounted(mounted, async () => {
        const element = part(mounted, `node${target}`);
        element.focus();
        const other = target === "a" ? "c" : "a";
        mounted.canvas.addNodes([node("z", 100, 0, "Zed"), node("y", 100, 250, "Why")]);
        await settle();
        expect(document.activeElement).toBe(element);
        expect(mounted.canvas.peek().cursor).toBe(target);
        mounted.canvas.removeNodes([other, "z"]);
        await settle();
        expect(document.activeElement).toBe(element);
        expect(mounted.canvas.peek().cursor).toBe(target);
        // the focus handler still resolves the right node after the indices shifted
        await userEvent.keyboard("{ArrowRight}");
        await settle();
        expect(mounted.canvas.position(target).x).toBe(110);
      });
    }
  });

  it("keeps the focused element focused when an insert re-orders the DOM around it", async () => {
    let focusedWasMoved = false;
    for (const target of ["a", "b", "c"]) {
      const mounted = mountCanvas({ kind: "camera", nodes: trio });
      await withMounted(mounted, async () => {
        const element = part(mounted, `node${target}`);
        const observer = new MutationObserver((records) => {
          if (records.some((record) => [...record.removedNodes].includes(element))) {
            focusedWasMoved = true;
          }
        });
        observer.observe(part(mounted, "layer"), { childList: true });
        element.focus();
        // the inserted nodes land before and after every row, and one in the middle
        mounted.canvas.addNodes([
          node("x", 100, 0, "Ex"),
          node("y", 100, 250, "Why"),
          node("z", 100, 400, "Zed"),
        ]);
        await settle();
        observer.disconnect();
        expect(domOrder(mounted)).toEqual(["nodex", "nodea", "nodeb", "nodey", "nodec", "nodez"]);
        expect(document.activeElement).toBe(element);
      });
    }
    expect(focusedWasMoved).toBe(true);
  });

  it("removing the focused node drops focus without throwing", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      part(mounted, "nodeb").focus();
      expect(mounted.canvas.peek().cursor).toBe("b");
      mounted.canvas.removeNodes(["b"]);
      await settle();
      expect(document.activeElement).not.toBe(part(mounted, "nodea"));
      expect(mounted.canvas.peek().cursor).toBeNull();
      part(mounted, "nodec").focus();
      expect(mounted.canvas.peek().cursor).toBe("c");
    });
  });

  it("removing the pressed node cancels the gesture, and nothing else moves", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      selectAB(mounted);
      await settle();
      canvas.pointerDown({ id: 7, x: 110, y: 210 });
      canvas.pointerMove({ id: 7, x: 160, y: 210 });
      await settle();
      expect(canvas.peek().mode).toBe("dragging");
      expect(canvas.position("a")).toEqual({ x: 150, y: 100 });
      canvas.removeNodes(["b"]);
      await settle();
      expect(canvas.peek().mode).toBe("idle");
      expect(canvas.peek().owner).toBeNull();
      expect(canvas.position("a")).toEqual({ x: 100, y: 100 });
      canvas.pointerUp(7);
      await settle();
      expect(mounted.events.get("onNodesMove")).toBeUndefined();
      expect(canvas.peek().selection).toEqual(["a"]);
    });
  });

  it("removing another node leaves a running drag going", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      canvas.pointerDown({ id: 7, x: 110, y: 210 });
      canvas.pointerMove({ id: 7, x: 160, y: 210 });
      canvas.removeNodes(["a"]);
      await settle();
      expect(canvas.peek().mode).toBe("dragging");
      expect(canvas.position("b")).toEqual({ x: 150, y: 200 });
      canvas.pointerUp(7);
      await settle();
      expect(mounted.events.get("onNodesMove")).toEqual([[{ id: "b", x: 150, y: 200 }]]);
    });
  });

  it("a running marquee picks up an inserted node", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      canvas.pointerDown({ id: 7, x: 0, y: 0 });
      canvas.pointerMove({ id: 7, x: 400, y: 170 });
      await settle();
      expect(canvas.peek().mode).toBe("marquee");
      expect(canvas.peek().selection).toEqual(["a"]);
      canvas.addNodes([node("z", 200, 20, "Zed")]);
      await settle();
      expect(canvas.peek().selection).toEqual(["a", "z"]);
      canvas.pointerUp(7);
      await settle();
      expect(canvas.peek().selection).toEqual(["a", "z"]);
    });
  });

  it("a position reported before a removal is reported by id, not by place", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: trio });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      canvas.removeNodes(["a"]);
      await settle();
      // c is now the second node; only c moved
      canvas.setGeometry([{ id: "c", x: 5 }]);
      await settle();
      expect(mounted.events.get("onNodesMove")).toEqual([[{ id: "c", x: 5, y: 300 }]]);
    });
  });

  it("works from an empty canvas to a full one and back", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: [] });
    await withMounted(mounted, async () => {
      const { canvas } = mounted;
      expect(domOrder(mounted)).toEqual([]);
      canvas.addNodes(trio);
      await settle();
      expect(domOrder(mounted)).toEqual(["nodea", "nodeb", "nodec"]);
      canvas.removeNodes(["a", "b", "c"]);
      await settle();
      expect(domOrder(mounted)).toEqual([]);
      expect(canvas.peek().culled).toEqual([]);
    });
  });
});
