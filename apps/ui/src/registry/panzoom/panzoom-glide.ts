// The glide of the pan-zoom skin: a flick leaves the picture moving, and a grab takes it back. It is a machine rather
// than a `requestAnimationFrame` in the component because the races are the protocol: a pointer down during the glide
// must own the picture from the frame the last tick wrote (`ReversalKeepsPosition`), a frame that outlives its effect
// must move nothing (`StaleCarriesCancelled`), a reader's key must end the animation, an unmount must cancel the loop,
// and reduced motion must never start one. Those are asserted on `@cssints/machine`'s harness without a browser, and
// the same machine is what the DOM test drives.
//
// The offset stays in `@cssints/headless`'s primitive: it already holds it, clamps it and reports it through
// `onPanChange`. The machine carries only the velocity (`vx`, `vy` in px/ms) and its phase, so the store is read for
// `data-gliding` and the offset never goes through it.
import { type ConfigEvent, createMachine, defineMachine, type Machine } from "@cssints/machine";
import { type MachineStore, createMachineStore } from "@cssints/machine/solid";
import type { PanZoom } from "@cssints/headless";
import { type Accessor, onCleanup, untrack } from "solid-js";

/** How fast a release must be, in px/ms, to leave a glide: 0.3 is a deliberate flick, not a drag. */
export const PANZOOM_FLING_VELOCITY = 0.3;
/** The speed at which a glide is over, in px/ms. */
export const PANZOOM_GLIDE_FLOOR = 0.02;
// Per frame, not per millisecond: the machine has no clock in an `assign`, and a frame is its tick. At 60 Hz a flick of
// 1 px/ms travels about 200 px and is over in about 650 ms; a 120 Hz display halves both. `ponytail:` one multiplier for
// every display; pass each frame's elapsed time if a real trackpad needs the same distance on a 120 Hz screen.
const PANZOOM_GLIDE_FRICTION = 0.92;

/** The glide's phases: still, or the picture is moving under its own momentum. */
export type PanzoomGlidePhase = "rest" | "gliding";

/** The glide's context: the velocity the last tick moved the picture by, in px/ms. */
export interface PanzoomGlideContext {
  readonly vx: number;
  readonly vy: number;
}

// a type alias, not an interface: `PayloadMap` is an index signature, and only an alias is assignable to one
type PanzoomGlidePayloads = {
  readonly fling: { readonly vx: number; readonly vy: number };
  readonly grab: undefined;
  readonly frame: { readonly id: number };
  readonly stop: undefined;
};

/** The glide's events: a release's velocity, the pointer's grab, one animation frame and a take-over. */
export type PanzoomGlideEvent =
  | { readonly type: "fling"; readonly vx: number; readonly vy: number }
  | { readonly type: "grab" }
  | { readonly type: "frame"; readonly id: number }
  | { readonly type: "stop" };

/** The running glide machine, as the skin and its tests name it. */
export type PanzoomGlideMachine = Machine<
  PanzoomGlideContext,
  PanzoomGlidePhase,
  PanzoomGlideEvent
>;

type PanzoomGlideConfig = ConfigEvent<PanzoomGlidePayloads>;

const ZERO: PanzoomGlideContext = { vx: 0, vy: 0 };

const speedOf = (event: PanzoomGlideConfig): number =>
  event.type === "fling" ? Math.hypot(event.vx, event.vy) : 0;

const velocityOf = (event: PanzoomGlideConfig): PanzoomGlideContext =>
  event.type === "fling" ? { vx: event.vx, vy: event.vy } : ZERO;

/**
 * The glide protocol as data, for the skin and for a harness. `rest` holds still; a `fling` fast enough to matter
 * enters `gliding` with one `glide` effect; every `frame` is one tick, which re-enters `gliding` (the state's effect is
 * the next frame, so a landing frame is also a cancel) and decays the velocity; a `grab` or a `stop` takes the picture
 * back to `rest` and cancels the pending frame.
 *
 * `frame` carries the effect's handle id, so a tick that the machine no longer owns (a grab happened, the effect was
 * replaced) is dropped before any transition is looked at. Under reduced motion a release lands at `rest` in one step
 * and no effect is issued: there is no loop to cancel because there never was one.
 */
export const panzoomGlideDefinition = (reduced: boolean) =>
  defineMachine<PanzoomGlidePayloads>()({
    start: "rest",
    initial: ZERO,
    states: {
      rest: {
        on: {
          fling: [
            {
              // a slow release is not a flick, and reduced motion never glides
              guard: (_context, event) => reduced || speedOf(event) < PANZOOM_FLING_VELOCITY,
              target: "rest",
              assign: ZERO,
            },
            {
              target: "gliding",
              assign: (context, event) => velocityOf(event),
            },
          ],
          grab: { target: "rest", assign: ZERO },
          stop: { target: "rest", assign: ZERO },
        },
      },
      gliding: {
        // every tick re-enters this state, so the frame that lands also owns the cancellation of the loop
        effect: [{ type: "glide" }],
        on: {
          frame: {
            target: "gliding",
            assign: (context) => ({
              vx: context.vx * PANZOOM_GLIDE_FRICTION,
              vy: context.vy * PANZOOM_GLIDE_FRICTION,
            }),
          },
          grab: { target: "rest", assign: ZERO },
          stop: { target: "rest", assign: ZERO },
        },
      },
    },
  });

