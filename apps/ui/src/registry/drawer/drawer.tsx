import { createDrawer, type Drawer as DrawerController, type DrawerSide } from "@cssints/headless";
import {
  type ConfigEvent,
  createMachine,
  defineMachine,
  type EffectHandle,
  type Machine,
  type Transition,
} from "@cssints/machine";
import { type MachineStore, createMachineStore } from "@cssints/machine/solid";
import { Portal } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import {
  type Accessor,
  createContext,
  createEffect,
  createUniqueId,
  merge,
  omit,
  onCleanup,
  Show,
  untrack,
  useContext,
} from "solid-js";

import { Button } from "../button/button.tsx";
import {
  createOverlayMotion,
  type OverlayMotion,
  type OverlayMotionPhase,
} from "../overlay-motion.ts";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface DrawerProps {
  /** Controlled: the host owns the open state and this is the only thing that changes it. */
  readonly open?: boolean;
  /** Open at mount; ignored while `open` is set. */
  readonly defaultOpen?: boolean;
  /** A request to change the open state: uncontrolled it is accepted, controlled the host may ignore it. */
  readonly onOpenChange?: (open: boolean) => void;
  /** The edge the panel is anchored to: a side rail, or the bottom sheet. @default "right" */
  readonly side?: DrawerSide;
  /** `aria-modal`, the Tab trap, the scroll lock and the backdrop (default `true`). */
  readonly modal?: boolean;
  /** A backdrop click or an outside press closes it (default `true`). */
  readonly dismissable?: boolean;
  /**
   * The panel enters and leaves on `@cssints/machine` (`closed`, `entering`, `open`, `leaving`) and the layer is
   * unmounted only at `closed`. The primitive still owns the open state and the whole APG contract; read once.
   */
  readonly animated?: boolean;
  /** The motion preference; left out, `prefers-reduced-motion: reduce` is read once. */
  readonly reducedMotion?: boolean;
  /** Every animation the layer starts, once, after `animate()`: a test pauses it and steps the timeline. */
  readonly onAnimate?: (animation: Animation) => void;
  readonly id?: string;
  /** The element the layer is portalled into (default `document.body`), for a host with its own overlay root. */
  readonly mount?: Element;
  readonly children?: JSX.Element;
}

export interface DrawerTriggerProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerContentProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerHeaderProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerTitleProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerBodyProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerFooterProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface DrawerHandleProps extends Renderable<PartProps, void> {
  readonly class?: string;
  /** Replaces the grip mark; the handle itself stays the drag's pointer surface. */
  readonly children?: JSX.Element;
}

export interface DrawerCloseProps {
  /** The accessible name of the icon button (default `"Close"`). */
  readonly label?: string;
  readonly class?: string;
  readonly children?: JSX.Element;
}

const DrawerContext = createContext<{
  readonly drawer: DrawerController;
  /** The title's id: the primitive puts it on `aria-labelledby`, so the panel is named by its heading. */
  readonly titleId: string;
  readonly mount: () => Element | undefined;
  readonly animated: boolean;
  readonly motion: OverlayMotion;
  readonly drag: SheetDrag;
}>();

// One positioned layer for the backdrop and the panel, out of the page's flow and over everything but a toast. It never takes
// the page's pointer itself: the panel turns that back on, and so does the backdrop when the drawer is modal.
const layerClass = css.cn(
  css.position("fixed"),
  css.inset("0"),
  // `z-index` takes an `<integer>`, which a `number` token is not: the class reads the token by hand, as the dialog's layer
  css.zIndex("var(--z-dialog)"),
  css.pointerEvents("none"),
);

const backdropClass = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.bg(t.color.scrim),
  css.pointerEvents("auto"),
);

