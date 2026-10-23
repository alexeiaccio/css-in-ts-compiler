import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { eventsOf, explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/apg/alert.model.generated.json";

// Spec-only verification for specs/apg/alert.qnt: the APG alert live region.
// The shared harness derives the event alphabet from the spec's own pools and
// checks every declared invariant after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const initial = model.initial;

describe("apg alert (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "FocusNeverOnAlert",
      "RoleWhenMounted",
      "MountedHasMessage",
      "PreloadedNotAnnounced",
      "LiveMessageAnnounced",
      "SilentBeforeLoad",
      "CountersConsistent",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...initial, focus: "alert" })).toEqual([
      "FocusNeverOnAlert",
    ]);

    expect(
      violatedInvariants(model, {
        ...initial,
        loaded: true,
        preloaded: 1n,
        announced: 1n,
        announcements: 1n,
        nextId: 2n,
      }),
    ).toEqual(["PreloadedNotAnnounced"]);

    expect(
      violatedInvariants(model, {
        ...initial,
        mounted: true,
        message: 1n,
        nextId: 2n,
      }),
    ).toEqual(["RoleWhenMounted"]);

    expect(violatedInvariants(model, { ...initial, announcements: 1n })).toEqual([
      "SilentBeforeLoad",
    ]);
  });

  it("does not announce an alert that was present before load", () => {
    const rendered = step(initial, { _tag: "show" });
    expect(rendered).toMatchObject({
      mounted: true,
      role: "alert",
      message: 1n,
      announced: 0n,
      announcements: 0n,
      preloaded: 1n,
    });

    const loaded = step(rendered, { _tag: "load" });
    expect(loaded).toMatchObject({
      loaded: true,
      announced: 0n,
      announcements: 0n,
      preloaded: 1n,
    });
  });

  it("announces a message rendered or changed after load", () => {
    const loaded = step(initial, { _tag: "load" });
    const first = step(loaded, { _tag: "show" });
    expect(first).toMatchObject({
      mounted: true,
      message: 1n,
      announced: 1n,
      announcements: 1n,
      preloaded: 0n,
    });

    // changing the content of a mounted alert is announced again
    const changed = step(first, { _tag: "show" });
    expect(changed).toMatchObject({
      message: 2n,
      announced: 2n,
      announcements: 2n,
    });
  });

  it("a live update after a preloaded alert is announced", () => {
    const preloaded = step(step(initial, { _tag: "show" }), { _tag: "load" });
    const updated = step(preloaded, { _tag: "show" });
    expect(updated).toMatchObject({
      message: 2n,
      announced: 2n,
      announcements: 1n,
      preloaded: 1n,
    });
  });

  it("never moves focus: show, load and dismiss leave it alone", () => {
    const away = step(initial, { _tag: "focusOther" });
    const shown = step(step(away, { _tag: "load" }), { _tag: "show" });
    expect(shown).toMatchObject({ focus: "other" });
    expect(step(shown, { _tag: "dismiss" })).toMatchObject({ focus: "other" });

    const task = step(shown, { _tag: "focusTask" });
    expect(step(task, { _tag: "show" })).toMatchObject({ focus: "task" });
  });

  it("only the user dismisses: no other event unmounts the alert", () => {
    const events = eventsOf(model).map((event) => event._tag);
    expect(events).not.toContain("timeout");
    expect(events).not.toContain("autoDismiss");

    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    for (const state of report.states) {
      if ((state as { mounted: boolean }).mounted) {
        for (const event of eventsOf(model)) {
          if (event._tag === "dismiss") {
            continue;
          }
          const next = model.transition(state, event) as { mounted: boolean };
          expect(next.mounted).toBe(true);
        }
      }
    }
  });

  it("dismiss unmounts, clears the message and counts the user action", () => {
    const shown = step(step(initial, { _tag: "load" }), { _tag: "show" });
    const dismissed = step(shown, { _tag: "dismiss" });
    expect(dismissed).toMatchObject({
      mounted: false,
      role: "none",
      message: 0n,
      announced: 1n,
      dismissals: 1n,
    });
    // dismissing nothing is not a dismissal
    expect(step(dismissed, { _tag: "dismiss" })).toMatchObject({
      dismissals: 1n,
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(20);
  });
});