/** One frame's scheduler: `requestAnimationFrame` in a browser, a queue in a test. */
export interface FrameScheduler {
  request(callback: (time: number) => void): number;
  cancel(handle: number): void;
}

/** The browser's own frame loop. */
export const browserFrames: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
};

/** The pan the glide moves: the primitive's offset and the relative pan it clamps. */
export type PanzoomGlideTarget = Pick<PanZoom, "offset" | "panBy">;

/** What the glide needs: the primitive, the motion preference and the frame scheduler a test supplies. */
export interface PanzoomGlideOptions {
  readonly panzoom: PanzoomGlideTarget;
  /** `prefers-reduced-motion: reduce` (or the override); left out, it is read once. */
  readonly reducedMotion?: boolean | undefined;
  /** The frame loop; the browser's by default, a queue in a test. */
  readonly frames?: FrameScheduler | undefined;
}

/** The glide as the skin reads it: the machine, its store, the phase and the three intents. */
export interface PanzoomGlide {
  readonly machine: PanzoomGlideMachine;
  readonly store: MachineStore<PanzoomGlideContext, PanzoomGlidePhase, PanzoomGlideEvent>;
  /** The picture is moving by itself: `data-gliding`. */
  readonly gliding: Accessor<boolean>;
  /** A release's velocity, in px/ms; the machine drops it below the threshold or under reduced motion. */
  readonly fling: (vx: number, vy: number) => void;
  /** A pointer down: the glide's effect is cancelled and the drag continues from the offset the last frame wrote. */
  readonly grab: () => void;
  /** The reader took over (a key, a double click): the glide stops where it is. */
  readonly stop: () => void;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Run the glide of one picture. Call it in a component body, beside `createPanZoom`: the store and the cleanup belong
 * to the component.
 *
 * Each effect is one frame: the host reads the velocity, asks the primitive for `panBy(vx * dt, vy * dt)`, and either
 * sends the tick and decays or sends `stop` when the clamp swallowed the move or the friction floor was reached. The
 * effect of a landing tick is cancelled with the state, so the loop ends at rest rather than at a final frame nobody
 * owns.
 */
export const createPanzoomGlide = (options: PanzoomGlideOptions): PanzoomGlide => {
  const frames = options.frames ?? browserFrames;
  const reduced = untrack(() => options.reducedMotion) ?? prefersReducedMotion();
  const machine: PanzoomGlideMachine = createMachine(panzoomGlideDefinition(reduced));
  const store = createMachineStore(machine);

  /** The id of the handle the pending frame belongs to; `undefined` when nothing is pending. */
  let current: number | undefined;
  let pending: number | undefined;
  /** The previous frame's timestamp, for the distance this one travels. */
  let last: number | undefined;

  const cancelPending = (): void => {
    if (pending !== undefined) {
      frames.cancel(pending);
      pending = undefined;
    }
  };

  const offEffect = machine.onEffect((handle) => {
    if (handle.type !== "glide") {
      return;
    }
    current = handle.id;
    pending = frames.request((time) => {
      pending = undefined;
      // a frame already dispatched when its effect was cancelled moves nothing: the picture belongs to the grab
      if (current !== handle.id) {
        return;
      }
      const { vx, vy } = machine.getState().context;
      // a stalled tab hands over one at most 64 ms long step, not a jump across the picture
      const dt = last === undefined ? 16.7 : Math.min(64, Math.max(1, time - last));
      last = time;
      if (Math.hypot(vx, vy) < PANZOOM_GLIDE_FLOOR) {
        machine.send({ type: "stop" });
        return;
      }
      const before = options.panzoom.offset();
      options.panzoom.panBy(vx * dt, vy * dt);
      const after = options.panzoom.offset();
      if (after.x === before.x && after.y === before.y) {
        // the clamp has the picture: a glide that pushed into it is over, at the bound
        machine.send({ type: "stop" });
        return;
      }
      machine.send({ type: "frame", id: handle.id });
    });
  });

  const offCancel = machine.onCancel((handle) => {
    if (current !== handle.id) {
      return;
    }
    current = undefined;
    cancelPending();
  });

  const fling = (vx: number, vy: number): void => {
    last = undefined;
    machine.send({ type: "fling", vx, vy });
  };

  const grab = (): void => {
    last = undefined;
    machine.send({ type: "grab" });
  };

  const stop = (): void => {
    last = undefined;
    machine.send({ type: "stop" });
  };

  onCleanup(() => {
    // `destroy` cancels the handles, but the listeners are gone by then: the loop is cancelled here, while it can be
    cancelPending();
    current = undefined;
    offEffect();
    offCancel();
    machine.destroy();
  });

  return {
    machine,
    store,
    gliding: () => store.state.phase === "gliding",
    fling,
    grab,
    stop,
  };
};
