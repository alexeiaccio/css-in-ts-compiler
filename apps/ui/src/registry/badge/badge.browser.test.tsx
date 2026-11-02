import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Badge } from "./badge.tsx";

// A badge has no primitive and no APG pattern: its contract is the skin — three tones, a pill and text that can be read on
// each fill. The test mounts it in a real Chromium and reads the computed colours, so the contrast is measured on what the
// browser paints rather than on a token name. There is no `data-tone` on the element (the tone is the variant class), so the
// three skins are told apart by their computed background and border, which is what a reader sees.

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

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const badgesIn = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="badge"]'),
];

// WCAG 2.x contrast from the values the browser computed. A computed colour may serialise as oklch() here, and WCAG
// luminance needs sRGB bytes: a 1 x 1 canvas resolves any CSS colour to them, the same maths `check.contrast` does at build
// time (and the same helper `tabs.browser.test.tsx` uses).
const canvas = document.createElement("canvas");
canvas.width = 1;
canvas.height = 1;
const canvasContext = canvas.getContext("2d", { willReadFrequently: true });

const srgb = (colour: string): [number, number, number] => {
  if (canvasContext === null) {
    throw new Error("no 2d canvas to resolve a colour");
  }
  canvasContext.clearRect(0, 0, 1, 1);
  canvasContext.fillStyle = colour;
  canvasContext.fillRect(0, 0, 1, 1);
  const pixels = canvasContext.getImageData(0, 0, 1, 1).data;
  return [pixels[0] ?? 0, pixels[1] ?? 0, pixels[2] ?? 0];
};

const linear = (channel: number): number => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (colour: string): number => {
  const [red, green, blue] = srgb(colour);
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
};

const contrastRatio = (a: string, b: string): number => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
};

// The quiet tone paints no fill of its own, so walk up to the first opaque ancestor; a test page with none is white.
const TRANSPARENT = /^rgba\([^)]*,\s*0\)$/;
const backgroundOf = (element: HTMLElement): string => {
  for (
    let current: HTMLElement | null = element;
    current !== null;
    current = current.parentElement
  ) {
    const colour = style(current).backgroundColor;
    if (colour !== "transparent" && !TRANSPARENT.test(colour)) {
      return colour;
    }
  }
  return "rgb(255, 255, 255)";
};

const mountTones = (): HTMLElement => {
  const { root } = mount(() => (
    <>
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="accent">Accent</Badge>
      <Badge tone="quiet">Quiet</Badge>
      <Badge>Default</Badge>
    </>
  ));
  return root;
};

describe("Badge skin", () => {
  it("is a small inline label in a pill, with the pill radius the theme's steps cannot give", () => {
    const root = mountTones();
    const [neutral] = badgesIn(root) as [HTMLElement];

    expect(neutral.tagName).toBe("SPAN");
    expect(style(neutral).display).toBe("inline-flex");
    expect(style(neutral).alignItems).toBe("center");
    // max-content: as wide as its label, not as wide as the page
    expect(neutral.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(neutral.getBoundingClientRect().width).toBeLessThan(root.getBoundingClientRect().width);
    expect(style(neutral).whiteSpace).toBe("nowrap");
    // 999px by hand: above half the height whatever that height is, because the theme's radius steps stop at 16px
    expect(style(neutral).borderRadius).toBe("999px");
    expect(parseFloat(style(neutral).borderRadius)).toBeGreaterThan(
      neutral.getBoundingClientRect().height / 2,
    );
    // the ring is a border even when the fill is transparent, so every tone keeps its size
    expect(style(neutral).borderTopWidth).toBe("1px");
    expect(style(neutral).borderTopStyle).toBe("solid");
  });

  it("gives the three tones their own fill and border", () => {
    const root = mountTones();
    const [neutral, accent, quiet, fallback] = badgesIn(root) as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];

    // neutral is the quiet fill, accent the highlighted one, quiet a label with no fill at all
    expect(style(neutral).backgroundColor).not.toBe(style(accent).backgroundColor);
    expect(style(neutral).color).not.toBe(style(accent).color);
    expect(style(quiet).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style(quiet).borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style(quiet).borderTopColor).not.toBe(style(accent).borderTopColor);
    expect(style(quiet).color).not.toBe(style(accent).color);
    // the default tone is the neutral one, not a fourth skin
    expect(style(fallback).backgroundColor).toBe(style(neutral).backgroundColor);
    expect(style(fallback).color).toBe(style(neutral).color);
  });

  it("keeps every tone's text at 4.5 : 1 against the fill behind it", () => {
    const root = mountTones();
    for (const badge of badgesIn(root)) {
      const ratio = contrastRatio(style(badge).color, backgroundOf(badge));
      expect(ratio, `${badge.textContent ?? ""} is ${ratio.toFixed(2)} : 1`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });
});
