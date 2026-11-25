import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Storybook } from "../src/storybook.tsx";
import { type Message } from "../src/view.ts";

const wire = () => {
  const windows = new Set<{ receive: (message: Message) => void }>();
  return {
    join: () => {
      const self = { receive: (_message: Message) => {} };
      windows.add(self);
      return {
        send: (message: Message) => {
          for (const other of windows) {
            if (other !== self) {
              other.receive(message);
            }
          }
        },
        listen: (receive: (message: Message) => void) => {
          self.receive = receive;
          return () => windows.delete(self);
        },
      };
    },
  };
};

const roots: (() => void)[] = [];

afterEach(() => {
  for (const dispose of roots.splice(0)) {
    dispose();
  }
});

const mount = (view: () => JSX.Element) => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(view, root);
  roots.push(() => {
    dispose();
    root.remove();
  });
  return root;
};

const tick = () => Promise.resolve();

const part = (root: HTMLElement, name: string) => {
  const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`no [data-part="${name}"]`);
  }
  return element;
};

const canvas = (root: HTMLElement) => part(root, "canvas");

describe("Storybook", () => {
  it("draws the first story and its rail, with no frame between them", () => {
    const root = mount(() => <Storybook channel={wire().join()} />);
    expect(part(root, "rail").querySelectorAll("[data-story]").length).toBeGreaterThan(4);
    expect(canvas(root).querySelector('[data-part="button"]')).not.toBeNull();
    expect(root.querySelector("iframe")).toBeNull();
  });

  it("draws the stories on the reset, not on the browser's own defaults", () => {
    const root = mount(() => <Storybook channel={wire().join()} />);
    const raw = document.createElement("button");
    const heading = document.createElement("h1");
    root.append(raw, heading);

    expect(getComputedStyle(raw).borderTopWidth).toBe("0px");
    expect(getComputedStyle(heading).textWrap).toBe("balance");
  });

  it("moves the canvas to the story a rail click names", async () => {
    const root = mount(() => <Storybook channel={wire().join()} />);
    const accent = root.querySelector<HTMLElement>('[data-story="button--accent"]');
    accent?.click();
    await tick();

    expect(canvas(root).getAttribute("data-story")).toBe("button--accent");
    expect(canvas(root).textContent).toContain("Save");
    expect(location.search).toContain("story=button--accent");
  });

  it("detaches the panels into a window and leaves the canvas alone in the page", async () => {
    const opened: string[] = [];
    const root = mount(() => (
      <Storybook
        channel={wire().join()}
        open={(url) => {
          opened.push(url);
          return window;
        }}
      />
    ));
    root.querySelector<HTMLElement>('[data-part="detach"]')?.click();
    await tick();

    expect(opened).toHaveLength(1);
    expect(opened[0]).toContain("panels=rail");
    expect(opened[0]).toContain("story=");
    expect(root.querySelector('[data-part="rail"]')).toBeNull();
    expect(canvas(root)).not.toBeNull();
  });

  it("is the panels window when the URL says rail, and drives the canvas from there", async () => {
    const bus = wire();
    const page = mount(() => <Storybook channel={bus.join()} open={() => window} />);
    const panels = mount(() => <Storybook panels="rail" channel={bus.join()} />);

    expect(part(panels, "rail")).not.toBeNull();
    expect(panels.querySelector('[data-part="canvas"]')).toBeNull();

    panels.querySelector<HTMLElement>('[data-story="tabs--default"]')?.click();
    await tick();
    expect(canvas(page).getAttribute("data-story")).toBe("tabs--default");

    const control = panels.querySelector<HTMLInputElement>(
      '[data-part="controls"] input[type="number"]',
    );
    if (control === null) {
      throw new Error("no numeric control");
    }
    control.value = "1";
    control.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(canvas(page).querySelectorAll('[role="tab"]')[1]?.getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("restores the rail when the panels window goes away", async () => {
    const bus = wire();
    const page = mount(() => <Storybook channel={bus.join()} open={() => window} />);
    page.querySelector<HTMLElement>('[data-part="detach"]')?.click();
    await tick();
    expect(page.querySelector('[data-part="rail"]')).toBeNull();

    mount(() => <Storybook panels="rail" channel={bus.join()} />);
    roots.pop()?.();
    await tick();
    expect(page.querySelector('[data-part="rail"]')).not.toBeNull();
  });
});
