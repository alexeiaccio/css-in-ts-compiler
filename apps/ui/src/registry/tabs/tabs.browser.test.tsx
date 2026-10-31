import {
  type ActionStep,
  type Driver,
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  tabsBridge,
  tabsConfig,
  tabsEventName,
  tabsProbe,
  tabsSteps,
} from "@cssints/apg-specs/apg/tabs.bridge";
import ariakit from "@cssints/apg-specs/scenarios/apg/tabs.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/tabs.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/tabs.model.json";
import { domDriver } from "./tabs-driver.ts";
import { mountSkin, mountTabs, mountTabsUnderStickyHeader } from "./tabs.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/tabs.react-aria.json";
import { page, userEvent } from "vite-plus/test/browser";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const NAMED_KEYS = new Set(["Enter", "Tab", "Escape", "Home", "End"]);

const keyboardSyntax = (key: string): string => {
  if (key === "Space" || key === " ") {
    return " ";
  }
  return NAMED_KEYS.has(key) || key.startsWith("Arrow") || key.startsWith("Page")
    ? `{${key}}`
    : key;
};

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });

/**
 * Like `domDriver`, but a `key` step is dispatched to whatever currently holds
 * focus instead of force-focusing the target first: the tabs spec routes keys
 * through its own `focused` cursor, so the two only agree if the DOM is driven
 * the way a user would.
 */
const tabsDom = (config: ScenarioConfig): Driver => {
  const mounted = mountTabs(tabsConfig(config));
  const base = domDriver(mounted, {
    hideableParts: ["tabpanel"],
    eventName: tabsEventName,
  });
  return {
    observer: base.observer,
    dispose: () => base.dispose?.(),
    perform: async (step: ActionStep) => {
      if (step.event === "key") {
        await userEvent.keyboard(keyboardSyntax(step.key ?? ""));
        await settle();
        return;
      }
      await base.perform(step);
    },
  };
};

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const AXIS_ONLY =
  "the spec (and APG) maps arrows to the tablist axis only; react-aria additionally treats Left/Right as previous/next in a vertical stack";
const SKIP_DISABLED =
  "the spec and react-aria skip disabled tabs in one keypress; base-ui moves focus onto the disabled tab without activating it";
const PANEL_CONVENTION =
  "one fixture convention cannot serve both ariakit panel-tabindex files (they assume opposite panels hold focusable content)";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "tabs.react-aria.arrow-vertical": AXIS_ONLY,
  "tabs.base-ui.arrow-focuses-disabled-without-activating": SKIP_DISABLED,
  "tabs.ariakit.panel-tabindex-tabbable": PANEL_CONVENTION,
};

describe("Tabs x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, tabsBridge, tabsDom);
          const divergence = DIVERGENCES[scenario.id];
          if (divergence !== undefined) {
            await expect(run).rejects.toBeInstanceOf(ScenarioMismatch);
            return;
          }
          const result = await run;
          if (result.status === "unsupported") {
            context.skip(result.reason);
          }
        });
      }
    });
  }
});

const tabsIn = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="tab"]'),
];

const partIn = (root: HTMLElement, name: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`no [data-part="${name}"] in ${root.innerHTML}`);
  }
  return element;
};

// WCAG 2.x contrast from the values the browser computed. A computed colour may serialise as oklch()
// here, and WCAG luminance needs sRGB bytes: a 1 x 1 canvas resolves any CSS colour to them, so the
// maths is the same one `check.contrast` does at build time. The ratios themselves are gated in
// `theme.ts`; this only checks that the focused tab keeps them.
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

// The tab paints no background of its own (`transparent` over the page), so walk up to the first
// opaque ancestor; the test page has none and its canvas is white.
const TRANSPARENT = /^rgba\([^)]*,\s*0\)$/;
const backgroundOf = (element: HTMLElement): string => {
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
  return "rgb(255, 255, 255)";
};

// Keyboard focus, not `.focus()`: the ring is `:focus-visible`, and a programmatic focus after a
// pointer interaction would not paint it.
const focusFirstTab = async (root: HTMLElement): Promise<HTMLElement> => {
  const tab = tabsIn(root)[0]!;
  (document.activeElement as HTMLElement | null)?.blur();
  await userEvent.tab();
  expect(document.activeElement).toBe(tab);
  return tab;
};

/**
 * The skin's side of the catalogue. The primitive emits no CSS, so the box, the ring, the selected
 * tab's non-colour cue and reflow are only assertable here; the colours are gated by
 * `check.contrast` in `theme.ts` (G4). The viewport and the root font size are restored after each.
 */