// The panel is edge-anchored: a rail on the left or the right, or a sheet across the bottom. It stays in the DOM while closed
// and hides with `visibility` rather than the `hidden` attribute, so the slide can play both ways and the primitive can move
// the focus into it before the first open frame (a `display: none` panel cannot take the focus).
const panel = css.cv({
  base: css.cn(
    css.position("absolute"),
    css.display("flex"),
    css.flexDirection("column"),
    css.margin("0"),
    css.overflow("hidden"),
    css.pointerEvents("auto"),
    css.color(t.color.text),
    css.boxShadow(t.shadow.popover),
    // the panel takes the focus itself (`tabindex="-1"`) when it holds nothing focusable: a ring around the whole panel is noise
    css.outline("none"),
  ),
  variants: {
    side: {
      left: css.cn(
        css.top("0"),
        css.bottom("0"),
        css.left("0"),
        css.width("min(22rem, 100vw)"),
        css.maxWidth("100%"),
        css.bg(t.color.overlayBackground),
        css.borderInlineEnd("1px solid", t.color.overlayBorder),
      ),
      right: css.cn(
        css.top("0"),
        css.bottom("0"),
        css.right("0"),
        css.width("min(22rem, 100vw)"),
        css.maxWidth("100%"),
        css.bg(t.color.overlayBackground),
        css.borderInlineStart("1px solid", t.color.overlayBorder),
      ),
      // the sheet: full width, its top corners rounded and its own surface token, and a height the body scrolls inside
      bottom: css.cn(
        css.left("0"),
        css.right("0"),
        css.bottom("0"),
        css.width("100%"),
        css.maxHeight("85dvh"),
        css.bg(t.color.sheetBackground),
        css.borderTop("1px solid", t.color.overlayBorder),
        css.borderStartStartRadius(t.radius.xl),
        css.borderStartEndRadius(t.radius.xl),
      ),
    },
  },
  defaultVariants: { side: "right" },
});

// The slide reads one state off `data-state` (`right-open`, `bottom-closed`, ...), so exactly one rule matches and no two
// declarations of the same property compete: closed it is off screen and invisible, open it is in place. With reduced motion
// there is no transition, so `visibility` flips at once instead of waiting for a slide that does not happen.
const panelMotion = css.cn(
  css.visibility("hidden"),
  css.attr("data-state", "left-closed")(css.transform("translateX(-100%)")),
  css.attr("data-state", "right-closed")(css.transform("translateX(100%)")),
  css.attr("data-state", "bottom-closed")(css.transform("translateY(100%)")),
  css.attr("data-state", "left-open")(css.visibility("visible"), css.transform("none")),
  css.attr("data-state", "right-open")(css.visibility("visible"), css.transform("none")),
  css.attr("data-state", "bottom-open")(css.visibility("visible"), css.transform("none")),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.cn(
      css.transition("transform 200ms ease-out, visibility 0s"),
      css.attr(
        "data-state",
        "left-closed",
      )(css.transition("transform 200ms ease-out, visibility 0s linear 200ms")),
      css.attr(
        "data-state",
        "right-closed",
      )(css.transition("transform 200ms ease-out, visibility 0s linear 200ms")),
      css.attr(
        "data-state",
        "bottom-closed",
      )(css.transition("transform 200ms ease-out, visibility 0s linear 200ms")),
    ),
  ),
);

// The animated panel: the box's own ends and no CSS transition (the machine's animation covers the way between them).
// `closed` is the edge the panel is anchored to and is out of the page's hit area; `leaving` paints at the same end while
// the animation slides it there, and takes no clicks (a dismissed panel swallows none); `entering` and `open` are in
// place, which is the panel's own base.
const panelPhases = css.cn(
  css.attr("data-state", "left-closed")(
    css.visibility("hidden"),
    css.transform("translateX(-100%)"),
  ),
  css.attr("data-state", "right-closed")(
    css.visibility("hidden"),
    css.transform("translateX(100%)"),
  ),
  css.attr("data-state", "bottom-closed")(
    css.visibility("hidden"),
    css.transform("translateY(100%)"),
  ),
  css.attr("data-state", "left-leaving")(
    css.transform("translateX(-100%)"),
    css.pointerEvents("none"),
  ),
  css.attr("data-state", "right-leaving")(
    css.transform("translateX(100%)"),
    css.pointerEvents("none"),
  ),
  css.attr("data-state", "bottom-leaving")(
    css.transform("translateY(100%)"),
    css.pointerEvents("none"),
  ),
);

// The panel's track: `fraction` 0 is off the panel's own edge, 1 is in place, and a partial one is where a cancelled
// slide stopped.
const drawerFrame = (side: DrawerSide, fraction: number): Keyframe => {
  const out = (1 - fraction) * 100;
  const x = side === "left" ? -out : side === "right" ? out : 0;
  const y = side === "bottom" ? out : 0;
  return { transform: `translate(${x}%, ${y}%)` };
};

