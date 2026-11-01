// The harness: a machine on a fake clock, a queue of events that can be delivered in any order, the effects that were
// issued, and a log of every delivery. Its point is that the protocol's properties are asserted in a plain node test —
// a close interrupted by an open reverses and ends open, a cancelled animation's completion is ignored, a burst produces
// one effect, a debounce keeps the last intent, and no state is a trap. No browser, no real time.
import {
  createMachine,
  type Clock,
  type EffectHandle,
  type EventOf,
  type Machine,
  type MachineDefinition,
  type MachineOptions,
  type MachineState,
  type PayloadMap,
  type SendOptions,
  type TransitionRecord,
} from "./index.ts";

/** A fake clock: time moves only when `advance` is called. */
export interface FakeClock extends Clock {
  /** The current time in ms. */
  readonly time: number;
  /** Move time forward by `ms`, running every timer that falls due, in order. */
  advance(ms: number): void;
  /** How many timers are scheduled. */
  pending(): number;
}

/** A deterministic clock: `now` starts at 0 and only `advance` moves it. */
export const createFakeClock = (): FakeClock => {
  let now = 0;
  let nextTimer = 1;
  const timers = new Map<number, { readonly at: number; readonly callback: () => void }>();

  const advance = (ms: number): void => {
    const target = now + ms;
    let steps = 0;
    for (;;) {
      let dueId: number | undefined;
      let dueAt = Number.POSITIVE_INFINITY;
      for (const [id, timer] of timers) {
        if (
          timer.at <= target &&
          (timer.at < dueAt || (timer.at === dueAt && dueId !== undefined && id < dueId))
        ) {
          dueId = id;
          dueAt = timer.at;
        }
      }
      const timer = dueId === undefined ? undefined : timers.get(dueId);
      if (dueId === undefined || timer === undefined) {
        break;
      }
      timers.delete(dueId);
      now = timer.at;
      timer.callback();
      steps += 1;
      if (steps > 100000) {
        throw new Error(
          "@cssints/machine: the fake clock ran 100000 timers without reaching its target",
        );
      }
    }
    now = target;
  };

  return {
    get time() {
      return now;
    },
    now: () => now,
    setTimeout: (callback, ms) => {
      const id = nextTimer++;
      timers.set(id, { at: now + Math.max(0, ms), callback });
      return id;
    },
    clearTimeout: (handle) => {
      timers.delete(handle as number);
    },
    advance,
    pending: () => timers.size,
  };
};

/** One entry of the harness log: a delivery, one row per effect it issued (or one row with no effect). */
export interface LogEntry<C extends object> {
  /** When it happened on the fake clock. */
  readonly at: number;
  /** The event's `type` (`"after"` for a timer). */
  readonly event: string;
  /** The state when the event arrived. */
  readonly from: string;
  /** The state after it, or `undefined` when no transition was taken. */
  readonly to: string | undefined;
  /** The handle this row is about. */
  readonly effect: number | undefined;
  /** The context after the delivery. */
  readonly context: C;
  /** The event was dropped (a stale handle id) or this effect was cancelled by leaving its state. */
  cancelled: boolean;
}

/** A machine on a fake clock, with the host's side recorded. */
export interface Harness<C extends object, S extends string, E extends { readonly type: string }> {
  /** The machine. Send through the harness to keep the queue and the log together, or directly. */
  readonly machine: Machine<C, S, E>;
  /** The fake clock; `advance(ms)` is the harness's shortcut. */
  readonly clock: FakeClock;
  /** Every delivery, and every effect a delivery issued. */
  readonly log: LogEntry<C>[];
  /** Send now (an effect's completion, a user event). */
  send(event: E, options?: SendOptions): void;
  /** Queue events for a later, chosen order. */
  enqueue(...events: E[]): void;
  /** The queued events, in order. */
  queued(): readonly E[];
  /** Deliver the first queued event now. */
  deliver(): void;
  /** Deliver every queued event now, in queue order. */
  deliverAll(): void;
  /** Move the fake clock forward. */
  advance(ms: number): void;
  /** The handles issued since the last flush: what the host would run now. */
  pendingEffects(): readonly EffectHandle[];
  /** The handles issued since the last flush; clears the queue. */
  flushEffects(): readonly EffectHandle[];
  /** Deliver every event at the current instant, in order, without advancing time. */
  race(...events: E[]): readonly MachineState<C, S>[];
  /** Deliver several sequences round-robin at the current instant. */
  interleave(...sequences: readonly (readonly E[])[]): readonly MachineState<C, S>[];
  /** The ids of the effects cancelled so far. */
  cancelled(): readonly number[];
}

