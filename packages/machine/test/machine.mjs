// @cssints/machine in plain node: the five properties, each test named after the one it proves. Run: node test/machine.mjs
import assert from "node:assert/strict";

import { defineMachine, harness } from "../src/index.ts";

// The animated disclosure. The protocol is four states; the animation is an effect the host runs; a completion is a
// `finish` event carrying the handle id the host was given. `after` is the fallback that makes no state a trap (an
// animation that never reports back still ends).
const disclosure = defineMachine({
  start: "closed",
  initial: { progress: 0 },
  states: {
    closed: {
      on: {
        open: { target: "opening", effect: { type: "animate", to: "open", duration: 200 } },
      },
    },
    opening: {
      on: {
        finish: { target: "open" },
        close: { target: "closing", effect: { type: "animate", to: "closed", duration: 200 } },
      },
      after: { 400: "open" },
    },
    open: {
      on: {
        close: { target: "closing", effect: { type: "animate", to: "closed", duration: 200 } },
        tick: { target: "open", assign: (context, event) => ({ progress: event.value }) },
      },
    },
    closing: {
      on: {
        finish: { target: "closed" },
        open: { target: "opening", effect: { type: "animate", to: "open", duration: 200 } },
      },
      after: { 400: "closed" },
    },
  },
});

// The debounced hover: a burst of pointerenter is one intent, the last one, and the effect carries it through the
// context. pointerleave is not debounced.
const hover = defineMachine({
  start: "hidden",
  initial: { source: "", shown: false },
  debounce: { pointerenter: 200 },
  states: {
    hidden: {
      on: {
        pointerenter: {
          target: "shown",
          assign: (context, event) => ({ source: event.source }),
          effect: { type: "show" },
        },
      },
    },
    shown: {
      on: {
        pointerleave: { target: "hidden", effect: { type: "hide" } },
      },
    },
  },
});

const state = (h) => h.machine.getState().state;
const context = (h) => h.machine.getState().context;
const current = (h) => h.machine.effects().at(-1);

// --- the definition -------------------------------------------------------------------------------------------------

// An unknown target is a build error, not a silent dead end.
assert.throws(
  () =>
    defineMachine({
      initial: {},
      states: { a: { on: { go: "nowhere" } } },
    }),
  /targets "nowhere", which is not a state/,
);
assert.throws(
  () => defineMachine({ initial: {}, start: "b", states: { a: {} } }),
  /the start state "b" is not a state/,
);

// --- a close interrupted by an open reverses and ends open ---------------------------------------------------------

{
  const h = harness(disclosure);
  h.send({ type: "open" });
  assert.equal(state(h), "opening");
  const opening = current(h);
  assert.equal(opening.spec.to, "open");

  h.send({ type: "close" });
  assert.equal(state(h), "closing");
  const closing = current(h);
  assert.equal(closing.spec.to, "closed");
  assert.deepEqual(
    h.cancelled(),
    [opening.id],
    "the opening's animation is cancelled, not left running",
  );

  h.send({ type: "open" });
  assert.equal(state(h), "opening", "the close reversed from where it was");
  const reverse = current(h);
  assert.equal(reverse.spec.to, "open");
  assert.deepEqual(h.cancelled(), [opening.id, closing.id]);

  h.send({ type: "finish", id: reverse.id });
  assert.equal(state(h), "open");
  assert.equal(
    h.machine.effects().length,
    0,
    "a completion removes its handle, it is not a cancellation",
  );
}

// --- a cancelled animation's completion is ignored -----------------------------------------------------------------

{
  const h = harness(disclosure);
  h.send({ type: "open" });
  const abandoned = current(h);
  h.send({ type: "close" });
  const running = current(h);

  // The cancelled animation reports back late: the id is stale, so the event is dropped.
  h.send({ type: "finish", id: abandoned.id });
  assert.equal(state(h), "closing", "a stale completion cannot move the machine");
  const dropped = h.log.at(-1);
  assert.equal(dropped.cancelled, true);
  assert.equal(dropped.to, undefined);
  const issued = h.log.find((entry) => entry.effect === abandoned.id);
  assert.equal(issued.cancelled, true, "the log marks the effect it cancelled");

  // The animation that is running still completes.
  h.send({ type: "finish", id: running.id });
  assert.equal(state(h), "closed");
}

// --- two events in one frame produce at most one effect per state ---------------------------------------------------

{
  const h = harness(disclosure);
  h.send({ type: "open" });
  h.flushEffects();

  const states = h.race({ type: "close" }, { type: "open" });
  assert.deepEqual(
    states.map((snapshot) => snapshot.state),
    ["closing", "opening"],
    "both events landed, in order, at the same instant",
  );
  assert.equal(h.machine.effects().length, 1, "one effect is live after the frame");
  assert.equal(current(h).spec.to, "open", "and it is the last intent's");
  const ran = h.flushEffects();
  assert.equal(ran.length, 1, "the host runs one effect, not two");
  assert.equal(ran[0].spec.to, "open");
}