/** How far a sheet must be pulled down, in px, for a release to dismiss it. */
export const SHEET_DISMISS_DISTANCE = 96;
/** How fast it must be moving at the release, in px/ms, to dismiss it by a flick alone. */
export const SHEET_DISMISS_VELOCITY = 0.5;
/** A snap-back's duration: the finger has just left, so it is short. */
const SHEET_SETTLE_DURATION = 180;
/** The window a release's velocity is measured over. */
const SHEET_VELOCITY_WINDOW = 100;
/** A shorter interval than this is not a velocity: a burst of synthetic moves in one task would read as a flick. */
const SHEET_VELOCITY_FLOOR = 8;
// The snap-back is linear, like the overlay's slide, so a grab can read the sheet's position off the animation's
// `currentTime` and continue from it.
const SHEET_SETTLE_EASING = "linear";

/** The drag's three states: at rest, the finger is down, or the sheet is going back to 0. */
export type SheetDragPhase = "rest" | "dragging" | "settling";

/** The drag machine's context: where the sheet is, how fast, and the motion preference it started with. */
export interface SheetDragContext {
  /** How far the sheet is pulled down, in px from the open position. Never below 0. */
  readonly offset: number;
  /** The last measured velocity, in px/ms downward. */
  readonly velocity: number;
  /** `prefers-reduced-motion: reduce` (or the override) when the machine was built; the host also reads the live one. */
  readonly reduced: boolean;
}

// a type alias, not an interface: `PayloadMap` is an index signature, and only an alias is assignable to one
type SheetDragPayloads = {
  readonly grab: { readonly offset: number };
  readonly move: { readonly offset: number };
  readonly release: { readonly velocity: number };
  readonly cancel: undefined;
  readonly reset: undefined;
  readonly finish: { readonly id: number };
};

/** The drag's events: the pointer's, the keyboard's, and an effect's completion. */
export type SheetDragEvent =
  | { readonly type: "grab"; readonly offset: number }
  | { readonly type: "move"; readonly offset: number }
  | { readonly type: "release"; readonly velocity: number }
  | { readonly type: "cancel" }
  | { readonly type: "reset" }
  | { readonly type: "finish"; readonly id: number };

/** The running drag machine, as the drawer and its tests name it. */
export type SheetDragMachine = Machine<SheetDragContext, SheetDragPhase, SheetDragEvent>;

type SheetDragConfig = ConfigEvent<SheetDragPayloads>;

/** A pulled-up drag stops at the open position: rubber-band overscroll is not modelled. */
const pulled = (offset: number): number => (offset > 0 ? offset : 0);

const offsetOf = (event: SheetDragConfig): number =>
  event.type === "grab" || event.type === "move" ? pulled(event.offset) : 0;

const velocityOf = (event: SheetDragConfig): number =>
  event.type === "release" ? event.velocity : 0;

// The release decides: past the distance, or a fast enough downward flick, and the sheet is dismissed. Both numbers are
// the machine's, so the harness can prove a flick without a browser and the host never re-checks them.
const dismisses = (context: SheetDragContext, velocity: number): boolean =>
  context.offset >= SHEET_DISMISS_DISTANCE || velocity >= SHEET_DISMISS_VELOCITY;

// A release below the threshold, or an Escape, puts the sheet back: one step under reduced motion, an effect the host
// runs on `element.animate` otherwise. `offset` stays in the context while `settling`, so the host reads the effect's
// `from` off the machine — a literal in the spec would need one transition per pixel.
const back = (): readonly Transition<SheetDragContext, SheetDragConfig>[] => [
  {
    guard: (context) => context.reduced || context.offset === 0,
    target: "rest",
    assign: (_context, event) => ({ offset: 0, velocity: velocityOf(event) }),
  },
  {
    target: "settling",
    assign: (_context, event) => ({ velocity: velocityOf(event) }),
    effect: { type: "settle", to: 0 },
  },
];

/**
 * The drag protocol of one bottom sheet, composed with `createOverlayMotion` rather than replacing it: the overlay owns
 * the open/closed box and its leave, this owns the finger. `rest`, `dragging`, `settling`; a release past
 * `SHEET_DISMISS_DISTANCE` or `SHEET_DISMISS_VELOCITY` issues a `dismiss` effect (the host asks the primitive to close,
 * so the leave is the overlay machine's and there is one leave), everything else settles back to 0. `cancel` is Escape
 * and runs the snap-back; `reset` is the overlay no longer being open, so the drag is dropped without a second
 * animation. A grab while `settling` cancels that effect and continues from the position the host hands it
 * (`ReversalKeepsPosition`), and a cancelled settle's late `finish` is dropped by its dead id
 * (`CancelledFinishIgnored`). No debounce: `dragging` has one live move stream, and `settling` has no transition that a
 * burst could duplicate — the state is the coalescer.
 */
