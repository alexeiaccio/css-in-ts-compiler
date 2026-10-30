import { createSignal, flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";
import { type Knob, type KnobOptions, createKnob } from "../src/knob";

// No APG pattern exists for a dial: `role=slider` is the closest role WAI-ARIA
// has, so there is no Quint spec to replay. This file is the oracle: it mounts
// the primitive on a real 200x200 knob in Chromium and drives real
// `KeyboardEvent`, `PointerEvent` and `WheelEvent`s at it.

const SIZE = 200;

const mount = (options: KnobOptions = {}) => {
  const root = document.createElement("div");
  root.style.cssText = "position: absolute; left: 0; top: 0";
  document.body.append(root);
  let api: Knob | undefined;
  const dispose = render(() => {
    const knob = createKnob(options);
    api = knob;
    return (
      <>
        <div
          {...knob.knobProps}
          data-part="knob"
          style={{ width: `${SIZE}px`, height: `${SIZE}px` }}
        />
        <span {...knob.valueProps} data-part="value">
          {knob.value()}
        </span>
      </>
    );
  }, root);

  return {
    api: (): Knob => {
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

const key = (element: HTMLElement, name: string): boolean =>
  element.dispatchEvent(
    new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }),
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

const wheel = (element: HTMLElement, deltaY: number): boolean =>
  element.dispatchEvent(new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true }));

const at = (element: HTMLElement, x: number, y: number): [number, number] => {
  const rect = element.getBoundingClientRect();
  return [rect.left + x, rect.top + y];
};

// A drag from `from` to `to` and released, with the mode locked on the move.
const drag = (
  element: HTMLElement,
  from: readonly [number, number],
  to: readonly [number, number],
): void => {
  pointer(element, "pointerdown", at(element, from[0], from[1]));
  pointer(element, "pointermove", at(element, to[0], to[1]));
  pointer(element, "pointerup", at(element, to[0], to[1]));
};

describe("createKnob", () => {
  it("is a labelled role=slider with a live value", () => {
    const { part, dispose } = mount();
    const knob = part("knob");
    const value = part("value");

    expect(knob.getAttribute("role")).toBe("slider");
    expect(knob.tabIndex).toBe(0);
    expect(knob.getAttribute("aria-valuemin")).toBe("0");
    expect(knob.getAttribute("aria-valuemax")).toBe("100");
    expect(knob.getAttribute("aria-valuenow")).toBe("50");
    expect(knob.getAttribute("aria-valuetext")).toBe("50");
    expect(knob.getAttribute("aria-label")).toBe("Knob");
    expect(value.getAttribute("role")).toBe("status");
    expect(value.getAttribute("aria-live")).toBe("polite");
    expect(value.getAttribute("hidden")).toBeNull();
    dispose();
  });

  it("takes a name and a formatter", () => {
    const { api, part, dispose } = mount({
      labels: { knob: "Volume" },
      format: (value) => `${value}%`,
    });
    expect(part("knob").getAttribute("aria-label")).toBe("Volume");
    expect(part("knob").getAttribute("aria-valuetext")).toBe("50%");

    key(part("knob"), "ArrowUp");
    flush();
    expect(api().value()).toBe(51);
    expect(part("knob").getAttribute("aria-valuetext")).toBe("51%");
    expect(part("value").textContent).toBe("51");
    dispose();
  });

  it("steps with the arrows, jumps with PageUp/PageDown and Home/End, and clamps", () => {
    const { api, part, dispose } = mount();
    const knob = part("knob");

    expect(key(knob, "ArrowRight")).toBe(false);
    expect(api().value()).toBe(51);
    expect(key(knob, "ArrowUp")).toBe(false);
    expect(api().value()).toBe(52);
    key(knob, "ArrowLeft");
    key(knob, "ArrowDown");
    expect(api().value()).toBe(50);
    key(knob, "PageUp");
    expect(api().value()).toBe(60);
    key(knob, "PageDown");
    expect(api().value()).toBe(50);
    key(knob, "End");
    expect(api().value()).toBe(100);
    key(knob, "ArrowUp");
    expect(api().value()).toBe(100);
    key(knob, "Home");
    expect(api().value()).toBe(0);
    key(knob, "ArrowDown");
    expect(api().value()).toBe(0);
    // an unhandled key stays the page's (no preventDefault)
    expect(key(knob, "Tab")).toBe(true);
    dispose();
  });

  it("takes a custom step and range", () => {
    const { api, part, dispose } = mount({ min: -50, max: 50, step: 5, defaultValue: 0 });
    const knob = part("knob");

    expect(knob.getAttribute("aria-valuemin")).toBe("-50");
    expect(knob.getAttribute("aria-valuemax")).toBe("50");
    key(knob, "ArrowUp");
    expect(api().value()).toBe(5);
    key(knob, "PageUp");
    expect(api().value()).toBe(50);
    key(knob, "PageUp");
    expect(api().value()).toBe(50);
    dispose();
  });

  it("holds the prop in controlled mode when the host rejects the request", () => {
    const requests: number[] = [];
    const [held, setHeld] = createSignal(50);
    const { api, part, dispose } = mount({
      get value() {
        return held();
      },
      onValueChange: (value) => requests.push(value),
    });
    const knob = part("knob");

    key(knob, "ArrowUp");
    flush();
    expect(requests).toEqual([51]);
    expect(api().value()).toBe(50);
    expect(knob.getAttribute("aria-valuenow")).toBe("50");

    // the host writes back: this is the only thing that moves a controlled value
    setHeld(75);
    flush();
    expect(api().value()).toBe(75);
    expect(knob.getAttribute("aria-valuenow")).toBe("75");

    key(knob, "ArrowUp");
    flush();
    expect(requests).toEqual([51, 76]);
    expect(api().value()).toBe(75);
    dispose();
  });

  it("changes the value in the direction the pointer spins", () => {
    const { api, part, dispose } = mount();
    const knob = part("knob");

    // grabbed at the right edge, a quarter turn down the screen is clockwise
    drag(knob, [200, 100], [100, 200]);
    expect(api().value()).toBe(75);

    api().setValue(50);
    flush();
    // grabbed at the right edge, a quarter turn up the screen is counter-clockwise
    drag(knob, [200, 100], [100, 0]);
    expect(api().value()).toBe(25);
    dispose();
  });

  it("locks a vertical slide and keeps tracking it", () => {
    const { api, part, dispose } = mount();
    const knob = part("knob");

    // from the top of the knob, straight down: radial, so a slide, not a spin
    pointer(knob, "pointerdown", at(knob, 100, 20));
    pointer(knob, "pointermove", at(knob, 100, 60));
    expect(api().value()).toBe(70);
    pointer(knob, "pointermove", at(knob, 140, 88));
    // still vertical: the 28 px down count, the 40 px right do not
    expect(api().value()).toBe(84);
    pointer(knob, "pointerup", at(knob, 140, 88));
    dispose();
  });

  it("slides horizontally with opposite signs on each side of the knob", () => {
    const { api, part, dispose } = mount();
    const knob = part("knob");

    // the right half: rightwards is clockwise
    drag(knob, [180, 100], [220, 100]);
    expect(api().value()).toBe(70);

    api().setValue(50);
    flush();
    // the left half: rightwards is counter-clockwise
    drag(knob, [20, 100], [60, 100]);
    expect(api().value()).toBe(30);
    dispose();
  });

  it("steps with the wheel and keeps the page from scrolling", () => {
    const { api, part, dispose } = mount();
    const knob = part("knob");

    expect(wheel(knob, -100)).toBe(false);
    expect(api().value()).toBe(51);
    expect(wheel(knob, 100)).toBe(false);
    expect(api().value()).toBe(50);
    // a zero delta is not a step and stays the page's
    expect(wheel(knob, 0)).toBe(true);
    expect(api().value()).toBe(50);
    dispose();
  });

  it("wraps around when asked, and clamps by default", () => {
    const wrapped = mount({ wrap: true, defaultValue: 99 });
    key(wrapped.part("knob"), "ArrowUp");
    expect(wrapped.api().value()).toBe(0);
    key(wrapped.part("knob"), "ArrowDown");
    expect(wrapped.api().value()).toBe(99);
    expect(wrapped.api().percentOf(100)).toBe(0);
    expect(wrapped.api().percentOf(25)).toBe(0.25);
    wrapped.dispose();

    const clamped = mount({ defaultValue: 99 });
    key(clamped.part("knob"), "ArrowUp");
    expect(clamped.api().value()).toBe(100);
    key(clamped.part("knob"), "ArrowUp");
    expect(clamped.api().value()).toBe(100);
    clamped.dispose();
  });

  it("reports the rotation fraction of a value", () => {
    const { api, dispose } = mount({ defaultValue: 25 });
    expect(api().percentOf(0)).toBe(0);
    expect(api().percentOf(25)).toBe(0.25);
    expect(api().percentOf(50)).toBe(0.5);
    expect(api().percentOf(100)).toBe(1);
    expect(api().percentOf(-10)).toBe(0);
    expect(api().percentOf(110)).toBe(1);
    dispose();
  });
});
