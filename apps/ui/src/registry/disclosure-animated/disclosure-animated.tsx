import {
  type Clock,
  type ConfigEvent,
  createMachine,
  defineMachine,
  type EffectHandle,
  type Machine,
  systemClock,
  type Transition,
  type TransitionList,
} from "@cssints/machine";
import { type MachineStore, createMachineStore } from "@cssints/machine/solid";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import {
  createContext,
  createEffect,
  createUniqueId,
  merge,
  omit,
  onCleanup,
  type Store,
  untrack,
  useContext,
} from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** How long a full open or close takes on the spec's five-point grid. */
export const DISCLOSURE_ANIMATED_DURATION = 200;
/** The window a burst of `pointerenter`/`pointerleave` coalesces in. */
export const DISCLOSURE_ANIMATED_DEBOUNCE = 120;

/** The box: the four states `specs/patterns/animation.qnt` calls `visual`. */
export type DisclosureAnimatedPhase = "closed" | "opening" | "open" | "closing";

/** The machine's context: the exposed intent, the settled state and the motion preference. */
export interface DisclosureAnimatedContext {
  /** What `aria-expanded` says, set the moment an intent arrives. */
  readonly logical: boolean;
  /** What the machine has settled at; only an effect's completion moves it. */
  readonly committed: "closed" | "open";
  /** `prefers-reduced-motion: reduce` (or the `reducedMotion` override): no transition is entered. */
  readonly reduced: boolean;
}

// a type alias, not an interface: `PayloadMap` is an index signature, and only an alias is assignable to one
type DisclosureAnimatedPayloads = {
  readonly open: undefined;
  readonly close: undefined;
  readonly toggle: undefined;
  readonly hover: { readonly open: boolean };
  readonly finish: { readonly id: number };
  readonly motion: { readonly reduced: boolean };
};

/** The machine's events: the protocol's own, not the DOM's. */
export type DisclosureAnimatedEvent =
  | { readonly type: "open" }
  | { readonly type: "close" }
  | { readonly type: "toggle" }
  | { readonly type: "hover"; readonly open: boolean }
  | { readonly type: "finish"; readonly id: number }
  | { readonly type: "motion"; readonly reduced: boolean };

type DisclosureMachine = Machine<
  DisclosureAnimatedContext,
  DisclosureAnimatedPhase,
  DisclosureAnimatedEvent
>;

type Config = ConfigEvent<DisclosureAnimatedPayloads>;

// An intent is one direction: a click, a controlled host's write, or a hover the window committed. The transition
// list is guarded on the intent's direction (`hover` carries its own open flag) and on reduced motion: with the
// preference on the box lands at the intent in the same step, and no effect is issued. A same-direction intent has
// no transition at all — the machine drops it, so the running effect is not cancelled and restarted.
const wants = (event: Config, open: boolean): boolean =>
  event.type !== "hover" || event.open === open;

const toward = (open: boolean): TransitionList<DisclosureAnimatedContext, Config> => [
  {
    guard: (context, event) => wants(event, open) && context.reduced,
    target: open ? "open" : "closed",
    assign: { logical: open, committed: open ? "open" : "closed" },
  },
  {
    guard: (_context, event) => wants(event, open),
    target: open ? "opening" : "closing",
    assign: { logical: open },
    effect: { type: "animate", to: open ? "open" : "closed" },
  },
];

// The preference moves while the box is still: keep it, nothing else changes.
const followMotion = (
  phase: DisclosureAnimatedPhase,
): Transition<DisclosureAnimatedContext, Config> => ({
  target: phase,
  assign: (context, event) => ({
    reduced: event.type === "motion" ? event.reduced : context.reduced,
  }),
});

// The preference turns on mid-flight: the effect is cancelled by leaving the state, the box lands at the intent.
const stopMotion = (target: "open" | "closed"): Transition<DisclosureAnimatedContext, Config> => ({
  target,
  guard: (_context, event) => event.type === "motion" && event.reduced,
  assign: { reduced: true, committed: target },
});

const settle = (target: "open" | "closed"): Transition<DisclosureAnimatedContext, Config> => ({
  target,
  assign: { committed: target },
});