export const bottomSheetDragDefinition = (reduced: boolean) =>
  defineMachine<SheetDragPayloads>()({
    start: "rest",
    initial: { offset: 0, velocity: 0, reduced },
    states: {
      rest: {
        on: {
          grab: {
            target: "dragging",
            assign: (_context, event) => ({ offset: offsetOf(event), velocity: 0 }),
          },
          cancel: { target: "rest", assign: { offset: 0, velocity: 0 } },
          reset: { target: "rest", assign: { offset: 0, velocity: 0 } },
        },
      },
      dragging: {
        on: {
          move: {
            target: "dragging",
            assign: (_context, event) => ({ offset: offsetOf(event) }),
          },
          release: [
            {
              guard: (context, event) =>
                event.type === "release" && dismisses(context, event.velocity),
              target: "rest",
              assign: (_context, event) => ({ offset: 0, velocity: velocityOf(event) }),
              effect: { type: "dismiss" },
            },
            ...back(),
          ],
          cancel: back(),
          reset: { target: "rest", assign: { offset: 0, velocity: 0 } },
        },
      },
      settling: {
        on: {
          finish: { target: "rest", assign: { offset: 0, velocity: 0 } },
          grab: {
            target: "dragging",
            assign: (_context, event) => ({ offset: offsetOf(event), velocity: 0 }),
          },
          // a second Escape and a second release while the snap-back runs are not transitions: once the finger is up
          // the sheet is going back, and dropping them is the coalescer
          reset: { target: "rest", assign: { offset: 0, velocity: 0 } },
        },
      },
    },
  });

/** What the host needs: the primitive's open state, the overlay's box and preference, and its close request. */
export interface SheetDragOptions {
  /** The drag exists: an animated bottom sheet. A side rail has no downward drag, and a static sheet keeps its CSS. */
  readonly enabled: Accessor<boolean>;
  /** The primitive's open state: while it is false the drag is reset, not left halfway. */
  readonly open: Accessor<boolean>;
  /** The overlay's box: a grab is taken only once the sheet is `open`, not while it enters. */
  readonly phase: Accessor<OverlayMotionPhase>;
  /** The overlay's motion preference, live: the host skips its animation when it is on. */
  readonly reduced: Accessor<boolean>;
  /** A dismissal asks the primitive for the close, so the leave is the overlay machine's, not a second one. */
  readonly close: () => void;
  /** Every animation the drag starts (a snap-back), once: a test pauses it and steps the timeline. */
  readonly onAnimate?: ((animation: Animation) => void) | undefined;
}

/** The drag as the drawer's parts read it: a phase, an offset, and the handle's pointer props. */
export interface SheetDrag {
  readonly machine: SheetDragMachine;
  readonly store: MachineStore<SheetDragContext, SheetDragPhase, SheetDragEvent>;
  /** The handle is live: an animated bottom sheet. */
  readonly enabled: Accessor<boolean>;
  /** The finger is down: the cursor is `grabbing` and Escape is the drag's, not the drawer's. */
  readonly dragging: Accessor<boolean>;
  readonly attach: (element: HTMLElement | undefined) => void;
  /**
   * Where a dismissal left the box, as a fraction of the panel (1 open, 0 off the edge), for the overlay's leave to
   * start from. Read once: a refused close then has nothing left behind.
   */
  readonly current: () => number | undefined;
  /** The grab handle's pointer props. Decorative for readers: the keyboard path stays the primitive's. */
  readonly handleProps: {
    readonly onPointerDown: (event: PointerEvent) => void;
    readonly onPointerMove: (event: PointerEvent) => void;
    readonly onPointerUp: (event: PointerEvent) => void;
    readonly onPointerCancel: (event: PointerEvent) => void;
  };
}

interface LiveSettle {
  /** The machine's handle, or `undefined` for the snap-back after a refused close. */
  readonly handle: EffectHandle | undefined;
  readonly animation: Animation;
  readonly from: number;
  readonly to: number;
  readonly duration: number;
}

interface Sample {
  readonly at: number;
  readonly y: number;
}

/**
 * Run the drag of one bottom sheet. Call it in a component body, beside `createOverlayMotion`: the store belongs to the
 * component, the pointer props go on the grab handle, and disposing it destroys the machine.
 *
 * The offset is written to the panel as the `translate` property, not `transform`: the overlay's slide animates
 * `transform`, so a drag and a leave never race for one declaration. The grab handle is the only pointer surface — the
 * body keeps `overflow-y: auto` and its own scroll.
 */
