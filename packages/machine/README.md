# @cssints/machine

A minimal, dependency-free, type-safe state machine for UI protocols: an animated disclosure, a menu that opens on
hover and closes on a debounced leave, a toast that reverses mid-flight.

A signal holds state, not a protocol. The moment a component animates, the protocol appears: a `closing` and an
`opening` in the same frame race; a cancelled animation still fires its completion; an interrupted close must reverse
from where the box is; a burst of `pointerenter`/`pointerleave` must not produce five effects; a debounce must not
swallow the last intent. None of those is expressible as a signal. This package is the runtime half: the smallest
machine that can drive those protocols, and a harness that makes them provable without a browser.

No dependencies. The core is plain TypeScript (it runs through node's type stripping: no enums, no namespaces, no
parameter properties); `@cssints/machine/solid` is the only file that imports anything, and `solid-js` is its optional
peer.

## An animated disclosure

```ts
import { createMachine, defineMachine } from "@cssints/machine";

type Events = { open: undefined; close: undefined; finish: { id: number } };

const disclosure = defineMachine<Events>()({
  start: "closed",
  initial: { progress: 0 },
  states: {
    closed: {
      on: { open: { target: "opening", effect: { type: "animate", to: "open" } } },
    },
    opening: {
      on: {
        finish: "open",
        close: { target: "closing", effect: { type: "animate", to: "closed" } },
      },
      after: { 400: "open" }, // an animation that never reports back still ends: no state is a trap
    },
    open: {
      on: {
        close: { target: "closing", effect: { type: "animate", to: "closed" } },
        tick: {
          target: "open",
          assign: (context, event) => ({
            progress: event.type === "tick" ? event.value : context.progress,
          }),
        },
      },
    },
    closing: {
      on: {
        finish: "closed",
        open: { target: "opening", effect: { type: "animate", to: "open" } },
      },
      after: { 400: "closed" },
    },
  },
});

const machine = createMachine(disclosure);

// The host runs the effects; the machine holds one handle per effect and cancels it when the state is left.
machine.onEffect((handle) => {
  const animation = box.animate(keyframes[handle.spec.to], { duration: 200 });
  animation.finished.then(() => machine.send({ type: "finish", id: handle.id }));
});

button.addEventListener("click", () => {
  machine.send(machine.getState().state === "closed" ? { type: "open" } : { type: "close" });
});
```

## The five properties it buys

1. **A close interrupted by an open reverses and ends open.** A transition out of a transient state is a transition like
   any other; the reverse's effect supersedes the close's effect.
2. **A cancelled animation's completion is ignored.** A `finish` carries the handle id the host was given. Leaving the
   state cancels the handle, so a completion that arrives late is stale and dropped, not applied to the new state.
3. **Two events in one frame produce at most one effect per state.** Each transition cancels the handles of the state it
   leaves; the host runs the last intent only.
4. **A debounced burst produces one effect carrying the last intent.** `send(event, { debounce })` (or a machine-level
   `debounce` map) coalesces by event type; `flush()` delivers the final intent, `cancel()` drops a superseded one.
5. **Nothing is ever stuck.** Every state has an exit; `after` is the fallback for an effect that never reports back.

## API

| Member                                           | What it does                                                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineMachine(config)`                          | A definition: `{ initial, states, start?, debounce? }`. Events are a union of the `on` keys, the context is inferred from `initial`; an event no state accepts is a type error. |
| `defineMachine<Payloads>()(config)`              | The same with typed payloads: `{ close: undefined; finish: { id: number } }`. A guard or an `assign` narrows on `event.type`.                                                   |
| `createMachine(definition, options?)`            | An instance. Options: `clock`, `autoStart`, `onEffect`, `onCancel`, `onTransition`.                                                                                             |
| `machine.getState()`                             | `{ state, context }`; a new object per transition, the old one stays readable.                                                                                                  |
| `machine.subscribe(listener)`                    | Every transition and every debounce flush.                                                                                                                                      |
| `machine.subscribe(selector, listener)`          | Only a change of `selector`'s value (`Object.is`), the store bridge a host reads one slice with.                                                                                |
| `machine.send(event, { debounce? })`             | Deliver now, or schedule a coalesced delivery.                                                                                                                                  |
| `machine.flush()` / `machine.cancel(type?)`      | Deliver the pending intent now / drop it.                                                                                                                                       |
| `machine.effects()`                              | The live handles: issued, not completed, not cancelled.                                                                                                                         |
| `machine.onEffect` / `onCancel` / `onTransition` | The host's side: run an effect, stop it, observe a delivery.                                                                                                                    |
| `machine.start()` / `machine.destroy()`          | Enter the start state (idempotent) / clear every timer, cancel every handle, drop every listener.                                                                               |
| `harness(definition)`                            | The machine on a fake clock: `advance(ms)`, a queue (`enqueue`, `deliver`, `deliverAll`), `race`, `interleave`, `flushEffects`, the live `cancelled()` ids and the `log`.       |

A transition is a target string (`open: "opening"`) or `{ target, guard?, effect?, assign? }`; a state's `on` value is one
transition or a list, the first whose guard passes. `after` maps ms to a transition; leaving the state clears the timer.
`assign` is a `Partial<context>` or `(context, event) => Partial<context>`.

## Effects and handles

Effects are data, not callbacks: `{ type: "animate", to: "open", duration: 200 }`. The machine issues a **handle**
(`{ id, type, spec, state }`) for every effect a state entry or a transition declares, and cancels it when the state is
left or a transition supersedes it. A completion event is any event with a numeric `id`: a stale id is dropped (and
logged as `cancelled`), a live one completes its handle without a cancellation. `effects()` is what the host should be
running now.

An effect that takes longer than the state lives is cancelled; the host stops it (`onCancel`) and its late completion
cannot move the machine.

## The clock

`createMachine(definition, { clock })` takes `{ now(), setTimeout(callback, ms), clearTimeout(handle) }`; the default is
`systemClock`. The same clock drives `after`, the debounce and a transition's timestamp, so a test drives time with
`advance(ms)` and a host uses real time.

## The harness

```ts
import { harness } from "@cssints/machine";

