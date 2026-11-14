import { type Prefs, withPrefs } from "./prefs";
import { createSignal } from "solid-js";

/** The two declarations a host spreads onto the element(s) the transition animates. */
export type ViewTransitionStyle = {
  readonly "view-transition-name": string;
  readonly "view-transition-class"?: string;
};

/** Spread onto an element: `{ style }` is the whole attribute object the primitive owns. */
export interface ViewTransitionStyleProps {
  readonly style: ViewTransitionStyle;
}

export interface ViewTransitionStyleOptions {
  /** A stable CSS hook: `::view-transition-group(*.card)`. */
  readonly class?: string;
}

export interface ViewTransitionOptions {
  /**
   * Structural mirror of `ing.lexicon.ui.prefs` (`./prefs`). Honoured here:
   * `motion` (`reduce` runs the update without starting a transition). Absent
   * prefs keep today's behaviour. Read at every `run`, so a host may pass a
   * getter and flip the preference between requests.
   */
  readonly prefs?: Partial<Prefs> | undefined;
  /** Base for `name()`; default `"vt"`. */
  readonly prefix?: string;
}

export interface ViewTransitionState {
  /** The platform has the API, read live (SSR-safe: false without a document). */
  readonly supported: boolean;
  /** A transition this primitive started is still running. */
  readonly active: boolean;
}

export interface ViewTransition {
  readonly supported: () => boolean;
  /**
   * Run `update` once, animating around it when the platform can. The promise
   * always resolves: a transition the platform skipped is not a failure.
   */
  readonly run: (update: () => void | Promise<void>) => Promise<void>;
  /**
   * The same element persists across the update: the browser names it itself
   * (`view-transition-name: match-element`). The default case; no bookkeeping.
   */
  readonly persist: (options?: ViewTransitionStyleOptions) => ViewTransitionStyleProps;
  /**
   * The morph pair (one element leaves, another arrives): a deterministic,
   * prefixed name. Only ONE of the pair may be rendered at a time — two
   * rendered elements with the same name make `ready` reject and skip the
   * whole transition. That is a DOM fact this primitive cannot enforce.
   */
  readonly name: (id: string, options?: ViewTransitionStyleOptions) => ViewTransitionStyleProps;
  readonly state: () => ViewTransitionState;
}

/** The minimal part of the platform's ViewTransition the runner touches. */
interface PlatformTransition {
  readonly finished: Promise<void>;
}

interface ViewTransitionHost {
  readonly startViewTransition?: (update: () => void | Promise<void>) => PlatformTransition;
}

const DEFAULT_PREFIX = "vt";

/**
 * The API is looked up on every call, never at module load: tests stub the
 * global, a polyfill may arrive later, and there is no `document` during SSR.
 */
const host = (): (Document & ViewTransitionHost) | undefined => {
  if (typeof document === "undefined") {
    return undefined;
  }
  const documentHost = document as Document & ViewTransitionHost;
  return typeof documentHost.startViewTransition === "function" ? documentHost : undefined;
};

const styleOf = (
  name: string,
  options: ViewTransitionStyleOptions | undefined,
): ViewTransitionStyleProps => ({
  style: {
    "view-transition-name": name,
    ...(options?.class === undefined ? {} : { "view-transition-class": options.class }),
  },
});

/**
 * The runner around `document.startViewTransition`: the update always runs
 * exactly once, the transition starts only when the platform has it and motion
 * is not reduced, and a skipped transition resolves `run` instead of failing
 * it. Latest wins — a second `run` while one is active just starts, which is the
 * platform's own policy, so there is no queue and no `skipTransition()` here.
 *
 * `persist()` is the default for "this element moves": the browser assigns the
 * unique name. `name(id)` is for a morph pair and leaves the uniqueness rule to
 * the host. Neither reads or writes the DOM.
 *
 * Behaviour is `packages/apg-specs/specs/patterns/view-transition.qnt`; the DOM
 * is checked against it by the differential walk.
 */
export const createViewTransition = (options: ViewTransitionOptions): ViewTransition => {
  const prefix = (): string => options.prefix ?? DEFAULT_PREFIX;
  const motion = (): Prefs["motion"] => withPrefs(options.prefs).motion;

  const [active, setActive] = createSignal(false);
  // a superseded run must not clear the flag of the run that replaced it
  let latestRun = 0;

  const run = async (update: () => void | Promise<void>): Promise<void> => {
    const platform = host();
    if (platform === undefined || motion() === "reduce") {
      await update();
      return;
    }
    const token = (latestRun += 1);
    setActive(true);
    try {
      const transition = platform.startViewTransition(update);
      try {
        await transition.finished;
      } catch {
        // a skipped or aborted transition is not a failure: the update already ran
      }
    } finally {
      if (token === latestRun) {
        setActive(false);
      }
    }
  };

  return {
    supported: () => host() !== undefined,
    run,
    persist: (styleOptions) => styleOf("match-element", styleOptions),
    name: (id, styleOptions) => styleOf(`${prefix()}-${id}`, styleOptions),
    state: () => ({ supported: host() !== undefined, active: active() }),
  };
};
