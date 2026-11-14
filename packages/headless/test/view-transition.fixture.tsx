import { type ViewTransition, createViewTransition } from "../src/view-transition";
import {
  type ViewTransitionConfig,
  type ViewTransitionMotion,
} from "@cssints/apg-specs/patterns/view-transition.bridge";
import { type Json } from "@cssints/apg-specs/scenario";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/** One transition the fixture's stub handed out; only the test drives it. */
interface FakeTransition {
  readonly settle: () => void;
  readonly abort: () => void;
}

interface FakeDocument {
  startViewTransition?: (update: () => void | Promise<void>) => {
    readonly finished: Promise<void>;
  };
}

const installFake = () => {
  const documentHost = document as unknown as FakeDocument;
  let pending: FakeTransition | undefined;
  let starts = 0;
  let finished = 0;
  let skips = 0;

  const abortPending = (): void => {
    const current = pending;
    pending = undefined;
    current?.abort();
  };

  documentHost.startViewTransition = (update) => {
    // latest wins: the platform skips the running transition, it does not queue
    abortPending();
    starts += 1;
    let resolveFinished!: () => void;
    const done = new Promise<void>((resolve) => {
      resolveFinished = resolve;
    });
    const transition: FakeTransition = {
      settle: () => {
        if (pending === transition) {
          pending = undefined;
        }
        finished += 1;
        resolveFinished();
      },
      abort: () => {
        if (pending === transition) {
          pending = undefined;
        }
        skips += 1;
        resolveFinished();
      },
    };
    pending = transition;
    void update();
    return { finished: done };
  };

  return {
    counters: () => ({ starts, finished, skips }),
    settle: (): void => {
      pending?.settle();
    },
    abort: abortPending,
    restore: (): void => {
      Reflect.deleteProperty(documentHost, "startViewTransition");
    },
  };
};

export interface MountedViewTransition {
  readonly root: HTMLElement;
  readonly events: ReadonlyMap<string, ReadonlyArray<Json>>;
  readonly value: () => Json;
  /** The running transition finished, as the platform would report. */
  readonly settle: () => void;
  /** The platform skipped it (a duplicate name, a supersede, a cancel). */
  readonly abort: () => void;
  readonly setProp: (name: string, value: Json | undefined) => void;
  readonly dispose: () => void;
}

/**
 * Renders `createViewTransition` with one button that runs an update, a
 * `persist()` element and a `name()` element, and installs a deterministic
 * `document.startViewTransition`: nothing settles until the driver says so, and
 * starting a second transition skips the first, exactly like the platform.
 */
export const mountViewTransition = (config: ViewTransitionConfig): MountedViewTransition => {
  const root = document.createElement("div");
  document.body.append(root);
  const fake = installFake();
  const [motion, setMotion] = createSignal<ViewTransitionMotion>(config.motion);
  const events = new Map<string, Json[]>();
  let requests = 0;
  let updates = 0;
  let api: ViewTransition | undefined;

  const dispose = render(() => {
    const transition = createViewTransition({
      get prefs() {
        return { motion: motion() };
      },
    });
    api = transition;
    const run = (): void => {
      requests += 1;
      void transition.run(() => {
        updates += 1;
      });
    };
    return (
      <div>
        <button data-part="run" type="button" onClick={run}>
          Run
        </button>
        <div data-part="surface" {...transition.persist({ class: "card" })} />
        <div data-part="pair" {...transition.name("card", { class: "card" })} />
      </div>
    );
  }, root);

  return {
    root,
    events,
    value: () => [
      motion(),
      api?.state().active ?? false,
      requests,
      updates,
      fake.counters().starts,
      fake.counters().finished,
      fake.counters().skips,
    ],
    settle: fake.settle,
    abort: fake.abort,
    setProp: (name, value) => {
      if (name === "motion" && (value === "full" || value === "reduce")) {
        setMotion(value);
      } else {
        throw new Error(`fixture has no prop ${name}=${JSON.stringify(value)}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
      fake.restore();
    },
  };
};
