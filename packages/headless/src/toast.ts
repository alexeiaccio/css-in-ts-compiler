import { type Accessor, createSignal, createUniqueId, getOwner, onCleanup } from "solid-js";

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX = 3;
const DEFAULT_REGION_LABEL = "Notifications";

/** A toast's urgency; `error` is the only tone that announces assertively. */
export type ToastTone = "info" | "success" | "error";

export interface ToastOptions {
  /** Auto-dismiss delay in ms, default 5000. A number; `0` dismisses on the next tick. */
  readonly timeout?: number | undefined;
  /** Visible toasts kept, default 3; a new one past the ceiling drops the oldest. */
  readonly max?: number | undefined;
  /** Pauses the countdown while a pointer is over a toast, default true. Focus always pauses. */
  readonly pauseOnHover?: boolean | undefined;
  /** The region's accessible name; `region` defaults to `"Notifications"`. */
  readonly labels?: { readonly region?: string | undefined } | undefined;
  /** Called with the id whenever a toast leaves, for whatever reason. */
  readonly onDismiss?: ((id: string) => void) | undefined;
}

/** What `show` takes; `tone` defaults to `"info"`. */
export interface ToastInput {
  readonly title: string;
  readonly description?: string | undefined;
  readonly tone?: ToastTone | undefined;
}

/** A toast in the queue, oldest first in `toasts()`. */
export interface ToastItem {
  readonly id: string;
  readonly title: string;
  readonly description: string | undefined;
  readonly tone: ToastTone;
}

/** Spread onto the container that holds every toast and the F6 target. */
export interface ToastRegionProps {
  readonly role: "region";
  readonly "aria-label": string;
}

/**
 * Spread onto one toast. `role` is `alert` for the `error` tone and `status`
 * otherwise; both pause the countdown while hovered or focused.
 */
export interface ToastItemProps {
  readonly role: "alert" | "status";
  readonly "aria-atomic": "true";
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
  readonly onFocusIn: () => void;
  readonly onFocusOut: () => void;
}

export interface Toast {
  /** Oldest first. */
  readonly toasts: Accessor<readonly ToastItem[]>;
  /** Queues a toast and returns its id. */
  readonly show: (input: ToastInput) => string;
  /** Removes a toast now, skipping whatever a renderer would animate. */
  readonly dismiss: (id: string) => void;
  readonly dismissAll: () => void;
  /**
   * Asks the renderer to remove a toast: every `onDismissRequest` handler is called and the removal is the one that
   * claims it (the countdown is over either way). With no handler, or none that claims it, the toast leaves at once.
   */
  readonly requestDismiss: (id: string) => void;
  /**
   * A toast the countdown wants gone: return `true` when this renderer owns the row and call `dismiss(id)` when it has
   * finished leaving. The queue still holds the item, so its ceiling counts it until then.
   */
  readonly onDismissRequest: (handler: (id: string) => boolean) => () => void;
  readonly regionProps: ToastRegionProps;
  readonly toastProps: (id: string) => ToastItemProps;
}

interface Countdown {
  handle: ReturnType<typeof setTimeout> | undefined;
  /** When the countdown ends while it runs; stale while paused. */
  deadline: number;
  /** Time left when paused (and the value first armed). */
  remaining: number;
  hovered: boolean;
  focused: boolean;
}

/**
 * A toast queue: one timeout per toast, a ceiling that drops the oldest, and a
 * countdown that pauses on hover and focus and resumes from where it stopped.
 * A toast announces itself through its own live region (`role=status`, or
 * `role=alert` for `error`), so the host renders one element per toast inside
 * `regionProps`. No DOM access here: the host renders, the primitive decides.
 *
 * The timeout is a floor of practice, not of code: the default is 5000 ms
 * because both Base UI and React Aria agree on at least five seconds to read a
 * message; shorter values exist for tests and are the host's judgement.
 *
 * The countdown does not remove a toast by itself: it asks, through
 * `onDismissRequest`, and a renderer that animates the departure answers with
 * `dismiss(id)` when the row is gone. A host with no renderer hears nothing and
 * the toast leaves at once.
 */
