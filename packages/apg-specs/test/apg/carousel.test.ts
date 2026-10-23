import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import {
  assertReachable,
  assertUnreachable,
  eventsOf,
  explore,
  simulate,
  stateKey,
} from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/carousel.model.generated.json";

// Spec-only verification for specs/apg/carousel.qnt (APG Carousel pattern).
//
// No Solid component exists yet, so the spec's reference model is the system
// under test: events come from the spec's own pools, `transition` is stepped,
// and every declared invariant is checked after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

// focus positions (see the spec header)
const NONE = 0n;
const ROTATION = 1n;
const PREV = 2n;
const NEXT = 3n;
const TAB0 = 4n;
const SLIDE_LINK = 7n;

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (
  events: ReadonlyArray<Record<string, unknown>>,
  from: QuintModelValue = model.initial,
): QuintModelValue => events.reduce(step, from);

// the test oracle for "slides are advancing": feature on, wanted, and either
// explicitly started or nothing engaged
const isRotating = (s: QuintModelValue): boolean =>
  s["autoRotate"] === true &&
  s["rotate"] === true &&
  (s["forced"] === true || (s["focus"] === NONE && s["hover"] === false));

const tab = { _tag: "key_tab" };
const shiftTab = { _tag: "key_shift_tab" };
const activate = { _tag: "key_activate" };
const tick = { _tag: "tick" };
const tabbedOn = { _tag: "set_tabbed", on: true };

