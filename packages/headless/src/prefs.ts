/**
 * The user preferences a primitive honours. The host resolves them from
 * wherever it keeps them and injects a `Partial<Prefs>` per primitive;
 * `@cssints/headless` never imports atproto or a lexicon. An absent pref falls back
 * to today's behaviour, so injection is additive.
 *
 * `motionDurationMs` has no consumer here: canvas tweens are tick-driven, not
 * millisecond-driven, and the look layer owns durations (ADR 0002). It is part
 * of the shape so a host's resolved prefs can be passed in unchanged.
 */
export interface Prefs {
  readonly motion: "reduce" | "full";
  readonly motionDurationMs: number;
  readonly typeaheadDelayMs: number;
  readonly tooltipShowDelayMs: number;
  readonly tooltipHideDelayMs: number;
  readonly announce: boolean;
  readonly focusFollowsCamera: boolean;
}

/** Today's behaviour, used for every pref the host does not inject. */
export const DEFAULT_PREFS: Prefs = {
  motion: "full",
  motionDurationMs: 200,
  typeaheadDelayMs: 500,
  tooltipShowDelayMs: 600,
  tooltipHideDelayMs: 300,
  announce: true,
  focusFollowsCamera: true,
};

/** Merge an injected partial with the defaults; never mutates the input. */
export const withPrefs = (partial?: Partial<Prefs>): Prefs => ({
  ...DEFAULT_PREFS,
  ...partial,
});