const h = harness(disclosure);
h.send({ type: "open" });
const animation = h.machine.effects().at(-1);

h.send({ type: "close" }); // the open's animation is cancelled, the close's is issued
h.send({ type: "finish", id: animation.id }); // stale: ignored
assert.equal(h.machine.getState().state, "closing");

h.advance(400); // the `after` fallback settles it
assert.equal(h.machine.getState().state, "closed");
```

`h.log` has one row per delivery (and one per effect it issued): `{ at, event, from, to, effect, context, cancelled }`.
`h.race(...events)` delivers a frame's events at one instant; `h.interleave(...sequences)` round-robins several orders.
`h.flushEffects()` returns the handles the host should run now, not the ones already cancelled in the same frame.

## The Solid bridge

`@cssints/machine/solid` (solid-js is a peer) exposes the machine as Solid's store layer:

```ts
import { createMachineStore } from "@cssints/machine/solid";

const store = createMachineStore(machine, {
  settled: (phase) => phase === "open" || phase === "closed",
  intent: (event) =>
    event.type === "close" ? "closed" : event.type === "open" ? "open" : undefined,
});
const view = store.projection(
  (draft, from) => {
    draft.visible = from.phase !== "closed";
  },
  { visible: false },
);
```

- `store.state` is a `createStore` of `{ ...context, phase }`, one setter call per transition, writing only the fields
  that changed: a reader of `state.phase` does not re-run when only `progress` changes.
- `store.optimistic` is a derived `createOptimisticStore`: its value follows `state`, and an intent writes the phase it
  is heading to inside a Solid `action`. The action stays open until the machine settles, then the override reverts to
  the committed snapshot — an intent that is superseded before the finish rolls back instead of sticking.
- `store.projection(compute, seed)` is a `createProjection` over `state`: only a changed field notifies, so a reader of
  `view.visible` does not re-run when `progress` changes. A projection reads the committed frame, not an optimistic
  override (Solid holds the override whole), so the visual phase is read off `optimistic` directly.
- `store.send(event)` is the machine's send with the optimistic lead; sending on the machine directly skips it.

One `setState` per transition is the same atomicity the reactive runtime gets from its one flush
(`packages/reactive/src/runtime.ts`, `packages/apg-specs/specs/patterns/reactive.qnt`): a reader never sees a phase from
one transition with a progress from another.

## Limits

- One state at a time: no parallel states, no history states, no nested machines. A protocol with two independent
  regions is two machines and a host that sends to both.
- Effects are data and the host runs them; the machine does not await a promise, own an animation or call a callback.
  A completion that never arrives is covered by `after` (or by a host that cancels).
- A numeric `id` on an event is reserved for an effect handle: an event with a stale id is dropped.
- The debounce coalesces by event type; two different sources of the same event type share one pending intent.
- The store bridge's optimistic lead is taken only from a settled phase (the coordinator's `settled`); a new intent in
  the middle of a transition rolls the previous lead back rather than stacking a second one.
- There is no Quint spec for this runtime yet; the harness's five properties are the oracle (`test/machine.mjs`).

## Tests

```bash
cd packages/machine && bun run test   # node test/machine.mjs, then node test/store.mjs (Solid's client build)
cd packages/machine && bun run typecheck   # src and test/types (the @ts-expect-error cases)
```

The store test runs in plain node with `--conditions=browser --conditions=development`: Solid's store layer needs no DOM,
but the node default is the SSR build, where an action's optimistic override has no client transaction to live in. The
package's `test` script carries the flags.
