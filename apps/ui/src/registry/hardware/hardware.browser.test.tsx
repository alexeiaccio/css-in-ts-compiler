import type { JSX } from "@solidjs/web";
import { render } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { BarGraph } from "./bar-graph.tsx";
import { Device } from "./device.tsx";
import { Dial } from "./dial.tsx";
import { Faceplate } from "./faceplate.tsx";
import { Fader } from "./fader.tsx";
import { Key } from "./key.tsx";
import { Lcd } from "./lcd.tsx";
import { Led } from "./led.tsx";
import { Rocker } from "./rocker.tsx";
import { SlideSwitch } from "./slide-switch.tsx";

// The skin's own oracle: the primitives are checked in packages/headless, so this file never re-walks a pattern. It reads
// what the sheet hangs off the primitives' announced state — `aria-pressed`, `aria-checked`, `aria-valuenow`, `role` — and
// the attributes the skin adds (`data-part`, `data-state`), then drives the two interactive parts the way a reader does.

/** Solid applies setters and delegated events on a later tick; two frames let the paint settle before a style is read. */
const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** Polls until `done` holds, so the cap's travel is waited for rather than assumed. */
const waitFor = async (done: () => boolean, limit = 2000): Promise<void> => {
  const start = performance.now();
  while (!done()) {
    if (performance.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await frame();
  }
};

const lift = (element: HTMLElement): string =>
  getComputedStyle(element).getPropertyValue("--lift").trim();

interface Mounted {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

const mounted: Mounted[] = [];

const mount = (view: () => JSX.Element): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(view, root);
  const instance: Mounted = {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
  mounted.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of mounted.splice(0)) {
    instance.dispose();
  }
});

const part = (root: ParentNode, name: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`skin 01: no part "${name}"`);
  }
  return element;
};

/** Tabs in from nowhere, so the ring is the browser's `:focus-visible` and not a forced class. */
const tabTo = async (root: ParentNode, name: string): Promise<HTMLElement> => {
  (document.activeElement as HTMLElement | null)?.blur();
  await frame();
  await userEvent.keyboard("{Tab}");
  await frame();
  const element = part(root, name);
  expect(document.activeElement).toBe(element);
  return element;
};

// Contrast, as WCAG computes it: the colour is painted and read back, because a computed `oklch(...)` is not `rgb(...)`.
const canvas = document.createElement("canvas");
canvas.width = 1;
canvas.height = 1;
const context = canvas.getContext("2d", { willReadFrequently: true });

const channels = (colour: string): readonly [number, number, number] => {
  if (context === null) {
    throw new Error("skin 01: no 2d context");
  }
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = colour;
  context.fillRect(0, 0, 1, 1);
  const pixels = context.getImageData(0, 0, 1, 1).data;
  return [pixels[0] ?? 0, pixels[1] ?? 0, pixels[2] ?? 0];
};

const linear = (channel: number): number => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (colour: string): number => {
  const [red, green, blue] = channels(colour);
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
};

const contrastRatio = (a: string, b: string): number => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
};

const TRANSPARENT = /^rgba\([^)]*,\s*0\)$/;

/** The panel a ring stands on: the first opaque ancestor's background (the faceplate's own panel). */
const panelOf = (element: HTMLElement): string => {
  for (
    let current: HTMLElement | null = element;
    current !== null;
    current = current.parentElement
  ) {
    const colour = getComputedStyle(current).backgroundColor;
    if (colour !== "transparent" && !TRANSPARENT.test(colour)) {
      return colour;
    }
  }
  return "white";
};

