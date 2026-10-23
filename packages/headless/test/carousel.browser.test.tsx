import {
  type ActionStep,
  type Driver,
  type ScenarioConfig,
  ScenarioMismatch,
  Unsupported,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  carouselBridge,
  carouselConfig,
  carouselProbe,
  carouselSteps,
} from "@cssints/apg-specs/apg/carousel.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import apg from "@cssints/apg-specs/scenarios/apg/carousel.apg.json";
import definitionJson from "@cssints/apg-specs/apg/carousel.model.json";
import { domDriver } from "./dom-driver";
import { mountCarousel } from "./carousel.fixture";
import { userEvent } from "vite-plus/test/browser";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const NAMED_KEYS = new Set(["Enter", "Tab", "Escape", "Home", "End", "PageUp", "PageDown"]);

const singleKey = (key: string): string =>
  key === "Space" || key === " "
    ? " "
    : NAMED_KEYS.has(key) || key.startsWith("Arrow") || key.startsWith("Page")
      ? `{${key}}`
      : key;

/** Playwright keyboard syntax, incl. `Shift+Tab` / `Control+End` combos. */
const keyboardSyntax = (key: string): string => {
  if (!key.includes("+")) {
    return singleKey(key);
  }
  const parts = key.split("+");
  const main = parts.pop() ?? "";
  return `${parts.map((modifier) => `{${modifier}>}`).join("")}${singleKey(main)}${parts
    .map((modifier) => `{/${modifier}}`)
    .join("")}`;
};

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });

/**
 * `domDriver` plus the two step kinds a carousel needs and the generic driver
 * does not know: `wait` advances one rotation interval through the fixture's
 * `tick`, and modifier combos reach the browser in real keyboard syntax.
 */
const carouselDom = (config: ScenarioConfig): Driver => {
  const mounted = mountCarousel(carouselConfig(config));
  const base = domDriver(mounted, { hideableParts: ["slide"] });
  const elementOf = (target: string): HTMLElement => {
    const [name = "", index = "0"] = target.split(":");
    const element = [...mounted.root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)][
      Number(index)
    ];
    if (element === undefined) {
      throw new Unsupported(`part ${target}`);
    }
    return element;
  };
  return {
    observer: base.observer,
    dispose: () => base.dispose?.(),
    perform: async (step: ActionStep) => {
      if (step.event === "wait") {
        const intervals = Math.floor((step.ms ?? 0) / 5000);
        for (let tick = 0; tick < intervals; tick += 1) {
          mounted.setProp("tick", undefined);
        }
        await settle();
        return;
      }
      if (step.event === "key") {
        const element = elementOf(step.target ?? "");
        if (document.activeElement !== element) {
          element.focus();
        }
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
const HIDDEN_VALUE =
  'the scenario asserts the raw hidden="" attribute; the DOM driver reports boolean attributes as "true"';
const WILDCARD_IDREF =
  'the scenario uses the "*" (any non-empty IDREF) convention, which the replay engine does not implement';
const FOCUS_PAUSE_INVERSION =
  "the ported expectation assumes focus does not pause rotation; the pattern text (and the spec) stop it, so the first activation restarts (Stop) and the second stops (Start)";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "carousel.apg.example.disable-auto-rotation-hides-control": HIDDEN_VALUE,
  "carousel.apg.roles.controls-aria-controls-slides": WILDCARD_IDREF,
  "carousel.apg.tablist.tab-has-role-label-and-controls": WILDCARD_IDREF,
  "carousel.apg.rotation.enter-or-space-toggles": FOCUS_PAUSE_INVERSION,
};

describe("createCarousel x ported scenarios (real DOM)", () => {
  const file = parseScenarioFile(apg);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const run = replayScenario(scenario, carouselBridge, carouselDom);
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
});

describe("createCarousel x spec (differential walk)", () => {
  for (const config of [
    { items: 3 },
    { items: 3, variant: "tabbed" },
    { items: 3, autoRotate: false },
    { items: 3, playing: false },
    { items: 3, hovering: true },
    // controlled: a host that accepts every request, and one that pins the
    // value (rejects), so no event commits
    { items: 3, controlled: true },
    { items: 3, controlled: true, value: 2 },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      const alphabet = carouselSteps.filter(
        (step) => config.autoRotate !== false || step.target !== "rotation",
      );
      await differentialWalk({
        alphabet,
        probe: carouselProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, carouselBridge, config), carouselDom(config)]),
        runs: 12,
        steps: 20,
        seed: 11,
      });
    });
  }
});
