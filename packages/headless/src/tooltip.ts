import { type Accessor, createSignal, createUniqueId } from "solid-js";
import { type Prefs, withPrefs } from "./prefs";
import { createControllable } from "./controllable";

export interface TooltipTriggerInput {
  readonly id?: string;
  /** Id of this trigger's tooltip element (needed for `aria-describedby`). */
  readonly tooltipId?: string;
  readonly label?: string;
}

export interface TooltipGroupOptions {
  readonly triggers: ReadonlyArray<TooltipTriggerInput>;
  /** Ignore focus / pointer entirely while disabled. */
  readonly disabled?: boolean;
  /** Keyboard focus opens the tooltip immediately (the host has applied its show delay). */
  readonly openOnFocus?: boolean;
  /** Hover opens the tooltip immediately (a `delay: 0` configuration). */
  readonly openOnHover?: boolean;
  /**
   * Whether native pointerenter/pointerleave on the rendered elements drive the
   * state. Disable for a host that feeds `pointerEnter`/`pointerLeave` itself
   * (the differential walk does), so a stray pointer sitting over the fixture
   * cannot inject events the other side never saw. @default true
   */
  readonly nativePointer?: boolean;
  /** Trigger index whose tooltip starts visible (`defaultOpen`). */
  readonly defaultOpen?: number;
  /**
   * Controlled: the host owns the visible tooltip. `0` = none, `1` = first,
   * `2` = second (`undefined` = uncontrolled).
   */
  readonly value?: number | undefined;
  /** A request to change the visible tooltip when the intent differs. */
  readonly onOpenChange?: (open: boolean, index: number) => void;
  /**
   * Structural mirror of `ing.lexicon.ui.prefs` (`./prefs`). Honoured here:
   * `tooltipShowDelayMs` / `tooltipHideDelayMs`, exposed as accessors the host
   * wires its `setTimeout` from. Absent prefs keep the defaults.
   */
  readonly prefs?: Partial<Prefs> | undefined;
}

