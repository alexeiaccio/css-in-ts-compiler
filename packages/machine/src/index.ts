// @cssints/machine: the smallest runtime that can drive a UI protocol — an animated disclosure, a menu that opens on
// hover and closes on a debounced leave, a toast that reverses mid-flight.
//
// A signal holds state, not a protocol. The moment a component animates, the protocol appears: a `closing` and an
// `opening` in the same frame race, a cancelled animation still fires its completion, an interrupted close must reverse
// from where the box is, a burst of pointer events must not produce five effects, a debounce must not swallow the last
// intent. This package makes those five properties expressible as data and provable without a browser:
//
//   - states and transitions are data (`defineMachine`), events are a union, the context is inferred;
//   - effects are data (`{ type: "animate", ... }`), the host runs them; the machine keeps one handle per effect and
//     cancels it on leaving the state, so a late completion (an event carrying a stale handle id) is ignored;
//   - `send(event, { debounce })` coalesces a burst into the last event, `flush()` delivers the final intent, `cancel()`
//     drops a superseded one;
//   - the clock is injected, so a harness advances time deterministically and the host uses the real one;
//   - the state is an external store: `getState`, `subscribe(listener)` and `subscribe(selector, listener)`.
//
// No dependencies, no Effect, plain TypeScript (this runs through node's type stripping: no enums, no namespaces, no
// parameter properties). `./solid` is the only file that imports anything, and solid-js is its optional peer.
//
// Not modelled: parallel states, history states, nested/hierarchical machines, and an `invoke` that owns a promise. The
// state after `send` is one state; a protocol that needs two independent regions needs two machines.

/** A map from event name to its payload: `undefined` for an event with no payload. */
export type PayloadMap = { readonly [type: string]: object | undefined };

/** An effect is data, not a callback: `type` names it and every other field is the host's. */
export type EffectSpec = { readonly type: string; readonly [field: string]: unknown };

/** Any event: a `type` and, when it carries one, a payload. */
export type BaseEvent = { readonly type: string; readonly [field: string]: unknown };

/** A timer handle: `number` in a fake clock, a `Timeout` from the system one. */
export type TimerHandle = unknown;

/** The clock the machine reads; a host passes the system one, a harness a fake one. */
export interface Clock {
  /** The current time in ms. */
  now(): number;
  /** Run `callback` after `ms`; the handle is opaque to the machine. */
  setTimeout(callback: () => void, ms: number): TimerHandle;
  /** Cancel a pending callback. */
  clearTimeout(handle: TimerHandle): void;
}