// The start context carries the motion preference, so a reduced page never enters a transition even for its first intent:
// the machine starts reduced, rather than being told so in a write from the component's owned scope.
const disclosureDefinition = (reduced: boolean) =>
  defineMachine<DisclosureAnimatedPayloads>()({
    start: "closed",
    // the two ends, not `string`: the context's `committed` is the settled state, and `assign` writes either one
    initial: { logical: false, committed: "closed" as "open" | "closed", reduced },
    states: {
      closed: {
        on: {
          open: toward(true),
          toggle: toward(true),
          hover: toward(true),
          motion: followMotion("closed"),
        },
      },
      opening: {
        on: {
          close: toward(false),
          toggle: toward(false),
          hover: toward(false),
          finish: settle("open"),
          motion: stopMotion("open"),
        },
      },
      open: {
        on: {
          close: toward(false),
          toggle: toward(false),
          hover: toward(false),
          motion: followMotion("open"),
        },
      },
      closing: {
        on: {
          open: toward(true),
          toggle: toward(true),
          hover: toward(true),
          finish: settle("closed"),
          motion: stopMotion("closed"),
        },
      },
    },
  });

/** The primitive, once: a fixture reads the machine and the box's position; a page rarely does. */
export interface DisclosureAnimatedController {
  /** The machine: `getState()`, `send()`, the live effect handles. */
  readonly machine: DisclosureMachine;
  /** The machine as Solid's store: one write per transition, and a reader of a field re-runs only for that field. */
  readonly store: MachineStore<
    DisclosureAnimatedContext,
    DisclosureAnimatedPhase,
    DisclosureAnimatedEvent
  >;
  /** The box's position on the spec's five-point grid (0 closed .. 4 open), read from the running animation. */
  readonly progress: () => number;
  /** The intent a controlled host delivers: the machine starts after an intent is accepted. */
  readonly setOpen: (open: boolean) => void;
}

export interface DisclosureAnimatedProps {
  /** The motion preference; left out, `prefers-reduced-motion: reduce` is read once. */
  readonly reducedMotion?: boolean;
  /** Controlled: writing it delivers an intent, as a host that accepts every request would. */
  readonly open?: boolean;
  /** Every intent's accepted value, in the protocol's own words. */
  readonly onOpenChange?: (open: boolean) => void;
  /** The machine's clock; the system one by default, a fake one in a test. */
  readonly clock?: Clock;
  /**
   * Every animation the host starts, once — after the element's `animate` call, before it is read. A test pauses it and
   * steps the timeline; a host may retime it. Not called when the panel's element is not rendered.
   */
  readonly onAnimate?: (animation: Animation) => void;
  readonly class?: string;
  readonly children?: JSX.Element;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (controller: DisclosureAnimatedController) => void;
}

export type DisclosureAnimatedTriggerPartProps = PartProps;

export interface DisclosureAnimatedTriggerProps extends Renderable<
  DisclosureAnimatedTriggerPartProps,
  void
> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DisclosureAnimatedContentState {
  readonly phase: () => DisclosureAnimatedPhase;
  readonly visible: () => boolean;
}

export interface DisclosureAnimatedContentProps extends Renderable<
  PartProps,
  DisclosureAnimatedContentState
> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

interface LiveAnimation {
  readonly handle: EffectHandle;
  readonly animation: Animation;
  readonly from: number;
  readonly to: number;
  readonly duration: number;
}

interface DisclosureAnimatedScope {
  readonly store: MachineStore<
    DisclosureAnimatedContext,
    DisclosureAnimatedPhase,
    DisclosureAnimatedEvent
  >;
  readonly view: Store<{ visible: boolean }>;
  readonly contentId: string;
  readonly attach: (element: HTMLElement | undefined) => void;
  readonly scheduleHover: (open: boolean) => void;
  readonly toggle: () => void;
}

const ScopeContext = createContext<DisclosureAnimatedScope>();

const rootClass = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._2));