export interface TooltipTriggerProps {
  readonly id: string;
  readonly "aria-describedby": string | undefined;
  readonly onFocus: () => void;
  readonly onPointerEnter: () => void;
  readonly onPointerLeave: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface TooltipContentProps {
  readonly id: string;
  readonly role: "tooltip";
  readonly hidden: boolean;
  readonly onPointerEnter: () => void;
  readonly onPointerLeave: () => void;
}

export interface TooltipGroup {
  /** Index of the visible tooltip, or `null`. */
  readonly visibleIndex: Accessor<number | null>;
  /** Resolved show delay (ms) the host wires its `setTimeout` from. */
  readonly showDelayMs: Accessor<number>;
  /** Resolved hide delay (ms) the host wires its `setTimeout` from. */
  readonly hideDelayMs: Accessor<number>;
  readonly described: (index: number) => boolean;
  readonly triggerProps: (index: number) => TooltipTriggerProps;
  readonly tooltipProps: (index: number) => TooltipContentProps;
  readonly focusTrigger: (index: number) => void;
  readonly blur: () => void;
  readonly pointerEnter: (index: number) => void;
  readonly pointerEnterTip: () => void;
  readonly pointerLeave: () => void;
  readonly showTimer: (index: number) => void;
  readonly hideTimer: () => void;
  readonly escape: () => void;
  readonly warmExpire: () => void;
  readonly setWarmup: (on: boolean) => void;
  /**
   * Call before the host writes the controlled visible value directly: it drops
   * the timer / dismissal memory the new value invalidates (mirrors the spec's
   * `setValue`).
   */
  readonly hostSet: (vis: number) => void;
  /**
   * Call before the host flips its controlled value between none and the first
   * tooltip directly (mirrors the spec's `hostToggle`, which also drops B).
   */
  readonly hostToggle: () => void;
}

interface State {
  focus: string;
  pointer: string;
  shown: [boolean, boolean];
  pend: [boolean, boolean];
  dism: [boolean, boolean];
  warm: boolean;
  warmEnabled: boolean;
}

const letters = ["a", "b"] as const;
const letterOf = (index: number): string => letters[index] ?? "a";
const shownOf = (vis: number): [boolean, boolean] => [vis === 1, vis === 2];
const visOf = (shown: [boolean, boolean]): number => (shown[0] ? 1 : shown[1] ? 2 : 0);

/**
 * APG Tooltip + WCAG 1.4.13 (dismissable, hoverable, persistent) on Solid 2.
 * Two triggers stand in for N (`ponytail:` a pair is all the spec models). The
 * state machine mirrors `specs/apg/tooltip.qnt`: timers are **events**, not
 * clocks — the host wires `setTimeout` to `showTimer` / `hideTimer` /
 * `warmExpire`.
 *
 * Request/commit (map ticket `rt1p`): the visible tooltip is the controlled
 * value (0 none / 1 first / 2 second). Uncontrolled by default (`defaultOpen`);
 * pass `value` + `onOpenChange` to own it. The non-visible state (focus,
 * pointer, pending timers) still tracks every event; only the visible commit is
 * gated, so a rejected request leaves the visible tooltip untouched.
 */
export const createTooltipGroup = (options: TooltipGroupOptions): TooltipGroup => {
  const base = createUniqueId();
  const tooltipId = (index: number): string =>
    options.triggers[index]?.tooltipId ?? `${base}-tooltip-${index}`;
  const triggerId = (index: number): string =>
    options.triggers[index]?.id ?? `${base}-trigger-${index}`;
  const prefs = withPrefs(options.prefs);

  const [vis, requestVis] = createControllable({
    value: () => options.value,
    initial:
      options.defaultOpen !== undefined && letters[options.defaultOpen]
        ? options.defaultOpen + 1
        : 0,
    // the request callback fires synchronously (and the host writes back before
    // the value is read again, so a rejection stays observable)
    onChange: () => (v: number) => options.onOpenChange?.(v > 0, v > 0 ? v - 1 : 0),
  });

  let state: State = {
    focus: "none",
    pointer: "none",
    shown: [false, false],
    pend: [false, false],
    dism: [false, false],
    warm: false,
    warmEnabled: false,
  };
  // `shown` always mirrors the committed visible value; `state` only carries the
  // non-visible machine state, so a host that has not flushed yet is read fresh.
  const full = (): State => ({ ...state, shown: shownOf(vis()) });

  const [version, setVersion] = createSignal(0);
  const notify = (): void => {
    setVersion((count) => count + 1);
  };

  const isShown = (s: State, t: string): boolean => (t === "a" ? s.shown[0] : s.shown[1]);
  const isPend = (s: State, t: string): boolean => (t === "a" ? s.pend[0] : s.pend[1]);
  const isDism = (s: State, t: string): boolean => (t === "a" ? s.dism[0] : s.dism[1]);
  const otherT = (t: string): string => (t === "a" ? "b" : "a");
  const entryOf = (current: string, t: string): string => (current === t ? "none" : t);
  const quickOf = (on: boolean, w: boolean, a: boolean, b: boolean): boolean => on && (w || a || b);
  const trigEng = (t: string, f: string, p: string): boolean => f === t || p === t;
  const visibleT = (s: State): string => (s.shown[0] ? "a" : s.shown[1] ? "b" : "none");
  const engaged = (s: State, t: string, f: string, p: string): boolean =>
    trigEng(t, f, p) || (p === "tip" && visibleT(s) === t);
  const dismNext = (s: State, t: string, f: string, p: string): boolean =>
    isDism(s, t) && trigEng(t, f, p);
  const immediateShow = (s: State, t: string, f: string, p: string, e: string): boolean =>
    e === t &&
    quickOf(s.warmEnabled, s.warm, s.shown[0], s.shown[1]) &&
    !dismNext(s, t, f, p) &&
    !isShown(s, t);
  const shownNext = (s: State, t: string, f: string, p: string, e: string): boolean =>
    immediateShow(s, t, f, p, e) || (isShown(s, t) && !immediateShow(s, otherT(t), f, p, e));
  const visNext = (s: State, f: string, p: string, e: string): string =>
    shownNext(s, "a", f, p, e) ? "a" : shownNext(s, "b", f, p, e) ? "b" : "none";
  const pendNext = (s: State, t: string, f: string, p: string, e: string): boolean =>
    trigEng(t, f, p) &&
    !shownNext(s, t, f, p, e) &&
    !dismNext(s, t, f, p) &&
    (isPend(s, t) || e === t);
  const ptrNext = (s: State, p: string, f: string, e: string): string =>
    p === "tip" && visNext(s, f, p, e) !== visibleT(s) ? "none" : p;
  const hidable = (s: State, f: string, p: string): boolean =>
    visibleT(s) !== "none" && !engaged(s, visibleT(s), f, p);

  const commit = (next: State): void => {
    requestVis(visOf(next.shown));
    state = next;
    notify();
  };

  const focusIn = (t: string): void => {
    const s = full();
    const e = entryOf(s.focus, t);
    commit({
      focus: t,
      pointer: ptrNext(s, s.pointer, t, e),
      shown: [shownNext(s, "a", t, s.pointer, e), shownNext(s, "b", t, s.pointer, e)],
      pend: [pendNext(s, "a", t, s.pointer, e), pendNext(s, "b", t, s.pointer, e)],
      dism: [dismNext(s, "a", t, s.pointer), dismNext(s, "b", t, s.pointer)],
      warm: s.warm,
      warmEnabled: s.warmEnabled,
    });
  };

  const focusOut = (): void => {
    const s = full();
    const p = s.pointer;
    commit({
      focus: "none",
      pointer: ptrNext(s, p, "none", "none"),
      shown: [shownNext(s, "a", "none", p, "none"), shownNext(s, "b", "none", p, "none")],
      pend: [pendNext(s, "a", "none", p, "none"), pendNext(s, "b", "none", p, "none")],
      dism: [dismNext(s, "a", "none", p), dismNext(s, "b", "none", p)],
      warm: s.warm,
      warmEnabled: s.warmEnabled,
    });
  };

  const pointerEnter = (t: string): void => {
    const s = full();
    const e = entryOf(s.pointer, t);
    commit({
      focus: s.focus,
      pointer: ptrNext(s, t, s.focus, e),
      shown: [shownNext(s, "a", s.focus, t, e), shownNext(s, "b", s.focus, t, e)],
      pend: [pendNext(s, "a", s.focus, t, e), pendNext(s, "b", s.focus, t, e)],
      dism: [dismNext(s, "a", s.focus, t), dismNext(s, "b", s.focus, t)],
      warm: s.warm,
      warmEnabled: s.warmEnabled,
    });
  };

  const pointerLeave = (): void => {
    const s = full();
    commit({
      focus: s.focus,
      pointer: ptrNext(s, "none", s.focus, "none"),
      shown: [
        shownNext(s, "a", s.focus, "none", "none"),
        shownNext(s, "b", s.focus, "none", "none"),
      ],
      pend: [pendNext(s, "a", s.focus, "none", "none"), pendNext(s, "b", s.focus, "none", "none")],
      dism: [dismNext(s, "a", s.focus, "none"), dismNext(s, "b", s.focus, "none")],
      warm: s.warm,
      warmEnabled: s.warmEnabled,
    });
  };

  const pointerEnterTip = (): void => {
    const s = full();
    const p = visibleT(s) !== "none" ? "tip" : s.pointer;
    commit({
      focus: s.focus,
      pointer: p,
      shown: s.shown,
      pend: [pendNext(s, "a", s.focus, p, "none"), pendNext(s, "b", s.focus, p, "none")],
      dism: [dismNext(s, "a", s.focus, p), dismNext(s, "b", s.focus, p)],
      warm: s.warm,
      warmEnabled: s.warmEnabled,
    });
  };

  const showTimer = (t: string): void => {
    const s = full();
    const pending = isPend(s, t);
    const p = pending && s.pointer === "tip" ? "none" : s.pointer;
    commit({
      focus: s.focus,
      pointer: p,
      shown: [pending ? t === "a" : s.shown[0], pending ? t === "b" : s.shown[1]],
      pend: [pending && t === "a" ? false : s.pend[0], pending && t === "b" ? false : s.pend[1]],
      dism: s.dism,
      warm: s.warm,
      warmEnabled: s.warmEnabled,
    });
  };

  const hideTimer = (): void => {
    const s = full();
    const h = hidable(s, s.focus, s.pointer);
    const before = vis();
    requestVis(h ? 0 : before);
    // a host that vetoes the hide keeps the tooltip visible, so it is not "warm"
    const rejected = h && options.value !== undefined && before !== 0 && vis() !== 0;
    state = {
      focus: s.focus,
      pointer: s.pointer,
      shown: [h ? false : s.shown[0], h ? false : s.shown[1]],
      pend: s.pend,
      dism: s.dism,
      warm: h && !rejected ? true : s.warm,
      warmEnabled: s.warmEnabled,
    };
    notify();
  };

  const escape = (): void => {
    const s = full();
    const before = vis();
    requestVis(0);
    // a vetoed Escape leaves the tooltip visible: it is neither dismissed nor warm
    const rejected = options.value !== undefined && before !== 0 && vis() !== 0;
    state = {
      focus: s.focus,
      pointer: s.pointer === "tip" ? "none" : s.pointer,
      shown: [false, false],
      pend: [false, false],
      dism: rejected
        ? s.dism
        : [
            s.dism[0] || (trigEng("a", s.focus, s.pointer) && (s.shown[0] || s.pend[0])),
            s.dism[1] || (trigEng("b", s.focus, s.pointer) && (s.shown[1] || s.pend[1])),
          ],
      warm: rejected ? s.warm : s.warm || s.shown[0] || s.shown[1],
      warmEnabled: s.warmEnabled,
    };
    notify();
  };

  const warmExpire = (): void => commit({ ...full(), warm: false });
  const setWarmup = (on: boolean): void => commit({ ...full(), warmEnabled: on });
  const hostSet = (v: number): void => {
    if (options.value === undefined) {
      return;
    }
    const s = full();
    state = {
      ...s,
      pointer: v === 0 && s.pointer === "tip" ? "none" : s.pointer,
      pend: [v === 1 ? false : s.pend[0], v === 2 ? false : s.pend[1]],
      dism: [v === 1 ? false : s.dism[0], v === 2 ? false : s.dism[1]],
    };
    notify();
  };
  const hostToggle = (): void => {
    if (options.value === undefined) {
      return;
    }
    const s = full();
    const next = vis() === 0 ? 1 : 0;
    state = {
      ...s,
      pointer: next === 0 && s.pointer === "tip" ? "none" : s.pointer,
      pend: [next === 1 ? false : s.pend[0], false],
      dism: [next === 1 ? false : s.dism[0], false],
    };
    notify();
  };
  const nativePointer = (): boolean => options.nativePointer ?? true;

  return {
    visibleIndex: () => {
      version();
      const v = vis();
      return v === 0 ? null : v - 1;
    },
    showDelayMs: () => prefs.tooltipShowDelayMs,
    hideDelayMs: () => prefs.tooltipHideDelayMs,
    described: (index) => {
      version();
      return vis() === index + 1;
    },
    focusTrigger: (index) => {
      if (options.disabled) {
        return;
      }
      const t = letterOf(index);
      focusIn(t);
      if (options.openOnFocus) {
        showTimer(t);
      }
    },
    blur: focusOut,
    pointerEnter: (index) => {
      if (options.disabled) {
        return;
      }
      const t = letterOf(index);
      pointerEnter(t);
      if (options.openOnHover) {
        showTimer(t);
      }
    },
    pointerEnterTip,
    pointerLeave,
    showTimer: (index) => showTimer(letterOf(index)),
    hideTimer,
    escape,
    warmExpire,
    setWarmup,
    hostSet,
    hostToggle,
    triggerProps: (index) => ({
      id: triggerId(index),
      get "aria-describedby"() {
        version();
        return vis() === index + 1 ? tooltipId(index) : undefined;
      },
      onFocus: () => {
        if (options.disabled) {
          return;
        }
        const t = letterOf(index);
        focusIn(t);
        if (options.openOnFocus) {
          showTimer(t);
        }
      },
      onPointerEnter: () => {
        if (options.disabled || !nativePointer()) {
          return;
        }
        const t = letterOf(index);
        pointerEnter(t);
        if (options.openOnHover) {
          showTimer(t);
        }
      },
      onPointerLeave: () => {
        if (!nativePointer()) {
          return;
        }
        pointerLeave();
        hideTimer();
      },
      onKeyDown: (event) => {
        if (event.key === "Escape") {
          escape();
        }
      },
    }),
    tooltipProps: (index) => ({
      id: tooltipId(index),
      role: "tooltip",
      get hidden() {
        version();
        return vis() !== index + 1;
      },
      onPointerEnter: () => {
        if (nativePointer()) {
          pointerEnterTip();
        }
      },
      onPointerLeave: () => {
        if (!nativePointer()) {
          return;
        }
        pointerLeave();
        hideTimer();
      },
    }),
  };
};