/** The host's clock: `Date.now` and the global timers. */
export const systemClock: Clock = {
  now: () => Date.now(),
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** A transition: a target state, a guard, an effect for the host and a write to the context. */
export interface Transition<C extends object, E> {
  /** The state the transition enters. */
  readonly target: string;
  /** Whether this transition applies, given the context and the event. */
  readonly guard?: ((context: C, event: E) => boolean) | undefined;
  /** The effect(s) the host runs; the machine issues a handle for each, owned by the target state. */
  readonly effect?: EffectSpec | readonly EffectSpec[] | undefined;
  /** The context fields to write, or a function of the context and the event. */
  readonly assign?: Partial<C> | ((context: C, event: E) => Partial<C>) | undefined;
}

/** A target as a string (a transition with no guard, effect or assign), or the full transition. */
export type TransitionLike<C extends object, E> = string | Transition<C, E>;

/** One transition or a list of them; the first whose guard passes is taken. */
export type TransitionList<C extends object, E> =
  | TransitionLike<C, E>
  | readonly TransitionLike<C, E>[];

/** The definition of one state. */
export interface StateDef<C extends object, E> {
  /** On an event: one transition, or the first of a list whose guard passes. */
  readonly on?: { readonly [type: string]: TransitionList<C, E> } | undefined;
  /** After `ms` in this state: a transition. Leaving the state clears the timer. */
  readonly after?: { readonly [ms: string]: TransitionList<C, E> } | undefined;
  /** The effects of being in this state; cancelled when the state is left. */
  readonly effect?: readonly EffectSpec[] | undefined;
}

/** The event union a machine accepts, plus its payloads, given its states and a payload map. */
type EventName<St, K extends keyof St> = St[K] extends { readonly on?: infer On }
  ? keyof On & string
  : never;

/** Every event name some state accepts. */
export type EventNames<St> = {
  [K in keyof St]: EventName<St, K>;
}[keyof St];

/** The payload of one event: its declared payload, or none. */
type PayloadOf<K extends string, P extends PayloadMap> = K extends keyof P
  ? P[K] extends object
    ? P[K]
    : Record<never, never>
  : Record<never, never>;

/** The event union of a machine, derived from its states and its payload map. */
export type EventOf<St, P extends PayloadMap> = {
  [K in EventNames<St>]: { readonly type: K } & PayloadOf<K, P>;
}[EventNames<St>];

/** What a guard or an `assign` sees in the definition: the declared payload union, or any event. */
export type ConfigEvent<P extends PayloadMap> = [keyof P] extends [never]
  ? BaseEvent
  : {
      [K in keyof P & string]: { readonly type: K } & PayloadOf<K, P>;
    }[keyof P & string];

/** A machine's definition: states, the initial context, the start state and the debounce map. */
export interface MachineDefinition<C extends object, St, P extends PayloadMap> {
  /** The initial context. */
  readonly initial: C;
  /** The states, in declaration order. */
  readonly states: St;
  /** The state the machine starts in: `start`, else the first key of `states`. */
  readonly start: keyof St & string;
  /** Event name → debounce in ms, applied by `send` when it passes no `debounce`. */
  readonly debounce: Readonly<Record<string, number>>;
  /** The payload map, so `createMachine` can recover the event union. */
  readonly payloads?: P | undefined;
}

/** The state a machine exposes: the state's name and the context. */
export interface MachineState<C extends object, S extends string> {
  /** The current state's name. */
  readonly state: S;
  /** The context. Replace-per-write, so an old snapshot stays readable. */
  readonly context: C;
}

/** One running effect: the machine's handle for it. */
export interface EffectHandle {
  /** Unique per machine; a completion event carries it as `id`. */
  readonly id: number;
  /** The effect's `type`. */
  readonly type: string;
  /** The effect as declared. */
  readonly spec: EffectSpec;
  /** The state that owns the handle; leaving the state cancels it. */
  readonly state: string;
}

/** What happened to one delivered event. */
export interface TransitionRecord {
  /** `clock.now()` when the event was delivered. */
  readonly at: number;
  /** The event's `type`. */
  readonly event: string;
  /** The state when the event arrived. */
  readonly from: string;
  /** The state after the event (`from` when no transition was taken). */
  readonly to: string;
  /** Whether a transition was taken. */
  readonly taken: boolean;
  /** The handles the transition issued, in order. */
  readonly effects: readonly number[];
  /** The event was dropped because the handle id it carried was already cancelled. */
  readonly cancelled: boolean;
}

/** Options for `send`. */
export interface SendOptions {
  /** Coalesce a burst of this event type into the last one, delivered after `ms` unless flushed. */
  readonly debounce?: number | undefined;
}

/** Options for `createMachine`. */
export interface MachineOptions {
  /** The clock; the system one by default. */
  readonly clock?: Clock | undefined;
  /** Start on creation (the default); a harness starts after wiring its listeners. */
  readonly autoStart?: boolean | undefined;
  /** A handle was issued. */
  readonly onEffect?: ((handle: EffectHandle) => void) | undefined;
  /** A handle was cancelled by leaving its state or by a transition that superseded it. */
  readonly onCancel?: ((handle: EffectHandle) => void) | undefined;
  /** An event was delivered. */
  readonly onTransition?: ((record: TransitionRecord) => void) | undefined;
}

/** A machine instance. */
export interface Machine<C extends object, S extends string, E extends { readonly type: string }> {
  /** The current state and context; a new object per transition. */
  getState(): MachineState<C, S>;
  /** Every transition and every debounce flush. */
  subscribe(listener: (state: MachineState<C, S>) => void): () => void;
  /** Only a change of `selector`'s value (compared with `Object.is`). */
  subscribe<T>(
    selector: (state: MachineState<C, S>) => T,
    listener: (value: T, previous: T) => void,
  ): () => void;
  /** Deliver an event now, or after a debounce when one applies. */
  send(event: E, options?: SendOptions): void;
  /** Deliver every pending debounced event now: the final intent is never lost. */
  flush(): void;
  /** Drop the pending debounced event of `type`, or every pending one. */
  cancel(type?: E["type"]): void;
  /** The handles that are live: issued and not yet completed or cancelled. */
  effects(): readonly EffectHandle[];
  /** A handle was issued. */
  onEffect(listener: (handle: EffectHandle) => void): () => void;
  /** A handle was cancelled. */
  onCancel(listener: (handle: EffectHandle) => void): () => void;
  /** An event was delivered (or dropped). */
  onTransition(listener: (record: TransitionRecord) => void): () => void;
  /** Enter the start state: issue its effects and schedule its `after` timers. Idempotent. */
  start(): void;
  /** Clear every timer and pending event, cancel every handle, drop every listener. */
  destroy(): void;
}

const toTransition = <C extends object, E>(value: TransitionLike<C, E>): Transition<C, E> =>
  typeof value === "string" ? { target: value } : value;

const listOf = <C extends object, E>(value: TransitionList<C, E>): readonly Transition<C, E>[] =>
  Array.isArray(value)
    ? (value as readonly TransitionLike<C, E>[]).map(toTransition)
    : [toTransition(value as TransitionLike<C, E>)];

const effectsOf = (
  value: EffectSpec | readonly EffectSpec[] | undefined,
): readonly EffectSpec[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? (value as readonly EffectSpec[]) : [value as EffectSpec];
};

const targetsOf = <C extends object, E>(value: TransitionList<C, E> | undefined): string[] =>
  value === undefined ? [] : listOf(value).map((transition) => transition.target);

/** What `defineMachine` takes: the initial context, the states, an optional start state and a debounce map. */
export interface MachineConfig<C extends object, St, P extends PayloadMap> {
  /** The initial context; its shape is the machine's context. */
  readonly initial: C;
  /** The states, in declaration order; the first is the start state unless `start` says otherwise. */
  readonly states: St;
  /** The state the machine starts in. */
  readonly start?: (keyof St & string) | undefined;
  /** Event name → debounce in ms, applied by `send` when it passes no `debounce`. */
  readonly debounce?: Readonly<Record<string, number>> | undefined;
  /** Keeps the payload map in the definition's type. */
  readonly payloads?: P | undefined;
}

type AnyConfig = MachineConfig<object, Record<string, StateDef<object, BaseEvent>>, PayloadMap>;

const build = <C extends object, St, P extends PayloadMap>(
  config: MachineConfig<C, St, P>,
): MachineDefinition<C, St, P> => {
  const states = config.states as unknown as Record<string, StateDef<object, BaseEvent>>;
  const names = Object.keys(states);
  if (names.length === 0) {
    throw new Error("@cssints/machine: a machine needs at least one state");
  }
  const start = config.start ?? (names[0] as keyof St & string);
  if (!Object.hasOwn(states, start)) {
    throw new Error(`@cssints/machine: the start state "${start}" is not a state`);
  }
  const known = new Set(names);
  for (const [name, state] of Object.entries(states)) {
    for (const [kind, map] of [
      ["on", state.on],
      ["after", state.after],
    ] as const) {
      for (const [key, value] of Object.entries(map ?? {})) {
        if (kind === "after" && Number.isNaN(Number(key))) {
          throw new Error(`@cssints/machine: ${name}.after.${key} is not a number of ms`);
        }
        for (const target of targetsOf(value)) {
          if (!known.has(target)) {
            throw new Error(
              `@cssints/machine: ${name}.${kind}.${key} targets "${target}", which is not a state`,
            );
          }
        }
      }
    }
  }
  return {
    initial: config.initial,
    states: config.states,
    start,
    debounce: config.debounce ?? {},
  };
};

/**
 * Define a machine: its initial context, its states, the start state (the first key of `states` by default) and an
 * optional debounce map. The state names, the event union and the context are all inferred, and a transition to a state
 * that does not exist is a build error.
 *
 * Events with no payload need nothing more. To type payloads, declare them once, curried:
 * `defineMachine<{ close: undefined; finish: { id: number } }>()({ ... })`; a guard or an `assign` then narrows on
 * `event.type`. Without the map they see `{ type: string; [field: string]: unknown }`.
 */
export function defineMachine<P extends PayloadMap = Record<never, never>>(): <
  C extends object,
  const St extends Record<string, StateDef<C, ConfigEvent<P>>>,
>(
  config: MachineConfig<C, St, P>,
) => MachineDefinition<C, St, P>;
export function defineMachine<
  C extends object,
  const St extends Record<string, StateDef<C, BaseEvent>>,
>(
  config: MachineConfig<C, St, Record<never, never>>,
): MachineDefinition<C, St, Record<never, never>>;
export function defineMachine(...args: [] | [AnyConfig]): unknown {
  if (args.length === 0) {
    return (config: AnyConfig) => build(config);
  }
  return build(args[0]);
}

interface RuntimeTransition<C extends object> {
  readonly target: string;
  readonly guard?: ((context: C, event: BaseEvent) => boolean) | undefined;
  readonly effect?: EffectSpec | readonly EffectSpec[] | undefined;
  readonly assign?: Partial<C> | ((context: C, event: BaseEvent) => Partial<C>) | undefined;
}

interface RuntimeState<C extends object> {
  readonly on?: { readonly [type: string]: TransitionList<C, BaseEvent> } | undefined;
  readonly after?: { readonly [ms: string]: TransitionList<C, BaseEvent> } | undefined;
  readonly effect?: readonly EffectSpec[] | undefined;
}

const choose = <C extends object>(
  value: TransitionList<C, BaseEvent> | undefined,
  context: C,
  event: BaseEvent,
): RuntimeTransition<C> | undefined => {
  if (value === undefined) {
    return undefined;
  }
  for (const transition of listOf(value)) {
    if (transition.guard === undefined || transition.guard(context, event)) {
      return transition;
    }
  }
  return undefined;
};

/** The id a completion event carries, if it carries one. */
const handleIdOf = (event: BaseEvent): number | undefined => {
  const id: unknown = event.id;
  return typeof id === "number" ? id : undefined;
};

/**
 * Create a machine and start it (unless `autoStart: false`). The start state's effects are issued right away, so a host
 * reads them through `effects()` or an `onEffect` option.
 */
export function createMachine<C extends object, St, P extends PayloadMap = Record<never, never>>(
  definition: MachineDefinition<C, St, P>,
  options: MachineOptions = {},
): Machine<C, keyof St & string, EventOf<St, P>> {
  type S = keyof St & string;
  type E = EventOf<St, P>;
  const states = definition.states as unknown as Record<S, RuntimeState<C>>;
  const clock = options.clock ?? systemClock;
  const debounceMap = definition.debounce;

  let current: S = definition.start;
  let context: C = definition.initial;
  let started = false;
  let destroyed = false;
  let nextId = 1;

  const handles = new Map<number, EffectHandle>();
  const afterTimers = new Set<TimerHandle>();
  const pending = new Map<string, { readonly event: BaseEvent; readonly timer: TimerHandle }>();

  const stateListeners = new Set<(state: MachineState<C, S>) => void>();
  const selectors = new Set<{
    readonly selector: (state: MachineState<C, S>) => unknown;
    readonly listener: (value: unknown, previous: unknown) => void;
    value: unknown;
  }>();
  const effectListeners = new Set<(handle: EffectHandle) => void>();
  const cancelListeners = new Set<(handle: EffectHandle) => void>();
  const transitionListeners = new Set<(record: TransitionRecord) => void>();

  const snapshot = (): MachineState<C, S> => ({ state: current, context });

  const notify = (): void => {
    const state = snapshot();
    for (const listener of stateListeners) {
      listener(state);
    }
    for (const entry of selectors) {
      const value = entry.selector(state);
      if (!Object.is(value, entry.value)) {
        const previous = entry.value;
        entry.value = value;
        entry.listener(value, previous);
      }
    }
  };

  const record = (entry: TransitionRecord): void => {
    for (const listener of transitionListeners) {
      listener(entry);
    }
  };

  const announce = (issued: readonly EffectHandle[]): void => {
    for (const handle of issued) {
      for (const listener of effectListeners) {
        listener(handle);
      }
    }
  };

  const clearAfter = (): void => {
    for (const timer of afterTimers) {
      clock.clearTimeout(timer);
    }
    afterTimers.clear();
  };

  const cancelHandles = (except?: number): void => {
    for (const handle of handles.values()) {
      if (handle.id === except) {
        continue;
      }
      handles.delete(handle.id);
      for (const listener of cancelListeners) {
        listener(handle);
      }
    }
    if (except !== undefined) {
      handles.delete(except);
    }
  };

  const issue = (specs: readonly EffectSpec[], state: S): EffectHandle[] => {
    const issued: EffectHandle[] = [];
    for (const spec of specs) {
      const handle: EffectHandle = { id: nextId++, type: spec.type, spec, state };
      handles.set(handle.id, handle);
      issued.push(handle);
    }
    return issued;
  };

  const scheduleAfter = (state: S): void => {
    for (const [ms, value] of Object.entries(states[state].after ?? {})) {
      const delay = Number(ms);
      const timer = clock.setTimeout(() => {
        afterTimers.delete(timer);
        const transition = choose(value, context, { type: "after" });
        if (transition !== undefined) {
          take(transition, { type: "after" });
        }
      }, delay);
      afterTimers.add(timer);
    }
  };

  const take = (transition: RuntimeTransition<C>, event: BaseEvent, completedId?: number): void => {
    const from = current;
    const target = transition.target as S;
    const assigned =
      transition.assign === undefined
        ? undefined
        : typeof transition.assign === "function"
          ? transition.assign(context, event)
          : transition.assign;
    const nextContext = assigned === undefined ? context : { ...context, ...assigned };

    clearAfter();
    cancelHandles(completedId);
    current = target;
    context = nextContext;

    const issued = [
      ...issue(states[target].effect ?? [], target),
      ...issue(effectsOf(transition.effect), target),
    ];
    scheduleAfter(target);

    record({
      at: clock.now(),
      event: event.type,
      from,
      to: target,
      taken: true,
      effects: issued.map((handle) => handle.id),
      cancelled: false,
    });
    notify();
    announce(issued);
  };

  const deliver = (event: BaseEvent): void => {
    if (destroyed) {
      return;
    }
    const from = current;
    const id = handleIdOf(event);
    if (id !== undefined && !handles.has(id)) {
      record({
        at: clock.now(),
        event: event.type,
        from,
        to: from,
        taken: false,
        effects: [],
        cancelled: true,
      });
      return;
    }
    const transition = choose(states[from].on?.[event.type], context, event);
    if (transition === undefined) {
      record({
        at: clock.now(),
        event: event.type,
        from,
        to: from,
        taken: false,
        effects: [],
        cancelled: false,
      });
      return;
    }
    take(transition, event, id);
  };

  const dropPending = (type?: string): void => {
    if (type === undefined) {
      for (const entry of pending.values()) {
        clock.clearTimeout(entry.timer);
      }
      pending.clear();
      return;
    }
    const entry = pending.get(type);
    if (entry !== undefined) {
      clock.clearTimeout(entry.timer);
      pending.delete(type);
    }
  };

  const send = (event: E, sendOptions?: SendOptions): void => {
    if (destroyed) {
      return;
    }
    const debounce = sendOptions?.debounce ?? debounceMap[event.type];
    if (debounce === undefined) {
      deliver(event);
      return;
    }
    const type = event.type;
    const previous = pending.get(type);
    if (previous !== undefined) {
      clock.clearTimeout(previous.timer);
    }
    const timer = clock.setTimeout(() => {
      const entry = pending.get(type);
      if (entry === undefined || entry.timer !== timer) {
        return;
      }
      pending.delete(type);
      deliver(entry.event);
    }, debounce);
    pending.set(type, { event, timer });
  };

  const flush = (): void => {
    const entries = [...pending.values()];
    pending.clear();
    for (const entry of entries) {
      clock.clearTimeout(entry.timer);
      deliver(entry.event);
    }
  };

  const start = (): void => {
    if (started || destroyed) {
      return;
    }
    started = true;
    const issued = issue(states[current].effect ?? [], current);
    scheduleAfter(current);
    announce(issued);
  };

  const destroy = (): void => {
    if (destroyed) {
      return;
    }
    destroyed = true;
    started = false;
    clearAfter();
    dropPending();
    cancelHandles();
    for (const set of [
      stateListeners,
      selectors,
      effectListeners,
      cancelListeners,
      transitionListeners,
    ]) {
      set.clear();
    }
  };

  const subscribe = ((
    first: (state: MachineState<C, S>) => unknown,
    second?: (value: unknown, previous: unknown) => void,
  ): (() => void) => {
    if (second === undefined) {
      stateListeners.add(first);
      return () => {
        stateListeners.delete(first);
      };
    }
    const entry = { selector: first, listener: second, value: first(snapshot()) };
    selectors.add(entry);
    return () => {
      selectors.delete(entry);
    };
  }) as Machine<C, S, E>["subscribe"];

  const onEffect = (listener: (handle: EffectHandle) => void): (() => void) => {
    effectListeners.add(listener);
    return () => {
      effectListeners.delete(listener);
    };
  };

  const onCancel = (listener: (handle: EffectHandle) => void): (() => void) => {
    cancelListeners.add(listener);
    return () => {
      cancelListeners.delete(listener);
    };
  };

  const onTransition = (listener: (entry: TransitionRecord) => void): (() => void) => {
    transitionListeners.add(listener);
    return () => {
      transitionListeners.delete(listener);
    };
  };

  if (options.onEffect !== undefined) {
    effectListeners.add(options.onEffect);
  }
  if (options.onCancel !== undefined) {
    cancelListeners.add(options.onCancel);
  }
  if (options.onTransition !== undefined) {
    transitionListeners.add(options.onTransition);
  }

  const machine: Machine<C, S, E> = {
    getState: snapshot,
    subscribe,
    send,
    flush,
    cancel: (type?: string): void => {
      dropPending(type);
    },
    effects: () => [...handles.values()],
    onEffect,
    onCancel,
    onTransition,
    start,
    destroy,
  };

  if (options.autoStart !== false) {
    start();
  }
  return machine;
}

// Re-export internals a caller may hide behind a named type is not needed: the public surface is above.

export { createFakeClock, harness } from "./harness.ts";
export type { FakeClock, Harness, LogEntry } from "./harness.ts";
