import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import { Schema } from "effect";
import definitionJson from "../../src/apg/menu-menubar.model.generated.json";

// Spec-only verification for specs/apg/menu-menubar.qnt: APG menubar / menu
// roving focus, nested submenus, focus return and typeahead. The shared harness
// derives the event alphabet from the spec's own pools and checks every
// declared invariant after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (events: ReadonlyArray<Record<string, unknown>>): QuintModelValue =>
  events.reduce(step, model.initial);

const tag = (name: string): Record<string, unknown> => ({ _tag: name });
const enter = { _tag: "activate", key: "Enter" };
const space = { _tag: "activate", key: "Space" };
const type = (ch: number): Record<string, unknown> => ({
  _tag: "typeahead",
  ch: BigInt(ch),
});

const focused = [tag("focus_in")];
const inFileMenu = [...focused, tag("arrow_down")];
const inSubmenu = [...inFileMenu, tag("arrow_down"), tag("arrow_right")];
const setValue = (v: number): Record<string, unknown> => ({
  _tag: "setValue",
  t: BigInt(v),
});

const at = (
  focusLevel: number,
  focusIdx: number,
  barStop: number,
  openTop: number,
  openSub: number,
) => ({
  focusLevel: BigInt(focusLevel),
  focusIdx: BigInt(focusIdx),
  barStop: BigInt(barStop),
  openTop: BigInt(openTop),
  openSub: BigInt(openSub),
});