export const createSheetDrag = (options: SheetDragOptions): SheetDrag => {
  const machine: SheetDragMachine = createMachine(
    bottomSheetDragDefinition(untrack(() => options.reduced())),
  );
  const store = createMachineStore(machine);

  let panel: HTMLElement | undefined;
  /** The running snap-back, or `undefined` at rest. */
  let live: LiveSettle | undefined;
  /** Where the finger went down, and the offset the sheet was at then (a grab during the snap-back). */
  let origin: { readonly y: number; readonly offset: number } | undefined;
  let samples: Sample[] = [];
  /** The offset at the release, read before the dismissal resets it. */
  let released = 0;
  /** A dismissal's fraction for the overlay's leave; read once by `current()`. */
  let handoff: number | undefined;

  const reduced = (): boolean => untrack(() => options.reduced());

  const positionOf = (settle: LiveSettle): number => {
    const time = Number(settle.animation.currentTime ?? 0);
    const fraction = settle.duration === 0 ? 0 : Math.min(1, Math.max(0, time / settle.duration));
    return settle.from + (settle.to - settle.from) * fraction;
  };

  const animateBack = (from: number, handle: EffectHandle | undefined): void => {
    const element = panel;
    if (element === undefined || from === 0 || reduced()) {
      // no motion asked for, or nothing to move: the same one-step landing, and the finish is a microtask so the
      // transition is still one delivery
      queueMicrotask(() => {
        if (handle !== undefined) {
          machine.send({ type: "finish", id: handle.id });
        }
      });
      return;
    }
    // the animation is the position now; `fill: none` because the rest state is `translate: none` (the store's write)
    element.style.translate = "";
    const animation = element.animate([{ translate: `0px ${from}px` }, { translate: "0px 0px" }], {
      duration: SHEET_SETTLE_DURATION,
      easing: SHEET_SETTLE_EASING,
      fill: "none",
    });
    // the ends, for a test that steps the timeline; `settle:` tells a snap-back from the overlay's own slide
    animation.id = `settle:${from}:0`;
    const settle: LiveSettle = {
      handle,
      animation,
      from,
      to: 0,
      duration: SHEET_SETTLE_DURATION,
    };
    live = settle;
    options.onAnimate?.(animation);
    const done = (): void => {
      if (live?.animation === animation) {
        live = undefined;
      }
      animation.cancel();
      // a completion, and a cancelled animation's own late one: the machine drops the latter by its id
      if (handle !== undefined) {
        machine.send({ type: "finish", id: handle.id });
      }
    };
    animation.finished.then(done, done);
  };

  // A dismissal is the overlay's, not a second leave: hand the box's fraction over, ask the primitive to close, and if
  // the request was refused (a controlled host) put the sheet back where the finger left it instead of leaving it
  // halfway. The refusal is one microtask later, after the overlay's own follow has run.
  const dismiss = (px: number): void => {
    const height = panel?.getBoundingClientRect().height ?? 0;
    handoff = height > 0 ? Math.min(1, Math.max(0, 1 - px / height)) : 0;
    options.close();
    queueMicrotask(() => {
      if (options.open()) {
        handoff = undefined;
        animateBack(px, undefined);
      }
    });
  };

  const offEffect = machine.onEffect((handle) => {
    if (handle.type === "dismiss") {
      dismiss(released);
      return;
    }
    animateBack(machine.getState().context.offset, handle);
  });

  const offCancel = machine.onCancel((handle) => {
    if (live?.handle?.id !== handle.id) {
      return;
    }
    const cancelled = live;
    live = undefined;
    cancelled.animation.cancel();
  });

  // The offset is the machine's, and it is the one thing the panel's `translate` reads. One store write per move, and a
  // reader of the phase does not re-run for it.
  createEffect(
    () => store.state.offset,
    (offset) => {
      const element = panel;
      if (element === undefined) {
        return;
      }
      element.style.translate = offset === 0 ? "" : `0px ${offset}px`;
    },
  );

  // The overlay is closed (or closing): the drag is done. A microtask, because a machine send writes the store and an
  // effect runs in an owned scope, where a Solid store refuses a write.
  createEffect(
    () => options.open(),
    (open) => {
      if (open) {
        return;
      }
      queueMicrotask(() => {
        if (!options.open()) {
          // the overlay's leave (if a dismissal asked for one) reads `current()` before this microtask: created first,
          // queued first. `handoff` is not cleared here, so a host that accepts the close on a later turn still starts
          // its leave where the drag left the sheet; `current()` and the refusal path are what clear it.
          machine.send({ type: "reset" });
        }
      });
    },
  );

  const pointerDown = (event: PointerEvent): void => {
    if (!options.enabled() || !options.open() || options.phase() !== "open" || event.button !== 0) {
      return;
    }
    const target = event.currentTarget;
    if (target instanceof Element) {
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // a synthetic pointer (a test, assistive technology) is not an active pointer: nothing to capture
      }
    }
    // a grab during the snap-back continues from the running animation's position, not from its start. The machine is
    // read, not its store: a store write is flushed, and a pointer sequence arrives in one task
    const at = live === undefined ? machine.getState().context.offset : positionOf(live);
    if (live !== undefined) {
      live.animation.cancel();
      live = undefined;
    }
    origin = { y: event.clientY, offset: at };
    samples = [{ at: event.timeStamp, y: event.clientY }];
    machine.send({ type: "grab", offset: at });
  };

  const pointerMove = (event: PointerEvent): void => {
    if (origin === undefined || machine.getState().state !== "dragging") {
      return;
    }
    machine.send({ type: "move", offset: origin.offset + event.clientY - origin.y });
    samples.push({ at: event.timeStamp, y: event.clientY });
    while (samples.length > 1) {
      const head = samples[0];
      if (head === undefined || event.timeStamp - head.at <= SHEET_VELOCITY_WINDOW) {
        break;
      }
      samples.shift();
    }
  };

  const pointerUp = (event: PointerEvent): void => {
    if (origin === undefined) {
      return;
    }
    origin = undefined;
    const head = samples[0];
    const tail = samples.at(-1);
    const elapsed = head === undefined || tail === undefined ? 0 : tail.at - head.at;
    // a pointer that rested before it lifted has no velocity; a burst of synthetic moves in one millisecond is no sample
    // either, so the timestamps decide, not the distance alone
    const age = tail === undefined ? Number.POSITIVE_INFINITY : event.timeStamp - tail.at;
    const velocity =
      age <= SHEET_VELOCITY_WINDOW &&
      elapsed > SHEET_VELOCITY_FLOOR &&
      head !== undefined &&
      tail !== undefined
        ? (tail.y - head.y) / elapsed
        : 0;
    samples = [];
    released = machine.getState().context.offset;
    machine.send({ type: "release", velocity });
  };

  const pointerCancel = (): void => {
    origin = undefined;
    samples = [];
    machine.send({ type: "cancel" });
  };

  onCleanup(() => {
    offEffect();
    offCancel();
    live?.animation.cancel();
    live = undefined;
    machine.destroy();
  });

  return {
    machine,
    store,
    enabled: () => options.enabled(),
    dragging: () => store.state.phase === "dragging",
    attach: (element) => {
      panel = element;
      if (element === undefined) {
        live?.animation.cancel();
        live = undefined;
      }
    },
    current: () => {
      const fraction = handoff;
      handoff = undefined;
      return fraction;
    },
    handleProps: {
      onPointerDown: pointerDown,
      onPointerMove: pointerMove,
      onPointerUp: pointerUp,
      onPointerCancel: pointerCancel,
    },
  };
};

const handleClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.height(t.space._6),
  css.flex("none"),
  css.touchAction("none"),
  css.userSelect("none"),
  css.cursor("grab"),
  css.attr("data-dragging", "true")(css.cursor("grabbing")),
);

const gripClass = css.cn(
  css.width(t.space._8),
  css.height("4px"),
  css.borderRadius("999px"),
  css.bg(t.color.border),
);

const headerClass = css.cn(
  css.display("flex"),
  css.alignItems("start"),
  css.justifyContent("space-between"),
  css.gap(t.space._3),
  css.padding(t.space._4),
  css.borderBottom("1px solid", t.color.overlayBorder),
  css.flex("none"),
);

const titleClass = css.cn(
  css.margin("0"),
  css.fontSize(t.font.sizeLg),
  css.fontWeight("600"),
  css.color(t.color.text),
);

const closeClass = css.cn(
  css.appearance("none"),
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.width(t.space._6),
  css.height(t.space._6),
  css.margin("0"),
  css.padding("0"),
  css.border("none"),
  css.borderRadius(t.radius.sm),
  css.bg("transparent"),
  css.color(t.color.muted),
  css.fontSize(t.font.sizeLg),
  css.lineHeight(1),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackground), css.color(t.color.text)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const bodyClass = css.cn(
  css.flex("1 1 auto"),
  css.overflowY("auto"),
  css.overscrollBehavior("contain"),
  css.padding(t.space._4),
  css.fontSize(t.font.size),
  css.color(t.color.text),
);

const footerClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("end"),
  css.gap(t.space._2),
  css.padding(t.space._4),
  css.borderTop("1px solid", t.color.overlayBorder),
  css.flex("none"),
);

/**
 * A drawer or bottom sheet, styled: `Drawer.Trigger` opens a panel on the edge of the viewport. `createDrawer` owns the open
 * state (controlled by `open`), the ARIA, the focus into the panel and back to whatever opened it, the Tab cycle, Escape, the
 * backdrop, the outside press and the page's scroll lock; the kit adds the three edges, the slide, the surface and the slots.
 *
 * The panel is named by `DrawerTitle` (`aria-labelledby`) and closes from a `DrawerClose` in its header, the backdrop, Escape
 * or the trigger. `side` and `modal` are the whole presentation switch: `{ side: "bottom" }` is the sheet, a rail is
 * `{ side: "right" }`, and a non-modal rail (`modal={false}`) keeps the page's scroll, focus and clicks.
 */
export const Drawer = (props: DrawerProps): JSX.Element => {
  // the heading names the panel: the id is made here, because `createDrawer` needs it at creation time
  const titleId = createUniqueId();
  const drawer = createDrawer({
    id: props.id,
    get open() {
      return props.open;
    },
    defaultOpen: props.defaultOpen,
    get side() {
      return props.side;
    },
    get modal() {
      return props.modal;
    },
    get dismissable() {
      return props.dismissable;
    },
    labelledby: titleId,
    get onOpenChange() {
      return props.onOpenChange;
    },
  });
  const mount = () => props.mount;
  const animated = untrack(() => props.animated) === true;
  const motion = createOverlayMotion({
    animated,
    open: () => drawer.open(),
    frame: (fraction) => drawerFrame(drawer.side(), fraction),
    get reducedMotion() {
      return props.reducedMotion;
    },
    get onAnimate() {
      return props.onAnimate;
    },
    // the sheet's drag leaves the box part-way down, so a dismissal's leave starts there, not at the open end
    current: () => drag.current(),
  });
  // The bottom sheet's drag is the kit's, not the primitive's: it starts from the grab handle only, so the panel's body
  // keeps its scroll. A side rail has no downward drag, and a static sheet keeps its CSS transition.
  const drag = createSheetDrag({
    enabled: () => animated && drawer.side() === "bottom",
    open: () => drawer.open(),
    phase: () => motion.phase(),
    reduced: () => motion.machine.getState().context.reduced,
    close: () => {
      if (drawer.open()) {
        // the primitive's own close channel: a controlled host may refuse it, and the drag puts the sheet back
        drawer.triggerProps.onClick();
      }
    },
    get onAnimate() {
      return props.onAnimate;
    },
  });

  // Escape during a drag is the drag's, not the drawer's: the snap-back must run and the overlay must stay open. The
  // primitive listens on the document in capture phase and registers when it opens, so this one — registered here,
  // before any open — sees the key first and stops it there. With no finger down it does nothing and the primitive's
  // Escape is unchanged.
  const onDragEscape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || drag.machine.getState().state !== "dragging") {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    drag.machine.send({ type: "cancel" });
  };
  document.addEventListener("keydown", onDragEscape, true);
  onCleanup(() => document.removeEventListener("keydown", onDragEscape, true));

  return (
    <DrawerContext value={{ drawer, titleId, mount, animated, motion, drag }}>
      {props.children}
    </DrawerContext>
  );
};

