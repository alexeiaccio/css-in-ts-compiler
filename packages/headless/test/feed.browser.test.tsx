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
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { feedBridge, feedConfig, feedProbe, feedSteps } from "@cssints/apg-specs/apg/feed.bridge";
import apg from "@cssints/apg-specs/scenarios/apg/feed.apg.json";
import definitionJson from "@cssints/apg-specs/apg/feed.model.json";
import { mountFeed } from "./feed.fixture";
import { userEvent } from "vite-plus/test/browser";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const BOOLEAN_ATTRS = new Set(["hidden", "disabled"]);
const NAMED_KEYS = new Set(["Enter", "Tab", "Escape", "Home", "End", "PageUp", "PageDown"]);

const singleKey = (key: string): string =>
  key === "Space" || key === " "
    ? " "
    : NAMED_KEYS.has(key) || key.startsWith("Arrow") || key.startsWith("Page")
      ? `{${key}}`
      : key;

/** Playwright keyboard syntax, incl. `Control+End` / `Control+Home`. */
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
 * A DOM driver for the feed: targets are the full `data-part` labels
 * (`article:1`), a `key` step first focuses its target (as a user would), and
 * modifier combos reach the browser in real keyboard syntax.
 */
const feedDom = (config: ScenarioConfig): Driver => {
  const mounted = mountFeed(feedConfig(config));
  const { root } = mounted;

  const elementOf = (target: string): HTMLElement => {
    const element = [...root.querySelectorAll<HTMLElement>("[data-part]")].find(
      (candidate) => candidate.dataset["part"] === target,
    );
    if (element === undefined) {
      throw new Unsupported(`part ${target}`);
    }
    return element;
  };

  const activePart = (): string | null => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !root.contains(active)) {
      return null;
    }
    return active.closest<HTMLElement>("[data-part]")?.dataset["part"] ?? null;
  };

  /** Focus `target` the way a user can: re-focus fires even if it is current. */
  const focusTarget = (target: string): void => {
    const element = elementOf(target);
    if (element.hidden) {
      return;
    }
    const current = document.activeElement;
    if (element === current) {
      element.blur();
    } else if (current instanceof HTMLElement && root.contains(current)) {
      current.blur();
    }
    element.focus();
  };

  return {
    perform: async (step: ActionStep) => {
      switch (step.event) {
        case "focus":
          focusTarget(step.target ?? "");
          break;
        case "blur":
          elementOf(step.target ?? "").blur();
          break;
        case "key":
          focusTarget(step.target ?? "");
          await userEvent.keyboard(keyboardSyntax(step.key ?? ""));
          break;
        case "prop":
          mounted.setProp(step.prop ?? "", step.value);
          break;
        default:
          throw new Unsupported(`event ${step.event}`);
      }
      await settle();
    },
    observer: {
      focus: activePart,
      attr: (target, name) => {
        if (name.startsWith("data-")) {
          throw new Unsupported(`styling hook ${name}`);
        }
        const value = elementOf(target).getAttribute(name);
        if (value === null) {
          return null;
        }
        return value === "" && BOOLEAN_ATTRS.has(name) ? "true" : value;
      },
      visible: () =>
        [...root.querySelectorAll<HTMLElement>("[data-part]")].flatMap((element) =>
          element.dataset["part"]?.startsWith("article:") === true && element.checkVisibility()
            ? [element.dataset["part"] ?? ""]
            : [],
        ),
      events: (name) => mounted.events.get(name) ?? [],
    },
    dispose: mounted.dispose,
  };
};

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const WILDCARD_IDREF =
  'the scenario uses the "*" (any non-empty IDREF) convention, which the replay engine does not implement';
const CTRL_HOME_TEXT_WINS =
  "APG Keyboard Interaction says Control+Home moves to the first focusable element before the feed (pattern text wins over the example, which focuses the first article)";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "feed.apg.roles.article-has-labelledby": WILDCARD_IDREF,
  "feed.apg.roles.article-has-describedby-for-primary-content": WILDCARD_IDREF,
  "feed.apg.example.ctrl-home-focuses-first-article": CTRL_HOME_TEXT_WINS,
};

describe("createFeed x ported scenarios (real DOM)", () => {
  const file = parseScenarioFile(apg);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const run = replayScenario(scenario, feedBridge, feedDom);
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

describe("createFeed x spec (differential walk)", () => {
  for (const config of [
    { loaded: 1 },
    { loaded: 3 },
    { loaded: 6 },
    { loaded: 3, sizeMode: "total", totalKnown: true },
    { loaded: 3, sizeMode: "total", totalKnown: false },
    // controlled: a host that accepts every request, and one that pins the
    // value (rejects), so no event commits
    { loaded: 1, controlled: true },
    { loaded: 3, controlled: true, value: 2 },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: feedSteps,
        probe: feedProbe,
        makePair: () => Promise.resolve([specDriver(model, feedBridge, config), feedDom(config)]),
        runs: 12,
        steps: 20,
        seed: 13,
      });
    });
  }
});
