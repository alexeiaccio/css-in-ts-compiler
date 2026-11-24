import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Spotlight } from "./spotlight.tsx";

const settle = (): Promise<void> => Promise.resolve();

/** Waits for the computed opacity the pointer or the focus asks for, a frame at a time: a transition that never starts is a
 *  failed test, not a hang. */
const opacityIs = async (element: Element, value: string): Promise<void> => {
  const limit = 600;
  for (let frame = 0; frame < limit; frame += 1) {
    if (getComputedStyle(element).opacity === value) {
      return;
    }
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  }
  throw new Error(`spotlight: opacity never became ${value}`);
};

interface Mounted {
  readonly root: HTMLElement;
  readonly card: HTMLElement;
  readonly dispose: () => void;
}

const live: Mounted[] = [];

const mount = (view: () => JSX.Element): Mounted => {
  const root = document.createElement("div");
  root.style.width = "200px";
  document.body.append(root);
  const dispose = render(view, root);
  flush();
  const card = root.querySelector<HTMLElement>('[data-part="spotlight"]');
  if (card === null) {
    throw new Error("spotlight: no card");
  }
  const mounted = {
    root,
    card,
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

const light = (card: ParentNode): HTMLElement => {
  const element = card.querySelector<HTMLElement>('[data-part="spotlight-light"]');
  if (element === null) {
    throw new Error("spotlight: no light");
  }
  return element;
};

const move = async (card: HTMLElement, x: number, y: number): Promise<void> => {
  const rect = card.getBoundingClientRect();
  card.dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: rect.left + x,
      clientY: rect.top + y,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
  await settle();
};

describe("Spotlight", () => {
  it("is a card whose light is decoration under the content", async () => {
    const { card, root } = mount(() => (
      <Spotlight>
        <a href="#x">Read the report</a>
      </Spotlight>
    ));
    await settle();

    const glow = light(card);
    expect(card.getAttribute("data-part")).toBe("spotlight");
    expect(glow.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(glow).pointerEvents).toBe("none");
    expect(getComputedStyle(card).isolation).toBe("isolate");

    const link = root.querySelector("a");
    if (link === null) {
      throw new Error("spotlight: no link");
    }
    expect(link.closest('[data-part="spotlight-content"]')).not.toBeNull();
    const box = link.getBoundingClientRect();
    expect(document.elementFromPoint(box.left + box.width / 2, box.top + 2)).toBe(link);
  });

  it("puts the light where the pointer is, as percentages of the card", async () => {
    const { card } = mount(() => <Spotlight>content</Spotlight>);
    await settle();

    const glow = light(card);
    expect(getComputedStyle(glow).opacity).toBe("0");
    expect(getComputedStyle(glow).getPropertyValue("--spot-x").trim()).toBe("");

    const box = card.getBoundingClientRect();
    await move(card, box.width / 4, box.height / 2);
    expect(getComputedStyle(glow).getPropertyValue("--spot-x").trim()).toBe("25.0%");
    expect(getComputedStyle(glow).getPropertyValue("--spot-y").trim()).toBe("50.0%");

    await move(card, box.width, box.height);
    expect(getComputedStyle(glow).getPropertyValue("--spot-x").trim()).toBe("100.0%");
    expect(getComputedStyle(glow).getPropertyValue("--spot-y").trim()).toBe("100.0%");

    const background = getComputedStyle(glow).backgroundImage;
    expect(background).toContain("radial-gradient");
    expect(background).toContain("100%");
  });

  it("lights up under the pointer, and for a control inside it that takes focus", async () => {
    const { card, root } = mount(() => (
      <Spotlight>
        <a href="#x">Read the report</a>
      </Spotlight>
    ));
    await settle();

    const glow = light(card);
    const link = root.querySelector("a");
    if (link === null) {
      throw new Error("spotlight: no link");
    }

    link.focus();
    await opacityIs(glow, "1");
    expect(getComputedStyle(glow).opacity).toBe("1");

    link.blur();
    await opacityIs(glow, "0");
    expect(getComputedStyle(glow).opacity).toBe("0");

    await userEvent.hover(card);
    await opacityIs(glow, "1");
    expect(getComputedStyle(glow).opacity).toBe("1");
  });
});
