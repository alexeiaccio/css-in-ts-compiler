// The type-level contract: events are a union derived from the states, payloads come from the payload map, the context is
// inferred from `initial`, and a send the machine's states do not accept is a type error. Checked by the package's
// typecheck (tsgo), not run.
import { createMachine, defineMachine, harness } from "../../src/index.ts";
import { createMachineStore } from "../../src/solid.ts";

type Disclosure = {
  open: undefined;
  close: undefined;
  finish: { id: number };
  tick: { value: number };
};

const disclosure = defineMachine<Disclosure>()({
  start: "closed",
  initial: { progress: 0 },
  debounce: { close: 100 },
  states: {
    closed: {
      on: {
        open: { target: "opening", effect: { type: "animate", to: "open", duration: 200 } },
      },
    },
    opening: {
      on: {
        finish: "open",
        close: { target: "closing", effect: { type: "animate", to: "closed" } },
      },
    },
    open: {
      on: {
        close: "closing",
        tick: {
          target: "open",
          assign: (context, event) => ({
            progress: event.type === "tick" ? event.value : context.progress,
          }),
        },
      },
    },
    closing: {
      on: { finish: "closed", open: "opening" },
    },
  },
});

const machine = createMachine(disclosure);

// The state is a union of the state names, and the context comes from `initial`.
const phase: "closed" | "opening" | "open" | "closing" = machine.getState().state;
const progress: number = machine.getState().context.progress;
void phase;
void progress;

// Events and their payloads.
machine.send({ type: "open" });
machine.send({ type: "close" });
machine.send({ type: "finish", id: 1 });
machine.send({ type: "tick", value: 0.5 });

// @ts-expect-error no state accepts an `explode` event
machine.send({ type: "explode" });
// @ts-expect-error a finish carries a numeric id
machine.send({ type: "finish", id: "1" });
// @ts-expect-error an event with no payload takes none
machine.send({ type: "open", extra: true });
// @ts-expect-error the tick payload is a number
machine.send({ type: "tick", value: "half" });
// @ts-expect-error the tick payload is required
machine.send({ type: "tick" });

// The harness and the store keep the same types.
const h = harness(disclosure);
h.send({ type: "finish", id: 2 });
// @ts-expect-error the harness's send is the machine's event union
h.send({ type: "explode" });

const store = createMachineStore(machine, {
  settled: (name) => name === "open" || name === "closed",
  intent: (event) =>
    event.type === "close" ? "closed" : event.type === "open" ? "open" : undefined,
});
const storePhase: "closed" | "opening" | "open" | "closing" = store.state.phase;
const optimisticProgress: number = store.optimistic.progress;
void storePhase;
void optimisticProgress;
// @ts-expect-error an intent returns a state name, not an arbitrary string
createMachineStore(machine, { intent: () => "opened" });

// The definitions validate their shape at run time; a transition's target is checked there, not in the type.
const single = defineMachine({
  initial: { count: 0 },
  states: {
    on: { on: { go: { target: "off", assign: (context) => ({ count: context.count + 1 }) } } },
    off: { on: { go: "on" } },
  },
});
const singleMachine = createMachine(single);
singleMachine.send({ type: "go" });
// @ts-expect-error `initial` has no other field to send
singleMachine.send({ type: "stop" });