// --- a debounced burst produces one effect carrying the last intent -------------------------------------------------

{
  const h = harness(hover);
  h.send({ type: "pointerenter", source: "a" });
  h.send({ type: "pointerenter", source: "b" });
  h.advance(150);
  h.send({ type: "pointerenter", source: "c" });
  h.advance(199);
  assert.equal(state(h), "hidden", "nothing has been delivered yet");
  assert.equal(h.flushEffects().length, 0);

  h.advance(1);
  assert.equal(state(h), "shown");
  assert.equal(h.machine.getState().context.source, "c", "the last intent survived the burst");
  const ran = h.flushEffects();
  assert.equal(ran.length, 1);
  assert.equal(ran[0].type, "show");
  assert.equal(h.log.filter((entry) => entry.event === "pointerenter").length, 1);
}

// --- flush keeps the last intent, cancel drops a superseded one ------------------------------------------------------

{
  const h = harness(hover);
  h.send({ type: "pointerenter", source: "a" });
  h.send({ type: "pointerenter", source: "b" });
  h.machine.flush();
  assert.equal(state(h), "shown", "flush delivers without waiting for the clock");
  assert.equal(context(h).source, "b");
  assert.equal(h.flushEffects().length, 1);

  h.send({ type: "pointerleave" });
  assert.equal(state(h), "hidden");
  h.flushEffects();
  h.send({ type: "pointerenter", source: "c" });
  h.machine.cancel("pointerenter");
  h.advance(500);
  assert.equal(state(h), "hidden", "a cancelled intent never lands");
  assert.equal(h.flushEffects().length, 0);
}

// --- after runs on the injected clock, and leaving the state clears it ----------------------------------------------

{
  const h = harness(disclosure);
  h.send({ type: "open" });
  h.advance(399);
  assert.equal(state(h), "opening");
  h.advance(1);
  assert.equal(state(h), "open");
  assert.equal(h.log.at(-1).event, "after");

  // A stale timer must not fire: opening's 400 ms fallback is cleared when `close` leaves the state at t = 500.
  h.send({ type: "close" });
  assert.equal(state(h), "closing");
  h.advance(400);
  assert.equal(
    state(h),
    "closed",
    "opening's timer fired would have reopened the box from closing",
  );
}

// --- nothing is ever stuck ------------------------------------------------------------------------------------------

{
  const names = Object.keys(disclosure.states);
  const exits = (name) => {
    const definition = disclosure.states[name];
    const targets = [];
    for (const value of [
      ...Object.values(definition.on ?? {}),
      ...Object.values(definition.after ?? {}),
    ]) {
      for (const transition of Array.isArray(value) ? value : [value]) {
        targets.push(transition.target);
      }
    }
    return targets;
  };

  for (const name of names) {
    const seen = new Set([name]);
    const queue = [name];
    let reached = false;
    while (queue.length > 0) {
      const at = queue.shift();
      if (at === "open" || at === "closed") {
        reached = true;
        break;
      }
      for (const target of exits(at)) {
        if (!seen.has(target)) {
          seen.add(target);
          queue.push(target);
        }
      }
    }
    assert.ok(reached, `${name} can reach open or closed`);
    assert.ok(exits(name).length > 0, `${name} has an exit`);
  }

  // The walk: whatever the machine is left holding, the `after` fallback ends in open or closed.
  const h = harness(disclosure);
  for (const event of [{ type: "open" }, { type: "close" }, { type: "finish", id: 999 }]) {
    h.send(event);
    h.advance(1000);
    assert.ok(["open", "closed"].includes(state(h)), `after ${event.type} the machine settled`);
  }
}

// --- a selector listener fires only for its slice --------------------------------------------------------------------

{
  const h = harness(disclosure);
  h.send({ type: "open" });
  h.send({ type: "finish", id: current(h).id });
  assert.equal(state(h), "open");

  let phases = 0;
  let progress = 0;
  const off = h.machine.subscribe(
    (snapshot) => snapshot.state,
    () => {
      phases += 1;
    },
  );
  h.machine.subscribe(
    (snapshot) => snapshot.context.progress,
    () => {
      progress += 1;
    },
  );

  h.send({ type: "tick", value: 0.5 });
  assert.equal(progress, 1, "the progress slice heard it");
  assert.equal(phases, 0, "the phase slice did not: the state did not change");

  h.send({ type: "close" });
  assert.equal(phases, 1);
  assert.equal(progress, 1);

  off();
  h.send({ type: "open" });
  assert.equal(phases, 1, "unsubscribing detached the listener");
}

// --- the store's shape without Solid: the context is replaced, never mutated -------------------------------------------

{
  const h = harness(disclosure);
  const before = h.machine.getState().context;
  h.send({ type: "open" });
  h.send({ type: "finish", id: current(h).id });
  h.send({ type: "tick", value: 1 });
  assert.notEqual(h.machine.getState().context, before, "a write replaces the context object");
  assert.equal(before.progress, 0, "an old snapshot stays readable");
}

console.log("machine: ok");
