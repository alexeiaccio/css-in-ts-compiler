// The machine of an animated modal layer: the box of `specs/patterns/animation.qnt` (closed, entering, open, leaving),
// and nothing of the modal contract. The APG half — focus in and back to the invoker, the Tab cycle, Escape, the
// backdrop, `aria-modal`, the scroll lock — is `specs/apg/dialog-modal.qnt` and stays in `@cssints/headless`
// (`createDialogModal`, `createDrawer`). A `Dialog` or a `Drawer` with `animated` is the two questions together: the
// primitive decides *whether* the layer is open, this machine decides *how* it leaves and enters, and the layer is
// unmounted only at `closed`.
//
// The intents are the primitive's, not the DOM's. The machine follows `open()`: a request a controlled host refuses
// never moves the box (no slide out and back), and the box starts closing only once the open state really changed. That
// is the one place this host differs from the disclosure's, which starts the animation from an intent. Two `close`
// intents in one frame are one dismissal because the machine has no `close` transition while `leaving` — a superseded
// intent, not a debounce — and because `createControllable` asks the host once for an intent it is still waiting on.
//
// Leaving a state cancels the effect the machine issued, and a cancelled animation's own late completion carries the
// dead handle's id, which the machine drops before it looks at a transition (`CancelledFinishIgnored`,
// `StaleCarriesCancelled`). A reversal keeps the box where it is: the host reads the running animation's `currentTime`
// before it cancels it, so the replacement starts at that fraction (`ReversalKeepsPosition`). With
// `prefers-reduced-motion: reduce` an intent lands in one step and no transition is entered (`ReducedMotionSkips`).
import {
  type ConfigEvent,
  createMachine,
  defineMachine,
  type EffectHandle,
  type Machine,
  type Transition,
  type TransitionList,
} from "@cssints/machine";
import { type MachineStore, createMachineStore } from "@cssints/machine/solid";
import { type Accessor, createEffect, onCleanup, untrack } from "solid-js";

/** How long a full open or close takes: the drawer's slide and the dialog's fade are one track. */
export const OVERLAY_MOTION_DURATION = 200;

/** The box: the four states `specs/patterns/animation.qnt` calls `visual`. */
export type OverlayMotionPhase = "closed" | "entering" | "open" | "leaving";

/** The machine's context: the accepted intent, what the box has settled at, and the motion preference. */
export interface OverlayMotionContext {
  /** The primitive's open state (`dialog.open()`): what `aria-expanded` and `aria-modal` say. */
  readonly logical: boolean;
  /** What the box has settled at; only an effect's completion moves it. */
  readonly committed: "closed" | "open";
  /** `prefers-reduced-motion: reduce` (or the `reducedMotion` override): no transition is entered. */
  readonly reduced: boolean;
}

// a type alias, not an interface: `PayloadMap` is an index signature, and only an alias is assignable to one
type OverlayMotionPayloads = {
  readonly open: undefined;
  readonly close: undefined;
  readonly finish: { readonly id: number };
  readonly motion: { readonly reduced: boolean };
};

/** The machine's events: the protocol's own, not the DOM's. */
export type OverlayMotionEvent =
  | { readonly type: "open" }
  | { readonly type: "close" }
  | { readonly type: "finish"; readonly id: number }
  | { readonly type: "motion"; readonly reduced: boolean };

/** The running machine, as the components and their tests name it. */
export type OverlayMotionMachine = Machine<
  OverlayMotionContext,
  OverlayMotionPhase,
  OverlayMotionEvent
>;

type OverlayMotionConfig = ConfigEvent<OverlayMotionPayloads>;

// A same-direction intent has no transition at all: the machine drops it, so the running effect is neither cancelled
// nor restarted. Reduced motion is the same list's first entry: the box lands at the intent in one step, no effect.
const toward = (open: boolean): TransitionList<OverlayMotionContext, OverlayMotionConfig> => [
  {
    guard: (context) => context.reduced,
    target: open ? "open" : "closed",
    assign: { logical: open, committed: open ? "open" : "closed" },
  },
  {
    target: open ? "entering" : "leaving",
    assign: { logical: open },
    effect: { type: "animate", to: open ? "open" : "closed" },
  },
];

