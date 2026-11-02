import { type Toast as ToastController, type ToastItem as ToastMessage } from "@cssints/headless";
import {
  type ConfigEvent,
  createMachine,
  defineMachine,
  type EffectHandle,
  type Machine,
  type TransitionList,
} from "@cssints/machine";
import { createMachineStore } from "@cssints/machine/solid";
import { Portal } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, For, merge, onCleanup, Show } from "solid-js";

import { type PartProps, renderPart, type Render, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** One row's phases: the box entering, at rest, on its way out, and the step past it that unmounts the row. */
export type ToastPhase = "entering" | "visible" | "leaving" | "gone";

/** How long a row's enter and leave take when the motion preference allows one. */
export const TOAST_ENTER_MS = 160;
export const TOAST_LEAVE_MS = 120;

/** The row machine's context: the motion preference it was built with. */
export interface ToastRowContext {
  readonly reduced: boolean;
}

// a type alias, not an interface: `PayloadMap` is an index signature, and only an alias is assignable to one
type ToastRowPayloads = {
  readonly dismiss: undefined;
  readonly finish: { readonly id: number };
};

/** The row machine's events: a dismissal, and the completion of the animation an effect started. */
export type ToastRowEvent =
  | { readonly type: "dismiss" }
  | { readonly type: "finish"; readonly id: number };

type ToastRowMachine = Machine<ToastRowContext, ToastPhase, ToastRowEvent>;

type Config = ConfigEvent<ToastRowPayloads>;

// A dismissal lands at once for a reader who asked for no motion, and otherwise runs the leave effect. There is no
// debounce: `leaving` accepts no `dismiss`, so the second intent of a burst — the timeout after the close button, or a
// second click — is dropped by the state the first one entered, and the leave is neither restarted nor delayed.
const leave = (reduced: boolean): TransitionList<ToastRowContext, Config> =>
  reduced ? { target: "gone" } : { target: "leaving", effect: { type: "leave" } };

/**
 * The row's lifecycle: `entering` (the enter effect runs) → `visible` → `leaving` (the leave effect runs) → `gone`. A
 * `dismiss` in `entering` leaves from the phase it is in, so the box reverses from where it is; a `finish` that carries a
 * cancelled effect's id is dropped by the machine, never by this component. `gone` is the row's last state: the stack
 * removes it and the primitive finally dismisses the toast.
 */
export const toastRowMachine = (reduced: boolean) =>
  defineMachine<ToastRowPayloads>()({
    start: reduced ? "visible" : "entering",
    initial: { reduced },
    states: {
      entering: {
        effect: [{ type: "enter" }],
        on: {
          dismiss: leave(reduced),
          finish: { target: "visible" },
        },
      },
      visible: {
        on: {
          dismiss: leave(reduced),
        },
      },
      leaving: {
        on: {
          finish: { target: "gone" },
        },
      },
      gone: {},
    },
  });

/** What the region's `render` gets: the landmark's props, `data-part` and the caller's class merged in. */
export type ToasterPartProps = PartProps;

/** What one row's `render` gets: the live region's props, `data-part`, the tone, and the caller's class. */
export type ToastPartProps = PartProps;

export interface ToasterProps extends Renderable<ToasterPartProps, void> {
  /** The queue the page holds: `createToast()` from `@cssints/headless`. */
  readonly toast: ToastController;
  /** The element the stack is portalled into (default `document.body`), for a host with its own overlay root. */
  readonly mount?: Element;
  /** One row's element, for every toast: the item part's `render`, passed down. */
  readonly renderItem?: Render<ToastPartProps, ToastMessage> | undefined;
  /** The motion preference; left out, `prefers-reduced-motion: reduce` is read once, when a row is created. */
  readonly reducedMotion?: boolean | undefined;
  /** Every animation a row starts, so a test can own the timeline (as the kit's other animated parts allow). */
  readonly onAnimate?: ((animation: Animation) => void) | undefined;
  readonly class?: string;
}

export interface ToastProps extends Renderable<ToastPartProps, ToastMessage> {
  readonly toast: ToastController;
  /** The toast the primitive queued: its title, description, tone and id. */
  readonly item: ToastMessage;
  readonly reducedMotion?: boolean | undefined;
  readonly onAnimate?: ((animation: Animation) => void) | undefined;
  readonly class?: string;
}

// The stack sits in the viewport's bottom end corner and never takes a click of its own: with nothing in the queue it is an
// empty, still box over the page, so it is transparent to the pointer and each row turns it back on. The corner is the
// inline end of the writing mode, and the inset is a token so a dense screen grows it with everything else.
//
// There is no `gap`: the space between rows is each row's own block margin, so it is part of the box the leave collapses
// and the enter grows. A container gap would survive the row's collapse and jump the stack by its width when the row was
// unmounted.
const regionClass = css.cn(
  css.position("fixed"),
  css.insetBlockEnd(t.space._4),
  css.insetInlineEnd(t.space._4),
  // `z-index` takes an `<integer>`, which a `number` token is not: the class reads the token by hand, as the dialog's layer
  css.zIndex("var(--z-toast)"),
  css.display("flex"),
  css.flexDirection("column"),
  css.alignItems("stretch"),
  css.width("min(24rem, calc(100vw - 2 * 16px))"),
  css.pointerEvents("none"),
);

// The row is painted at rest and its phases are the machine's: `entering` starts transparent, `leaving` is headed to
// transparent, and the WAAPI animation the machine's effect runs covers the way between the row's own box and the state's —
// the box's block size, its padding and border on that axis, its own block margin (the stack's spacing) and its opacity.
// The CSS is the animation's opacity ends, so a row with no animation (reduced motion, or a frame before it starts) is
// already at the right end and never flashes; the box is the animation's alone, because a zero block size in CSS would still
// leave the padding and the border behind.
//
// The tone is one rule on the leading edge: the theme has an invalid colour and one accent, so `success` takes the accent
// and `info` the plain border. The row names the tone it was queued with (`data-tone`), which is the primitive's own
// `item.tone`; the `error` row is also `role="alert"`, and the title follows it through `within()`.
const toast = css.cv({
  base: css.cn(
    // the marker `within()` reads, so a part inside the row can follow the tone without a prop of its own
    css.group("toast"),
    css.pointerEvents("auto"),
    css.display("grid"),
    css.gridTemplateColumns("minmax(0, 1fr) auto"),
    css.gridTemplateAreas('"title close" "description close"'),
    css.columnGap(t.space._2),
    css.alignItems("start"),
    css.boxSizing("border-box"),
    // the space this row owns in the stack, collapsed with the box: `block-size: 0` alone would leave it behind and the
    // stack would jump when the row was unmounted
    css.marginBlockStart(t.space._2),
    // the content must not spill out of a box that is being collapsed through zero
    css.overflow("clip"),
    css.padding(t.space._3),
    css.border("1px solid", "transparent"),
    css.borderInlineStartWidth(t.space._1),
    css.borderRadius(t.radius.lg),
    css.bg(t.color.overlayBackground),
    css.color(t.color.text),
    css.boxShadow(t.shadow.popover),
    css.fontSize(t.font.size),
    // `visible` is the resting look; the two transient phases are the fade's ends, and `gone` is never painted
    css.attr("data-state", "entering")(css.opacity(0)),
    css.attr("data-state", "leaving")(css.opacity(0)),
  ),
  variants: {
    tone: {
      info: css.cn(css.borderInlineStartColor(t.color.border)),
      success: css.cn(css.borderInlineStartColor(t.color.highlight)),
      error: css.cn(css.borderInlineStartColor(t.color.invalid)),
    },
  },
  defaultVariants: { tone: "info" },
});

const titleClass = css.cn(
  css.gridArea("title"),
  css.margin("0"),
  css.fontWeight("500"),
  css.lineHeight(1.4),
  css.overflowWrap("anywhere"),
  css.within(css.attr("data-tone", "error"), "toast")(css.color(t.color.invalid)),
);

const descriptionClass = css.cn(
  css.gridArea("description"),
  css.margin("0"),
  css.color(t.color.muted),
  css.lineHeight(1.5),
  css.overflowWrap("anywhere"),
);

// A glyph with a label, as the primitive's docs ask: `aria-atomic` reads the row's whole text, and a whole word here would
// be announced with every message. The label stays short for the same reason.
const closeClass = css.cn(
  css.gridArea("close"),
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

/**
 * APG alert / status, styled as a stack: `createToast` owns the queue, one timer per toast, the hover and focus pause, the
 * ceiling and the live region each row is; `Toaster` is the `role="region"` landmark those rows live in, portalled into
 * `document.body` (or `mount`) so a `transform` or `overflow` ancestor can neither clip the stack nor become the
 * containing block of its `position: fixed`.
 *
 * The page holds the controller (`const toast = createToast()`), pushes with `toast.show(...)` and renders one
 * `<Toaster toast={toast} />`; the stack is always in the DOM and empty when there is nothing to say. The queue's
 * countdown asks the row to leave (`onDismissRequest`) rather than removing it, so the row animates out and the primitive
 * dismisses it only when the machine reaches `gone`; `toast.dismiss(id)` still removes at once, and a paused countdown is
 * the row's `:hover` / `:focus-within`, not a class.
 */
export const Toaster = (props: ToasterProps): JSX.Element => {
  // `tabindex="-1"`: the region is the F6 target the primitive's docs describe, focusable by the host's handler and not a
  // stop of the page's tab order.
  const own = {
    "data-part": "toast-region",
    tabindex: "-1",
    get class() {
      return css.cn(regionClass, props.class);
    },
  } as PartProps;
  return renderPart(props, merge(props.toast.regionProps, own), undefined, (part) => (
    <Portal mount={props.mount}>
      <div {...part}>
        <For each={props.toast.toasts()}>
          {(item) => (
            <Toast
              toast={props.toast}
              item={item}
              render={props.renderItem}
              reducedMotion={props.reducedMotion}
              onAnimate={props.onAnimate}
            />
          )}
        </For>
      </div>
    </Portal>
  ));
};

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The animation a row is running, with the handle the machine issued for it. */
interface LiveRow {
  readonly handle: EffectHandle;
  readonly animation: Animation;
  readonly duration: number;
}

/**
 * The row's rest box, read from the DOM before its animation starts: the block size it grows to, and the padding, border
 * and margin on that axis the collapse has to take with it. `box-sizing: border-box` floors a zero block size at the
 * padding and the border, and the space between rows is the row's own block margin, so animating the size alone would
 * leave a strip of the row behind and the stack would jump by it at the unmount.
 */
interface RowBox {
  readonly blockSize: number;
  readonly paddingBlockStart: number;
  readonly paddingBlockEnd: number;
  readonly borderBlockStartWidth: number;
  readonly borderBlockEndWidth: number;
  readonly marginBlockStart: number;
}

const length = (value: string): number => {
  const size: number = Number.parseFloat(value);
  return Number.isNaN(size) ? 0 : size;
};

/** The row's rest box: the row is painted at it, so one synchronous read gives every end of the animation. */
const boxOf = (element: HTMLElement): RowBox => {
  const style = getComputedStyle(element);
  return {
    blockSize: element.getBoundingClientRect().height,
    paddingBlockStart: length(style.paddingBlockStart),
    paddingBlockEnd: length(style.paddingBlockEnd),
    borderBlockStartWidth: length(style.borderBlockStartWidth),
    borderBlockEndWidth: length(style.borderBlockEndWidth),
    marginBlockStart: length(style.marginBlockStart),
  };
};

/**
 * The row's box at a fraction of its height: `0` is nothing, `1` the rest box. The enter runs `0 → 1` and the leave
 * `f → 0` with the same function, so the two keyframe sets are symmetric and a leave that starts at a fraction continues
 * from the box the enter had reached — a reversal never snaps the row open first.
 */
const frame = (box: RowBox, f: number): Keyframe => ({
  blockSize: `${box.blockSize * f}px`,
  paddingBlockStart: `${box.paddingBlockStart * f}px`,
  paddingBlockEnd: `${box.paddingBlockEnd * f}px`,
  borderBlockStartWidth: `${box.borderBlockStartWidth * f}px`,
  borderBlockEndWidth: `${box.borderBlockEndWidth * f}px`,
  marginBlockStart: `${box.marginBlockStart * f}px`,
  opacity: f,
});

/**
 * One toast: the `role` and `aria-atomic` the primitive gives it (`role="alert"` for `error`, `status` otherwise), the
 * `data-tone` it was queued with, and the title, the optional description and a close button. Hover and focus pause the
 * countdown through the handlers `toastProps` hands over.
 *
 * The row's phase is `@cssints/machine`'s: `entering` runs the enter animation, a `dismiss` in it reverses from the
 * fraction the box has reached (the leave effect reads the enter's `currentTime` before it is cancelled), a `dismiss` in
 * `leaving` is a state the machine does not react to so the leave is never restarted, and a cancelled animation's own
 * completion carries a dead handle id and is dropped. The animation moves the row's own box — block size, the padding and
 * border on that axis, its block margin and its opacity — so the stack's own layout closes the gap and opens it, and no
 * sibling is measured or moved by hand. `prefers-reduced-motion` builds the machine at `visible`, so a dismissal goes
 * straight to `gone` and no animation exists to skip. `data-state` and `hidden` read the row's own store, so one row's
 * phase never re-runs another row's readers.
 */
export const Toast = (props: ToastProps): JSX.Element => {
  // the preference is read once per row: a toast lives for seconds, and a machine is not rebuilt under a running effect
  const reduced = props.reducedMotion ?? prefersReducedMotion();
  const machine: ToastRowMachine = createMachine(toastRowMachine(reduced), { autoStart: false });
  const store = createMachineStore(machine);
  // the pair the Atomic rule is about: both read this row's phase, and only a change of the derived value notifies
  const view = store.projection(
    (draft, from) => {
      draft.hidden = from.phase === "gone";
    },
    { hidden: false },
  );

  let row: HTMLElement | undefined;
  /** The running animation, or `undefined` at rest. */
  let live: LiveRow | undefined;
  /** The fraction of the box a cancelled enter had reached: where the leave starts, for every property the box moves. */
  let carried: number | undefined;

  const offEffect = machine.onEffect((handle) => {
    const element = row;
    if (element === undefined) {
      // a host's `render` that took no ref: there is nothing to animate, so the row lands in the next task
      queueMicrotask(() => machine.send({ type: "finish", id: handle.id }));
      return;
    }
    const entering = handle.spec.type === "enter";
    // the box is at rest when the effect runs (a cancelled enter was cancelled before it, and its state's rule carries no
    // box), so this is the size to grow to and, at a fraction, the size to leave from
    const box = boxOf(element);
    const from = entering ? 0 : (carried ?? 1);
    carried = undefined;
    const duration = entering ? TOAST_ENTER_MS : TOAST_LEAVE_MS;
    // linear, so the box travels at a constant rate and a reversal's fraction is the running animation's own `currentTime`
    const animation = element.animate([frame(box, from), frame(box, entering ? 1 : 0)], {
      duration,
      easing: "linear",
      // each phase's end is the state's own styling; the leave holds its end until `gone` unmounts the row
      fill: entering ? "both" : "forwards",
    });
    // the ends, for a test that steps the timeline (as the kit's overlay motion does)
    animation.id = `${from}:${entering ? 1 : 0}`;
    live = { handle, animation, duration };
    props.onAnimate?.(animation);
    const done = (): void => {
      if (live?.handle.id === handle.id) {
        live = undefined;
      }
      // drop the fill hold so the state's own styling is what paints, then report the completion
      animation.cancel();
      // a completion, and a cancelled animation's own rejection: the machine drops the latter by its dead id
      machine.send({ type: "finish", id: handle.id });
    };
    animation.finished.then(done, done);
  });

  const offCancel = machine.onCancel((handle) => {
    if (live?.handle.id !== handle.id) {
      return;
    }
    const cancelled = live;
    live = undefined;
    // read before `cancel()`: a cancelled animation's `currentTime` is null. One fraction moves every property, so a row
    // dismissed halfway through its enter leaves from half its height and half its space, exactly where it was.
    const time = Number(cancelled.animation.currentTime ?? 0);
    carried = cancelled.duration === 0 ? 0 : Math.min(1, Math.max(0, time / cancelled.duration));
    cancelled.animation.cancel();
  });

  // The countdown is the primitive's; its expiry is this row's `dismiss`, in the same frame as a close click. The row
  // claims the request by id, so a request that arrives before it mounted leaves the toast to the primitive.
  const offRequest = props.toast.onDismissRequest((id) => {
    if (id !== props.item.id) {
      return false;
    }
    machine.send({ type: "dismiss" });
    return true;
  });

  // The row is hidden only at `gone`, after the store has written it, and the queue drops it in the same task: a row that
  // is painted is never hidden, and a hidden row is never painted.
  const offGone = machine.subscribe(
    (state) => state.state === "gone",
    (gone) => {
      if (gone) {
        props.toast.dismiss(props.item.id);
      }
    },
  );

  // the element exists only after the render: the start state's effect needs it, so the machine starts here, in an
  // effect that tracks nothing and runs once
  createEffect(
    () => undefined,
    () => {
      machine.start();
    },
  );

  onCleanup(() => {
    offRequest();
    offGone();
    offEffect();
    offCancel();
    machine.destroy();
  });

  const own = {
    "data-part": "toast",
    "data-tone": props.item.tone,
    get "data-state"() {
      return store.state.phase;
    },
    get hidden() {
      return view.hidden;
    },
    ref: (element: HTMLElement) => {
      row = element;
    },
    get class() {
      return css.cn(toast({ tone: props.item.tone }), props.class);
    },
  } as PartProps;
  return renderPart(
    props,
    merge(props.toast.toastProps(props.item.id), own),
    props.item,
    (part) => (
      <div {...part}>
        <p data-part="toast-title" class={titleClass}>
          {props.item.title}
        </p>
        <Show when={props.item.description !== undefined}>
          <p data-part="toast-description" class={descriptionClass}>
            {props.item.description}
          </p>
        </Show>
        <button
          type="button"
          data-part="toast-close"
          class={closeClass}
          aria-label="Dismiss"
          onClick={() => machine.send({ type: "dismiss" })}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    ),
  );
};