describe("Tabs x requirements (the skin)", () => {
  afterEach(async () => {
    document.documentElement.style.fontSize = "";
    await page.viewport(1280, 1024);
  });

  it("gives every tab a 24 x 24 target (2.5.8; AAA asks 44 x 44)", () => {
    // A one-letter label is the narrow case; the skin's min-width and min-height hold the floor.
    const mounted = mountSkin({ label: () => "A" });
    try {
      for (const tab of tabsIn(mounted.root)) {
        const box = tab.getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    } finally {
      mounted.dispose();
    }
  });

  it("marks the selected tab with more than colour (1.4.1)", () => {
    const mounted = mountSkin();
    try {
      const [active, inactive] = tabsIn(mounted.root);
      expect(active?.getAttribute("aria-selected")).toBe("true");
      const activeStyle = getComputedStyle(active!);
      const inactiveStyle = getComputedStyle(inactive!);
      // the underline is heavier when selected: a weight cue, not only the highlight colour
      expect(parseFloat(activeStyle.borderBottomWidth)).toBeGreaterThan(
        parseFloat(inactiveStyle.borderBottomWidth),
      );
      expect(activeStyle.borderBottomStyle).toBe("solid");
      expect(activeStyle.borderBottomColor).not.toBe(inactiveStyle.borderBottomColor);
    } finally {
      mounted.dispose();
    }
  });

  it("draws a 2 px focus ring with 3 : 1 against the page (2.4.11)", async () => {
    const mounted = mountSkin();
    try {
      const tab = await focusFirstTab(mounted.root);
      const style = getComputedStyle(tab);
      expect(style.outlineStyle).toBe("solid");
      expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
      expect(contrastRatio(style.outlineColor, backgroundOf(tab))).toBeGreaterThanOrEqual(3);
    } finally {
      mounted.dispose();
    }
  });

  it("keeps a focused tab clear of a sticky header (2.4.12)", async () => {
    const mounted = mountTabsUnderStickyHeader();
    try {
      const scroll = partIn(mounted.root, "scroll");
      const header = partIn(mounted.root, "sticky-header");
      const tab = await focusFirstTab(mounted.root);
      // what the browser does on focus or on an in-page link: reveal the tab at the scrollport's top
      tab.scrollIntoView({ block: "start" });
      const tabBox = tab.getBoundingClientRect();
      const headerBox = header.getBoundingClientRect();
      expect(scroll.scrollTop).toBeGreaterThan(0);
      expect(parseFloat(getComputedStyle(tab).scrollMarginTop)).toBeGreaterThanOrEqual(
        headerBox.height,
      );
      expect(tabBox.top).toBeGreaterThanOrEqual(headerBox.bottom);
      // the ring is drawn inside the tab (`outline-offset: -2px`), so a visible tab is a visible ring
      expect(getComputedStyle(tab).outlineStyle).toBe("solid");
    } finally {
      mounted.dispose();
    }
  });

  it("reflows at 320 px without a horizontal scrollbar (1.4.10)", async () => {
    await page.viewport(320, 800);
    const mounted = mountSkin();
    try {
      expect(partIn(mounted.root, "tablist").scrollWidth).toBeLessThanOrEqual(
        partIn(mounted.root, "tablist").clientWidth,
      );
      for (const tab of tabsIn(mounted.root)) {
        expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth);
      }
    } finally {
      mounted.dispose();
    }
  });

  it("keeps the labels whole at 200 % text (1.4.4)", async () => {
    await page.viewport(320, 800);
    document.documentElement.style.fontSize = "32px";
    const mounted = mountSkin();
    try {
      const list = partIn(mounted.root, "tablist");
      expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
      for (const tab of tabsIn(mounted.root)) {
        expect(getComputedStyle(tab).fontSize).toBe("28px");
        expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth);
      }
    } finally {
      mounted.dispose();
    }
  });

  it("keeps the labels whole with increased text spacing (1.4.12)", () => {
    const mounted = mountSkin();
    try {
      for (const tab of tabsIn(mounted.root)) {
        tab.style.letterSpacing = "0.12em";
        tab.style.wordSpacing = "0.16em";
        tab.style.lineHeight = "1.5";
      }
      const list = partIn(mounted.root, "tablist");
      expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
      for (const tab of tabsIn(mounted.root)) {
        expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth);
      }
    } finally {
      mounted.dispose();
    }
  });
});

describe("Tabs x spec (differential walk)", () => {
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [
    {},
    { activation: "manual" },
    { orientation: "vertical" },
    { disabled: [1] },
    // controlled: a host that accepts every request, and one that pins the
    // value (rejects), so no event commits
    { controlled: true, selected: 0 },
    { controlled: true, value: 2 },
  ];
  for (const config of CONFIGS) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: tabsSteps,
        probe: tabsProbe,
        makePair: () => Promise.resolve([specDriver(model, tabsBridge, config), tabsDom(config)]),
        runs: 12,
        steps: 20,
        seed: 5,
      });
    });
  }
});
