import { flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";
import { type PanZoom, type PanZoomOptions, createPanZoom } from "../src/panzoom";

// No APG pattern exists for pan-zoom: there is no spec to replay and no ported
// scenario, so this file is the oracle. It mounts the primitive on a real
// viewport in Chromium and drives real `KeyboardEvent` / `PointerEvent` /
// `WheelEvent`s at it, because the accessible contract (a focusable viewport,
// keyboard operations, a live value) is only observable through the DOM.
//
// The viewport is 300x200 so the clamp bounds at scale 2 are exactly
// (150, 100) and a 24 px arrow step is a whole number.

const WIDTH = 300;
const HEIGHT = 200;

const mount = (options: PanZoomOptions = {}) => {
  const root = document.createElement("div");
  document.body.append(root);
  let api: PanZoom | undefined;
  const dispose = render(() => {
    const panzoom = createPanZoom(options);
    api = panzoom;
    return (
      <div
        {...panzoom.viewportProps}
        data-part="viewport"
        style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
      >
        <img {...panzoom.imageProps} data-part="image" alt="" width={WIDTH} height={HEIGHT} />
        <span {...panzoom.valueProps} data-part="value">
          {panzoom.value()}
        </span>
      </div>
    );
  }, root);

  return {
    api: (): PanZoom => {
      if (api === undefined) {
        throw new Error("the primitive did not mount");
      }
      return api;
    },
    part: (name: string): HTMLElement => {
      const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
      if (element === null) {
        throw new Error(`no part ${name}`);
      }
      return element;
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const key = (element: HTMLElement, name: string, shiftKey = false): boolean =>
  element.dispatchEvent(
    new KeyboardEvent("keydown", { key: name, shiftKey, bubbles: true, cancelable: true }),
  );

const pointer = (
  element: HTMLElement,
  type: string,
  at: readonly [number, number],
  pointerId = 7,
): boolean =>
  element.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: at[0],
      clientY: at[1],
    }),
  );

const at = (element: HTMLElement, x: number, y: number): [number, number] => {
  const rect = element.getBoundingClientRect();
  return [rect.left + x, rect.top + y];
};

describe("createPanZoom", () => {
  it("makes the viewport the focusable, named control and the value a live region", () => {
    const { api, part, dispose } = mount();
    const viewport = part("viewport");
    const value = part("value");

    expect(viewport.tabIndex).toBe(0);
    expect(viewport.getAttribute("role")).toBe("group");
    expect(viewport.getAttribute("aria-roledescription")).toBe("zoomable image");
    expect(viewport.getAttribute("aria-label")).toBe("Image");
    expect(viewport.getAttribute("aria-describedby")).toBe(value.id);
    expect(value.getAttribute("role")).toBe("status");
    expect(value.getAttribute("aria-live")).toBe("polite");
    expect(value.getAttribute("hidden")).toBeNull();
    expect(api().value()).toBe("100%");

    viewport.focus();
    expect(document.activeElement).toBe(viewport);
    dispose();
  });

  it("takes a label for the viewport", () => {
    const { part, dispose } = mount({ labels: { viewport: "Portrait of a stranger" } });
    expect(part("viewport").getAttribute("aria-label")).toBe("Portrait of a stranger");
    dispose();
  });

  it("zooms in with + / =, out with -, and resets with 0", () => {
    const { api, part, dispose } = mount();
    const viewport = part("viewport");

    expect(key(viewport, "+")).toBe(false);
    expect(api().scale()).toBe(1.25);
    expect(key(viewport, "=")).toBe(false);
    expect(api().scale()).toBe(1.5);
    expect(key(viewport, "-")).toBe(false);
    expect(api().scale()).toBe(1.25);
    expect(key(viewport, "0")).toBe(false);
    expect(api().scale()).toBe(1);
    // an unhandled key stays the page's (no preventDefault)
    expect(key(viewport, "Tab")).toBe(true);
    dispose();
  });

  it("clamps the scale at min and max", () => {
    const { api, part, dispose } = mount();
    const viewport = part("viewport");
    for (let i = 0; i < 20; i += 1) {
      key(viewport, "+");
    }
    expect(api().scale()).toBe(4);
    for (let i = 0; i < 20; i += 1) {
      key(viewport, "-");
    }
    expect(api().scale()).toBe(1);
    dispose();
  });

  it("updates the live value and the image transform", () => {
    const { api, part, dispose } = mount();
    const viewport = part("viewport");

    key(viewport, "+");
    key(viewport, "+");
    flush();

    expect(api().value()).toBe("150%");
    expect(part("value").textContent).toBe("150%");
    expect(part("image").style.transform).toBe("translate(0px, 0px) scale(1.5)");
    dispose();
  });

  it("pans with the arrows, further with Shift", () => {
    const { api, part, dispose } = mount();
    const viewport = part("viewport");
    api().setScale(2);

    key(viewport, "ArrowRight");
    expect(api().offset()).toEqual({ x: 24, y: 0 });
    key(viewport, "ArrowRight", true);
    expect(api().offset()).toEqual({ x: 120, y: 0 });
    key(viewport, "ArrowLeft");
    expect(api().offset()).toEqual({ x: 96, y: 0 });
    key(viewport, "ArrowDown");
    expect(api().offset()).toEqual({ x: 96, y: 24 });
    key(viewport, "ArrowUp", true);
    expect(api().offset()).toEqual({ x: 96, y: -72 });
    dispose();
  });

  it("keeps the image covering the viewport (no gap) when it is dragged", () => {
    const { api, part, dispose } = mount();
    const viewport = part("viewport");
    api().setScale(2);

    pointer(viewport, "pointerdown", at(viewport, 150, 100));
    pointer(viewport, "pointermove", at(viewport, 400, 300));
    expect(api().offset()).toEqual({ x: 150, y: 100 });
    pointer(viewport, "pointerup", at(viewport, 400, 300));
    dispose();
  });

  it("moves the offset with a pointer drag and stops at pointerup", () => {
    const { api, part, dispose } = mount();
    const viewport = part("viewport");
    api().setScale(2);

    pointer(viewport, "pointerdown", at(viewport, 150, 100));
    pointer(viewport, "pointermove", at(viewport, 180, 110));
    expect(api().offset()).toEqual({ x: 30, y: 10 });
    pointer(viewport, "pointerup", at(viewport, 180, 110));
    pointer(viewport, "pointermove", at(viewport, 220, 130));
    expect(api().offset()).toEqual({ x: 30, y: 10 });
    dispose();
  });

  it("lets the image leave the viewport with bounds: free", () => {
    const { api, part, dispose } = mount({ bounds: "free" });
    const viewport = part("viewport");

    pointer(viewport, "pointerdown", at(viewport, 150, 100));
    pointer(viewport, "pointermove", at(viewport, 250, 160));
    pointer(viewport, "pointerup", at(viewport, 250, 160));
    expect(api().offset()).toEqual({ x: 100, y: 60 });
    dispose();
  });

  it("zooms on ctrl/meta wheel and leaves a bare wheel to the page", () => {
    const { api, part, dispose } = mount();
    const viewport = part("viewport");
    const wheel = (init: WheelEventInit): boolean =>
      viewport.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init }));

    expect(wheel({ deltaY: -100 })).toBe(true);
    expect(api().scale()).toBe(1);
    expect(wheel({ deltaY: -100, ctrlKey: true })).toBe(false);
    expect(api().scale()).toBeCloseTo(1.1);
    expect(wheel({ deltaY: 100, metaKey: true })).toBe(false);
    expect(api().scale()).toBeCloseTo(1);
    dispose();
  });

  it("resets the scale and the pan on a double click", () => {
    const { api, part, dispose } = mount();
    const viewport = part("viewport");
    api().setScale(3);
    key(viewport, "ArrowRight");

    viewport.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    expect(api().scale()).toBe(1);
    expect(api().offset()).toEqual({ x: 0, y: 0 });
    dispose();
  });

  it("asks a controlled host for the scale and holds when the host does not answer", () => {
    const changes: number[] = [];
    const panzoom = createPanZoom({ scale: 1.5, onScaleChange: (next) => changes.push(next) });
    panzoom.zoomIn();
    expect(panzoom.scale()).toBe(1.5);
    expect(changes).toEqual([1.75]);
  });
});
