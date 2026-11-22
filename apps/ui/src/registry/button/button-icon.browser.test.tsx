// An icon is one line box square, and the glyphs of the label are where it has to sit (docs/API.md, "Optical spacing").
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";

import { Button, ButtonIcon } from "./button.tsx";

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

const Glyph = (): JSX.Element => (
  <svg viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" />
  </svg>
);

/** The box the label's ink occupies: the line box, and where the glyphs sit inside it. */
const ink = (label: Text): { readonly top: number; readonly bottom: number } => {
  const range = document.createRange();
  range.selectNode(label);
  const line = range.getBoundingClientRect();
  const parent = label.parentElement;
  if (parent === null) {
    throw new Error("no label");
  }
  const style = getComputedStyle(parent);
  const canvas = document.createElement("canvas").getContext("2d");
  if (canvas === null) {
    throw new Error("no canvas");
  }
  canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const metrics = canvas.measureText(label.textContent ?? "");
  // the line box holds the font box: the baseline is the font's ascent below its top
  const baseline = line.top + metrics.fontBoundingBoxAscent;
  return {
    top: baseline - metrics.actualBoundingBoxAscent,
    bottom: baseline + metrics.actualBoundingBoxDescent,
  };
};

describe("ButtonIcon", () => {
  it("is one line box square and sits on the caps of the label", () => {
    const { root, dispose } = mount(() => (
      <Button>
        <ButtonIcon>
          <Glyph />
        </ButtonIcon>
        Save
      </Button>
    ));
    const button = root.querySelector<HTMLElement>('[data-part="button"]');
    const icon = root.querySelector<HTMLElement>('[data-part="button-icon"]');
    const label = [...(button?.childNodes ?? [])].find(
      (node): node is Text => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() !== "",
    );
    expect(button).not.toBeNull();
    expect(icon).not.toBeNull();
    expect(label).toBeDefined();

    const range = document.createRange();
    range.selectNode(label as Text);
    const line = range.getBoundingClientRect();
    const box = (icon as HTMLElement).getBoundingClientRect();
    // `1lh`: the icon is the height of the line box it sits in, not the height of its viewBox
    expect(Math.abs(box.height - line.height)).toBeLessThanOrEqual(0.5);

    // the glyphs' centre, not the line box's: the two differ by half the leading the caps do not use
    const text = ink(label as Text);
    const iconCentre = box.top + box.height / 2;
    const inkCentre = (text.top + text.bottom) / 2;
    expect(Math.abs(iconCentre - inkCentre)).toBeLessThanOrEqual(0.75);
    dispose();
  });

  it("is decoration: a screen reader gets the label, once", () => {
    const { root, dispose } = mount(() => (
      <Button>
        <ButtonIcon>
          <Glyph />
        </ButtonIcon>
        Save
      </Button>
    ));
    const icon = root.querySelector<HTMLElement>('[data-part="button-icon"]');
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelector('[data-part="button"]')?.textContent?.trim()).toBe("Save");
    dispose();
  });
});