describe("apg carousel (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "NeverRotatingWhileEngaged",
      "ForcedImpliesRotate",
      "DisabledIsIdle",
      "StickyFocusStaysStopped",
      "LiveOffIffRotating",
      "RotationLabelMatchesAction",
      "RotationControlFirst",
      "CurrentInRange",
      "SlideCountValid",
      "ExactlyOneSlideShown",
      "TabbedHasOneTabStop",
      "SlideRoleMatchesVariant",
      "FocusValid",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(
      violatedInvariants(model, {
        ...model.initial,
        forced: true,
        rotate: false,
        autoRotate: false,
        current: 5n,
        focus: 1n,
      }),
    ).toEqual([
      "ForcedImpliesRotate",
      "DisabledIsIdle",
      "CurrentInRange",
      "ExactlyOneSlideShown",
      "FocusValid",
    ]);
    // focus inside while sticky and still wanted: the pause was missed
    expect(
      violatedInvariants(model, {
        ...model.initial,
        focus: ROTATION,
        rotate: true,
      }),
    ).toEqual(["StickyFocusStaysStopped"]);
    // tab focus with no tablist rendered
    expect(
      violatedInvariants(model, {
        ...model.initial,
        focus: TAB0,
        rotate: false,
      }),
    ).toEqual(["FocusValid"]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        valueProp: 0n,
        current: 1n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the slide anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "rejected",
        base: 0n,
        current: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "accepted",
        requested: 1n,
        current: 0n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("page load: rotating, slides advance and wrap", () => {
    expect(isRotating(model.initial)).toBe(true);
    let state = step(model.initial, tick);
    expect(state["current"]).toBe(1n);
    state = run([tick, tick], state);
    expect(state["current"]).toBe(0n);
  });

  it("mouse hover pauses rotation and leaving resumes it", () => {
    let state = step(model.initial, { _tag: "pointer_enter" });
    expect(isRotating(state)).toBe(false);
    expect(step(state, tick)["current"]).toBe(0n);

    state = step(state, { _tag: "pointer_leave" });
    expect(isRotating(state)).toBe(true);
    expect(step(state, tick)["current"]).toBe(1n);
  });

  it("the rotation control is the first Tab stop, and focus entry stops rotation for good", () => {
    let state = step(model.initial, tab);
    expect(state["focus"]).toBe(ROTATION);
    expect(state).toMatchObject({ rotate: false, forced: false });
    expect(step(state, tick)["current"]).toBe(0n);

    // leaving the carousel does not resume it (pattern: explicit restart only)
    state = step(state, { _tag: "blur_out" });
    expect(isRotating(state)).toBe(false);
    expect(step(state, tick)["current"]).toBe(0n);

    // moving focus around inside never changes the intent
    state = run([tab, tab, tab, tab]);
    expect(state["focus"]).toBe(SLIDE_LINK);
    expect(state["rotate"]).toBe(false);
  });

  it("Tab walks rotation -> prev -> next -> slide link -> out; Shift+Tab reverses", () => {
    const forward = [tab, tab, tab, tab, tab].map((_, i, all) => run(all.slice(0, i + 1))["focus"]);
    expect(forward).toEqual([ROTATION, PREV, NEXT, SLIDE_LINK, NONE]);

    const backward = [shiftTab, shiftTab, shiftTab, shiftTab, shiftTab].map(
      (_, i, all) => run(all.slice(0, i + 1))["focus"],
    );
    expect(backward).toEqual([SLIDE_LINK, NEXT, PREV, ROTATION, NONE]);
  });

  it("with the policy relaxed (basic example) blur resumes rotation", () => {
    const relaxed = step(model.initial, {
      _tag: "set_sticky_focus_pause",
      on: false,
    });
    let state = step(relaxed, tab);
    expect(state["focus"]).toBe(ROTATION);
    expect(isRotating(state)).toBe(false);
    expect(state["rotate"]).toBe(true);

    state = step(state, { _tag: "blur_out" });
    expect(isRotating(state)).toBe(true);
  });

  it("an explicit Start ignores focus and hover until Stop", () => {
    // focus the control (stops rotation), then Enter/Space = Start
    let state = run([tab, activate]);
    expect(state).toMatchObject({ rotate: true, forced: true });
    expect(isRotating(state)).toBe(true);

    state = run([{ _tag: "pointer_enter" }, tick], state);
    expect(state["current"]).toBe(1n);

    // leaving the carousel does not stop an explicit Start
    const away = run([{ _tag: "blur_out" }, { _tag: "pointer_leave" }, tick], state);
    expect(away["current"]).toBe(2n);
    expect(isRotating(away)).toBe(true);
    // ...but focus entering again is a new stop (sticky policy)
    expect(step(away, tab)).toMatchObject({ rotate: false, forced: false });

    // activating the control again is Stop
    const stopped = step(state, activate);
    expect(stopped).toMatchObject({ rotate: false, forced: false });
    expect(isRotating(stopped)).toBe(false);
  });

  it("Start via pointer works while the mouse hovers (hover ignored)", () => {
    const paused = run([{ _tag: "set_reduced_motion" }, { _tag: "pointer_enter" }]);
    expect(isRotating(paused)).toBe(false);

    const started = step(paused, { _tag: "click_rotation" });
    expect(isRotating(started)).toBe(true);
    expect(step(started, tick)["current"]).toBe(1n);

    const stopped = step(started, { _tag: "click_rotation" });
    expect(isRotating(stopped)).toBe(false);
  });

  it("a hover-paused carousel offers Start; clicking it forces rotation", () => {
    const hovered = step(model.initial, { _tag: "pointer_enter" });
    expect(isRotating(hovered)).toBe(false);
    const started = step(hovered, { _tag: "click_rotation" });
    expect(started).toMatchObject({ rotate: true, forced: true });
    expect(isRotating(started)).toBe(true);
  });

  it("prev/next wrap, do not move focus, and never touch the rotation state", () => {
    const afterPrev = step(model.initial, { _tag: "click_prev" });
    expect(afterPrev["current"]).toBe(2n);
    expect(afterPrev["rotate"]).toBe(true);

    // keyboard: focus Next, Enter/Space twice
    const focused = step(model.initial, { _tag: "focus_control", t: NEXT });
    const twice = run([activate, activate], focused);
    expect(twice["current"]).toBe(2n);
    expect(twice["focus"]).toBe(NEXT);

    const prev = run([{ _tag: "focus_control", t: PREV }, activate, activate], model.initial);
    expect(prev["current"]).toBe(1n);
    expect(prev["focus"]).toBe(PREV);
  });

  it("basic variant: arrow keys, Home/End and tab clicks do nothing", () => {
    const focused = step(model.initial, { _tag: "focus_control", t: 4n });
    expect(focused["focus"]).toBe(NONE);
    for (const key of ["key_arrow_right", "key_arrow_left", "key_home", "key_end"]) {
      expect(step(model.initial, { _tag: key })["current"]).toBe(0n);
    }
    expect(step(model.initial, { _tag: "click_tab", i: 2n })["current"]).toBe(0n);
  });

  it("tabbed variant: roving tab stop, arrows wrap, Home/End, automatic activation", () => {
    const tabbed = step(model.initial, tabbedOn);
    expect(tabbed["tabbed"]).toBe(true);

    // rotation, prev, next, then the selected tab
    let state = run([tab, tab, tab, tab], tabbed);
    expect(state["focus"]).toBe(TAB0);

    state = step(state, { _tag: "key_arrow_right" });
    expect(state).toMatchObject({ current: 1n, focus: TAB0 + 1n });
    state = step(state, { _tag: "key_arrow_right" });
    state = step(state, { _tag: "key_arrow_right" });
    expect(state).toMatchObject({ current: 0n, focus: TAB0 });
    state = step(state, { _tag: "key_arrow_left" });
    expect(state).toMatchObject({ current: 2n, focus: TAB0 + 2n });
    state = step(state, { _tag: "key_home" });
    expect(state).toMatchObject({ current: 0n, focus: TAB0 });
    state = step(state, { _tag: "key_end" });
    expect(state).toMatchObject({ current: 2n, focus: TAB0 + 2n });

    // Enter/Space on an already-selected tab is a no-op
    expect(step(state, activate)).toEqual(state);

    // Tab from a tab goes to the slide link; Shift+Tab back to Next
    expect(step(state, tab)["focus"]).toBe(SLIDE_LINK);
    expect(step(state, shiftTab)["focus"]).toBe(NEXT);
  });

  it("tabbed variant: tab entry lands on the selected tab; clicking a tab selects it", () => {
    const tabbed = run([tabbedOn, { _tag: "click_tab", i: 2n }]);
    expect(tabbed["current"]).toBe(2n);
    expect(run([shiftTab, shiftTab], tabbed)["focus"]).toBe(TAB0 + 2n);
    expect(step(tabbed, { _tag: "focus_control", t: 4n })["focus"]).toBe(TAB0 + 2n);
  });

  it("tabbed variant: an explicit Start rotates past a focused tab; focus stays put", () => {
    const onTab = run([
      tabbedOn,
      { _tag: "focus_control", t: ROTATION }, // sticky: stops
      activate, // explicit Start
      { _tag: "focus_control", t: 4n }, // move within: no new entry
    ]);
    expect(onTab).toMatchObject({ focus: TAB0, forced: true, current: 0n });
    expect(isRotating(onTab)).toBe(true);

    const ticked = step(onTab, tick);
    expect(ticked).toMatchObject({ current: 1n, focus: TAB0 });
    // the selected tab moved on, so Tab leaves to the slide link
    expect(step(ticked, tab)["focus"]).toBe(SLIDE_LINK);
  });

  it("turning the tablist off drops tab focus; shrinking slides clamps focus and current", () => {
    const onTab = run([tabbedOn, { _tag: "click_tab", i: 2n }, { _tag: "focus_control", t: 4n }]);
    expect(onTab["focus"]).toBe(TAB0 + 2n);

    expect(step(onTab, { _tag: "set_tabbed", on: false })["focus"]).toBe(NONE);
    expect(step(onTab, { _tag: "set_slide_count", m: 2n })).toMatchObject({
      slides: 2n,
      current: 1n,
      focus: TAB0 + 1n,
    });
  });

  it("disabling auto-rotation unmounts the control and skips it in the tab order", () => {
    const focused = step(model.initial, { _tag: "focus_control", t: ROTATION });
    const off = step(focused, { _tag: "set_auto_rotate", on: false });
    expect(off).toMatchObject({
      autoRotate: false,
      rotate: false,
      forced: false,
      focus: NONE,
    });
    expect(isRotating(off)).toBe(false);
    expect(step(off, tick)["current"]).toBe(0n);

    // first Tab stop is now Previous
    expect(step(off, tab)["focus"]).toBe(PREV);
    // the control cannot be focused directly, and clicking it does nothing
    expect(step(off, { _tag: "focus_control", t: ROTATION })["focus"]).toBe(NONE);
    expect(step(off, { _tag: "click_rotation" })).toEqual(off);
  });

  it("reduced motion pauses until the user starts rotation", () => {
    const paused = step(model.initial, { _tag: "set_reduced_motion" });
    expect(isRotating(paused)).toBe(false);
    expect(step(paused, tick)["current"]).toBe(0n);
    expect(isRotating(step(paused, { _tag: "click_rotation" }))).toBe(true);
  });

  it("the policy flip to sticky stops a focused, user-unstarted carousel", () => {
    const relaxed = step(model.initial, {
      _tag: "set_sticky_focus_pause",
      on: false,
    });
    const focused = step(relaxed, tab);
    const sticky = step(focused, { _tag: "set_sticky_focus_pause", on: true });
    expect(sticky["rotate"]).toBe(false);
  });

  it("exposes typed event schemas for the pools", () => {
    const decode = (tag: string, payload: Record<string, unknown>) => {
      const schema = model.eventSchemas[tag];
      if (schema === undefined) {
        throw new Error(`no event schema for ${tag}`);
      }
      return Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>)({
        _tag: tag,
        ...payload,
      });
    };
    expect(decode("set_slide_count", { m: 2n })).toEqual({
      _tag: "set_slide_count",
      m: 2n,
    });
    expect(() => decode("set_slide_count", { m: "two" })).toThrow();
    expect(() => decode("set_tabbed", { on: "yes" })).toThrow();
    expect(model.pools["focus_control"]).toEqual({
      t: ["1", "2", "3", "4", "7"],
    });
  });

  it("derives the event alphabet from the spec pools", () => {
    const tags = new Set(eventsOf(model).map((event) => event._tag));
    for (const tag of [
      "tick",
      "pointer_enter",
      "key_tab",
      "key_activate",
      "key_arrow_right",
      "click_rotation",
      "set_tabbed",
      "set_reduced_motion",
    ]) {
      expect(tags.has(tag)).toBe(true);
    }
  });

  it("uncontrolled, every slide request is accepted and commits its intent", () => {
    const next = step(model.initial, { _tag: "click_next" });
    expect(next).toMatchObject({
      current: 1n,
      outcome: "accepted",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
    // host-side commits are inert without a controlled value
    expect(model.transition(next, { _tag: "setValue", v: 2n })).toEqual(next);
  });

  it("controlled, a rejected request leaves the slide untouched", () => {
    const controlled = step(model.initial, { _tag: "control" });
    const next = step(controlled, { _tag: "click_next" });
    expect(next).toMatchObject({
      current: 0n,
      valueProp: 0n,
      outcome: "rejected",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
    // a host write is the only commit while controlled
    expect(step(next, { _tag: "setValue", v: 2n })).toMatchObject({
      current: 2n,
      valueProp: 2n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(model.initial, { _tag: "control" }), {
      _tag: "acceptRequests",
    });
    const next = step(host, { _tag: "click_next" });
    expect(next).toMatchObject({
      current: 1n,
      valueProp: 1n,
      outcome: "accepted",
      requests: 1n,
    });
  });

  it("controlled, the auto-rotation timer is a request too", () => {
    const controlled = step(model.initial, { _tag: "control" });
    // the page-load carousel is rotating, so a tick requests the next slide
    // but the holding host leaves the shown slide alone
    expect(step(controlled, { _tag: "tick" })).toMatchObject({
      current: 0n,
      outcome: "rejected",
      requested: 1n,
      requests: 1n,
    });
  });

  it("controlled, setValue clamps into the slide range", () => {
    const controlled = run([{ _tag: "set_slide_count", m: 2n }, { _tag: "control" }]);
    expect(step(controlled, { _tag: "setValue", v: 2n })).toMatchObject({
      current: 1n,
      valueProp: 1n,
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 9, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(1000);

    // the headline guarantee, checked against the independent oracle
    assertUnreachable(
      report,
      "rotating with focus or hover inside without an explicit Start",
      (state) =>
        isRotating(state) &&
        state["forced"] === false &&
        (state["focus"] !== NONE || state["hover"] === true),
    );
    assertReachable(
      report,
      "explicit Start rotating while focus is inside",
      (state) => isRotating(state) && state["forced"] === true && state["focus"] !== NONE,
    );
    assertReachable(
      report,
      "hover-paused with rotation still wanted",
      (state) => state["rotate"] === true && state["hover"] === true && !isRotating(state),
    );
    assertReachable(
      report,
      "tabbed carousel with focus on a tab",
      (state) => state["tabbed"] === true && state["focus"] === TAB0,
    );
  });

  it("random walks keep every invariant (seeded simulation)", () => {
    const report = simulate(model, { runs: 100, maxSteps: 80, seed: 7 });
    expect(report.violations).toEqual([]);
    expect(report.steps).toBe(8000);
  });
});