const triggerClass = css.cn(
  css.group(),
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.padding(t.space._2, 0),
  css.bg("transparent"),
  css.border("none"),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.fontWeight("500"),
  css.cursor("pointer"),
  css.textAlign("left"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const chevronClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.transition("transform 120ms"),
  css.within(css.attr("aria-expanded", "true"))(css.transform("rotate(90deg)")),
);

// The resting look is the state's own end of the grid: closed and closing are collapsed, opening and open are not. The
// animation covers the way between them (and a finished one is cancelled in the same task that writes the next state), so
// the panel never paints a frame at the wrong end. The grid row is what a disclosure grows.
const contentClass = css.cn(
  css.display("grid"),
  css.gridTemplateRows("0fr"),
  css.opacity(0),
  css.overflow("hidden"),
  css.willChange("grid-template-rows, opacity"),
  css.color(t.color.muted),
  css.fontSize(t.font.size),
  css.attr("data-state", "opening")(css.gridTemplateRows("1fr"), css.opacity(1)),
  css.attr("data-state", "open")(css.gridTemplateRows("1fr"), css.opacity(1)),
);

const contentInnerClass = css.cn(
  css.minHeight("0"),
  css.overflow("hidden"),
  css.paddingBlockStart(t.space._2),
);

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A disclosure whose panel animates open and closed, on `@cssints/machine`: the protocol `specs/patterns/animation.qnt`
 * fixes, and the first component that runs it.
 *
 * The intents are the machine's, not a signal's: an intent that arrives during the opposite animation reverses from the
 * box's own position (the running animation's `currentTime` is read before it is cancelled), leaving a state cancels its
 * effect and a late completion carrying that effect's id is dropped, a burst of `pointerenter`/`pointerleave` is
 * debounced with the last intent kept, and `prefers-reduced-motion` lands an intent in one step. `data-state` is the
 * box's phase and `hidden` its visibility, both written from the same store flush, so the panel is never hidden while
 * painted. The progress is read from the animation's real `currentTime`, which is why the animation is linear: the
 * spec's five-point grid is a sample of the timeline, not of an easing curve.
 */
export const DisclosureAnimated = (props: DisclosureAnimatedProps): JSX.Element => {
  const initialReduced = untrack(() => props.reducedMotion) ?? prefersReducedMotion();
  const machine: DisclosureMachine = createMachine(disclosureDefinition(initialReduced), {
    clock: untrack(() => props.clock) ?? systemClock,
  });
  // `store.send` would start an optimistic action whose open transaction holds the committed store until the machine
  // settles. The panel's `data-state` is the machine's own transient phase (`opening`, not `open`), so it reads the
  // committed store; the spec's optimistic split is the context's `logical` against `committed`, which is exact without
  // the action. One `setState` per transition writes only the changed fields, so a reader of `phase` does not re-run when
  // `logical` changes.
  const store = createMachineStore(machine);
  const view = store.projection(
    (draft, state) => {
      draft.visible = state.phase !== "closed";
    },
    { visible: false },
  );

  const contentId = createUniqueId();
  let content: HTMLElement | undefined;
  /** The live animation, or `undefined` at rest (and for the instant between a cancel and its replacement). */
  let live: LiveAnimation | undefined;
  /** Where a cancelled animation stopped: the reversal's start. */
  let carried: number | undefined;
  /** The phase the last transition left (its listener runs before the effect announcement, so `onEffect` reads it). */
  let lastPhase: DisclosureAnimatedPhase = machine.getState().state;

  const fractionOf = (effect: LiveAnimation): number => {
    const time = Number(effect.animation.currentTime ?? 0);
    const ratio = effect.duration === 0 ? 0 : Math.min(1, Math.max(0, time / effect.duration));
    return effect.from + (effect.to - effect.from) * ratio;
  };

  const progress = (): number => {
    if (live === undefined) {
      return machine.getState().state === "open" ? 4 : 0;
    }
    return Math.min(4, Math.max(0, Math.floor(fractionOf(live) * 4 + 0.000001)));
  };

  machine.onTransition((record) => {
    lastPhase = record.from as DisclosureAnimatedPhase;
  });

  const offEffect = machine.onEffect((handle) => {
    const fromTransient = lastPhase === "opening" || lastPhase === "closing";
    const to = handle.spec.to === "open" ? 1 : 0;
    // a reversal keeps the box where it was; a start begins at the end the box is already at
    const from = fromTransient && carried !== undefined ? carried : to === 1 ? 0 : 1;
    carried = undefined;
    const element = content;
    if (element === undefined) {
      queueMicrotask(() => machine.send({ type: "finish", id: handle.id }));
      return;
    }
    // the box moves at a constant rate in the grid, so a quarter of the duration is one grid point; `fill: "none"`
    // because the panel's own state styling is the animation's end at either direction
    const duration = DISCLOSURE_ANIMATED_DURATION * Math.max(Math.abs(to - from), 0.25);
    const animation = element.animate(
      [
        {
          gridTemplateRows: `${from}fr`,
          opacity: from,
          transform: `translateY(${(1 - from) * -4}px)`,
        },
        { gridTemplateRows: `${to}fr`, opacity: to, transform: `translateY(${(1 - to) * -4}px)` },
      ],
      { duration, easing: "linear", fill: "none" },
    );
    // the driver that steps a frame a grid point needs the animation's own ends; the id is the least visible place
    animation.id = `${from}:${to}`;
    live = { handle, animation, from, to, duration };
    props.onAnimate?.(animation);
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
    carried = fractionOf(cancelled);
    live = undefined;
    cancelled.animation.cancel();
  });

  const sendIntent = (event: DisclosureAnimatedEvent): void => {
    if (event.type !== "hover") {
      // a direct intent is the window's end: a pending hover cannot land after it
      machine.cancel("hover");
    }
    store.send(event);
  };

  const scheduleHover = (open: boolean): void => {
    store.send({ type: "hover", open }, { debounce: DISCLOSURE_ANIMATED_DEBOUNCE });
  };

  const setOpen = (open: boolean): void => {
    sendIntent({ type: open ? "open" : "close" });
  };

  let logical = machine.getState().context.logical;
  machine.onTransition(() => {
    const next = machine.getState().context.logical;
    if (next !== logical) {
      logical = next;
      props.onOpenChange?.(next);
    }
  });

  // A prop write is a host intent, and an effect runs in an owned scope where the store refuses a write: deliver it on the
  // next microtask, where it is a plain event like a click's. The read happens then, so a burst of prop writes coalesces
  // to the last one the machine has not already accepted.
  createEffect(
    () => props.reducedMotion,
    (reduced) => {
      queueMicrotask(() => {
        if (reduced !== undefined && reduced !== machine.getState().context.reduced) {
          machine.send({ type: "motion", reduced });
        }
      });
    },
  );
  createEffect(
    () => props.open,
    (open) => {
      queueMicrotask(() => {
        if (open !== undefined && open !== machine.getState().context.logical) {
          sendIntent({ type: open ? "open" : "close" });
        }
      });
    },
  );

  const controller: DisclosureAnimatedController = { machine, store, progress, setOpen };
  untrack(() => props.onReady)?.(controller);

  onCleanup(() => {
    offEffect();
    offCancel();
    machine.destroy();
  });

  const scope: DisclosureAnimatedScope = {
    store,
    view,
    contentId,
    attach: (element) => {
      content = element;
    },
    scheduleHover,
    toggle: () => sendIntent({ type: "toggle" }),
  };

  return (
    <ScopeContext value={scope}>
      <div data-part="root" class={css.cn(rootClass, props.class)}>
        {props.children}
      </div>
    </ScopeContext>
  );
};