describe("the set", () => {
  it("gives every part of the skin its name", () => {
    const { root } = mount(() => (
      <Faceplate title="Test unit">
        <Lcd tag="Level" value="40%">
          take 3
        </Lcd>
        <Led label="Signal present" legend="Sig" on />
        <BarGraph label="Signal level" value={50} segments={10} />
        <Key label="Mute the output" legend="Mute" isToggle />
        <Rocker label="Power" />
        <SlideSwitch label="Phantom power" />
        <Fader label="Level" min={0} max={100} defaultValue={40} />
        <Dial label="Tone" min={0} max={10} defaultValue={5} />
      </Faceplate>
    ));

    for (const name of [
      "faceplate",
      "faceplate-title",
      "lcd",
      "lcd-tag",
      "lcd-value",
      "lcd-body",
      "led",
      "led-lamp",
      "led-legend",
      "bar-graph",
      "bar-graph-segment",
      "key",
      "key-face",
      "key-legend",
      "rocker",
      "rocker-cap",
      "rocker-legend",
      "slide-switch",
      "slide-switch-slot",
      "slide-switch-lever",
      "slide-switch-legend",
      "fader",
      "fader-label",
      "fader-track",
      "fader-fill",
      "fader-scale",
      "fader-cap",
      "dial",
      "dial-label",
      "dial-knob",
      "dial-scale",
      "dial-pointer",
      "dial-readout",
      "dial-value",
    ]) {
      expect(root.querySelector(`[data-part="${name}"]`), name).not.toBeNull();
    }
  });

  it("makes a whole instrument out of the parts", () => {
    const { root } = mount(() => <Device />);
    expect(root.querySelector('[data-part="device"]')).not.toBeNull();
    expect(root.querySelectorAll('[data-part="key"]')).toHaveLength(3);
    expect(part(root, "lcd-value").getAttribute("role")).toBe("status");
  });

  it("makes the value a live region and the printed legend nothing of the sort", () => {
    const { root } = mount(() => (
      <Faceplate>
        <Lcd tag="Level" value="40%">
          take 3
        </Lcd>
      </Faceplate>
    ));

    const value = part(root, "lcd-value");
    expect(value.getAttribute("role")).toBe("status");
    expect(value.getAttribute("aria-live")).toBe("polite");
    for (const staticPart of [part(root, "lcd-tag"), part(root, "lcd-body")]) {
      expect(staticPart.getAttribute("role")).toBeNull();
      expect(staticPart.getAttribute("aria-live")).toBeNull();
    }
  });

  it("keeps the small switches' targets above 24 px (2.5.8)", () => {
    const { root } = mount(() => (
      <Faceplate>
        <Rocker label="Power" />
        <SlideSwitch label="Phantom power" offLabel="Off" onLabel="48V" />
      </Faceplate>
    ));
    for (const name of ["rocker", "slide-switch"]) {
      const box = part(root, name).getBoundingClientRect();
      expect(box.width, name).toBeGreaterThanOrEqual(24);
      expect(box.height, name).toBeGreaterThanOrEqual(24);
    }
  });

  it("lights a lamp in its state and names it", () => {
    const { root } = mount(() => (
      <Faceplate>
        <Led label="Signal present" legend="Sig" on />
        <Led label="Peak" legend="Peak" />
      </Faceplate>
    ));
    const [lit, dark] = [...root.querySelectorAll<HTMLElement>('[data-part="led"]')];
    expect(lit?.getAttribute("role")).toBe("img");
    expect(lit?.getAttribute("aria-label")).toBe("Signal present");
    expect(lit?.dataset.state).toBe("on");
    expect(dark?.dataset.state).toBe("off");
  });

  it("fills the graph's segments up to the value and sits in the panel", () => {
    const { root } = mount(() => (
      <Faceplate>
        <BarGraph label="Signal level" value={50} segments={10} />
      </Faceplate>
    ));
    const graph = part(root, "bar-graph");
    expect(graph.getAttribute("role")).toBe("meter");
    expect(graph.getAttribute("aria-valuenow")).toBe("50");
    const lit = [...graph.querySelectorAll<HTMLElement>('[data-part="bar-graph-segment"]')].map(
      (segment) => segment.style.getPropertyValue("--v"),
    );
    expect(lit.filter((value) => value === "1")).toHaveLength(5);
    expect([...graph.children]).toHaveLength(10);
    // the graph is the widest thing on the row: it takes the room the screen leaves
    expect(getComputedStyle(graph).flexGrow).toBe("1");
  });
});