/** The button that opens the drawer: `Button` unless `render` says otherwise. It is the element with `aria-haspopup`. */
export const DrawerTrigger = (props: DrawerTriggerProps): JSX.Element => {
  const { drawer } = useContext(DrawerContext);
  const rest = omit(props, "render", "class", "children");
  // no `data-part` of its own: the part renders a `Button` by default, and the button owns the attribute, as `Dialog` does
  const merged = merge(rest, drawer.triggerProps, () => ({
    get class() {
      return css.cn(props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children}</Button>
  ));
};

/**
 * The panel and the wash under it, portalled into `document.body` (or `mount`) so an ancestor's `transform`, `filter`,
 * `contain` or `overflow` can neither clip the layer nor become the containing block of its `position: fixed`.
 *
 * With `animated` the layer is mounted only while the box is not `closed` (or while the primitive is open and the box has
 * yet to follow it), so the slide out is played before the panel leaves the page; `data-state` is `<side>-<phase>` and
 * the panel keeps no `hidden` attribute (a panel cut from the page mid-slide is the frame `Atomic` rules out). Without
 * it, the panel stays mounted and the CSS transition follows the primitive's open state.
 */
export const DrawerContent = (props: DrawerContentProps): JSX.Element => {
  const { drawer, mount, animated, motion, drag } = useContext(DrawerContext);
  const merged = merge(omit(props, "render", "class", "children"), drawer.contentProps, () => ({
    "data-part": "drawer",
    get "data-side"() {
      return drawer.side();
    },
    get "data-state"() {
      return `${drawer.side()}-${animated ? motion.phase() : drawer.open() ? "open" : "closed"}`;
    },
    // the drag's own field: a reader of the phase is not re-run by a pointer move, and the offset reaches the panel
    // through `translate` (the host's effect), never the overlay's `transform`
    get "data-drag-state"() {
      return drag.store.state.phase;
    },
    // the panel hides with `visibility` (panelMotion, panelPhases), not with `hidden`: the primitive's attribute would cut
    // the slide, make the panel unfocusable at the moment the focus moves into it, and take a leaving panel off the page
    hidden: false,
    get class() {
      return css.cn(
        panel({ side: drawer.side() }),
        animated ? panelPhases : panelMotion,
        props.class,
      );
    },
  }));
  return (
    <Show when={!animated || motion.visible()}>
      <Portal mount={mount()}>
        <div data-part="drawer-layer" class={layerClass}>
          <div {...drawer.backdropProps} data-part="drawer-backdrop" class={backdropClass} />
          {renderPart(props, merged, undefined, (part) => (
            <div
              {...part}
              ref={(element: HTMLDivElement) => {
                motion.attach(element);
                drag.attach(element);
              }}
            >
              {props.children}
            </div>
          ))}
        </div>
      </Portal>
    </Show>
  );
};

/**
 * The grab handle at the top of a bottom sheet: a grip mark a reader can pull down. It exists only for an animated sheet
 * (`side="bottom"` and `animated`), and it is the only pointer surface of the drag — the panel's body keeps its scroll.
 * Decorative for assistive technology (`aria-hidden`): the keyboard path is the primitive's Escape and `Drawer.Close`.
 */
export const DrawerHandle = (props: DrawerHandleProps): JSX.Element => {
  const { drag } = useContext(DrawerContext);
  const merged = merge(omit(props, "render", "class", "children"), drag.handleProps, () => ({
    "data-part": "drawer-handle",
    "aria-hidden": "true" as const,
    get "data-dragging"() {
      return drag.dragging() ? "true" : undefined;
    },
    get class() {
      return css.cn(handleClass, props.class);
    },
  }));
  return (
    <Show when={drag.enabled()}>
      {renderPart(props, merged, undefined, (part) => (
        <div {...part}>{props.children ?? <span aria-hidden="true" class={gripClass} />}</div>
      ))}
    </Show>
  );
};

/** The top of the panel: the title and the close button. */
export const DrawerHeader = (props: DrawerHeaderProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "drawer-header",
      get class() {
        return css.cn(headerClass, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The panel's visible heading, and the name the primitive points `aria-labelledby` at. */
export const DrawerTitle = (props: DrawerTitleProps): JSX.Element => {
  const { titleId } = useContext(DrawerContext);
  return renderPart(
    props,
    {
      id: titleId,
      "data-part": "drawer-title",
      get class() {
        return css.cn(titleClass, props.class);
      },
    },
    undefined,
    (part) => <h2 {...part}>{props.children}</h2>,
  );
};

/** The panel's body: the only part that scrolls when the content is taller than the edges allow. */
export const DrawerBody = (props: DrawerBodyProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "drawer-body",
      get class() {
        return css.cn(bodyClass, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The panel's footer: actions, against the bottom edge. */
export const DrawerFooter = (props: DrawerFooterProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "drawer-footer",
      get class() {
        return css.cn(footerClass, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The close control in the header: a small icon button with an accessible name. */
export const DrawerClose = (props: DrawerCloseProps): JSX.Element => {
  const { drawer } = useContext(DrawerContext);
  return (
    <button
      type="button"
      data-part="drawer-close"
      class={css.cn(closeClass, props.class)}
      aria-label={props.label ?? "Close"}
      onClick={() => {
        // the trigger's handler toggles, which is a close while the drawer is open
        if (drawer.open()) {
          drawer.triggerProps.onClick();
        }
      }}
    >
      {props.children ?? <span aria-hidden="true">×</span>}
    </button>
  );
};