/** The button that delivers the intent: a click toggles, and a burst of hover is the debounced window. */
export const DisclosureAnimatedTrigger = (props: DisclosureAnimatedTriggerProps): JSX.Element => {
  const scope = useContext(ScopeContext);
  const rest = omit(props, "render", "class", "children");
  const merged = merge(rest, () => ({
    type: "button" as const,
    "data-part": "trigger",
    get "aria-expanded"() {
      return scope.store.state.logical ? "true" : "false";
    },
    "aria-controls": scope.contentId,
    onClick: () => scope.toggle(),
    onPointerEnter: () => scope.scheduleHover(true),
    onPointerLeave: () => scope.scheduleHover(false),
    get class() {
      return css.cn(triggerClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <button {...part}>
      <span aria-hidden="true" class={chevronClass}>
        ▸
      </span>
      <span>{props.children}</span>
    </button>
  ));
};

/** The panel: `data-state` is the box and `hidden` its visibility, both from the same store frame. */
export const DisclosureAnimatedContent = (props: DisclosureAnimatedContentProps): JSX.Element => {
  const scope = useContext(ScopeContext);
  const rest = omit(props, "render", "class", "children");
  const state: DisclosureAnimatedContentState = {
    phase: () => scope.store.state.phase,
    visible: () => scope.view.visible,
  };
  const merged = merge(rest, () => ({
    id: scope.contentId,
    "data-part": "content",
    get "data-state"() {
      return scope.store.state.phase;
    },
    get hidden() {
      return !scope.view.visible;
    },
    ref: (element: HTMLDivElement) => {
      scope.attach(element);
    },
    get class() {
      return css.cn(contentClass, props.class);
    },
  }));
  return renderPart(props, merged, state, (part) => (
    <div {...part}>
      <div class={contentInnerClass}>{props.children}</div>
    </div>
  ));
};