describe("the key", () => {
  it("is a button with a name, and its latch is the announced aria-pressed", async () => {
    const { root } = mount(() => (
      <Faceplate>
        <Key label="Mute the output" legend="Mute" isToggle />
        <Key label="Arm" />
      </Faceplate>
    ));
    const [latch, command] = [...root.querySelectorAll<HTMLElement>('[data-part="key"]')];
    expect(latch?.getAttribute("role")).toBe("button");
    expect(latch?.getAttribute("aria-label")).toBe("Mute the output");
    expect(latch?.getAttribute("aria-pressed")).toBe("false");
    // a command key is not a toggle: no aria-pressed at all
    expect(command?.hasAttribute("aria-pressed")).toBe(false);

    await userEvent.click(latch!);
    await frame();
    expect(latch?.getAttribute("aria-pressed")).toBe("true");
    expect(part(root, "key-legend").textContent).toBe("Mute");
  });

  it("moves the cap, not the hole, when it latches", async () => {
    const { root } = mount(() => (
      <Faceplate>
        <Key label="Hold" legend="Hold" isToggle />
      </Faceplate>
    ));
    const hole = part(root, "key");
    const cap = part(root, "key-face");
    const rest = getComputedStyle(cap).translate;
    // one number drives both: the sheet's --lift is the travel at rest and 0 latched, and the cap's translate reads it
    expect(lift(hole)).toBe("10px");

    await userEvent.click(hole);
    // the cap travels down into the hole rather than jumping: the one registered property is what the transition walks
    await waitFor(() => lift(hole) === "0px");
    expect(hole.getAttribute("aria-pressed")).toBe("true");
    expect(getComputedStyle(cap).translate).not.toBe(rest);
  });

  it("travels back to the raised position when a command key lets go", async () => {
    const { root } = mount(() => (
      <Faceplate>
        <Key label="Arm" />
      </Faceplate>
    ));
    const hole = part(root, "key");
    const travel = lift(hole);
    await userEvent.click(hole);
    await frame();
    expect(hole.hasAttribute("aria-pressed")).toBe(false);
    await waitFor(() => lift(hole) === travel);
  });

  it("rings its hole in outline, 3 : 1 against the panel it stands on", async () => {
    const { root } = mount(() => (
      <Faceplate>
        <Key label="Arm" />
      </Faceplate>
    ));
    const hole = await tabTo(root, "key");
    const style = getComputedStyle(hole);
    // an outline, not a shadow: a ring painted with box-shadow is clipped by the hole's own overflow and reads as the key
    expect(style.outlineStyle).toBe("solid");
    expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    expect(style.boxShadow).not.toContain(style.outlineColor);
    expect(contrastRatio(style.outlineColor, panelOf(hole))).toBeGreaterThanOrEqual(3);
  });
});

describe("the fader", () => {
  it("puts the slider on the cap and the value on the thumb", () => {
    const { root } = mount(() => (
      <Faceplate>
        <Fader label="Level" min={0} max={100} defaultValue={40} />
      </Faceplate>
    ));
    const cap = part(root, "fader-cap");
    expect(cap.getAttribute("role")).toBe("slider");
    expect(cap.getAttribute("aria-label")).toBe("Level");
    expect(cap.getAttribute("aria-valuenow")).toBe("40");
    expect(cap.getAttribute("aria-valuemin")).toBe("0");
    expect(cap.getAttribute("aria-valuemax")).toBe("100");
    // the cap and the fill are placed by one number, written on the groove from the value the thumb announces
    expect(part(root, "fader-track").style.getPropertyValue("--at")).toBe("40");
  });

  it("steps the value with the arrow keys and moves the cap with it", async () => {
    const { root } = mount(() => (
      <Faceplate>
        <Fader label="Level" min={0} max={100} defaultValue={40} />
      </Faceplate>
    ));
    const cap = part(root, "fader-cap");
    cap.focus();
    await frame();

    await userEvent.keyboard("{ArrowRight}");
    await frame();
    expect(cap.getAttribute("aria-valuenow")).toBe("41");
    expect(part(root, "fader-track").style.getPropertyValue("--at")).toBe("41");

    await userEvent.keyboard("{Home}");
    await frame();
    expect(cap.getAttribute("aria-valuenow")).toBe("0");
  });

  it("rings its cap in outline, 3 : 1 against the panel", async () => {
    const { root } = mount(() => (
      <Faceplate>
        <Fader label="Level" min={0} max={100} defaultValue={40} />
      </Faceplate>
    ));
    const cap = await tabTo(root, "fader-cap");
    const style = getComputedStyle(cap);
    expect(style.outlineStyle).toBe("solid");
    expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    expect(contrastRatio(style.outlineColor, panelOf(cap))).toBeGreaterThanOrEqual(3);
  });
});
