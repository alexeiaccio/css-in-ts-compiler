// The native hosts of docs/hosts.md, in a real Chromium: each recipe is a story of its item (the `Native` export, or
// `AutoGrow` / `UserInvalid` for the form fields), rendered through the loader's own `render` with the meta's args, and
// held to what the platform is supposed to own. A jsdom cannot answer any of this: `details`' open state, `:modal`, the
// implicit `meter` role, `field-sizing` and `:user-invalid` are the engine's.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import accordionMeta, { Native as nativeAccordion } from "./accordion/accordion.stories.tsx";
import dialogMeta, { Native as nativeDialog } from "./dialog/dialog.stories.tsx";
import disclosureMeta, { Native as nativeDisclosure } from "./disclosure/disclosure.stories.tsx";
import inputMeta, { UserInvalid as userInvalid } from "./input/input.stories.tsx";
import meterMeta, { Native as nativeMeter } from "./meter/meter.stories.tsx";
import switchMeta, { Native as nativeSwitch } from "./switch/switch.stories.tsx";
import textareaMeta, { AutoGrow as autoGrow } from "./textarea/textarea.stories.tsx";

const roots: HTMLElement[] = [];

interface Args {
  readonly args?: object | undefined;
}

/** Renders a story the way the site does: the meta's args with the story's over them. */
const mount = (meta: object, story: Args & { render?: (args: never) => unknown }) => {
  const root = document.createElement("div");
  document.body.append(root);
  const args = { ...(meta as Args).args, ...story.args };
  render(() => story.render?.(args as never) as JSX.Element, root);
  roots.push(root);
  return root;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

afterEach(() => {
  for (const root of roots.splice(0)) root.remove();
});

describe("the native hosts (docs/hosts.md)", () => {
  it("disclosure: <details> toggles itself and fires toggle", async () => {
    const root = mount(disclosureMeta, nativeDisclosure);
    const details = root.querySelector("details")!;
    const fired: string[] = [];
    details.addEventListener("toggle", () => fired.push("toggle"));
    expect(details.open).toBe(false);
    await userEvent.click(root.querySelector("summary")!);
    expect(details.open).toBe(true);
    expect(fired).toEqual(["toggle"]);
    await userEvent.click(root.querySelector("summary")!);
    expect(details.open).toBe(false);
  });

  it("accordion: a shared name is exclusive, one name per section is multiple", async () => {
    const single = mount(accordionMeta, nativeAccordion);
    const items = [...single.querySelectorAll<HTMLDetailsElement>("details")];
    expect(items).toHaveLength(3);
    expect(new Set(items.map((item) => item.name))).toEqual(new Set(["native-accordion"]));
    expect(items[0]!.open).toBe(true);
    await userEvent.click(items[1]!.querySelector("summary")!);
    expect(items[1]!.open).toBe(true);
    expect(items[0]!.open).toBe(false);

    const many = mount(
      { args: { ...accordionMeta.args, multiple: true } },
      { ...nativeAccordion, args: { multiple: true } },
    );
    const sections = [...many.querySelectorAll<HTMLDetailsElement>("details")];
    expect(new Set(sections.map((item) => item.name)).size).toBe(3);
    await userEvent.click(sections[1]!.querySelector("summary")!);
    expect(sections[0]!.open).toBe(true);
    expect(sections[1]!.open).toBe(true);
  });

  it("dialog: showModal puts it in the modal top layer, focus goes in, Escape closes and returns it", async () => {
    const root = mount(dialogMeta, nativeDialog);
    const dialog = root.querySelector("dialog")!;
    const trigger = root.querySelector("button")!;
    expect(dialog.open).toBe(false);
    await userEvent.click(trigger);
    expect(dialog.open).toBe(true);
    expect(dialog.matches(":modal")).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("meter: the element is the role and carries the value", async () => {
    const root = mount(meterMeta, nativeMeter);
    const meter = root.querySelector("meter")!;
    expect(meter.value).toBe(64);
    expect(meter.max).toBe(100);
    expect(meter.labels?.[0]?.textContent).toBe("Storage");
  });

  it("switch: the checkbox with role=switch toggles, and the attribute is only the look", async () => {
    const root = mount(switchMeta, nativeSwitch);
    const input = root.querySelector<HTMLInputElement>("input[role=switch]")!;
    expect(input.checked).toBe(false);
    expect(input.hasAttribute("switch")).toBe(true);
    await userEvent.click(input);
    expect(input.checked).toBe(true);
  });

  it("textarea: field-sizing grows the field with its content", async () => {
    const root = mount(textareaMeta, autoGrow);
    const area = root.querySelector("textarea")!;
    const before = area.offsetHeight;
    area.value = Array.from({ length: 8 }, (_, line) => `line ${line + 1}`).join("\n");
    area.dispatchEvent(new Event("input", { bubbles: true }));
    await frame();
    expect(area.offsetHeight).toBeGreaterThan(before);
  });

  it("input: :user-invalid is the browser's own state after the user leaves the field", async () => {
    expect(CSS.supports("selector(:user-invalid)")).toBe(true);
    const root = mount(inputMeta, userInvalid);
    const input = root.querySelector("input")!;
    await userEvent.type(input, "ab");
    await userEvent.tab();
    expect(input.matches(":user-invalid")).toBe(true);
    input.value = "abc";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await userEvent.tab();
    expect(input.matches(":user-invalid")).toBe(false);
  });
});
