import type { Scene, SceneNode } from "./scene";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { centreOf, mountScene, pointer, settle, wheel } from "./canvas.nested.fixture";
import type { SceneMounted } from "./canvas.nested.fixture";
import { ZONE } from "../src";
import { userEvent } from "vite-plus/test/browser";

const NESTED_URI = "at://did:plc:abc123/example.canvas.scene/3knest";
const URI_A = "at://did:plc:abc123/example.canvas.scene/3ka";
const URI_B = "at://did:plc:abc123/example.canvas.scene/3kb";

const text = (id: string, x: number, y: number): SceneNode => ({
  id,
  x,
  y,
  width: 80,
  height: 60,
  order: 0,
  content: { kind: "text", text: id },
});

const canvasNode = (id: string, scene: string): SceneNode => ({
  id,
  x: 10,
  y: 10,
  width: 120,
  height: 100,
  order: 0,
  content: { kind: "canvas", scene },
});

const sceneOf = (nodes: readonly SceneNode[]): Scene => ({ nodes });

// The outer scene: a frame holding a nested canvas, and a plain note beside it.
const outer = sceneOf([
  {
    id: "frame",
    x: 20,
    y: 20,
    width: 220,
    height: 180,
    order: 1,
    content: { kind: "canvas", scene: NESTED_URI },
  },
  text("side", 260, 20),
]);
const nested = sceneOf([text("n1", 10, 10), text("n2", 110, 10)]);

const FRAME = "outer.frame";
const POINTER = 7;

let mounted: SceneMounted | undefined;
afterEach(() => {
  mounted?.dispose();
  mounted = undefined;
});

const mount = async (scenes: Record<string, Scene>): Promise<SceneMounted> => {
  mounted = mountScene({ scene: outer, scenes });
  await settle();
  return mounted;
};

const shifted = (
  at: readonly [number, number],
  dx: number,
  dy: number,
): readonly [number, number] => [at[0] + dx, at[1] + dy];

describe("a #canvas node renders as a real canvas inside its frame", () => {
  it("mounts a second createCanvas in the node body, with its own nodes and camera", async () => {
    const m = await mount({ [NESTED_URI]: nested });
    const frame = m.node("outer", "frame");
    const inner = m.viewport(FRAME);
    expect(frame.contains(inner)).toBe(true);
    expect(frame.getAttribute("aria-roledescription")).toBe("nested canvas");
    expect(inner.getAttribute("role")).toBe("region");
    expect(inner.getAttribute("aria-label")).toBe("Nested canvas 3knest");
    expect(m.canvas(FRAME).nodeIds()).toEqual(["n1", "n2"]);
    expect(m.node(FRAME, "n1").getAttribute("aria-label")).toBe("n1");
    expect(frame.contains(m.node(FRAME, "n2"))).toBe(true);
    // the outer canvas knows the frame, never the nodes inside it
    expect(m.canvas("outer").nodeIds()).toEqual(["frame", "side"]);
    expect(m.canvas(FRAME).peek().camera.z).toBe(ZONE);
    expect(m.canvas(FRAME).peek().viewport).toEqual({
      width: 220,
      height: 180,
    });
  });

  it("keeps an unresolved scene a labelled figure", async () => {
    const m = await mount({});
    expect(m.root.querySelector('[data-part="viewport:outer.frame"]')).toBeNull();
    expect(m.node("outer", "frame").getAttribute("aria-label")).toBe("Nested canvas 3knest");
  });
});