/**
 * Put a definition on a fake clock: the machine starts (so its entry effects are issued before the harness returns) and
 * every delivery, issued effect and cancellation is recorded.
 */
export function harness<C extends object, St, P extends PayloadMap = Record<never, never>>(
  definition: MachineDefinition<C, St, P>,
  options: Omit<
    MachineOptions,
    "autoStart" | "clock" | "onEffect" | "onCancel" | "onTransition"
  > = {},
): Harness<C, keyof St & string, EventOf<St, P>> {
  type S = keyof St & string;
  type E = EventOf<St, P>;
  const clock = createFakeClock();
  const log: LogEntry<C>[] = [];
  const entries = new Map<number, LogEntry<C>>();
  const pending: EffectHandle[] = [];
  const queue: E[] = [];
  const cancelledIds: number[] = [];

  const onTransition = (record: TransitionRecord): void => {
    const context = machine.getState().context;
    if (!record.taken) {
      log.push({
        at: record.at,
        event: record.event,
        from: record.from,
        to: undefined,
        effect: undefined,
        context,
        cancelled: record.cancelled,
      });
      return;
    }
    if (record.effects.length === 0) {
      log.push({
        at: record.at,
        event: record.event,
        from: record.from,
        to: record.to,
        effect: undefined,
        context,
        cancelled: false,
      });
      return;
    }
    for (const id of record.effects) {
      const entry: LogEntry<C> = {
        at: record.at,
        event: record.event,
        from: record.from,
        to: record.to,
        effect: id,
        context,
        cancelled: false,
      };
      entries.set(id, entry);
      log.push(entry);
    }
  };

  const machine = createMachine(definition, {
    ...options,
    clock,
    autoStart: false,
    onEffect: (handle) => {
      pending.push(handle);
    },
    onCancel: (handle) => {
      cancelledIds.push(handle.id);
      const entry = entries.get(handle.id);
      if (entry !== undefined) {
        entry.cancelled = true;
      }
    },
    onTransition,
  });
  machine.start();

  const deliverAll = (): void => {
    while (queue.length > 0) {
      const event = queue.shift();
      if (event !== undefined) {
        machine.send(event);
      }
    }
  };

  const step = (event: E): MachineState<C, S> => {
    machine.send(event);
    return machine.getState();
  };

  return {
    machine,
    clock,
    log,
    send: (event, sendOptions) => {
      machine.send(event, sendOptions);
    },
    enqueue: (...events) => {
      queue.push(...events);
    },
    queued: () => [...queue],
    deliver: () => {
      const event = queue.shift();
      if (event !== undefined) {
        machine.send(event);
      }
    },
    deliverAll,
    advance: (ms) => {
      clock.advance(ms);
    },
    pendingEffects: () => {
      const live = new Set(machine.effects().map((handle) => handle.id));
      return pending.filter((handle) => live.has(handle.id));
    },
    flushEffects: () => {
      // Only the handles still live: a host runs what the machine still wants, and a superseded effect in the same
      // frame was cancelled before the flush.
      const live = new Set(machine.effects().map((handle) => handle.id));
      const issued = pending.filter((handle) => live.has(handle.id));
      pending.length = 0;
      return issued;
    },
    race: (...events) => events.map(step),
    interleave: (...sequences) => {
      const states: MachineState<C, S>[] = [];
      const longest = Math.max(0, ...sequences.map((sequence) => sequence.length));
      for (let index = 0; index < longest; index += 1) {
        for (const sequence of sequences) {
          const event = sequence[index];
          if (event !== undefined) {
            states.push(step(event));
          }
        }
      }
      return states;
    },
    cancelled: () => [...cancelledIds],
  };
}
