import { describe, expect, it } from "vite-plus/test";
import { mountToolbar } from "./toolbar.fixture";

// The styled Toolbar is a container-only skin: it does not import @cssints/headless, so there is
// no roving toolbar to walk against `specs/apg/toolbar.qnt`. What this copy checks is the skin's
// whole contract: `role=toolbar` with its name, the size and orientation it hands to the controls
// inside as `data-size` / `data-orientation`, and the compact rule the kit's Button reads through
// `within()` without a prop of its own. Behaviour (arrows, wrap, the menu button) is the
// primitive's and is checked by @cssints/headless; compose `createToolbar` for it.
const part = (root: HTMLElement, name: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;

const buttonsOf = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="button"]'),
];

describe("Toolbar skin", () => {
  it("is a named toolbar that states its size and orientation", () => {
    const { root, dispose } = mountToolbar();
    const toolbar = part(root, "toolbar");
    expect(toolbar.getAttribute("role")).toBe("toolbar");
    expect(toolbar.getAttribute("aria-label")).toBe("Formatting");
    expect(toolbar.getAttribute("data-size")).toBe("md");
    expect(toolbar.getAttribute("data-orientation")).toBe("horizontal");
    expect(getComputedStyle(toolbar).flexDirection).toBe("row");
    // the size is the container's: the controls do not carry it themselves
    for (const button of buttonsOf(root)) {
      expect(button.hasAttribute("data-size")).toBe(false);
    }
    dispose();
  });

  it("a compact toolbar makes the buttons inside it compact without a prop", () => {
    const { root, dispose } = mountToolbar({ size: "sm" });
    expect(part(root, "toolbar").getAttribute("data-size")).toBe("sm");
    const [inside, outside] = [buttonsOf(root)[0]!, buttonsOf(root)[2]!];
    // the same component, one inside the context and one outside it
    expect(parseFloat(getComputedStyle(inside).fontSize)).toBeLessThan(
      parseFloat(getComputedStyle(outside).fontSize),
    );
    expect(parseFloat(getComputedStyle(inside).paddingInlineStart)).toBeLessThan(
      parseFloat(getComputedStyle(outside).paddingInlineStart),
    );
    dispose();
  });

  it("vertical lays the controls in a column", () => {
    const { root, dispose } = mountToolbar({ orientation: "vertical" });
    const toolbar = part(root, "toolbar");
    expect(toolbar.getAttribute("data-orientation")).toBe("vertical");
    expect(getComputedStyle(toolbar).flexDirection).toBe("column");
    dispose();
  });
});