describe("the innermost canvas whose viewport contains the target owns the event", () => {
  it("a press inside the nested canvas starts a nested gesture, never an outer one", async () => {
    const m = await mount({ [NESTED_URI]: nested });
    const n1 = m.node(FRAME, "n1");
    const start = centreOf(n1);

    pointer(n1, "pointerdown", POINTER, start);
    expect(m.canvas(FRAME).peek()).toMatchObject({
      mode: "pointing",
      owner: POINTER,
    });
    expect(m.canvas("outer").peek()).toMatchObject({
      mode: "idle",
      owner: null,
    });

    pointer(n1, "pointermove", POINTER, shifted(start, 30, 0));
    expect(m.canvas(FRAME).peek().mode).toBe("dragging");
    expect(m.canvas("outer").peek().mode).toBe("idle");

    pointer(n1, "pointerup", POINTER, shifted(start, 30, 0));
    await settle();
    // the dragged node moved inside its own canvas; the frame did not
    expect(m.canvas(FRAME).position("n1")).toEqual({ x: 40, y: 10 });
    expect(m.canvas("outer").position("frame")).toEqual({ x: 20, y: 20 });
    expect(m.canvas(FRAME).peek().selection).toEqual(["n1"]);
    expect(m.canvas("outer").peek()).toMatchObject({
      selection: [],
      announcements: 0,
    });
  });

  it("a wheel inside the nested canvas zooms it and leaves the outer camera alone", async () => {
    const m = await mount({ [NESTED_URI]: nested });
    const outerBefore = m.canvas("outer").peek().camera;

    wheel(m.node(FRAME, "n1"), -100, centreOf(m.node(FRAME, "n1")));
    expect(m.canvas(FRAME).peek().camera.z).toBeGreaterThan(ZONE);
    expect(m.canvas("outer").peek().camera).toEqual(outerBefore);
  });

  it("the outer canvas still works everywhere else", async () => {
    const m = await mount({ [NESTED_URI]: nested });
    const nestedBefore = m.canvas(FRAME).peek();

    // a wheel on empty outer space zooms the outer canvas only
    const rect = m.viewport("outer").getBoundingClientRect();
    wheel(m.viewport("outer"), -100, [rect.left + 300, rect.top + 250]);
    expect(m.canvas("outer").peek().camera.z).toBeGreaterThan(ZONE);
    expect(m.canvas(FRAME).peek().camera).toEqual(nestedBefore.camera);
    await settle();

    // a press on the plain note selects it in the outer canvas
    const side = m.node("outer", "side");
    const at = centreOf(side);
    pointer(side, "pointerdown", POINTER, at);
    expect(m.canvas("outer").peek().owner).toBe(POINTER);
    expect(m.canvas(FRAME).peek().mode).toBe("idle");
    pointer(side, "pointerup", POINTER, at);
    await settle();
    expect(m.canvas("outer").peek().selection).toEqual(["side"]);
    expect(m.canvas(FRAME).peek().selection).toEqual([]);
  });

  it("an outer marquee over the frame selects the frame, not the nodes inside it", async () => {
    const m = await mount({ [NESTED_URI]: nested });
    const viewport = m.viewport("outer");
    const rect = viewport.getBoundingClientRect();
    const from: readonly [number, number] = [rect.left + 5, rect.top + 290];
    const to: readonly [number, number] = [rect.left + 250, rect.top + 10];

    pointer(viewport, "pointerdown", POINTER, from);
    pointer(viewport, "pointermove", POINTER, to);
    expect(m.canvas("outer").peek().mode).toBe("marquee");
    pointer(viewport, "pointerup", POINTER, to);
    await settle();
    expect(m.canvas("outer").peek().selection).toEqual(["frame"]);
    expect(m.canvas(FRAME).peek()).toMatchObject({
      mode: "idle",
      selection: [],
    });
  });

  it("an arrow key in the nested canvas moves its node, not the frame", async () => {
    const m = await mount({ [NESTED_URI]: nested });
    const n1 = m.node(FRAME, "n1");
    const at = centreOf(n1);
    pointer(n1, "pointerdown", POINTER, at);
    pointer(n1, "pointerup", POINTER, at);
    await settle();
    expect(document.activeElement).toBe(n1);

    await userEvent.keyboard("{ArrowRight}");
    await settle();
    expect(m.canvas(FRAME).position("n1")).toEqual({ x: 20, y: 10 });
    expect(m.canvas("outer").position("frame")).toEqual({ x: 20, y: 20 });
  });
});

