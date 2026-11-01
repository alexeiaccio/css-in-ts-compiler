// @cssints/machine/solid in plain node: Solid 2's store layer needs no DOM, so the bridge is tested here rather than in
// Chromium. The client build is selected with the browser and development conditions (the node default is Solid's SSR
// build, where an action's optimistic override has no client transaction to live in). Run: node --conditions=browser
// --conditions=development test/store.mjs
import assert from "node:assert/strict";

import { createMemo, createRoot, flush } from "solid-js";

import { createMachine, defineMachine } from "../src/index.ts";
import { createMachineStore } from "../src/solid.ts";

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
    },
  },
});

const settled = (phase) => phase === "open" || phase === "closed";
const intent = (event) =>
  event.type === "close" ? "closed" : event.type === "open" ? "open" : undefined;
const key = (snapshot) => `${snapshot.state}:${snapshot.context.progress}`;

// The machine, its log of committed pairs (a pair never seen there must never reach the store), and the store in a root.
const machine = createMachine(disclosure);
const seen = new Set([key(machine.getState())]);
machine.onTransition(() => {
  seen.add(key(machine.getState()));
});

let store;
let phase;
let progress;
let visible;
let pair;
let phaseRuns = 0;
let progressRuns = 0;
let visibleRuns = 0;
const pairs = [];

const dispose = createRoot((disposeRoot) => {
  store = createMachineStore(machine, { settled, intent });
  phase = createMemo(() => {
    phaseRuns += 1;
    return store.state.phase;
  });
  progress = createMemo(() => {
    progressRuns += 1;
    return store.state.progress;
  });
  const view = store.projection(
    (draft, from) => {
      draft.visible = from.phase !== "closed";
    },
    { visible: false },
  );
  visible = createMemo(() => {
    visibleRuns += 1;
    return view.visible;
  });
  pair = createMemo(() => {
    const next = `${store.state.phase}:${store.state.progress}`;
    pairs.push(next);
    return next;
  });
  return disposeRoot;
});

const read = () => {
  phase();
  progress();
  visible();
  pair();
};

const settle = async () => {
  flush();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  flush();
  await Promise.resolve();
  read();
};

const step = async (event) => {
  store.send(event);
  await settle();
};

const finish = async () => {
  const handle = machine.effects().at(-1);
  await step({ type: "finish", id: handle.id });
};

// The first reads are the memos' initial runs.
read();
assert.equal(phase(), "closed");
assert.equal(progress(), 0);
assert.equal(visible(), false);
assert.equal(pair(), "closed:0");

// --- the fine-grained store ------------------------------------------------------------------------------------------

await step({ type: "open" });
await finish();
assert.equal(store.state.phase, "open", "the committed store is the logical state");
assert.equal(visible(), true);
read();

// Reset the counters: the property below is about a reader of one field, not about how many times the open took.
phaseRuns = 0;
progressRuns = 0;
visibleRuns = 0;

// Only progress changes: the phase reader must not re-run.
await step({ type: "tick", value: 0.5 });
assert.equal(store.state.progress, 0.5);
assert.equal(progressRuns, 1, "the progress reader re-ran");
assert.equal(phaseRuns, 0, "the phase reader did not: the field was not written");

// The projection recomputes from progress, but `visible` does not change, so its reader does not re-run.
await step({ type: "tick", value: 0.9 });
assert.equal(visibleRuns, 0, "the projection's value did not change, so its reader did not re-run");

// A phase change that does not change the projection's value either.
store.send({ type: "close" });
await settle();
assert.equal(machine.getState().state, "closing");
assert.notEqual(store.state.phase, "closed", "the committed store has not settled to closed");
assert.equal(
  store.optimistic.phase,
  "closed",
  "the optimistic view already says where the intent goes",
);
assert.equal(visibleRuns, 0, "closing is still visible, so the projection's reader did not re-run");
await finish();
assert.equal(store.state.phase, "closed");
assert.equal(visibleRuns, 1, "closed is not visible, so the projection's reader ran");

// --- the optimistic view ---------------------------------------------------------------------------------------------

// It leads while the transition is in flight: the committed store is `closing`, the optimistic view already says
// `closed`, the settled phase the intent is heading to.
await step({ type: "open" });
await finish();
store.send({ type: "close" });
await settle();
assert.equal(machine.getState().state, "closing");
assert.notEqual(store.state.phase, "closed", "the committed store has not settled to closed");
assert.equal(
  store.optimistic.phase,
  "closed",
  "the optimistic view already says where the intent goes",
);

// It reconciles to the committed state when the transition settles.
await finish();
assert.equal(store.state.phase, "closed");
assert.equal(
  store.optimistic.phase,
  "closed",
  "after the settle the optimistic view equals the committed one",
);

// And it rolls back when the opposite intent cancels it before the finish.
await step({ type: "open" });
await finish();
store.send({ type: "close" });
await settle();
assert.equal(store.optimistic.phase, "closed", "the close leads");
store.send({ type: "open" });
await settle();
assert.equal(
  store.optimistic.phase,
  store.state.phase,
  "the cancelled close rolled back to the committed state",
);
assert.notEqual(
  store.state.phase,
  "closed",
  "and the committed state is no longer heading to closed",
);
await finish();
assert.equal(store.state.phase, "open");
assert.equal(store.optimistic.phase, "open");

// --- atomicity: one store write per transition, never a mixed pair -----------------------------------------------------

// Every pair the store ever delivered came from one machine snapshot: phase and progress are never from two
// transitions in the same read.
assert.ok(pairs.length > 0);
for (const observed of pairs) {
  assert.ok(seen.has(observed), `${observed} is a pair the machine never held`);
}

dispose();
console.log("store: ok");