// The preference moves while the box is still: keep the phase, nothing else changes.
const followMotion = (
  phase: OverlayMotionPhase,
): Transition<OverlayMotionContext, OverlayMotionConfig> => ({
  target: phase,
  assign: (context, event) => ({
    reduced: event.type === "motion" ? event.reduced : context.reduced,
  }),
});

// The preference turns on mid-flight: the effect is cancelled by leaving the state, the box lands at the intent.
const stopMotion = (
  target: "open" | "closed",
): Transition<OverlayMotionContext, OverlayMotionConfig> => ({
  target,
  guard: (_context, event) => event.type === "motion" && event.reduced,
  assign: { reduced: true, committed: target },
});

const settle = (
  target: "open" | "closed",
): Transition<OverlayMotionContext, OverlayMotionConfig> => ({
  target,
  assign: { committed: target },
});

/**
 * The protocol as data, for the components and for a harness: four states, four events, and no `close` in `leaving`
 * (a second dismissal is a superseded intent) and no `open` in `open` (a repeated open is none). `start` follows the
 * primitive, so a dialog that is open at mount is painted open rather than entered.
 */
export const overlayMotionDefinition = (reduced: boolean, start: "open" | "closed" = "closed") =>
  defineMachine<OverlayMotionPayloads>()({
    start,
    initial: { logical: start === "open", committed: start, reduced },
    states: {
      closed: {
        on: { open: toward(true), motion: followMotion("closed") },
      },
      entering: {
        on: { close: toward(false), finish: settle("open"), motion: stopMotion("open") },
      },
      open: {
        on: { close: toward(false), motion: followMotion("open") },
      },
      leaving: {
        on: { open: toward(true), finish: settle("closed"), motion: stopMotion("closed") },
      },
    },
  });

/** A frame of the panel on the box's track: 0 is closed, 1 is open. */
export type OverlayFrame = (fraction: number) => Keyframe;

/** What the host needs: the primitive's open state, the panel's frames, and the preference. */
export interface OverlayMotionOptions {
  /** The primitive's open state: the machine follows it, so a request the host refuses never moves the box. */
  readonly open: Accessor<boolean>;
  /** Structural, read once: off, the box lands in one microtask and no animation starts. */
  readonly animated: boolean;
  /** The panel's frames: the dialog fades and lifts, the drawer slides off its own edge. */
  readonly frame: OverlayFrame;
  /** The motion preference; left out, `prefers-reduced-motion: reduce` is read once. */
  readonly reducedMotion?: boolean | undefined;
  /** Every animation the host starts, once, after `animate()`: a test pauses it and steps the timeline. */
  readonly onAnimate?: ((animation: Animation) => void) | undefined;
}

/** The machine as the layer reads it: a phase, a presence, and the panel the effects run on. */
export interface OverlayMotion {
  readonly machine: OverlayMotionMachine;
  readonly store: MachineStore<OverlayMotionContext, OverlayMotionPhase, OverlayMotionEvent>;
  /** The box, from the committed store: one field, and a reader of it does not re-run for the others. */
  readonly phase: Accessor<OverlayMotionPhase>;
  /** The layer is mounted: the box is not closed, or the primitive is open and the box has yet to follow it. */
  readonly visible: Accessor<boolean>;
  readonly attach: (element: HTMLElement | undefined) => void;
}