export const createToast = (options: ToastOptions = {}): Toast => {
  const [version, setVersion] = createSignal(0);
  let items: ToastItem[] = [];
  const timers = new Map<string, Countdown>();
  const requests = new Set<(id: string) => boolean>();

  const toasts = (): readonly ToastItem[] => {
    version();
    return items;
  };
  const commit = (next: readonly ToastItem[]): void => {
    items = [...next];
    setVersion((count) => count + 1);
  };

  const clear = (id: string): void => {
    const countdown = timers.get(id);
    if (countdown === undefined) {
      return;
    }
    if (countdown.handle !== undefined) {
      clearTimeout(countdown.handle);
    }
    timers.delete(id);
  };

  const dismiss = (id: string): void => {
    if (!items.some((item) => item.id === id)) {
      return;
    }
    clear(id);
    commit(items.filter((item) => item.id !== id));
    options.onDismiss?.(id);
  };

  const dismissAll = (): void => {
    const ids = items.map((item) => item.id);
    if (ids.length === 0) {
      return;
    }
    for (const id of ids) {
      clear(id);
    }
    commit([]);
    for (const id of ids) {
      options.onDismiss?.(id);
    }
  };

  const arm = (id: string, countdown: Countdown): void => {
    countdown.handle = setTimeout(() => {
      countdown.handle = undefined;
      request(id);
    }, countdown.remaining);
  };

  // The countdown is over: the renderer that owns the row removes it, and a toast no renderer claims leaves at once.
  const request = (id: string): void => {
    if (!items.some((item) => item.id === id)) {
      return;
    }
    const countdown = timers.get(id);
    if (countdown !== undefined) {
      if (countdown.handle !== undefined) {
        clearTimeout(countdown.handle);
      }
      timers.delete(id);
    }
    let claimed = false;
    for (const handler of requests) {
      claimed = handler(id) || claimed;
    }
    if (!claimed) {
      dismiss(id);
    }
  };

  const pause = (id: string): void => {
    const countdown = timers.get(id);
    if (countdown === undefined || countdown.handle === undefined) {
      return;
    }
    clearTimeout(countdown.handle);
    countdown.handle = undefined;
    countdown.remaining = Math.max(0, countdown.deadline - Date.now());
  };

  const paused = (countdown: Countdown): boolean =>
    // Focus always pauses: a reader who tabbed into the toast must not lose it.
    countdown.focused || (countdown.hovered && (options.pauseOnHover ?? true));

  const resume = (id: string): void => {
    const countdown = timers.get(id);
    if (countdown === undefined || countdown.handle !== undefined || paused(countdown)) {
      return;
    }
    countdown.deadline = Date.now() + countdown.remaining;
    arm(id, countdown);
  };

  const sync = (id: string, countdown: Countdown): void => {
    if (paused(countdown)) {
      pause(id);
    } else {
      resume(id);
    }
  };

  const show = (input: ToastInput): string => {
    const item: ToastItem = {
      id: createUniqueId(),
      title: input.title,
      description: input.description,
      tone: input.tone ?? "info",
    };
    const limit = Math.max(1, options.max ?? DEFAULT_MAX);
    const next = [...items, item];
    const dropped: string[] = [];
    while (next.length > limit) {
      const oldest = next.shift();
      if (oldest !== undefined) {
        dropped.push(oldest.id);
      }
    }
    commit(next);
    for (const id of dropped) {
      clear(id);
      options.onDismiss?.(id);
    }
    const duration = Math.max(0, options.timeout ?? DEFAULT_TIMEOUT_MS);
    const countdown: Countdown = {
      handle: undefined,
      deadline: Date.now() + duration,
      remaining: duration,
      hovered: false,
      focused: false,
    };
    timers.set(item.id, countdown);
    arm(item.id, countdown);
    return item.id;
  };

  const hover = (id: string, next: boolean): void => {
    const countdown = timers.get(id);
    if (countdown === undefined) {
      return;
    }
    countdown.hovered = next;
    sync(id, countdown);
  };
  const focus = (id: string, next: boolean): void => {
    const countdown = timers.get(id);
    if (countdown === undefined) {
      return;
    }
    countdown.focused = next;
    sync(id, countdown);
  };

  const owner = getOwner();
  if (owner !== null) {
    onCleanup(() => {
      for (const countdown of timers.values()) {
        if (countdown.handle !== undefined) {
          clearTimeout(countdown.handle);
        }
      }
      timers.clear();
    });
  }

  return {
    toasts,
    show,
    dismiss,
    dismissAll,
    requestDismiss: request,
    onDismissRequest: (handler) => {
      requests.add(handler);
      return () => {
        requests.delete(handler);
      };
    },
    regionProps: {
      role: "region",
      get "aria-label"() {
        return options.labels?.region ?? DEFAULT_REGION_LABEL;
      },
    },
    toastProps: (id) => ({
      get role() {
        return items.find((item) => item.id === id)?.tone === "error" ? "alert" : "status";
      },
      "aria-atomic": "true",
      onMouseEnter: () => hover(id, true),
      onMouseLeave: () => hover(id, false),
      onFocusIn: () => focus(id, true),
      onFocusOut: () => focus(id, false),
    }),
  };
};