describe("apg menu-menubar (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "LevelValid",
      "FocusOutsideClosesAll",
      "BarFocusIsTabStop",
      "FocusInsideOpenPath",
      "OpenPathWellFormed",
      "ExactlyOneBarTabStop",
      "AtMostOneBarExpanded",
      "AtMostOneItemExpanded",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // focus in a submenu of an item that has none, and a menu that is not the
    // roving item's
    expect(
      violatedInvariants(model, {
        ...model.initial,
        ...at(3, 5, 2, 1, 3),
      }),
    ).toEqual(["FocusInsideOpenPath", "OpenPathWellFormed", "AtMostOneItemExpanded"]);
    // focus outside the widget while a menu is still open
    expect(
      violatedInvariants(model, {
        ...model.initial,
        ...at(0, 0, 1, 1, 0),
      }),
    ).toEqual(["FocusOutsideClosesAll"]);
    // tab stop outside the menubar
    expect(
      violatedInvariants(model, {
        ...model.initial,
        ...at(1, 4, 4, 0, 0),
      }),
    ).toEqual(["BarFocusIsTabStop", "ExactlyOneBarTabStop"]);
    // controlled: an event committed and the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        ...at(1, 1, 1, 1, 0),
        controlled: true,
        valueProp: 0n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the state anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        ...at(1, 1, 1, 1, 0),
        outcome: "rejected",
        base: 0n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        ...at(1, 1, 1, 0, 0),
        outcome: "accepted",
        requested: 1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("Tab lands on the roving item and arrows wrap around the menubar", () => {
    let state = run(focused);
    expect(state).toMatchObject(at(1, 1, 1, 0, 0));

    state = step(state, tag("arrow_right"));
    expect(state).toMatchObject(at(1, 2, 2, 0, 0));
    state = step(step(state, tag("arrow_right")), tag("arrow_right"));
    expect(state).toMatchObject(at(1, 1, 1, 0, 0));
    state = step(state, tag("arrow_left"));
    expect(state).toMatchObject(at(1, 3, 3, 0, 0));
  });

  it("Tab out closes everything and Tab back restores the last item", () => {
    const out = run([...focused, tag("arrow_right"), tag("arrow_down"), tag("tab_out")]);
    expect(out).toMatchObject(at(0, 0, 2, 0, 0));

    expect(step(out, tag("focus_in"))).toMatchObject(at(1, 2, 2, 0, 0));
  });

  it("Down Arrow opens the menu on its first item, Up Arrow on its last", () => {
    expect(run(inFileMenu)).toMatchObject(at(2, 1, 1, 1, 0));
    expect(run([...focused, tag("arrow_up")])).toMatchObject(at(2, 3, 1, 1, 0));
    // an item without a menu has nothing to open
    expect(run([...focused, tag("arrow_left"), tag("arrow_down")])).toMatchObject(
      at(1, 3, 3, 0, 0),
    );
  });

  it("Enter and Space open a menu from the menubar", () => {
    expect(run([...focused, enter])).toMatchObject(at(2, 1, 1, 1, 0));
    expect(run([...focused, space])).toMatchObject(at(2, 1, 1, 1, 0));
  });

  it("menu arrows wrap, Home/End jump", () => {
    const edit = [...focused, tag("arrow_right"), tag("arrow_down")];
    expect(run(edit)).toMatchObject(at(2, 1, 2, 2, 0));
    expect(run([...edit, tag("arrow_down"), tag("arrow_down")])).toMatchObject(at(2, 1, 2, 2, 0));
    expect(run([...edit, tag("arrow_up")])).toMatchObject(at(2, 2, 2, 2, 0));
    expect(run([...inFileMenu, tag("key_end")])).toMatchObject(at(2, 3, 1, 1, 0));
    expect(run([...inFileMenu, tag("key_end"), tag("key_home")])).toMatchObject(at(2, 1, 1, 1, 0));
    expect(run([...focused, tag("key_end")])).toMatchObject(at(1, 3, 3, 0, 0));
  });

  it("Escape closes the menu and returns focus to the menubar item", () => {
    expect(run([...inFileMenu, tag("escape")])).toMatchObject(at(1, 1, 1, 0, 0));
  });

  it("a submenu opens on Right Arrow / Enter and Escape returns to the parent item", () => {
    expect(run(inSubmenu)).toMatchObject(at(3, 1, 1, 1, 2));
    expect(run([...inFileMenu, tag("arrow_down"), enter])).toMatchObject(at(3, 1, 1, 1, 2));

    const back = run([...inSubmenu, tag("arrow_down"), tag("escape")]);
    expect(back).toMatchObject(at(2, 2, 1, 1, 0));

    // Left Arrow in a submenu behaves the same
    expect(run([...inSubmenu, tag("arrow_left")])).toMatchObject(at(2, 2, 1, 1, 0));
    // and a second Escape closes the whole menu
    expect(step(back, tag("escape"))).toMatchObject(at(1, 1, 1, 0, 0));
  });

  it("Right Arrow on a plain menu item moves to the next menubar item and opens its menu unfocused", () => {
    // item 1 of File has no submenu
    expect(run([...inFileMenu, tag("arrow_right")])).toMatchObject(at(1, 2, 2, 2, 0));
    // from the submenu all menus close, then Edit opens unfocused
    expect(run([...inSubmenu, tag("arrow_right")])).toMatchObject(at(1, 2, 2, 2, 0));
    // landing on About (no menu) leaves nothing open
    expect(
      run([...focused, tag("arrow_right"), tag("arrow_down"), tag("arrow_right")]),
    ).toMatchObject(at(1, 3, 3, 0, 0));
  });

  it("Left Arrow in a top-level menu moves to the previous menubar item", () => {
    // File -> About (wraps, no menu)
    expect(run([...inFileMenu, tag("arrow_left")])).toMatchObject(at(1, 3, 3, 0, 0));
    // Edit -> File reopens File's menu without focus
    expect(
      run([...focused, tag("arrow_right"), tag("arrow_down"), tag("arrow_left")]),
    ).toMatchObject(at(1, 1, 1, 1, 0));
  });

  it("an open menu follows menubar navigation, and Down then enters it", () => {
    const edit = run([...inFileMenu, tag("arrow_right")]);
    expect(step(edit, tag("arrow_right"))).toMatchObject(at(1, 3, 3, 0, 0));
    expect(step(edit, tag("arrow_down"))).toMatchObject(at(2, 1, 2, 2, 0));
    expect(step(edit, tag("escape"))).toMatchObject(at(1, 2, 2, 0, 0));
  });

  it("activating a leaf closes every menu and returns focus to the menubar item", () => {
    const fired = run([...inFileMenu, enter]);
    expect(fired).toMatchObject({ ...at(1, 1, 1, 0, 0), lastActivated: 110n });

    const deep = run([...inSubmenu, space]);
    expect(deep).toMatchObject({ ...at(1, 1, 1, 0, 0), lastActivated: 121n });
  });

  it("a menubar item without a menu is activated in place", () => {
    const about = run([...focused, tag("arrow_left"), enter]);
    expect(about).toMatchObject({ ...at(1, 3, 3, 0, 0), lastActivated: 300n });
  });

  it("typeahead moves to the next item with that label, wrapping, else stays", () => {
    expect(run([...inFileMenu, type(1)])).toMatchObject(at(2, 3, 1, 1, 0));
    expect(run([...inFileMenu, type(1), type(2)])).toMatchObject(at(2, 2, 1, 1, 0));
    expect(run([...inFileMenu, type(3)])).toMatchObject(at(2, 1, 1, 1, 0));
    expect(run([...inSubmenu, type(1)])).toMatchObject(at(3, 2, 1, 1, 2));
    expect(run([...focused, type(3)])).toMatchObject(at(1, 3, 3, 0, 0));
  });

  it("events are inert while focus is outside the widget", () => {
    for (const event of [tag("arrow_down"), tag("arrow_right"), tag("escape"), enter, type(1)]) {
      expect(step(model.initial, event)).toEqual(model.initial);
    }
  });

  it("uncontrolled, opening a menu is a request that commits", () => {
    const opened = run(inFileMenu);
    expect(opened).toMatchObject({
      openTop: 1n,
      outcome: "accepted",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
    // the host-side writes are inert without a controlled value
    expect(step(opened, tag("hostToggle"))).toEqual(opened);
    expect(model.transition(opened, setValue(0))).toEqual(opened);
  });

  it("controlled, an open the host ignores leaves the state untouched", () => {
    const requested = step(
      step(step(model.initial, tag("control")), tag("focus_in")),
      tag("arrow_down"),
    );
    expect(requested).toMatchObject({
      openTop: 0n,
      focusLevel: 1n,
      focusIdx: 1n,
      barStop: 1n,
      valueProp: 0n,
      outcome: "rejected",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
  });

  it("controlled, only the value prop commits", () => {
    const rejected = step(
      step(step(model.initial, tag("control")), tag("focus_in")),
      tag("arrow_down"),
    );
    const committed = step(rejected, setValue(1));
    expect(committed).toMatchObject({
      openTop: 1n,
      focusLevel: 1n,
      focusIdx: 1n,
      barStop: 1n,
      valueProp: 1n,
      outcome: "none",
      requests: 1n,
    });
    // adopting a state on `control` keeps what was on screen
    expect(step(run(inFileMenu), tag("control"))).toMatchObject({
      openTop: 1n,
      valueProp: 1n,
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(model.initial, tag("control")), tag("acceptRequests"));
    const opened = step(step(host, tag("focus_in")), tag("arrow_down"));
    expect(opened).toMatchObject({
      openTop: 1n,
      focusLevel: 2n,
      focusIdx: 1n,
      barStop: 1n,
      valueProp: 1n,
      outcome: "accepted",
      requested: 1n,
      requests: 1n,
    });
  });

  it("exposes typed event schemas for the pools", () => {
    const decode = (name: string) => {
      const schema = model.eventSchemas[name];
      if (schema === undefined) {
        throw new Error(`no event schema for ${name}`);
      }
      return Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    };
    expect(decode("typeahead")({ _tag: "typeahead", ch: 2n })).toEqual({
      _tag: "typeahead",
      ch: 2n,
    });
    expect(() => decode("typeahead")({ _tag: "typeahead", ch: "a" })).toThrow();
    // str pools decode as plain strings (not literal unions) in the generated schema
    expect(decode("activate")({ _tag: "activate", key: "Enter" })).toEqual({
      _tag: "activate",
      key: "Enter",
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
  });
});