describe("a nested canvas under a zoomed outer camera", () => {
  // `local()` divides the client delta by the viewport's rendered scale, so a press inside a
  // nested canvas under the outer camera's zoom lands in the nested viewport's own px.
  it("hits the node under the pointer", async () => {
    const m = await mount({ [NESTED_URI]: nested });
    m.canvas("outer").zoomTo(2 * ZONE, [0, 0]);
    await settle();
    const n1 = m.node(FRAME, "n1");
    const at = centreOf(n1);
    pointer(n1, "pointerdown", POINTER, at);
    pointer(n1, "pointerup", POINTER, at);
    await settle();
    expect(m.canvas(FRAME).peek().selection).toEqual(["n1"]);
  });

  it("drags the node by its own viewport px, not the scaled screen px", async () => {
    const m = await mount({ [NESTED_URI]: nested });
    m.canvas("outer").zoomTo(2 * ZONE, [0, 0]);
    await settle();
    const n1 = m.node(FRAME, "n1");
    const start = centreOf(n1);
    pointer(n1, "pointerdown", POINTER, start);
    pointer(n1, "pointermove", POINTER, shifted(start, 30, 0));
    pointer(n1, "pointerup", POINTER, shifted(start, 30, 0));
    await settle();
    // 30 screen px at the outer camera's x2 is 15 nested-viewport px, so n1 moves 15 units; the
    // frame it lives in does not move.
    expect(m.canvas(FRAME).position("n1")).toEqual({ x: 25, y: 10 });
    expect(m.canvas("outer").position("frame")).toEqual({ x: 20, y: 20 });
  });
});

describe("the scene reader stops on a nesting cycle", () => {
  it("renders a labelled figure instead of recursing A -> B -> A", async () => {
    const wrapper = sceneOf([canvasNode("toA", URI_A)]);
    const sceneA = sceneOf([canvasNode("toB", URI_B)]);
    const sceneB = sceneOf([canvasNode("toA", URI_A)]);
    const m = mountScene({
      scene: wrapper,
      scenes: { [URI_A]: sceneA, [URI_B]: sceneB },
    });
    mounted = m;
    await settle();

    // A and B each render once; B's reference back to A is a figure, not a third canvas.
    expect(m.viewport("outer.toA").getAttribute("role")).toBe("region");
    expect(m.viewport("outer.toA.toB").getAttribute("role")).toBe("region");
    expect(m.root.querySelector('[data-part="viewport:outer.toA.toB.toA"]')).toBeNull();
    const figure = m.root.querySelector('[data-part="figure:outer.toA.toB:toA"]');
    expect(figure).not.toBeNull();
    expect(figure?.textContent).toContain("repeats an ancestor scene");
  });
});

describe("focus: the nested canvas is one tab stop until it is entered explicitly", () => {
  it("Tab passes over the inner nodes; F2 on the selected frame lets Tab in, and leaving ends it", async () => {
    const m = await mount({ [NESTED_URI]: nested });
    const frame = m.node("outer", "frame");

    frame.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(m.node("outer", "side"));

    // Enter selects the focused frame, F2 enters it (toggleEdit)
    frame.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{F2}");
    await settle();
    expect(m.canvas("outer").peek().editing).toBe("frame");

    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(m.node(FRAME, "n1"));
    expect(m.canvas("outer").peek().editing).toBe("frame");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(m.node(FRAME, "n2"));

    // Tab from the last inner node leaves back to the next outer node and ends editing
    await userEvent.keyboard("{Tab}");
    await settle();
    expect(document.activeElement).toBe(m.node("outer", "side"));
    expect(m.canvas("outer").peek().editing).toBeNull();
    expect(m.node(FRAME, "n1").getAttribute("tabindex")).toBe("-1");
  });
});
