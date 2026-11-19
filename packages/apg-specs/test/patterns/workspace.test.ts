import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/patterns/workspace.model.generated.json";
import { workspaceBridge } from "../../src/patterns/workspace.bridge";
import { parseScenarioFile, replayScenario, specDriver } from "../../src/scenario";
import scenarios from "../../scenarios/patterns/workspace.spec.json";

// Spec-only verification for specs/patterns/workspace.qnt: four tabs, two docked
// tabsets in one row split, one floating tabset, one edge tabset a drop creates.
// A drop names its target as data (`tab0` .. `edge-bottom`), so the model never
// sees a pointer; a copy names its destination the same way, through the one
// nondet pool, so `explore` walks every copy target as well as the 22 actions.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (start: QuintModelValue, ...tags: ReadonlyArray<string>): QuintModelValue =>
  tags.reduce((state, tag) => step(state, { _tag: tag }), start);

/** `copyTab` is the one action with a payload: the destination the host named. */
const copy = (start: QuintModelValue, dest = "tab1"): QuintModelValue =>
  step(start, { _tag: "copyTab", dest });

const initial = model.initial;

const homes = (state: QuintModelValue): ReadonlyArray<string> =>
  ["where0", "where1", "where2", "where3"].map(
    (name) => ["tabset0", "tabset1", "float", "edge", "out", "closed"][Number(state[name])] ?? "?",
  );

const actives = (state: QuintModelValue): ReadonlyArray<number> =>
  ["active0", "active1", "activeF", "activeE"].map((name) => Number(state[name]));

const value = (state: QuintModelValue): unknown => workspaceBridge.value?.(state);

const pick = (target: number): ReadonlyArray<string> => [`pick${target}`];

