import {
  type ActionStep,
  type Driver,
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  treeviewBridge,
  treeviewConfig,
  treeviewProbe,
  treeviewSteps,
} from "@cssints/apg-specs/src/apg/treeview.bridge";
import apg from "@cssints/apg-specs/scenarios/apg/treeview.apg.json";
import definitionJson from "@cssints/apg-specs/src/apg/treeview.model.generated.json";
import { mountTreeview } from "./treeview.fixture";
import { userEvent } from "vite-plus/test/browser";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const NAMED_KEYS = new Set(["Enter", "Home", "End"]);

const keyboardSyntax = (key: string): string => {
  if (key === "Space" || key === " ") {
    return " ";
  }
  return NAMED_KEYS.has(key) || key.startsWith("Arrow") ? `{${key}}` : key;
};

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });

/**
 * The DOM side of the treeview scenario bridge. Targets are the `data-part`
 * slash paths (`tree`, `treeitem:0/1`), so it resolves them directly rather
 * than through the generic index scheme. `type` / `typeaheadReset` reach the
 * primitive's type-ahead directly.
 */
const treeviewDriver = (
  mounted: ReturnType<typeof mountTreeview>,
  consumeEvents: boolean,
): Driver => {
  const { root, treeview } = mounted;
  const consumed = new Map<string, number>();

  const elementOf = (target: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(`[data-part="${target}"]`);
    if (element === null) {
      throw new Error(`unknown part ${target}`);
    }
    return element;
  };
  const roving = (): HTMLElement | null =>
    root.querySelector<HTMLElement>('[data-part="tree"] [tabindex="0"]');
  const focusTarget = (target: string): void => {
    if (target === "" || target === "tree") {
      roving()?.focus();
      return;
    }
    elementOf(target).focus();
  };

  return {
    perform: async (step: ActionStep) => {
      switch (step.event) {
        case "focus":
          focusTarget(step.target ?? "tree");
          break;
        case "blur": {
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            active.blur();
          } else {
            roving()?.blur();
          }
          break;
        }
        case "click": {
          const element = elementOf(step.target ?? "");
          // Like the spec: an unreachable (hidden) node ignores the click, but
          // the type-ahead buffer still resets.
          if (!element.checkVisibility()) {
            element.click();
            break;
          }
          if (document.activeElement !== element) {
            element.focus();
          }
          await userEvent.click(element);
          break;
        }
        case "key": {
          focusTarget(step.target ?? "tree");
          await userEvent.keyboard(keyboardSyntax(step.key ?? ""));
          break;
        }
        case "type": {
          focusTarget(step.target ?? "tree");
          await userEvent.keyboard(step.text ?? "");
          break;
        }
        case "typeaheadReset":
          treeview.resetTypeahead();
          break;
        case "prop":
          mounted.setProp(step.prop ?? "", step.value);
          break;
        case "hover":
        case "unhover":
          break;
        default:
          throw new Error(`unsupported event ${step.event}`);
      }
      await settle();
    },
    observer: {
      focus: () => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement) || !root.contains(active)) {
          return null;
        }
        const part = active.closest<HTMLElement>("[data-part]");
        return part?.dataset["part"] ?? null;
      },
      attr: (target, name) => {
        const value = elementOf(target).getAttribute(name);
        if (value === null) {
          return null;
        }
        if (value === "" && (name === "hidden" || name === "disabled")) {
          return "true";
        }
        return value;
      },
      visible: () =>
        [...root.querySelectorAll<HTMLElement>('[data-part^="treeitem"]')].flatMap((element) =>
          element.checkVisibility() ? [element.dataset["part"] ?? ""] : [],
        ),
      events: (name) => {
        const fired = mounted.events.get(name) ?? [];
        if (!consumeEvents) {
          return fired;
        }
        const seen = consumed.get(name) ?? 0;
        consumed.set(name, fired.length);
        return fired.slice(seen);
      },
    },
    dispose: mounted.dispose,
  };
};

const dom = (config: ScenarioConfig) => treeviewDriver(mountTreeview(treeviewConfig(config)), true);

// The walk compares cumulative event lists after every step, like `specDriver`.
const domCumulative = (config: ScenarioConfig) =>
  treeviewDriver(mountTreeview(treeviewConfig(config)), false);

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const FOCUS_ON_ENTRY =
  "APG focuses the selected node when the tree receives focus; the treeview spec (and the primitive) keep the roving node instead.";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "treeview.apg.focus-selected-node": FOCUS_ON_ENTRY,
  "treeview.apg.focus-first-selected-node-multi-select": FOCUS_ON_ENTRY,
};

describe("createTreeview x ported scenarios (real DOM)", () => {
  const file = parseScenarioFile(apg);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const run = replayScenario(scenario, treeviewBridge, dom);
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

describe("createTreeview x spec (differential walk)", () => {
  const configs: ReadonlyArray<ScenarioConfig> = [
    {},
    { multiSelectable: true },
    {
      multiSelectable: true,
      expanded: ["0", "0/0"],
      selected: ["treeitem:1", "treeitem:0/0/1"],
      focus: "treeitem:0/0/0",
    },
    // controlled: a host that accepts every request, one that holds the value
    // (rejects), one that holds it in multi-select, and pinned values
    { controlled: true, accepts: true },
    { controlled: true, accepts: false },
    { controlled: true, accepts: true, multiSelectable: true },
    {
      controlled: true,
      accepts: true,
      expanded: ["0"],
      selected: ["treeitem:0/0"],
    },
    {
      controlled: true,
      accepts: false,
      expanded: ["0"],
      selected: ["treeitem:0/0"],
    },
  ];
  for (const config of configs) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: treeviewSteps,
        probe: treeviewProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, treeviewBridge, config), domCumulative(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