interface LiveAnimation {
  readonly handle: EffectHandle;
  readonly animation: Animation;
  readonly from: number;
  readonly to: number;
  readonly duration: number;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Run the box for one layer. Call it in a component body: the store and its projections belong to the component, and
 * disposing it unsubscribes from the machine and settles it.
 */
export const createOverlayMotion = (options: OverlayMotionOptions): OverlayMotion => {
  const animated = options.animated;
  const machine: OverlayMotionMachine = createMachine(
    overlayMotionDefinition(
      untrack(() => options.reducedMotion) ?? prefersReducedMotion(),
      untrack(() => options.open()) ? "open" : "closed",
    ),
  );
  const store = createMachineStore(machine);
  const view = store.projection(
    (draft, state) => {
      draft.visible = state.phase !== "closed";
    },
    { visible: false },
  );

  let panel: HTMLElement | undefined;
  /** The live animation, or `undefined` at rest (and for the instant between a cancel and its replacement). */
  let live: LiveAnimation | undefined;
  /** Where a cancelled animation stopped: the reversal's start. */
  let carried: number | undefined;

  const fractionOf = (running: LiveAnimation): number => {
    const time = Number(running.animation.currentTime ?? 0);
    return running.duration === 0 ? 0 : Math.min(1, Math.max(0, time / running.duration));
  };

  const offEffect = machine.onEffect((handle) => {
    const to = handle.spec.to === "open" ? 1 : 0;
    // a reversal keeps the box where it was; a start begins at the end the box is already at
    const from = carried ?? (to === 1 ? 0 : 1);
    carried = undefined;
    const element = panel;
    if (element === undefined || !animated) {
      // no motion asked for, or nothing mounted to animate: the box lands at once, and the finish is a microtask so a
      // transition is still one delivery
      queueMicrotask(() => machine.send({ type: "finish", id: handle.id }));
      return;
    }
    const distance = Math.abs(to - from);
    // the box moves at a constant rate, so the duration is what is left to travel; `fill: none` because the panel's own
    // state styling is the animation's end in either direction
    const duration = OVERLAY_MOTION_DURATION * Math.max(distance, 0.001);
    const animation = element.animate([options.frame(from), options.frame(to)], {
      duration,
      easing: "linear",
      fill: "none",
    });
    // the ends, for a test that steps the timeline; the id is the least visible place to keep them
    animation.id = `${from}:${to}`;
    live = { handle, animation, from, to, duration };
    options.onAnimate?.(animation);
    const done = (): void => {
      if (live?.handle.id === handle.id) {
        live = undefined;
      }
      animation.cancel();
      // a completion, and a cancelled animation's own late one: the machine drops the latter by its id
      machine.send({ type: "finish", id: handle.id });
    };
    animation.finished.then(done, done);
  });

  const offCancel = machine.onCancel((handle) => {
    if (live?.handle.id !== handle.id) {
      return;
    }
    const cancelled = live;
    // read before `cancel()`: a cancelled animation's `currentTime` is null
    carried = fractionOf(cancelled);
    live = undefined;
    cancelled.animation.cancel();
  });

  // The machine follows the primitive. The delivery is a microtask because an effect runs in an owned scope, where the
  // store refuses a write; the layer's presence does not wait for it — it reads `open()` too, so the panel is in the
  // DOM before the primitive moves the focus into it.
  createEffect(
    () => options.open(),
    (open) => {
      queueMicrotask(() => {
        if (open !== machine.getState().context.logical) {
          machine.send({ type: open ? "open" : "close" });
        }
      });
    },
  );

  createEffect(
    () => options.reducedMotion,
    (reduced) => {
      if (reduced === undefined) {
        return;
      }
      queueMicrotask(() => {
        if (reduced !== machine.getState().context.reduced) {
          machine.send({ type: "motion", reduced });
        }
      });
    },
  );

  onCleanup(() => {
    offEffect();
    offCancel();
    machine.destroy();
  });

  // The box as the layer shows it (`data-state`). The machine follows `open()` on the next microtask, so for the flush
  // that mounts the panel — before the primitive can move the focus into it — the box is where it is heading: `entering`,
  // or `open` at once when the preference skips the transition. A mounted layer is never shown at the `closed` end.
  const shown = (): OverlayMotionPhase => {
    const phase = store.state.phase;
    if (phase !== "closed" || !options.open()) {
      return phase;
    }
    return machine.getState().context.reduced ? "open" : "entering";
  };

  return {
    machine,
    store,
    phase: shown,
    visible: () => options.open() || view.visible,
    attach: (element) => {
      panel = element;
    },
  };
};
