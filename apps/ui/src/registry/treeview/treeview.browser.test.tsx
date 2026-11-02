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
import { TREEVIEW_NODES } from "@cssints/headless";
import { nodeToPath, pathToNode } from "@cssints/apg-specs/apg/treeview.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  treeviewBridge,
  treeviewConfig,
  treeviewProbe,
  treeviewSteps,
} from "@cssints/apg-specs/apg/treeview.bridge";
import apg from "@cssints/apg-specs/scenarios/apg/treeview.apg.json";
import definitionJson from "@cssints/apg-specs/apg/treeview.model.json";
import { type TreeviewMounted, mountTreeview } from "./treeview.fixture";
import { flush } from "solid-js";
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
 * The DOM side of the treeview scenario bridge. The scenario names a row by its slash path
 * (`treeitem:0/1`); the skin paints one part for every row, in document order, so the path resolves
 * to that node's position in `TREEVIEW_NODES`. `type` / `typeaheadReset` reach the primitive's
 * type-ahead directly.
 */
const treeviewDriver = (mounted: TreeviewMounted, consumeEvents: boolean): Driver => {
  const { root, treeview } = mounted;
  const consumed = new Map<string, number>();

  const items = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="treeview-item"]'),
  ];
  const tree = (): HTMLElement => {
    const element = root.querySelector<HTMLElement>('[data-part="treeview"]');
    if (element === null) {
      throw new Error("no treeview part");
    }
    return element;
  };
  const elementOf = (target: string): HTMLElement => {
    if (target === "" || target === "tree") {
      return tree();
    }
    const id = pathToNode(target);
    const element = items()[TREEVIEW_NODES.findIndex((node) => node.id === id)];
    if (element === undefined) {
      throw new Error(`unknown part ${target}`);
    }
    return element;
  };
  const pathOf = (element: HTMLElement): string | null => {
    const node = TREEVIEW_NODES[items().indexOf(element)];
    return node === undefined ? null : nodeToPath(node.id);
  };
  const roving = (): HTMLElement | null =>
    tree().querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]');
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
        const part = active.closest<HTMLElement>('[data-part="treeview-item"]');
        return part === null ? "tree" : pathOf(part);
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
        items().flatMap((element) => {
          const path = pathOf(element);
          return path !== null && element.checkVisibility() ? [path] : [];
        }),
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

describe("Treeview x ported scenarios (real DOM)", () => {
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

describe("Treeview x spec (differential walk)", () => {
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

// The walk above is the primitive's contract through the skin's markup. What the skin adds is one part per row, the indent
// from `aria-level`, the selected row's fill, the chevron turned by `aria-expanded`, the hidden rows of a closed parent, and
// the DOM focus that follows the primitive's roving tabindex.
const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const token = (name: string): string => {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${name})`;
  document.body.append(probe);
  const value = style(probe).backgroundColor;
  probe.remove();
  return value;
};

/** Solid 2 delivers delegated events on a later turn. */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const live: TreeviewMounted[] = [];
const mount = (config: ScenarioConfig = {}): TreeviewMounted => {
  const mounted = mountTreeview(treeviewConfig(config));
  live.push(mounted);
  return mounted;
};

afterEach(() => {
  for (const mounted of live.splice(0)) {
    mounted.dispose();
  }
});

const tree = (mounted: TreeviewMounted): HTMLElement =>
  mounted.root.querySelector<HTMLElement>('[data-part="treeview"]')!;
const rows = (mounted: TreeviewMounted): HTMLElement[] => [
  ...mounted.root.querySelectorAll<HTMLElement>('[data-part="treeview-item"]'),
];
/** The row of a spec node, by its id: the skin paints every row with the same part. */
const row = (mounted: TreeviewMounted, id: number): HTMLElement =>
  rows(mounted)[TREEVIEW_NODES.findIndex((node) => node.id === id)]!;
const chevron = (element: HTMLElement): HTMLElement =>
  element.querySelector<HTMLElement>(':scope > [aria-hidden="true"]')!;

describe("Treeview (the kit's look)", () => {
  it("is a named tree of rows, indented by the level the primitive announces", () => {
    const mounted = mount({ expanded: ["0"] });

    expect(tree(mounted).tagName).toBe("UL");
    expect(tree(mounted).getAttribute("data-part")).toBe("treeview");
    expect(tree(mounted).getAttribute("role")).toBe("tree");
    expect(tree(mounted).getAttribute("aria-label")).toBe("Files");
    expect(rows(mounted).every((element) => element.getAttribute("role") === "treeitem")).toBe(
      true,
    );
    expect(rows(mounted).every((element) => element.tagName === "LI")).toBe(true);

    // the level is the primitive's aria-level, and the skin's indent reads it (never a second copy)
    const projects = row(mounted, 1);
    const reports = row(mounted, 2);
    expect(projects.getAttribute("aria-level")).toBe("1");
    expect(reports.getAttribute("aria-level")).toBe("2");
    expect(parseFloat(style(reports).paddingInlineStart)).toBeGreaterThan(
      parseFloat(style(projects).paddingInlineStart),
    );
  });

  it("paints the selected row and turns the chevron from aria-expanded", async () => {
    const mounted = mount({ expanded: ["0"] });
    const projects = row(mounted, 1);
    const photos = row(mounted, 6);
    const resting = style(photos).backgroundColor;

    // an open parent's chevron is turned; a closed one's is not
    expect(projects.getAttribute("aria-expanded")).toBe("true");
    expect(row(mounted, 2).getAttribute("aria-expanded")).toBe("false");
    expect(style(chevron(projects)).transform).not.toBe("none");
    expect(style(chevron(row(mounted, 2))).transform).toBe("none");

    await userEvent.click(photos);
    await tick();

    expect(photos.getAttribute("aria-selected")).toBe("true");
    expect(projects.getAttribute("aria-selected")).toBe("false");
    expect(style(photos).backgroundColor).toBe(token("--color-button-background"));
    expect(style(photos).backgroundColor).not.toBe(resting);
  });

  it("does not paint the rows of a collapsed parent", () => {
    const mounted = mount();
    const reports = row(mounted, 2);

    // the primitive hides the row; the skin's own `display` must not override `[hidden]`
    expect(reports.hasAttribute("hidden")).toBe(true);
    expect(reports.checkVisibility()).toBe(false);
    expect(row(mounted, 1).checkVisibility()).toBe(true);
    expect(row(mounted, 6).checkVisibility()).toBe(true);
  });

  it("moves the real DOM focus to the row the primitive made roving", async () => {
    const mounted = mount();
    const projects = row(mounted, 1);
    const photos = row(mounted, 6);

    expect(projects.getAttribute("tabindex")).toBe("0");
    expect(photos.getAttribute("tabindex")).toBe("-1");

    projects.focus();
    projects.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
    );
    flush();
    await tick();

    expect(document.activeElement).toBe(photos);
    expect(photos.getAttribute("tabindex")).toBe("0");
    expect(projects.getAttribute("tabindex")).toBe("-1");
    expect(mounted.treeview.focus()).toBe(6);
  });
});
