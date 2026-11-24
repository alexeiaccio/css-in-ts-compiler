import type { Tabs as TabsController } from "@cssints/headless";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Button, Field, Switch, Tabs } from "../src/index.ts";
import { stories, storyOfId } from "../src/stories.ts";

const tick = () => Promise.resolve();

const mounts: (() => void)[] = [];

afterEach(() => {
  for (const dispose of mounts.splice(0)) {
    dispose();
  }
});

const mount = (view: () => JSX.Element) => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(view, root);
  mounts.push(() => {
    dispose();
    root.remove();
  });
  return root;
};

const part = (root: HTMLElement, name: string) => {
  const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`no [data-part="${name}"]`);
  }
  return element;
};

describe("Button", () => {
  it("is a command button, and a toggle when asked", async () => {
    const clicks = { count: 0 };
    const root = mount(() => <Button onClick={() => (clicks.count += 1)}>Save</Button>);
    const button = part(root, "button");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-pressed")).toBeNull();

    button.click();
    await tick();
    expect(clicks.count).toBe(1);

    const toggle = mount(() => <Button isToggle>Pin</Button>);
    const pin = part(toggle, "button");
    expect(pin.getAttribute("aria-pressed")).toBe("false");
    pin.click();
    await tick();
    expect(pin.getAttribute("aria-pressed")).toBe("true");
  });

  it("reads its look from the tone and the size", () => {
    const root = mount(() => (
      <Button tone="accent" size="sm">
        Go
      </Button>
    ));
    const style = getComputedStyle(part(root, "button"));
    expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.fontSize).toBe("13px");
  });
});

describe("Field", () => {
  it("names its control from the label and reads the error with it", () => {
    const root = mount(() => (
      <Field label="Email" hint="We never share it." error="Missing an @." invalid />
    ));
    const label = part(root, "label");
    const control = part(root, "control");
    expect(label.getAttribute("for")).toBe(control.getAttribute("id"));
    expect(control.getAttribute("aria-invalid")).toBe("true");

    const error = part(root, "error");
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("Missing an @.");
    expect(control.getAttribute("aria-describedby")?.split(" ")).toContain(error.id);
  });

  it("hides the message nobody wrote and keeps the hint when there is one", () => {
    const root = mount(() => <Field label="Name" hint="As printed on the card." />);
    const control = part(root, "control");
    const hint = part(root, "hint");
    expect(hint.hidden).toBe(false);
    expect(control.getAttribute("aria-describedby")).toBe(hint.id);
    expect(part(root, "error").hidden).toBe(true);
  });
});

describe("Switch", () => {
  it("turns on with a click and announces it on the same element", async () => {
    const root = mount(() => <Switch>Wi-Fi</Switch>);
    const track = part(root, "switch");
    expect(track.getAttribute("role")).toBe("switch");
    expect(track.getAttribute("aria-checked")).toBe("false");

    track.click();
    await tick();
    expect(track.getAttribute("aria-checked")).toBe("true");
  });
});

describe("Tabs", () => {
  it("selects the first tab, and a request moves the selection", async () => {
    const ready: TabsController[] = [];
    const root = mount(() => (
      <Tabs
        labels={["Overview", "Activity"]}
        panels={["one", "two"]}
        onReady={(api) => ready.push(api)}
      />
    ));
    const tablist = part(root, "tablist");
    const tabs = [...tablist.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(["true", "false"]);
    expect(root.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')?.textContent).toBe(
      "one",
    );

    ready[0]?.select(1);
    await tick();
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(["false", "true"]);
    expect(root.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')?.textContent).toBe(
      "two",
    );
  });
});

describe("stories", () => {
  it("ships the ids Storybook builds, per component", () => {
    const ids = stories.map((entry) => entry.id);
    expect(ids).toContain("button--accent");
    expect(ids).toContain("field--with-a-hint-and-an-error");
    expect(ids).toContain("switch--on");
    expect(ids).toContain("tabs--opened-on-the-second");
    expect(new Set(stories.map((entry) => entry.item))).toEqual(
      new Set(["button", "field", "switch", "tabs"]),
    );
    expect(stories.every((entry) => typeof entry.view === "function")).toBe(true);
  });

  it("renders a story with its own args and the meta's controls", () => {
    const accent = storyOfId("button--accent");
    const compact = storyOfId("button--compact");
    expect(accent?.args["tone"]).toBe("accent");
    expect(compact?.args["size"]).toBe("sm");
    expect(compact?.argTypes["tone"]).toEqual({
      type: "select",
      options: ["neutral", "accent", "quiet"],
    });
    expect(accent?.args["children"]).toBe("Save");

    if (accent === undefined) {
      throw new Error("no button--accent");
    }
    const root = document.createElement("div");
    document.body.append(root);
    const dispose = render(() => accent.view(accent.args) as JSX.Element, root);
    expect(root.querySelector<HTMLElement>('[data-part="button"]')?.textContent).toBe("Save");
    dispose();
    root.remove();
  });
});
