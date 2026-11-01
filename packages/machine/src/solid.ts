// @cssints/machine/solid: the machine's state as Solid's own store layer — a `createStore` for the committed snapshot,
// `createProjection` for a derived view, and `createOptimisticStore` for the visual state that leads the logical one
// while a transition is in flight. solid-js is an optional peer; the core never imports it.
//
// Why an optimistic store and not a "pending" flag: an animation's visual state leads the logical one. The intent writes
// the phase the box is heading to inside a Solid `action`; the action stays open until the machine settles (`open` or
// `closed`, the caller's `settled`), and the machine's committed snapshot is written into the store's base on every
// transition. When the action settles the override is dropped and readers see the committed base — reconciliation by
// construction, and a reversal (a second intent before the finish) settles the first action, which rolls the lead back
// to the committed state. This is the same atomicity the reactive runtime gets from its one flush (see
// packages/reactive/src/runtime.ts and specs/patterns/reactive.qnt): one `setState` call per transition, mutating only
// the fields that changed, so a reader never sees a phase from one transition with a progress from another.
import {
  action,
  createOptimisticStore,
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

/** Copy `source` onto `draft`, reading every field of a store so the projection tracks each one, writing only changes. */
const copyInto = (draft: object, source: object): void => {
  const target = draft as Record<string, unknown>;
  const from = source as Record<string, unknown>;
  for (const key of Object.keys(from)) {
    const value = from[key];
    if (!Object.is(target[key], value)) {
      target[key] = value;
    }
  }
  for (const key of Object.keys(target)) {
    if (!Object.hasOwn(from, key)) {
      delete target[key];
    }
  }
};

/** Write only the fields that changed: a store replaces nothing, so only the readers of a changed field re-run. */
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
  // The derived form: its authoritative value is computed from the committed store (so it follows every transition)
  // and an intent's write inside an action is an override that reverts to that computed value when the action settles.
  const [optimistic, setOptimistic] = createOptimisticStore<MachineFields<C, S>>((draft) => {
    copyInto(draft, state);
  }, fieldsOf(initial));
  const settled = options.settled ?? (() => true);

  // The open intent's gate: resolving it lets the action settle, and the optimistic override drops back to the
  // committed base that the transitions have been writing all along.
  let end: (() => void) | undefined;
  const endIntent = (): void => {
    const resolve = end;
    end = undefined;
    resolve?.();
  };

  const startIntent = (phase: S): void => {
    const gate = new Promise<void>((resolve) => {
      end = resolve;
    });
    void action(async function* () {
      setOptimistic((draft) => {
        draft.phase = phase;
      });
      yield gate;
    })();
  };

  const off = machine.subscribe((snapshot) => {
    writeFields(setState, fieldsOf(snapshot));
    if (settled(snapshot.state)) {
      endIntent();
    }
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
      }, seed),
    send,
  };
};