describe("patterns workspace (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "EachTabHasOneHome",
      "HomeContainerExists",
      "NoEmptyContainer",
      "ActiveIsAMember",
      "ActiveIsAlwaysSet",
      "EdgeSideKnown",
      "CollapsedTabsetExists",
      "RefusalKeepsTheTabs",
      "MoveTouchesOneTab",
      "CopyKeepsSource",
      "CopyNamesItsTarget",
      "CloseTouchesOneTab",
      "TransferTouchesOneTab",
      "CollapseMovesNoTab",
      "FloatShowsTheTabset",
      "DockEndsTheFloat",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // a home outside the six
    expect(violatedInvariants(model, { ...initial, where0: 6n })).toEqual([
      "EachTabHasOneHome",
      "ActiveIsAMember",
      "RefusalKeepsTheTabs",
    ]);
    // a tab that points at a container that is not there
    expect(violatedInvariants(model, { ...initial, exists0: false })).toEqual([
      "HomeContainerExists",
    ]);
    expect(violatedInvariants(model, { ...initial, where3: 2n, activeF: 3n })).toEqual([
      "HomeContainerExists",
      "RefusalKeepsTheTabs",
    ]);
    // a container that ran out of tabs and stayed
    expect(violatedInvariants(model, { ...initial, where0: 1n, where1: 1n, active0: -1n })).toEqual(
      ["NoEmptyContainer", "RefusalKeepsTheTabs"],
    );
    // an active tab that is not in its container, and a container with none
    expect(violatedInvariants(model, { ...initial, active0: 2n })).toEqual(["ActiveIsAMember"]);
    expect(violatedInvariants(model, { ...initial, active0: -1n })).toEqual(["ActiveIsAlwaysSet"]);
    // an edge tabset whose side is not one of the four edges
    expect(
      violatedInvariants(model, {
        ...initial,
        where0: 3n,
        where1: 3n,
        active0: -1n,
        activeE: 0n,
        exists0: false,
        side: "middle",
      }),
    ).toEqual(["EdgeSideKnown", "RefusalKeepsTheTabs"]);
    // a collapsed tabset that is not there
    const emptied = run(initial, "pick0", "dropTab1", "pick1", "dropTab1");
    expect(violatedInvariants(model, { ...emptied, collapsed0: true })).toEqual([
      "CollapsedTabsetExists",
    ]);
    // a report that does not match what moved
    const moved = { reason: "none", where0: 1n, active0: 1n, active1: 0n };
    expect(violatedInvariants(model, { ...initial, ...moved })).toEqual(["RefusalKeepsTheTabs"]);
    expect(violatedInvariants(model, { ...initial, ...moved, reason: "copy" })).toEqual([
      "CopyKeepsSource",
      "CopyNamesItsTarget",
    ]);
    expect(violatedInvariants(model, { ...initial, ...moved, reason: "close" })).toEqual([
      "CloseTouchesOneTab",
    ]);
    expect(violatedInvariants(model, { ...initial, ...moved, reason: "transfer" })).toEqual([
      "TransferTouchesOneTab",
    ]);
    // a close that left the tab in the window
    expect(violatedInvariants(model, { ...initial, ...moved, reason: "close" })).toContain(
      "CloseTouchesOneTab",
    );
    // a float that does not show the floating tabset, a dock that leaves it up
    expect(violatedInvariants(model, { ...initial, reason: "float" })).toEqual([
      "FloatShowsTheTabset",
    ]);
    expect(violatedInvariants(model, { ...initial, reason: "dock", floatOn: true })).toEqual([
      "NoEmptyContainer",
      "DockEndsTheFloat",
    ]);
  });

  it("starts with two tabsets, two tabs each, nothing floating", () => {
    expect(initial).toMatchObject({
      where0: 0n,
      where1: 0n,
      where2: 1n,
      where3: 1n,
      active0: 0n,
      active1: 2n,
      activeF: -1n,
      activeE: -1n,
      exists0: true,
      exists1: true,
      floatOn: false,
      side: "none",
      collapsed0: false,
      collapsed1: false,
      keepEmpty: false,
      drag: -1n,
      target: "none",
      reason: "none",
      copies: 0n,
    });
  });

  it("a pick names the tab in hand; a tab out of the window cannot be picked", () => {
    expect(run(initial, "pick2")).toMatchObject({ drag: 2n });
    expect(workspaceBridge.focus?.(run(initial, "pick2"))).toBe("tab:2");
    expect(workspaceBridge.focus?.(initial)).toBeNull();
    const out = run(initial, "pick1", "transferOut");
    expect(run(out, "pick1")).toMatchObject({ drag: 1n });
    // a closed tab is not in the window either
    const closed = run(initial, "pick2", "closeTab");
    expect(run(closed, "pick2")).toMatchObject({ drag: -1n });
  });

  it("a move changes one tab's home, and the tabset it left re-selects", () => {
    const moved = run(initial, "pick0", "dropTab1");
    expect(homes(moved)).toEqual(["tabset1", "tabset0", "tabset1", "tabset1"]);
    // the arriving tab is tabset 1's active, tabset 0 falls back to its first tab
    expect(actives(moved)).toEqual([1, 0, -1, -1]);
    expect(moved).toMatchObject({ reason: "move", target: "tab1", drag: -1n });

    // a drop on the tab's own tabset is not a move
    const own = run(initial, "pick1", "dropTab0");
    expect(own).toEqual({ ...initial, drag: 1n });
    expect(run(own, "dropTab0")).toEqual({ ...initial, drag: 1n });
  });

  it("a tabset that loses its last tab disappears, and comes back when one lands", () => {
    const emptied = run(initial, "pick0", "dropTab1", "pick1", "dropTab1");
    expect(emptied).toMatchObject({ exists0: false, active0: -1n, reason: "move" });
    expect(workspaceBridge.visible?.(emptied)).toEqual([
      "tab:0",
      "tab:1",
      "tab:2",
      "tab:3",
      "tabset:1",
    ]);

    // a tab landing in it again brings it back with that tab selected
    const back = run(emptied, "pick2", "dropTab0");
    expect(back).toMatchObject({ exists0: true, active0: 2n });
  });

  it("keepWhenEmpty keeps the emptied tabset, with no active tab", () => {
    const kept = run(initial, "keepOn", "pick0", "dropTab1", "pick1", "dropTab1");
    expect(kept).toMatchObject({ exists0: true, active0: -1n });
    expect(workspaceBridge.visible?.(kept)).toContain("tabset:0");
  });

  it("an edge drop creates a tabset at that edge and keeps every tab", () => {
    const edge = run(initial, "pick2", "dropEdgeBottom");
    expect(homes(edge)).toEqual(["tabset0", "tabset0", "edge", "tabset1"]);
    expect(edge).toMatchObject({ side: "bottom", activeE: 2n, active1: 3n, reason: "move" });

    // a second edge drop joins the tabset that is already there, keeping its side
    const second = run(edge, "pick3", "dropEdgeRight");
    expect(homes(second)).toEqual(["tabset0", "tabset0", "edge", "edge"]);
    expect(second).toMatchObject({ side: "bottom", activeE: 3n, exists1: false });

    // when the edge tabset runs out, its side goes with it
    const gone = run(second, "pick2", "dropTab0", "pick3", "dropTab0");
    expect(gone).toMatchObject({ side: "none", activeE: -1n });
  });

  it("a copy names its destination, never removes the source, and reports both", () => {
    const copied = copy(run(initial, "pick0"), "tab1");
    expect(copied).toMatchObject({
      copies: 1n,
      reason: "copy",
      copyTo: "tab1",
      target: "tab1",
      drag: -1n,
    });
    expect(value(copied)).toEqual(value(initial));

    // the destination travels: the float, and an edge the duplicate alone names
    const floated = copy(run(initial, "pick0"), "tabF");
    expect(floated).toMatchObject({ copies: 1n, copyTo: "tabF", reason: "copy" });
    // recording a copy into the floating tabset does not turn the tabset on here
    expect(floated).toMatchObject({ floatOn: false });
    const edged = copy(run(initial, "pick1"), "edge-bottom");
    expect(edged).toMatchObject({ copyTo: "edge-bottom", side: "none", copies: 1n });

    // a copy with nothing in hand does not count, and names nothing
    expect(copy(initial)).toMatchObject({ copies: 0n, copyTo: "none", reason: "none" });

    // the tab's own container is refused, like a drop on it
    const own = copy(run(initial, "pick1"), "tab0");
    expect(own).toMatchObject({ copies: 0n, copyTo: "none", reason: "none", drag: 1n });

    // a tab that is out of the window cannot be copied either
    const out = copy(run(initial, "pick1", "transferOut"));
    expect(out).toMatchObject({ copies: 0n, copyTo: "none", reason: "none" });
  });

  it("float shows the floating tabset; dock takes every floating tab back", () => {
    const floated = run(initial, "pick0", "dropFloat");
    expect(homes(floated)).toEqual(["float", "tabset0", "tabset1", "tabset1"]);
    expect(floated).toMatchObject({ floatOn: true, activeF: 0n, active0: 1n, reason: "float" });

    const docked = run(floated, "dockFloat");
    expect(homes(docked)).toEqual(["tabset1", "tabset0", "tabset1", "tabset1"]);
    expect(docked).toMatchObject({ floatOn: false, activeF: -1n, reason: "dock" });
    // docking with nothing floating is refused
    expect(run(initial, "dockFloat")).toEqual(initial);
  });

  it("a transfer takes one tab out of the window and attach brings it back", () => {
    const out = run(initial, "pick1", "transferOut");
    expect(out).toMatchObject({ reason: "transfer", target: "out", active0: 0n });
    expect(homes(out)).toEqual(["tabset0", "out", "tabset1", "tabset1"]);
    expect(workspaceBridge.visible?.(out)).toEqual([
      "tab:0",
      "tab:2",
      "tab:3",
      "tabset:0",
      "tabset:1",
    ]);

    const back = run(out, "attach");
    expect(homes(back)).toEqual(["tabset0", "tabset1", "tabset1", "tabset1"]);
    expect(back).toMatchObject({ reason: "transfer", target: "tab1", active1: 1n });
    // nothing is out: attach is refused, and a drop with no tab in hand too
    expect(run(initial, "attach")).toEqual(initial);
    expect(run(initial, "dropTabF")).toEqual(initial);
  });

  it("a close removes the tab and empties the tabset it was alone in", () => {
    const closed = run(initial, "pick2", "closeTab");
    expect(homes(closed)).toEqual(["tabset0", "tabset0", "closed", "tabset1"]);
    expect(closed).toMatchObject({ reason: "close", active1: 3n });

    const last = run(closed, "pick3", "closeTab");
    expect(last).toMatchObject({ exists1: false, active1: -1n });
    expect(workspaceBridge.attr?.(last, "tab:2", "data-home")).toBe("closed");
  });

  it("collapsing keeps every tab, and an absent tabset cannot be collapsed", () => {
    const collapsed = run(initial, "collapse0");
    expect(collapsed).toMatchObject({ collapsed0: true, reason: "collapse" });
    expect(value(collapsed)).toEqual(value(initial));
    expect(run(collapsed, "collapse0")).toMatchObject({ collapsed0: false });

    const emptied = run(initial, "pick0", "dropTab1", "pick1", "dropTab1");
    const refused = run(emptied, "collapse0");
    expect(value(refused)).toEqual(value(emptied));
    expect(refused).toMatchObject({ collapsed0: false, reason: "none" });
  });

  it("a refused request leaves every observable as it was and says nothing", () => {
    const before = value(initial);
    for (const tag of ["cancel", "attach", "dockFloat", "closeTab"]) {
      const after = run(initial, tag);
      expect(after).toMatchObject({ reason: "none" });
      expect(value(after), tag).toEqual(before);
    }
    // a copy with no tab in hand changes nothing either, whatever it names
    for (const dest of ["tab0", "tab1", "tabF", "edge-left", "float"]) {
      expect(copy(initial, dest)).toMatchObject({ reason: "none", copies: 0n, copyTo: "none" });
    }
    // a drop with no target named, and a prop the model cannot honour
    expect(value(run(initial, "dropTab1"))).toEqual(before);
    expect(() => workspaceBridge.setup({ keepWhenEmpty: false })).not.toThrow();
    expect(() => workspaceBridge.setup({ keepWhenEmpty: "yes" })).toThrow();
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(500);
  });

  it("the bridge names the tab in hand and the target it was dropped on", () => {
    expect(pick(0)).toEqual(["pick0"]);
    expect(() => workspaceBridge.event({ event: "drop", target: "tab:9" })).toThrow();
    expect(() => workspaceBridge.event({ event: "pick", target: "tabset:0" })).toThrow();
    expect(() => workspaceBridge.event({ event: "collapse", target: "tabset:F" })).toThrow();
    // a copy names a destination, so a copy without one is not a step
    expect(() => workspaceBridge.event({ event: "copy" })).toThrow();
    expect(workspaceBridge.event({ event: "copy", target: "tabF" })).toEqual([
      { _tag: "copyTab", dest: "tabF" },
    ]);
  });
});

describe("workspace scenarios (spec driver)", () => {
  const file = parseScenarioFile(scenarios);
  for (const scenario of file.scenarios) {
    it(scenario.id, async () => {
      const result = await replayScenario(scenario, workspaceBridge, (config) =>
        specDriver(model, workspaceBridge, config),
      );
      // our own scenarios must be expressible: an `unsupported` here is a gap
      // in the bridge, not a step we deliberately drop
      expect(result.status).toBe("passed");
    });
  }
});
