// @cssints/machine/solid: the machine's state as Solid's own store layer — a `createStore` for the committed snapshot,
// a second store for the visual state that leads the logical one while a transition is in flight, and
// `createProjection` for a derived view. solid-js is an optional peer; the core never imports it.
//
// Why an optimistic store and not a "pending" flag: an animation's visual state leads the logical one. An intent writes
// the phase the box is heading to; the machine's committed snapshot is written into both stores on every transition, and
// the lead is dropped as soon as a transition reaches a settled phase (`open` or `closed`, the caller's `settled`), so
// readers see the committed base — reconciliation by construction. A reversal (a second intent before the finish) drops
// the first lead before reading the new one. This is the same atomicity the reactive runtime gets from its one flush (see
// packages/reactive/src/runtime.ts and specs/patterns/reactive.qnt): one `setState` call per transition, mutating only
// the fields that changed, so a reader never sees a phase from one transition with a progress from another.
//
// The lead is plain state, not a Solid `action` held open across the transition: since Solid 2 rc.21 a pending action
// holds the store's writes with it, so the machine's own transition never reached the committed store.
import {
  createProjection,
  createStore,
  getOwner,
  onCleanup,
  type Store,
  type StoreSetter,
} from "solid-js";

import type { BaseEvent, Machine, MachineState, SendOptions } from "./index.ts";

/** The machine's context plus the state's name, which is the store's shape. */
export type MachineFields<C extends object, S extends string> = C & { phase: S };

/** What the bridge needs to know about a machine beyond its type: which phases are settled, and where an event leads. */
export interface MachineStoreOptions<C extends object, S extends string, E extends BaseEvent> {
  /**
   * Whether a phase is settled (the committed logical state). The optimistic lead is taken only from a settled phase,
   * and an in-flight intent reconciles as soon as a transition reaches one. Every phase is settled by default, which
   * makes the optimistic view equal the committed one.
   */
  readonly settled?: ((phase: S) => boolean) | undefined;
  /**
   * The phase an event's visual state leads to, or `undefined` for no lead (`close` → `closed`, `open` → `open`).
   * Read before the machine transitions; a lead that the machine then does not take is rolled back at once.
   */
  readonly intent?: ((event: E, state: MachineState<C, S>) => S | undefined) | undefined;
}

/** The machine as Solid reads it. */
export interface MachineStore<C extends object, S extends string, E extends BaseEvent> {
  /** The committed snapshot: `{ ...context, phase }`, one `setStore` per transition, only the changed fields. */
  readonly state: Store<MachineFields<C, S>>;
  /** The visual snapshot: the committed one, plus the current intent's lead while a transition is in flight. */
  readonly optimistic: Store<MachineFields<C, S>>;
  /**
   * A `createProjection` over the committed snapshot (call it in a component body). The draft is the caller's object;
   * only the fields that change notify, so a reader of `view.visible` does not re-run when `progress` changes. A
   * projection reads the committed frame, not an optimistic override (Solid holds it whole), so the visual phase is
   * read off `optimistic` directly.
   */
  readonly projection: <T extends object>(
    compute: (draft: T, state: Store<MachineFields<C, S>>) => void,
    seed: T,
  ) => Store<T>;
  /** Send through the store, so an intent gets its optimistic lead. */
  readonly send: (event: E, options?: SendOptions) => void;
}

const fieldsOf = <C extends object, S extends string>(
  state: MachineState<C, S>,
): MachineFields<C, S> => ({ ...state.context, phase: state.state });

/** Write `next` onto a store, changing only the fields that differ, so a reader of one field is not re-run by the rest. */
const writeFields = <T extends object>(setter: StoreSetter<T>, next: T): void => {
  setter((draft) => {
    const target = draft as Record<string, unknown>;
    const source = next as Record<string, unknown>;
    for (const key of Object.keys(source)) {
      if (!Object.is(target[key], source[key])) {
        target[key] = source[key];
      }
    }
    for (const key of Object.keys(target)) {
      if (!Object.hasOwn(source, key)) {
        delete target[key];
      }
    }
  });
};

/**
 * Expose a machine as a Solid store. Call it in a component body: the projections it makes belong to the component, and
 * disposing the component unsubscribes it and settles a pending intent.
 */
export const createMachineStore = <C extends object, S extends string, E extends BaseEvent>(
  machine: Machine<C, S, E>,
  options: MachineStoreOptions<C, NoInfer<S>, NoInfer<E>> = {},
): MachineStore<C, S, E> => {
  const initial = machine.getState();
  const [state, setState] = createStore<MachineFields<C, S>>(fieldsOf(initial) as never);
  // The optimistic view is a second store over the same fields: the committed snapshot, with the phase an in-flight
  // intent is heading to on top. It is written here, not by holding a Solid `action` open across the machine's own
  // transition: since Solid 2 rc.21 a pending action holds the store's writes with it, so a transition the machine
  // performs while the action waits never reaches the committed store (measured: the store sat on `closing` while the
  // machine was already `closed`).
  const [optimistic, setOptimistic] = createStore<MachineFields<C, S>>(fieldsOf(initial) as never);
  const settled = options.settled ?? (() => true);

  /** The phase an in-flight intent is heading to (`undefined` when nothing is in flight). */
  let lead: S | undefined;

  /** The optimistic fields: the committed snapshot, with the intent's phase on top while one is in flight. */
  const syncOptimistic = (snapshot: MachineState<C, S>): void => {
    writeFields(setOptimistic, fieldsOf(snapshot));
    const heading = lead;
    if (heading !== undefined) {
      setOptimistic((draft) => {
        draft.phase = heading;
      });
    }
  };

  /** Drop the lead: the optimistic view goes back to the committed snapshot, which is where the machine really is. */
  const endIntent = (): void => {
    if (lead === undefined) {
      return;
    }
    lead = undefined;
    syncOptimistic(machine.getState());
  };

  const startIntent = (phase: S): void => {
    lead = phase;
    syncOptimistic(machine.getState());
  };

  const off = machine.subscribe((snapshot) => {
    writeFields(setState, fieldsOf(snapshot));
    // an intent reconciles as soon as a transition reaches a settled phase: then the committed state IS the lead
    if (lead !== undefined && settled(snapshot.state)) {
      lead = undefined;
    }
    syncOptimistic(snapshot);
  });

  if (getOwner() !== null) {
    onCleanup(() => {
      endIntent();
      off();
    });
  }

  const send = (event: E, sendOptions?: SendOptions): void => {
    const before = machine.getState();
    // A new intent supersedes the previous one: roll its lead back before reading the new intent.
    endIntent();
    const lead =
      sendOptions?.debounce === undefined && settled(before.state) && options.intent !== undefined
        ? options.intent(event, before)
        : undefined;
    machine.send(event, sendOptions);
    const after = machine.getState();
    // The lead is taken only when the event actually moved the machine: a guarded no-op is a rollback, not a promise.
    if (lead === undefined || after.state === before.state || lead === after.state) {
      return;
    }
    startIntent(lead);
  };

  return {
    state,
    optimistic,
    projection: <T extends object>(
      compute: (draft: T, state: Store<MachineFields<C, S>>) => void,
      seed: T,
    ): Store<T> =>
      createProjection<T>((draft) => {
        compute(draft, state);
      }, seed as never),
    send,
  };
};
