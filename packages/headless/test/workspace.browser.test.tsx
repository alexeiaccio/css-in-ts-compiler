import {
  type ScenarioConfig,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  workspaceBridge,
  workspaceProbe,
  workspaceSteps,
} from "@cssints/apg-specs/patterns/workspace.bridge";
import definitionJson from "@cssints/apg-specs/patterns/workspace.model.json";
import scenarios from "@cssints/apg-specs/scenarios/patterns/workspace.spec.json";
import { flush } from "solid-js";
import { mountWorkspace } from "./workspace.fixture";
import { supportsFocusGroup } from "../src/focusgroup";
import { userEvent } from "vite-plus/test/browser";
import { workspaceDriver } from "./workspace.driver";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) => workspaceDriver(mountWorkspace(config));

/** Let Solid apply the signal writes and run the host's focus effect. */
const settle = async (): Promise<void> => {
  flush();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  flush();
};

const partOf = (root: HTMLElement, part: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-part="${part}"]`);
  if (element === null) {
    throw new Error(`no part ${part}`);
  }
  return element;
};

describe("createWorkspace x scenarios (spec model and real DOM)", () => {
  const file = parseScenarioFile(scenarios);
  for (const scenario of file.scenarios) {
    it(`${scenario.id} (model)`, async () => {
      const result = await replayScenario(scenario, workspaceBridge, (config) =>
        specDriver(model, workspaceBridge, config),
      );
      expect(result).toEqual({ status: "passed", skipped: [] });
    });
    it(`${scenario.id} (DOM)`, async (context) => {
      const result = await replayScenario(scenario, workspaceBridge, dom);
      if (result.status === "unsupported") {
        context.skip(result.reason);
        return;
      }
      expect(result).toEqual({ status: "passed", skipped: [] });
    });
  }
});

describe("createWorkspace x spec (differential walk)", () => {
  for (const config of [{}, { keepWhenEmpty: true }]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: workspaceSteps,
        probe: workspaceProbe,
        makePair: () => Promise.resolve([specDriver(model, workspaceBridge, config), dom(config)]),
        runs: 20,
        steps: 30,
        seed: 29,
      });
    });
  }
});

describe("createWorkspace keyboard move", () => {
  it.skipIf(!supportsFocusGroup())(
    "moves the focused tab along the row with Ctrl+Alt+Arrow",
    async () => {
      const mounted = mountWorkspace({});
      try {
        partOf(mounted.root, "tab:0").focus();
        await userEvent.keyboard("{Control>}{Alt>}{ArrowRight}{/Alt}{/Control}");
        await settle();
        expect(mounted.workspace.home(0)).toBe("tabset1");
        expect(mounted.workspace.home(1)).toBe("tabset0");
        // the element was rebuilt in the other list, so focus followed it there
        expect(document.activeElement).toBe(partOf(mounted.root, "tab:0"));
        expect(partOf(mounted.root, "tabset:1").getAttribute("data-tabs")).toBe("3");

        // macOS spells the chord Ctrl+Cmd
        await userEvent.keyboard("{Control>}{Meta>}{ArrowLeft}{/Meta}{/Control}");
        await settle();
        expect(mounted.workspace.home(0)).toBe("tabset0");
        expect(document.activeElement).toBe(partOf(mounted.root, "tab:0"));
      } finally {
        mounted.dispose();
      }
    },
  );

  it.skipIf(!supportsFocusGroup())("leaves a plain arrow to the tab list", async () => {
    const mounted = mountWorkspace({});
    try {
      partOf(mounted.root, "tab:0").focus();
      await userEvent.keyboard("{ArrowRight}");
      await settle();
      // APG tabs: the arrow moved focus (and automatic activation the selection)
      expect(document.activeElement).toBe(partOf(mounted.root, "tab:1"));
      expect(mounted.workspace.home(0)).toBe("tabset0");
      expect(mounted.workspace.home(1)).toBe("tabset0");
      expect(partOf(mounted.root, "tab:1").getAttribute("aria-selected")).toBe("true");
    } finally {
      mounted.dispose();
    }
  });

  it.skipIf(!supportsFocusGroup())("closes the focused tab with Delete", async () => {
    const mounted = mountWorkspace({});
    try {
      partOf(mounted.root, "tab:2").focus();
      await userEvent.keyboard("{Delete}");
      await settle();
      expect(mounted.workspace.home(2)).toBe("closed");
      expect(mounted.root.querySelector('[data-part="tab:2"]')).toBeNull();
      expect(mounted.workspace.announcement()).toBe("Files closed");
      // focus went to the tabset's next active tab, not to the body
      expect(document.activeElement).toBe(partOf(mounted.root, "tab:3"));
    } finally {
      mounted.dispose();
    }
  });

  it("says so when the host refuses a close, instead of doing nothing", async () => {
    const mounted = mountWorkspace({}, { canDrop: (change) => change.reason !== "close" });
    try {
      partOf(mounted.root, "tab:2").focus();
      await userEvent.keyboard("{Delete}");
      await settle();
      // the key was handled - the page did not get it - and the tab is still there
      expect(mounted.workspace.home(2)).toBe("tabset1");
      expect(mounted.workspace.reason()).toBe("none");
      expect(partOf(mounted.root, "tab:2")).toBeDefined();
      // a key that does nothing is a mystery: the refusal is in words
      expect(partOf(mounted.root, "live").textContent).toBe("Files cannot be closed");
      expect(document.activeElement).toBe(partOf(mounted.root, "tab:2"));
    } finally {
      mounted.dispose();
    }
  });

  it("floats a tab with Ctrl+Alt+ArrowUp and docks it back with Ctrl+Alt+ArrowDown", async () => {
    const mounted = mountWorkspace({});
    try {
      mounted.workspace.pick(0);
      expect(mounted.workspace.drop("tabsetF")).toBe(true);
      expect(mounted.workspace.home(0)).toBe("float");
      expect(mounted.workspace.tabsetOpen("float")).toBe(true);
      expect(mounted.workspace.dock()).toBe(true);
      expect(mounted.workspace.home(0)).toBe("tabset1");
      expect(mounted.workspace.tabsetOpen("float")).toBe(false);
    } finally {
      mounted.dispose();
    }
  });
});

describe("createWorkspace announcements, veto and detach", () => {
  it("says what landed, in words", async () => {
    const mounted = mountWorkspace({});
    try {
      mounted.workspace.pick(0);
      mounted.workspace.drop("tabset1");
      await settle();
      expect(mounted.workspace.announcement()).toBe("Logs moved to the right tabset");
      expect(partOf(mounted.root, "live").textContent).toBe("Logs moved to the right tabset");

      mounted.workspace.pick(1);
      mounted.workspace.close(1);
      await settle();
      expect(partOf(mounted.root, "live").textContent).toBe("Runs closed");

      mounted.workspace.pick(2);
      mounted.workspace.detach(2);
      await settle();
      expect(partOf(mounted.root, "live").textContent).toBe("Files detached");
    } finally {
      mounted.dispose();
    }
  });

  it("keeps the tab in hand when the host refuses a drop", async () => {
    const mounted = mountWorkspace({}, { canDrop: (change) => change.reason !== "move" });
    try {
      mounted.workspace.pick(0);
      expect(mounted.workspace.drop("tabset1")).toBe(false);
      await settle();
      expect(mounted.workspace.home(0)).toBe("tabset0");
      expect(mounted.workspace.picked()).toBe(0);
      expect(mounted.workspace.reason()).toBe("none");
      expect(partOf(mounted.root, "live").textContent).toBe("Logs cannot be dropped there");
      // the interaction can continue: the same tab still lands elsewhere
      expect(mounted.workspace.drop("float")).toBe(true);
      expect(mounted.workspace.home(0)).toBe("float");
    } finally {
      mounted.dispose();
    }
  });

  it("round-trips a detached tab as a serialisable value", async () => {
    const mounted = mountWorkspace({});
    try {
      const value = mounted.workspace.detach(0);
      await settle();
      expect(value).toEqual({ id: 0, data: "Logs" });
      expect(JSON.parse(JSON.stringify(value))).toEqual({ id: 0, data: "Logs" });
      expect(mounted.workspace.home(0)).toBe("out");
      // a detached tab is not in the window, so it has no element
      expect(mounted.root.querySelector('[data-part="tab:0"]')).toBeNull();
      expect(partOf(mounted.root, "tabset:0").getAttribute("data-tabs")).toBe("1");

      expect(mounted.workspace.attach(value)).toBe(true);
      await settle();
      expect(mounted.workspace.home(0)).toBe("tabset1");
      expect(partOf(mounted.root, "tab:0").getAttribute("data-home")).toBe("tabset1");
      expect(partOf(mounted.root, "tab:0").getAttribute("aria-selected")).toBe("true");
      expect(partOf(mounted.root, "live").textContent).toBe("Logs attached");
    } finally {
      mounted.dispose();
    }
  });

  it("copies into the target the host names", async () => {
    const mounted = mountWorkspace({});
    try {
      mounted.workspace.pick(0);
      expect(mounted.workspace.copy(0, "tabsetF")).toBe(true);
      await settle();
      // the source stays where it was; the host was asked for a duplicate elsewhere
      expect(mounted.workspace.home(0)).toBe("tabset0");
      expect(mounted.events.get("onCopy")).toEqual([[0, "tabsetF"]]);
      expect(partOf(mounted.root, "live").textContent).toBe(
        "Logs duplicated to the floating tabset",
      );

      // the tab's own container is refused, like a drop on it
      expect(mounted.workspace.copy(0, "tabset0")).toBe(false);
      expect(mounted.workspace.reason()).toBe("none");
      expect(mounted.events.get("onCopy")).toEqual([[0, "tabsetF"]]);

      // an edge target travels too, and the words name the edge it will make
      expect(mounted.workspace.copy(1, "edge-left")).toBe(true);
      await settle();
      expect(mounted.events.get("onCopy")).toEqual([
        [0, "tabsetF"],
        [1, "edge-left"],
      ]);
      expect(partOf(mounted.root, "live").textContent).toBe(
        "Runs duplicated to the left edge tabset",
      );
    } finally {
      mounted.dispose();
    }
  });

  it("renders every props bag as a part", () => {
    const mounted = mountWorkspace({});
    try {
      const parts = [...mounted.root.querySelectorAll("[data-part]")].map(
        (element) => element.getAttribute("data-part") ?? "",
      );
      for (const part of [
        "workspace",
        "tabset:0",
        "tabset:1",
        "tabset:F",
        "tabset:E",
        "tablist:0",
        "tablist:1",
        "tablist:F",
        "tablist:E",
        "tab:0",
        "tab:3",
        "tabpanel",
        "floating",
        "drop-indicator",
        "live",
      ]) {
        expect(parts).toContain(part);
      }
      expect(partOf(mounted.root, "tabset:0").getAttribute("data-open")).toBe("true");
      expect(partOf(mounted.root, "tabset:F").getAttribute("data-open")).toBe("false");
      expect(partOf(mounted.root, "tabset:E").getAttribute("data-open")).toBe("false");
      expect(partOf(mounted.root, "drop-indicator").hasAttribute("hidden")).toBe(true);
      expect(partOf(mounted.root, "live").getAttribute("role")).toBe("status");
    } finally {
      mounted.dispose();
    }
  });

  it("leaves no dead tab stop when a tabset loses its last tab", async () => {
    const mounted = mountWorkspace({});
    try {
      mounted.workspace.close(2);
      mounted.workspace.close(3);
      await settle();
      expect(mounted.workspace.tabsetOpen("tabset1")).toBe(false);
      const list = partOf(mounted.root, "tablist:1");
      expect(list.querySelectorAll('[role="tab"]').length).toBe(0);
      expect(list.tabIndex).toBe(-1);
      expect(list.checkVisibility()).toBe(false);
    } finally {
      mounted.dispose();
    }
  });
});

describe("createWorkspace panels, initial layout and names", () => {
  // The panels are the reason a host binds `hidden` straight from the bag: the active tab decides
  // which one is visible, and a panel that never hides is a stack of four overlapping panels. The
  // workspace mutates `active` in place, so this only holds when the inner tab list reads the
  // version signal — a regression test for 0.46.0's dead `hidden`.
  it("hides every panel but the active tab's, and the active one changes", async () => {
    const mounted = mountWorkspace({});
    try {
      await settle();
      const panels = (): ReadonlyArray<HTMLElement> => [
        ...mounted.root.querySelectorAll<HTMLElement>('[data-part="tabpanel"]'),
      ];
      const visible = (): number => panels().filter((panel) => !panel.hidden).length;
      // four tabs, two tabsets: one visible panel in each
      expect(panels().length).toBe(4);
      expect(visible()).toBe(2);

      // the second tab of the right tabset was never active
      mounted.root.querySelector<HTMLElement>('[data-part="tab:3"]')?.click();
      await settle();
      expect(visible()).toBe(2);
      expect(
        panels()
          .filter((panel) => !panel.hidden)
          .map((panel) => panel.textContent),
      ).toContain("tabset1:Preview");
    } finally {
      mounted.dispose();
    }
  });

  it("starts where the host says, without replaying a move", async () => {
    const mounted = mountWorkspace({}, { initial: { 2: "tabset0", 3: "tabset0" } });
    try {
      await settle();
      const workspace = mounted.workspace;
      expect(workspace.tabsIn("tabset0").map((tab) => tab.id)).toEqual([0, 1, 2, 3]);
      expect(workspace.tabsetOpen("tabset1")).toBe(false);
      // the dealt layout would have written a sentence and asked for focus; the host's does neither
      expect(workspace.announcement()).toBe("");
      expect(workspace.focusRequested()).toBeNull();
    } finally {
      mounted.dispose();
    }
  });

  it("speaks the tabset name the host chose", async () => {
    const mounted = mountWorkspace({}, { labels: { tabset0: "Detail" } });
    try {
      await settle();
      expect(partOf(mounted.root, "tablist:0").getAttribute("aria-label")).toBe("Detail tabs");
      expect(partOf(mounted.root, "tabset:0").getAttribute("aria-label")).toBe("Detail");
      // an unnamed tabset keeps the positional default
      expect(partOf(mounted.root, "tablist:1").getAttribute("aria-label")).toBe(
        "Right tabset tabs",
      );
    } finally {
      mounted.dispose();
    }
  });
});
