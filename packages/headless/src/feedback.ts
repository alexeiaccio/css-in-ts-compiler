/**
 * Feedback: the physical gestures of a primitive, reported as **named intents**.
 *
 * This is output, not state. Nothing about a detent being felt changes what the
 * widget is, so no spec models it and the primitives never call the platform:
 * `navigator.vibrate` is missing entirely on iOS Safari and inert in a
 * background tab, so a primitive that promised a haptic would lie on half the
 * targets. The host decides what an intent becomes — a vibration pattern, a
 * click sample, nothing at all — and a host that passes no `feedback` pays
 * nothing.
 *
 * The intents are the contract; the pattern, the volume and the milliseconds
 * are the host's:
 * - `detent` — a user interaction crossed a step (a drag, a wheel, an arrow or
 *   PageUp/PageDown key);
 * - `latch` — a two-state control turned on;
 * - `release` — a two-state control turned off;
 * - `limit` — a user interaction reached a bound and could move no further.
 */
export type FeedbackIntent = "detent" | "latch" | "release" | "limit";

/** Both channels optional, both called with the same intent; neither means silence. */
export interface Feedback {
  /** The vibration channel: the host maps an intent to `navigator.vibrate(...)`, or to nothing. */
  readonly haptic?: (intent: FeedbackIntent) => void;
  /** The sound channel: the same intents, for a click sample or a beep. */
  readonly sound?: (intent: FeedbackIntent) => void;
}

/**
 * What a primitive reports through. The option is read lazily, so a host may
 * swap the callbacks (a preference toggled off) without rebuilding the widget.
 */
export interface FeedbackSink {
  /** A user step from `from` landed on `to` (both already bounded). */
  readonly step: (from: number, to: number) => void;
  /** A user turn landed on `on` (`latch`) or off (`release`). */
  readonly turn: (on: boolean) => void;
  /** A new interaction begins (a fresh press or key press): a bound may tick again. */
  readonly rearm: () => void;
}

export const createFeedback = (read: () => Feedback | undefined): FeedbackSink => {
  const emit = (intent: FeedbackIntent): void => {
    const feedback = read();
    feedback?.haptic?.(intent);
    feedback?.sound?.(intent);
  };
  // A held key, a wheel still turning and a pointer pressed against the end all
  // arrive many times a second at the same bound. One `limit` per interaction is
  // the difference between a tick and a buzz: the gate re-arms when a step lands
  // (the value moved) or when a new interaction starts.
  let armed = true;
  return {
    step: (from, to) => {
      if (from === to) {
        if (armed) {
          armed = false;
          emit("limit");
        }
        return;
      }
      armed = true;
      emit("detent");
    },
    turn: (on) => {
      emit(on ? "latch" : "release");
    },
    rearm: () => {
      armed = true;
    },
  };
};
